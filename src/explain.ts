// `explain <name>`: print the step-by-step resolution of one name.
import { displayPath, formatVars, messageFor, rulesLine, type ReportContext } from "./report.js";
import { lookupBuiltin } from "./resolve.js";
import type { SnapshotIndex } from "./snapshot.js";
import type { MessageKey } from "./i18n.js";
import type { Verdict } from "./types.js";

export function formatExplain(
  rawName: string,
  verdicts: Verdict[],
  index: SnapshotIndex,
  ctx: ReportContext,
): string {
  const { t, cwd } = ctx;
  const name = rawName.replace(/^\//, "").toLowerCase();
  const lines: string[] = [];
  if (ctx.demo) lines.push(t("demo.banner"));
  lines.push(rulesLine(ctx), "");

  // Items whose full name matches, plus plugin items whose bare name matches.
  const matches = verdicts.filter((v) => v.item.key === name || v.item.bare?.toLowerCase() === name);
  if (matches.length === 0) {
    const { entry, reserved, aliases } = lookupBuiltin(name, index);
    if (entry) {
      if (entry.kind === "alias") {
        lines.push(t("explain.alias-of", { name, target: entry.aliasOf ?? "" }));
      } else {
        lines.push(t("explain.builtin-only", { name, kind: entry.kind, version: index.snapshot.version }));
        if (aliases.length) lines.push(t("explain.builtin-aliases", { aliases: aliases.join(", ") }));
      }
    } else if (reserved) {
      lines.push(t("explain.reserved", { name, effect: reserved.effect }));
    } else {
      lines.push(t("explain.notfound", { name }));
    }
    return lines.join("\n") + "\n";
  }

  matches.forEach((v, idx) => {
    if (idx > 0) lines.push("");
    lines.push(
      t("explain.title", { name: v.item.name, scope: v.item.scope, type: v.item.type, path: displayPath(v.item.path, cwd) }),
    );
    v.steps.forEach((s, i) => {
      lines.push(`  ${i + 1}. ${t(`step.${s.key}` as MessageKey, formatVars(s.vars, cwd))}`);
    });
    lines.push(t("explain.verdict", { status: v.status.toUpperCase(), message: messageFor(v, ctx) }));
    const fix = t(`fix.${v.reason}` as MessageKey, formatVars(v.vars, cwd));
    if (fix) lines.push(t("explain.fix", { fix }));
  });
  return lines.join("\n") + "\n";
}
