// Output: text table, JSON, summary and exit code.
import { homedir } from "node:os";
import { isAbsolute, relative } from "node:path";
import type { MessageKey, Translate } from "./i18n.js";
import { ALL_STATUSES, type Snapshot, type Status, type Verdict } from "./types.js";

export const DEFAULT_FAIL_ON: readonly Status[] = ["not-loaded", "shadowed", "unreachable"];
export const SESSION = "local-terminal";

export interface ReportContext {
  t: Translate;
  snapshot: Snapshot;
  demo: boolean;
  color: boolean;
  failOn: readonly Status[];
  cwd: string;
}

/** Shows a path relative to the current folder when that is shorter, ~ for the home folder. */
export function displayPath(p: string, cwd: string): string {
  const rel = relative(cwd, p);
  if (rel && !rel.startsWith("..") && !isAbsolute(rel)) return rel;
  const home = homedir();
  if (home && p.startsWith(home + "/")) return "~" + p.slice(home.length);
  return p;
}

/** The translated one-line explanation of a verdict. */
export function messageFor(v: Verdict, ctx: ReportContext): string {
  let key = `msg.${v.reason}`;
  if (v.reason === "replaces-builtin" && !v.vars.aliases) key += ".noalias";
  if (v.reason === "builtin-alias" && v.item.type === "skill") key += ".skill";
  return ctx.t(key as MessageKey, formatVars(v.vars, ctx.cwd));
}

export function formatVars(vars: Record<string, string>, cwd: string): Record<string, string> {
  const out = { ...vars };
  if (out.winner) out.winner = displayPath(out.winner, cwd);
  return out;
}

export function rulesLine(ctx: ReportContext): string {
  const s = ctx.snapshot;
  return ctx.t("rules.line", { host: hostLabel(s.host), version: s.version, fetched: s.fetched });
}

function hostLabel(host: string): string {
  return host === "claude-code" ? "Claude Code" : host;
}

/** Terminal width of a string: Hangul and other wide characters count as two columns. */
function width(s: string): number {
  let w = 0;
  for (const ch of s) w += (ch.codePointAt(0) ?? 0) >= 0x1100 ? 2 : 1;
  return w;
}

const pad = (s: string, w: number): string => s + " ".repeat(Math.max(0, w - width(s)));

const COLORS: Record<Status, string> = {
  ok: "32",
  overrides: "36",
  shadowed: "31",
  "not-loaded": "31",
  unreachable: "31",
  ambiguous: "33",
  "namespaced-only": "33",
};

function paint(text: string, code: string, on: boolean): string {
  return on ? `\u001b[${code}m${text}\u001b[0m` : text;
}

export function isFailing(v: Verdict, failOn: readonly Status[]): boolean {
  return failOn.includes(v.status);
}

export function countByStatus(verdicts: Verdict[]): Record<Status, number> {
  const counts = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const v of verdicts) counts[v.status]++;
  return counts;
}

export function formatTable(verdicts: Verdict[], ctx: ReportContext): string {
  const { t, cwd } = ctx;
  const lines: string[] = [];
  if (ctx.demo) lines.push(paint(t("demo.banner"), "33", ctx.color));
  lines.push(rulesLine(ctx), "");
  if (verdicts.length === 0) {
    lines.push(t("summary.empty"));
    return lines.join("\n") + "\n";
  }

  const head = [t("col.status"), t("col.name"), t("col.scope"), t("col.type")];
  const rows = verdicts.map((v) => [v.status.toUpperCase(), "/" + v.item.name, v.item.scope, v.item.type]);
  const widths = head.map((h, i) => Math.max(width(h), ...rows.map((r) => width(r[i] as string))));

  lines.push(head.map((c, i) => pad(c, (widths[i] as number) + 2)).join("") + t("col.detail"));
  verdicts.forEach((v, i) => {
    const row = rows[i] as string[];
    const first = paint(pad(row[0] as string, (widths[0] as number) + 2), COLORS[v.status], ctx.color);
    const rest = row.slice(1).map((c, j) => pad(c, (widths[j + 1] as number) + 2)).join("");
    lines.push(first + rest + messageFor(v, ctx));
    if (v.status !== "ok") lines.push("    " + displayPath(v.item.path, cwd));
  });

  const counts = countByStatus(verdicts);
  const parts = ALL_STATUSES.filter((s) => counts[s] > 0).map((s) => `${counts[s]} ${s}`);
  const failing = verdicts.filter((v) => isFailing(v, ctx.failOn)).length;
  const failOn = ctx.failOn.length ? ctx.failOn.join(",") : t("failon.none");
  // 1건이면 단수 문구("1 item")를 쓴다.
  const summaryKey = verdicts.length === 1 ? "summary.line.one" : "summary.line";
  lines.push("", t(summaryKey, { total: String(verdicts.length), counts: parts.join(", ") }));
  lines.push(failing > 0 ? t("summary.failing", { failing: String(failing), failOn }) : t("summary.clean", { failOn }));
  return lines.join("\n") + "\n";
}

/** JSON report. Keys, statuses and reasons are language independent; only `message` is translated. */
export function toJson(verdicts: Verdict[], ctx: ReportContext): string {
  const s = ctx.snapshot;
  const doc = {
    rules: { host: s.host, version: s.version, fetched: s.fetched, session: SESSION },
    ...(ctx.demo ? { demo: true } : {}),
    summary: {
      total: verdicts.length,
      failing: verdicts.filter((v) => isFailing(v, ctx.failOn)).length,
      fail_on: [...ctx.failOn],
      by_status: countByStatus(verdicts),
    },
    items: verdicts.map((v) => ({
      name: v.item.name,
      scope: v.item.scope,
      type: v.item.type,
      status: v.status,
      reason: v.reason,
      path: displayPath(v.item.path, ctx.cwd),
      message: messageFor(v, ctx),
    })),
  };
  return JSON.stringify(doc, null, 2) + "\n";
}
