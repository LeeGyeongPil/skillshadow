// Command line entry logic. `run` returns the exit code so tests can call it directly.
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { formatExplain } from "./explain.js";
import { isLang, resolveLang, translator, type Lang, type MessageKey, type Translate } from "./i18n.js";
import { DEFAULT_FAIL_ON, formatTable, isFailing, toJson, type ReportContext } from "./report.js";
import { resolveAll } from "./resolve.js";
import { scan, setScanWarn, type ScanOptions } from "./scan.js";
import { SnapshotError, indexSnapshot, loadSnapshot, packageRoot } from "./snapshot.js";
import { ALL_STATUSES, type Status } from "./types.js";

export interface RunIo {
  env: NodeJS.ProcessEnv;
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  /** True when stdout is an interactive terminal (enables colors). */
  tty: boolean;
}

const OPTIONS = {
  project: { type: "string" },
  home: { type: "string" },
  "user-dir": { type: "string" },
  "managed-dir": { type: "string" },
  "plugin-dir": { type: "string", multiple: true },
  "config-dir-name": { type: "string" },
  builtins: { type: "string" },
  json: { type: "boolean" },
  "fail-on": { type: "string" },
  demo: { type: "boolean" },
  lang: { type: "string" },
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
} as const;

function readVersion(): string {
  // package.json is next to the compiled output; read lazily to keep startup cheap.
  const pkg = JSON.parse(readFileSync(join(packageRoot(), "package.json"), "utf8")) as { version: string };
  return pkg.version;
}

function isDir(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function parseFailOn(value: string | undefined): Status[] | string {
  if (value === undefined) return [...DEFAULT_FAIL_ON];
  if (value.trim().toLowerCase() === "none") return [];
  const parts = value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const bad = parts.find((p) => !(ALL_STATUSES as readonly string[]).includes(p));
  if (bad !== undefined || parts.length === 0) return bad ?? value;
  return parts as Status[];
}

export function run(argv: string[], io: RunIo): number {
  // Language first so that even usage errors are translated.
  let langFlag: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] as string;
    if (a === "--lang") langFlag = argv[i + 1];
    else if (a.startsWith("--lang=")) langFlag = a.slice("--lang=".length);
  }
  const lang: Lang = resolveLang(langFlag, io.env);
  const t: Translate = translator(lang);
  const fail = (key: MessageKey, vars: Record<string, string> = {}): number => {
    io.stderr(`${t("err.prefix")}: ${t(key, vars)}\n`);
    return 2;
  };

  if (langFlag !== undefined && !isLang(langFlag)) return fail("err.invalid-lang", { value: langFlag });

  let parsed;
  try {
    parsed = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true, strict: true });
  } catch (err) {
    const e = err as Error & { code?: string };
    const opt = /'(-{1,2}[^'\s]+)/.exec(e.message)?.[1] ?? "";
    if (e.code === "ERR_PARSE_ARGS_UNKNOWN_OPTION" && opt) return fail("err.unknown-option", { option: opt });
    if (e.code === "ERR_PARSE_ARGS_INVALID_OPTION_VALUE" && opt) return fail("err.option-value", { option: opt });
    return fail("err.usage", { detail: e.message.replace(/\.$/, "") });
  }
  const { values, positionals } = parsed;

  if (values.help) {
    io.stdout(t("help.text"));
    return 0;
  }
  if (values.version) {
    io.stdout(t("version.line", { version: readVersion() }) + "\n");
    return 0;
  }

  const command = positionals[0];
  if (command === undefined) return fail("err.no-command");
  if (command !== "check" && command !== "explain") return fail("err.unknown-command", { command });
  if (command === "explain" && !positionals[1]) return fail("err.explain-name");

  const failOn = parseFailOn(values["fail-on"]);
  if (typeof failOn === "string") {
    return fail("err.invalid-fail-on", { value: failOn, allowed: ALL_STATUSES.join(", ") });
  }

  // Build the scan options. --demo swaps in the bundled practice fixture.
  const demo = values.demo === true;
  let scanOpts: ScanOptions;
  if (demo) {
    const root = join(packageRoot(), "fixtures", "demo");
    scanOpts = {
      configDirName: "_claude",
      home: join(root, "home"),
      projectDir: join(root, "project"),
      stopDir: join(root, "project"),
      managedDir: "",
      pluginDirs: [join(root, "plugins", "rootly")],
      env: {},
    };
  } else {
    const projectDir = values.project ?? io.cwd;
    if (values.project !== undefined && !isDir(projectDir)) {
      return fail("err.path-missing", { option: "--project", path: projectDir });
    }
    for (const p of values["plugin-dir"] ?? []) {
      if (!isDir(p)) return fail("err.path-missing", { option: "--plugin-dir", path: p });
    }
    scanOpts = {
      projectDir,
      pluginDirs: values["plugin-dir"] ?? [],
      env: io.env,
      ...(values["config-dir-name"] ? { configDirName: values["config-dir-name"] } : {}),
      ...(values.home ? { home: values.home } : {}),
      ...(values["user-dir"] ? { userDir: values["user-dir"] } : {}),
      ...(values["managed-dir"] !== undefined ? { managedDir: values["managed-dir"] } : {}),
    };
  }

  let index;
  try {
    index = indexSnapshot(loadSnapshot(values.builtins));
  } catch (err) {
    if (err instanceof SnapshotError) return fail("err.snapshot", { file: err.file, detail: err.detail });
    throw err;
  }

  // Unreadable SKILL.md files are skipped with a warning on stderr; the scan keeps going.
  setScanWarn((file, code) => {
    io.stderr(`${t("warn.prefix")}: ${t("err.scan-read", { file, code })}\n`);
  });
  let items;
  try {
    items = scan(scanOpts);
  } finally {
    setScanWarn(undefined);
  }
  const verdicts = resolveAll(items, index);
  const ctx: ReportContext = {
    t,
    snapshot: index.snapshot,
    demo,
    color: io.tty && !io.env.NO_COLOR && !values.json,
    failOn,
    cwd: io.cwd,
  };

  if (command === "explain") {
    io.stdout(formatExplain(positionals[1] as string, verdicts, index, ctx));
    return 0;
  }
  io.stdout(values.json ? toJson(verdicts, ctx) : formatTable(verdicts, ctx));
  return verdicts.some((v) => isFailing(v, failOn)) ? 1 : 0;
}
