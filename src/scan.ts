// Finds skills and command files on disk and turns them into Items.
import { existsSync, readdirSync, realpathSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { parseFrontmatter } from "./frontmatter.js";
import type { Item, Scope } from "./types.js";

export interface ScanOptions {
  /** Config folder name inside a home/project folder. Default ".claude". */
  configDirName?: string;
  /** Parent of the personal config folder (reads <home>/<configDirName>). */
  home?: string;
  /** Personal config folder itself (wins over home and CLAUDE_CONFIG_DIR). */
  userDir?: string;
  /** Start folder for project skills. Omit to skip project scanning. */
  projectDir?: string;
  /** Never walk above this folder when looking for the project root (used by --demo). */
  stopDir?: string;
  /** Managed (enterprise) folder holding skills/ and commands/. */
  managedDir?: string;
  /** Plugin root folders. */
  pluginDirs?: string[];
  /** Environment for CLAUDE_CONFIG_DIR lookup. Default process.env. */
  env?: NodeJS.ProcessEnv;
}

export const DEFAULT_CONFIG_DIR_NAME = ".claude";
/** The only enterprise path the docs name; other platforms need --managed-dir. */
export const LINUX_MANAGED_DIR = "/etc/claude-code";

function isDir(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function listDir(p: string): string[] {
  try {
    return readdirSync(p).sort();
  } catch {
    return [];
  }
}

function isFile(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

/** Receives non-fatal scan problems (a SKILL.md that cannot be read). */
export type ScanWarn = (file: string, code: string) => void;
let warnHook: ScanWarn | undefined;
export function setScanWarn(fn: ScanWarn | undefined): void {
  warnHook = fn;
}

/** Reads a SKILL.md; returns undefined (and reports) when it is not a readable regular file. */
function readSkillFile(file: string): string | undefined {
  if (!isFile(file)) {
    if (existsSync(file)) warnHook?.(file, "EISDIR");
    return undefined;
  }
  try {
    return readFileSync(file, "utf8");
  } catch (err) {
    warnHook?.(file, (err as NodeJS.ErrnoException).code ?? "EIO");
    return undefined;
  }
}

function makeItem(base: Omit<Item, "key">): Item {
  return { ...base, key: base.name.toLowerCase() };
}

/** Skills: <root>/<folder>/SKILL.md. The front-matter name beats the folder name. */
export function scanSkillsDir(root: string, scope: Scope, extra: Partial<Item> = {}): Item[] {
  const items: Item[] = [];
  if (!isDir(root)) return items;
  for (const folder of listDir(root)) {
    const file = join(root, folder, "SKILL.md");
    const text = readSkillFile(file);
    if (text === undefined) continue;
    const fm = parseFrontmatter(text);
    const bare = fm.name ?? folder;
    items.push(skillItem(file, bare, fm.userInvocable !== false, scope, extra));
  }
  return items;
}

function skillItem(file: string, bare: string, userInvocable: boolean, scope: Scope, extra: Partial<Item>): Item {
  const plugin = extra.plugin;
  return makeItem({
    name: plugin ? `${plugin}:${bare}` : bare,
    scope,
    type: "skill",
    path: file,
    userInvocable,
    ...extra,
    ...(plugin ? { bare } : {}),
  });
}

/** Command files: <root>/a/b.md becomes /a:b. Front matter is ignored for names. */
export function scanCommandsDir(root: string, scope: Scope, extra: Partial<Item> = {}): Item[] {
  const items: Item[] = [];
  const seen = new Set<string>();
  const walk = (dir: string, prefix: string[]): void => {
    // Skip a folder already visited through a symlink (loop protection).
    let real: string;
    try {
      real = realpathSync(dir);
    } catch {
      return;
    }
    if (seen.has(real)) return;
    seen.add(real);
    for (const entry of listDir(dir)) {
      const p = join(dir, entry);
      if (isDir(p)) walk(p, [...prefix, entry]);
      else if (entry.toLowerCase().endsWith(".md")) {
        const bare = [...prefix, basename(entry).slice(0, -3)].join(":");
        const plugin = extra.plugin;
        items.push(
          makeItem({
            name: plugin ? `${plugin}:${bare}` : bare,
            scope,
            type: "command",
            path: p,
            userInvocable: true,
            ...extra,
            ...(plugin ? { bare } : {}),
          }),
        );
      }
    }
  };
  if (isDir(root)) walk(root, []);
  return items;
}

/** Plugin folder: skills/, a root SKILL.md and commands/. Name from plugin.json, else folder name. */
export function scanPluginDir(dir: string): Item[] {
  if (!isDir(dir)) return [];
  let plugin = basename(resolve(dir));
  const manifest = join(dir, ".claude-plugin", "plugin.json");
  if (existsSync(manifest)) {
    try {
      const data = JSON.parse(readFileSync(manifest, "utf8")) as { name?: unknown };
      if (typeof data.name === "string" && data.name) plugin = data.name;
    } catch {
      // A broken manifest falls back to the folder name.
    }
  }
  const items = scanSkillsDir(join(dir, "skills"), "plugin", { plugin });
  const rootSkill = join(dir, "SKILL.md");
  const rootText = readSkillFile(rootSkill);
  if (rootText !== undefined) {
    const fm = parseFrontmatter(rootText);
    items.push(skillItem(rootSkill, fm.name ?? plugin, fm.userInvocable !== false, "plugin", { plugin }));
  }
  items.push(...scanCommandsDir(join(dir, "commands"), "plugin", { plugin }));
  return items;
}

/** Folders from `start` up to the nearest folder with a .git entry (or just `start`). */
export function projectLayers(start: string, stopDir?: string): string[] {
  const layers: string[] = [];
  let dir = resolve(start);
  const stop = stopDir ? resolve(stopDir) : undefined;
  // First find whether a git root exists above; if not, only the start folder counts.
  const chain: string[] = [];
  for (;;) {
    chain.push(dir);
    if (existsSync(join(dir, ".git")) || dir === stop) break;
    const parent = dirname(dir);
    if (parent === dir) {
      return [resolve(start)];
    }
    dir = parent;
  }
  layers.push(...chain);
  return layers;
}

/** Resolves the personal config folder from the options. */
export function personalDir(opts: ScanOptions): string {
  const cfg = opts.configDirName ?? DEFAULT_CONFIG_DIR_NAME;
  if (opts.userDir) return resolve(opts.userDir);
  if (opts.home) return join(resolve(opts.home), cfg);
  const env = opts.env ?? process.env;
  if (env.CLAUDE_CONFIG_DIR) return resolve(env.CLAUDE_CONFIG_DIR);
  return join(homedir(), cfg);
}

/** Collects every item. Missing folders are skipped silently. */
export function scan(opts: ScanOptions): Item[] {
  const cfg = opts.configDirName ?? DEFAULT_CONFIG_DIR_NAME;
  const items: Item[] = [];

  const managed = opts.managedDir ?? (process.platform === "linux" ? LINUX_MANAGED_DIR : undefined);
  if (managed) {
    items.push(...scanSkillsDir(join(managed, "skills"), "managed"));
    items.push(...scanCommandsDir(join(managed, "commands"), "managed"));
  }

  const personal = personalDir(opts);
  items.push(...scanSkillsDir(join(personal, "skills"), "personal"));
  items.push(...scanCommandsDir(join(personal, "commands"), "personal"));

  if (opts.projectDir) {
    const layers = projectLayers(opts.projectDir, opts.stopDir);
    layers.forEach((dir, layer) => {
      const root = join(dir, cfg);
      if (resolve(root) === personal) return; // project folder is the home folder: already scanned
      items.push(...scanSkillsDir(join(root, "skills"), "project", { layer }));
      items.push(...scanCommandsDir(join(root, "commands"), "project", { layer }));
    });
  }

  for (const dir of opts.pluginDirs ?? []) items.push(...scanPluginDir(resolve(dir)));
  return items;
}
