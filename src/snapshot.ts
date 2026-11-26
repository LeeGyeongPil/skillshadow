// Loading and validating built-in name snapshots (bundled or user supplied).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { EntryKind, ReservedEffect, Snapshot, SnapshotEntry } from "./types.js";

export class SnapshotError extends Error {
  constructor(
    readonly file: string,
    readonly detail: string,
  ) {
    super(`invalid snapshot ${file}: ${detail}`);
    this.name = "SnapshotError";
  }
}

const KINDS: readonly EntryKind[] = ["builtin", "bundled-skill", "alias", "bundled-workflow"];
const EFFECTS: readonly ReservedEffect[] = ["bundled-wins", "folder-skipped", "namespace", "conditional"];

/** Finds the package root (the folder holding package.json) from any compiled file location. */
export function packageRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, "package.json"))) return dir;
    dir = dirname(dir);
  }
  throw new Error("cannot locate the skillshadow package root");
}

export const BUNDLED_SNAPSHOT = "builtins/claude-code-2.1.332.json";

export function bundledSnapshotPath(): string {
  return join(packageRoot(), BUNDLED_SNAPSHOT);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Validates already-parsed JSON. Throws SnapshotError with a fixable message. */
export function validateSnapshot(data: unknown, file: string): Snapshot {
  if (!isObject(data)) throw new SnapshotError(file, "top level must be a JSON object");
  if (typeof data.version !== "string" || data.version === "") {
    throw new SnapshotError(file, 'missing string field "version" (for example "2.1.332")');
  }
  if (!Array.isArray(data.entries)) {
    throw new SnapshotError(file, 'missing array field "entries" of {name, kind}');
  }
  const entries: SnapshotEntry[] = [];
  for (const [i, raw] of data.entries.entries()) {
    if (!isObject(raw) || typeof raw.name !== "string" || raw.name === "") {
      throw new SnapshotError(file, `entries[${i}] needs a non-empty string "name"`);
    }
    if (typeof raw.kind !== "string" || !KINDS.includes(raw.kind as EntryKind)) {
      throw new SnapshotError(file, `entries[${i}].kind must be one of ${KINDS.join(", ")}`);
    }
    const e: SnapshotEntry = { name: raw.name.toLowerCase(), kind: raw.kind as EntryKind };
    if (typeof raw.aliasOf === "string") e.aliasOf = raw.aliasOf.toLowerCase();
    if (raw.removed === true) e.removed = true;
    entries.push(e);
  }
  const reserved: Snapshot["reserved"] = [];
  if (data.reserved !== undefined) {
    if (!Array.isArray(data.reserved)) throw new SnapshotError(file, '"reserved" must be an array');
    for (const [i, raw] of data.reserved.entries()) {
      if (!isObject(raw) || typeof raw.name !== "string" || raw.name === "") {
        throw new SnapshotError(file, `reserved[${i}] needs a non-empty string "name"`);
      }
      if (typeof raw.effect !== "string" || !EFFECTS.includes(raw.effect as ReservedEffect)) {
        throw new SnapshotError(file, `reserved[${i}].effect must be one of ${EFFECTS.join(", ")}`);
      }
      reserved.push({
        name: raw.name.toLowerCase(),
        effect: raw.effect as ReservedEffect,
        match: raw.match === "prefix" ? "prefix" : "exact",
        ...(typeof raw.note === "string" ? { note: raw.note } : {}),
      });
    }
  }
  return {
    host: typeof data.host === "string" ? data.host : "claude-code",
    version: data.version,
    fetched: typeof data.fetched === "string" ? data.fetched : "unknown",
    source: typeof data.source === "string" ? data.source : "",
    entries,
    reserved,
  };
}

/** Reads a snapshot file (default: the bundled Claude Code snapshot). */
export function loadSnapshot(file: string = bundledSnapshotPath()): Snapshot {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch (err) {
    throw new SnapshotError(file, `cannot read the file (${(err as NodeJS.ErrnoException).code ?? "error"})`);
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new SnapshotError(file, `not valid JSON (${(err as Error).message})`);
  }
  return validateSnapshot(data, file);
}

/** Lookup helpers built once per run. */
export interface SnapshotIndex {
  snapshot: Snapshot;
  byName: Map<string, SnapshotEntry>;
  /** target -> names that alias it, e.g. usage -> [cost, stats]. */
  aliasesOf: Map<string, string[]>;
}

export function indexSnapshot(snapshot: Snapshot): SnapshotIndex {
  const byName = new Map<string, SnapshotEntry>();
  const aliasesOf = new Map<string, string[]>();
  for (const e of snapshot.entries) {
    byName.set(e.name, e);
    if (e.kind === "alias" && e.aliasOf) {
      const list = aliasesOf.get(e.aliasOf) ?? [];
      list.push(e.name);
      aliasesOf.set(e.aliasOf, list);
    }
  }
  return { snapshot, byName, aliasesOf };
}
