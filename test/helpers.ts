// Test helpers: temp folders, file writing and an in-process CLI runner.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after } from "node:test";
import { run } from "../src/main.js";
import { packageRoot } from "../src/snapshot.js";

export const ROOT = packageRoot();
export const DEMO = join(ROOT, "fixtures", "demo");

/** Creates a temp folder that is removed when the test file finishes. */
export function tmp(): string {
  const dir = mkdtempSync(join(tmpdir(), "skillshadow-"));
  after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

export function write(root: string, rel: string, content = ""): string {
  const file = join(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  return file;
}

export const skillMd = (extra = ""): string => `---\ndescription: test\n${extra}---\nbody\n`;

export interface CliResult {
  code: number;
  out: string;
  err: string;
}

/** Runs the CLI in-process with a clean environment (English, no colors). */
export function cli(args: string[], env: NodeJS.ProcessEnv = {}): CliResult {
  let out = "";
  let err = "";
  const code = run(args, {
    env: { LANG: "C", ...env },
    cwd: ROOT,
    stdout: (s) => (out += s),
    stderr: (s) => (err += s),
    tty: false,
  });
  return { code, out, err };
}
