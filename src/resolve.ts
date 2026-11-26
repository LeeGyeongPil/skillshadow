// The rule engine. Rules run in this order for every user item (see docs/rules.md):
//   1 reserved names -> 2 skill beats command file -> 3 scope precedence and duplicates
//   -> 4 built-in / bundled names (and their aliases) -> 5 ok
// Plugin items only ask whether their bare name is free.
import type { SnapshotIndex } from "./snapshot.js";
import type { Item, Reason, ReservedName, Scope, Status, Step, Verdict } from "./types.js";

const SCOPE_RANK: Record<Scope, number> = { managed: 0, personal: 1, project: 2, plugin: 3 };

interface Context {
  index: SnapshotIndex;
  /** Non-plugin items by lower-cased name. */
  byKey: Map<string, Item[]>;
}

function findReserved(key: string, index: SnapshotIndex): ReservedName | undefined {
  return index.snapshot.reserved.find(
    (r) => key === r.name || (r.match === "prefix" && key.startsWith(r.name + ":")),
  );
}

function verdict(item: Item, status: Status, reason: Reason, vars: Record<string, string>, steps: Step[]): Verdict {
  return { item, status, reason, vars: { name: item.key, scope: item.scope, ...vars }, steps };
}

const step = (key: string, vars: Record<string, string> = {}, decisive = false): Step => ({ key, vars, decisive });

function resolvePlugin(item: Item, ctx: Context): Verdict {
  const bare = (item.bare ?? item.name).toLowerCase();
  const steps: Step[] = [step("plugin-namespace", { name: item.key })];
  const entry = ctx.index.byName.get(bare);
  const local = ctx.byKey.get(bare)?.[0];
  if (entry && !entry.removed) {
    steps.push(step("plugin-bare-builtin", { bare, kind: entry.kind }, true));
    return verdict(item, "namespaced-only", "plugin-bare-taken", { bare, kind: entry.kind }, steps);
  }
  if (local) {
    steps.push(step("plugin-bare-local", { bare, winner: local.path }, true));
    return verdict(item, "namespaced-only", "plugin-bare-taken", { bare, kind: `${local.scope} ${local.type}`, winner: local.path }, steps);
  }
  steps.push(step("plugin-bare-free", { bare }, true));
  return verdict(item, "ok", "plugin-bare-free", { bare }, steps);
}

function resolveUser(item: Item, ctx: Context): Verdict {
  const steps: Step[] = [];
  const key = item.key;

  // Rule 1: reserved names are never loaded (computer-use only on some machines).
  const reserved = findReserved(key, ctx.index);
  if (reserved) {
    const note = reserved.note ?? "";
    if (reserved.effect === "conditional") {
      steps.push(step("reserved-conditional", { name: key, note }, true));
      return verdict(item, "ambiguous", "reserved-conditional", { note }, steps);
    }
    const reason: Reason =
      reserved.effect === "bundled-wins" ? "reserved-bundled" : reserved.effect === "folder-skipped" ? "reserved-folder" : "reserved-namespace";
    steps.push(step("reserved-hit", { name: key, effect: reserved.effect, note }, true));
    return verdict(item, "not-loaded", reason, { note }, steps);
  }
  steps.push(step("reserved-miss", { name: key }));

  const peers = (ctx.byKey.get(key) ?? []).filter((o) => o !== item);

  // Rule 2: a skill beats a command file with the same name.
  if (item.type === "command") {
    const skill = peers.find((o) => o.type === "skill");
    if (skill) {
      if (!skill.userInvocable) {
        steps.push(step("skill-blocks-command", { winner: skill.path }, true));
        return verdict(item, "unreachable", "skill-not-invocable", { winner: skill.path, winnerScope: skill.scope }, steps);
      }
      steps.push(step("skill-beats-command", { winner: skill.path }, true));
      return verdict(item, "shadowed", "skill-over-command", { winner: skill.path, winnerScope: skill.scope }, steps);
    }
    steps.push(step("skill-vs-command-miss", { name: key }));
  }

  // Rule 3: higher scope wins; same scope twice is not specified by the docs.
  const sameType = peers.filter((o) => o.type === item.type);
  const higher = sameType.find((o) => SCOPE_RANK[o.scope] < SCOPE_RANK[item.scope]);
  if (higher) {
    steps.push(step("scope-hit", { winner: higher.path, winnerScope: higher.scope, scope: item.scope }, true));
    return verdict(item, "shadowed", "higher-scope", { winner: higher.path, winnerScope: higher.scope }, steps);
  }
  const twin = sameType.find((o) => o.scope === item.scope);
  if (twin) {
    steps.push(step("scope-duplicate", { winner: twin.path, scope: item.scope }, true));
    return verdict(item, "ambiguous", "same-scope-duplicate", { winner: twin.path }, steps);
  }
  steps.push(step("scope-miss", { name: key, scope: item.scope }));

  // Rule 4: built-in commands, bundled skills and workflows are replaced locally; aliases are unclear.
  const entry = ctx.index.byName.get(key);
  if (entry && entry.kind === "alias") {
    const target = entry.aliasOf ?? "";
    steps.push(step("builtin-alias", { name: key, target }, true));
    return verdict(item, "ambiguous", "builtin-alias", { target, kind: entry.kind }, steps);
  }
  if (entry && !entry.removed) {
    const aliases = (ctx.index.aliasesOf.get(key) ?? []).map((a) => `/${a}`).join(", ");
    steps.push(step("builtin-hit", { name: key, kind: entry.kind }));
    steps.push(step(aliases ? "builtin-aliases" : "builtin-no-aliases", { name: key, aliases }, true));
    return verdict(item, "overrides", "replaces-builtin", { kind: entry.kind, aliases }, steps);
  }
  if (entry && entry.removed) {
    steps.push(step("builtin-removed", { name: key }, true));
    return verdict(item, "ok", "removed-builtin", { kind: entry.kind }, steps);
  }
  steps.push(step("builtin-miss", { name: key }, true));
  return verdict(item, "ok", "none", {}, steps);
}

/** Judges every item. Output order: by name, then scope rank, then path. */
export function resolveAll(items: Item[], index: SnapshotIndex): Verdict[] {
  const byKey = new Map<string, Item[]>();
  for (const it of items) {
    if (it.scope === "plugin") continue;
    const list = byKey.get(it.key) ?? [];
    list.push(it);
    byKey.set(it.key, list);
  }
  const ctx: Context = { index, byKey };
  const verdicts = items.map((it) => (it.scope === "plugin" ? resolvePlugin(it, ctx) : resolveUser(it, ctx)));
  return verdicts.sort(
    (a, b) =>
      a.item.key.localeCompare(b.item.key) ||
      SCOPE_RANK[a.item.scope] - SCOPE_RANK[b.item.scope] ||
      a.item.type.localeCompare(b.item.type) ||
      a.item.path.localeCompare(b.item.path),
  );
}

/** Judges a bare name that is not on disk, for `explain` of built-in-only names. */
export function lookupBuiltin(name: string, index: SnapshotIndex) {
  const key = name.toLowerCase();
  return {
    entry: index.byName.get(key),
    reserved: findReserved(key, index),
    aliases: (index.aliasesOf.get(key) ?? []).map((a) => `/${a}`),
  };
}
