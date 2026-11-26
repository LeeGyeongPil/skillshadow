// Shared types for skillshadow.

/** Where an item lives. Order of precedence: managed > personal > project. */
export type Scope = "managed" | "personal" | "project" | "plugin";

export type ItemType = "skill" | "command";

/** One user-defined skill or command file found on disk. */
export interface Item {
  /** Name as typed after the slash, e.g. "deploy", "frontend:component", "rootly:status". */
  name: string;
  /** Lower-cased name used for every comparison. */
  key: string;
  scope: Scope;
  type: ItemType;
  /** Absolute path of the SKILL.md or command .md file. */
  path: string;
  /** False when the skill has `user-invocable: false`. */
  userInvocable: boolean;
  /** Plugin name for plugin items. */
  plugin?: string;
  /** Name without the "plugin:" prefix (plugin items only). */
  bare?: string;
  /** Project items: 0 = start folder, 1 = its parent, ... up to the git root. */
  layer?: number;
}

export type EntryKind = "builtin" | "bundled-skill" | "alias" | "bundled-workflow";

/** One name from the host's official command reference. */
export interface SnapshotEntry {
  name: string;
  kind: EntryKind;
  /** For aliases: the command the alias points at. */
  aliasOf?: string;
  /** True for commands the docs list as removed. */
  removed?: boolean;
}

export type ReservedEffect = "bundled-wins" | "folder-skipped" | "namespace" | "conditional";

export interface ReservedName {
  name: string;
  effect: ReservedEffect;
  /** "prefix" also reserves "<name>:*". */
  match?: "exact" | "prefix";
  note?: string;
}

/** A version-stamped copy of the host's built-in names. */
export interface Snapshot {
  host: string;
  version: string;
  fetched: string;
  source: string;
  entries: SnapshotEntry[];
  reserved: ReservedName[];
}

export type Status =
  | "ok"
  | "overrides"
  | "shadowed"
  | "not-loaded"
  | "unreachable"
  | "ambiguous"
  | "namespaced-only";

export const ALL_STATUSES: readonly Status[] = [
  "ok",
  "overrides",
  "shadowed",
  "not-loaded",
  "unreachable",
  "ambiguous",
  "namespaced-only",
];

/** Stable machine-readable reason codes (never translated). */
export type Reason =
  | "none"
  | "removed-builtin"
  | "plugin-bare-free"
  | "reserved-bundled"
  | "reserved-folder"
  | "reserved-namespace"
  | "reserved-conditional"
  | "skill-over-command"
  | "higher-scope"
  | "skill-not-invocable"
  | "replaces-builtin"
  | "builtin-alias"
  | "same-scope-duplicate"
  | "plugin-bare-taken";

export interface Verdict {
  item: Item;
  status: Status;
  reason: Reason;
  /** Values for the message template: name, kind, aliases, target, winner, scope, ... */
  vars: Record<string, string>;
  /** Human-readable trace used by `explain`. */
  steps: Step[];
}

export interface Step {
  /** Message key suffix, translated by i18n. */
  key: string;
  vars: Record<string, string>;
  /** True when this step decided the verdict. */
  decisive: boolean;
}
