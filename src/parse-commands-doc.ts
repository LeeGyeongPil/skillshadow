// Turns the official commands reference (a markdown table) into snapshot entries.
// Only names and relations are extracted, never the description text.
import type { SnapshotEntry } from "./types.js";

const NAME = "[a-z0-9:_-]+";

/** Splits a table row on unescaped pipes. */
function splitRow(row: string): string[] {
  return row.split(/(?<!\\)\|/).map((c) => c.trim());
}

export function parseCommandsDoc(markdown: string): SnapshotEntry[] {
  const entries = new Map<string, SnapshotEntry>();
  const rows = markdown.split(/\r?\n/).filter((l) => /^\| `\//.test(l));
  for (const row of rows) {
    const cells = splitRow(row);
    const head = cells[1] ?? "";
    const desc = cells.slice(2).join("|");
    const names = [...head.matchAll(new RegExp("`/(" + NAME + ")", "g"))].map((m) => m[1] as string);
    const primary = names[0];
    if (!primary) continue;

    let kind: SnapshotEntry["kind"] = "builtin";
    if (/\*\*\[Skill\]/.test(desc)) kind = "bundled-skill";
    else if (/\*\*\[Workflow\]/.test(desc)) kind = "bundled-workflow";

    // Row that is itself an alias: "Alias for `/x`" or "Alias of [`/x`](...)".
    let aliasOf: string | undefined;
    const a = new RegExp("^Alias (?:for|of) \\[?`?/(" + NAME + ")").exec(desc);
    if (a) {
      kind = "alias";
      aliasOf = a[1];
    }
    const removed = /^Removed/.test(desc);

    for (const n of new Set(names)) {
      if (entries.has(n)) continue;
      const e: SnapshotEntry = { name: n, kind };
      if (aliasOf) e.aliasOf = aliasOf;
      if (removed) e.removed = true;
      entries.set(n, e);
    }

    // Extra aliases inside the description: "Alias: `/app`", "Aliases: `/ios`, `/android`",
    // "Also available as `/bashes`".
    const extra = /(?:Alias(?:es)?:|Also available as)\s*((?:`\/[a-z0-9-]+`(?:,\s*|\s*and\s*)?)+)/.exec(desc);
    if (extra) {
      for (const m of (extra[1] as string).matchAll(/`\/([a-z0-9-]+)`/g)) {
        const n = m[1] as string;
        if (!entries.has(n)) entries.set(n, { name: n, kind: "alias", aliasOf: primary });
      }
    }
  }
  return [...entries.values()];
}
