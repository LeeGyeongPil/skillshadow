import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { resolveAll } from "../src/resolve.js";
import { scan } from "../src/scan.js";
import { indexSnapshot, loadSnapshot } from "../src/snapshot.js";
import type { Item } from "../src/types.js";
import { DEMO, skillMd, tmp, write } from "./helpers.js";

const index = indexSnapshot(loadSnapshot());

function demoItems(): Item[] {
  return scan({
    configDirName: "_claude",
    home: join(DEMO, "home"),
    projectDir: join(DEMO, "project"),
    stopDir: join(DEMO, "project"),
    managedDir: "",
    pluginDirs: [join(DEMO, "plugins", "rootly")],
    env: {},
  });
}

test("demo fixture verdicts", () => {
  const got = resolveAll(demoItems(), index).map((v) => `${v.item.name}|${v.item.scope}|${v.item.type}|${v.status}|${v.reason}`);
  assert.deepEqual(got, [
    "checkpoint|personal|command|ambiguous|builtin-alias",
    "code-review|personal|skill|overrides|replaces-builtin",
    "deploy|personal|skill|ok|none",
    "deploy|project|skill|shadowed|higher-scope",
    "explain-code|project|command|unreachable|skill-not-invocable",
    "explain-code|project|skill|ok|none",
    "frontend:component|project|command|ok|none",
    "rootly:status|plugin|skill|namespaced-only|plugin-bare-taken",
    "ship|personal|skill|not-loaded|reserved-bundled",
    "status|project|skill|overrides|replaces-builtin",
    "synced|personal|skill|not-loaded|reserved-folder",
    "usage|personal|skill|overrides|replaces-builtin",
  ]);
});

test("overrides lists the aliases that still run the built-in", () => {
  const usage = resolveAll(demoItems(), index).find((v) => v.item.name === "usage");
  assert.equal(usage?.vars.aliases, "/cost, /stats");
  const review = resolveAll(demoItems(), index).find((v) => v.item.name === "code-review");
  assert.match(review?.vars.aliases ?? "", /\/review/);
});

function oneSkill(name: string, extra = ""): Verdict0 {
  const home = tmp();
  write(home, `_claude/skills/${name}/SKILL.md`, skillMd(extra));
  const items = scan({ configDirName: "_claude", home, managedDir: "", env: {} });
  const [v] = resolveAll(items, index);
  assert.ok(v);
  return { status: v.status, reason: v.reason };
}
interface Verdict0 {
  status: string;
  reason: string;
}

test("reserved names: ship-local, steward, anthropic-skills namespace", () => {
  assert.deepEqual(oneSkill("ship-local"), { status: "not-loaded", reason: "reserved-bundled" });
  assert.deepEqual(oneSkill("steward"), { status: "not-loaded", reason: "reserved-bundled" });
  assert.deepEqual(oneSkill("anthropic-skills"), { status: "not-loaded", reason: "reserved-namespace" });
});

test("computer-use is ambiguous because it is reserved only on some machines", () => {
  assert.deepEqual(oneSkill("computer-use"), { status: "ambiguous", reason: "reserved-conditional" });
});

test("a removed built-in name is ok", () => {
  assert.deepEqual(oneSkill("vim"), { status: "ok", reason: "removed-builtin" });
});

test("an unrelated name is ok", () => {
  assert.deepEqual(oneSkill("my-own-thing"), { status: "ok", reason: "none" });
});

test("names compare case-insensitively", () => {
  assert.deepEqual(oneSkill("Usage"), { status: "overrides", reason: "replaces-builtin" });
});

test("managed scope beats personal, which beats project", () => {
  const base = tmp();
  write(base, "managed/skills/dup/SKILL.md", skillMd());
  write(base, "home/_claude/skills/dup/SKILL.md", skillMd());
  write(base, "proj/_claude/skills/dup/SKILL.md", skillMd());
  const items = scan({
    configDirName: "_claude",
    home: join(base, "home"),
    projectDir: join(base, "proj"),
    stopDir: join(base, "proj"),
    managedDir: join(base, "managed"),
    env: {},
  });
  const got = resolveAll(items, index).map((v) => `${v.item.scope}:${v.status}`);
  assert.deepEqual(got, ["managed:ok", "personal:shadowed", "project:shadowed"]);
});

test("the same name in two project layers is ambiguous", () => {
  const base = tmp();
  write(base, "repo/_claude/skills/dup/SKILL.md", skillMd());
  write(base, "repo/pkg/_claude/skills/dup/SKILL.md", skillMd());
  write(base, "repo/.git", "gitdir: elsewhere");
  const items = scan({ configDirName: "_claude", home: join(base, "h"), projectDir: join(base, "repo", "pkg"), managedDir: "", env: {} });
  const got = resolveAll(items, index).map((v) => `${v.status}:${v.reason}`);
  assert.deepEqual(got, ["ambiguous:same-scope-duplicate", "ambiguous:same-scope-duplicate"]);
});

test("a skill with the same name beats a command file", () => {
  const home = tmp();
  write(home, "_claude/skills/same/SKILL.md", skillMd());
  write(home, "_claude/commands/same.md", "x");
  const got = resolveAll(scan({ configDirName: "_claude", home, managedDir: "", env: {} }), index).map((v) => `${v.item.type}:${v.status}`);
  assert.deepEqual(got, ["command:shadowed", "skill:ok"]);
});

test("a plugin bare name that matches a local skill is namespaced-only; a free one is ok", () => {
  const base = tmp();
  write(base, "home/_claude/skills/mine/SKILL.md", skillMd());
  write(base, "pl/skills/mine/SKILL.md", skillMd());
  write(base, "pl/skills/unique-thing/SKILL.md", skillMd());
  const items = scan({ configDirName: "_claude", home: join(base, "home"), managedDir: "", pluginDirs: [join(base, "pl")], env: {} });
  const got = resolveAll(items, index).map((v) => `${v.item.name}:${v.status}`);
  assert.deepEqual(got, ["mine:ok", "pl:mine:namespaced-only", "pl:unique-thing:ok"]);
});
