import assert from "node:assert/strict";
import { mkdirSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { indexSnapshot, loadSnapshot } from "../src/snapshot.js";
import { resolveAll } from "../src/resolve.js";
import { projectLayers, scan } from "../src/scan.js";
import { cli, skillMd, tmp, write } from "./helpers.js";

const index = indexSnapshot(loadSnapshot());
const names = (items: { name: string }[]): string[] => items.map((i) => i.name).sort();

test("front-matter name beats the folder name", () => {
  const home = tmp();
  write(home, "_claude/skills/release/SKILL.md", skillMd("name: status\n"));
  const items = scan({ configDirName: "_claude", home, managedDir: "", env: {} });
  assert.deepEqual(names(items), ["status"]);
  assert.equal(items[0]?.type, "skill");
});

test("commands in sub folders become a:b and ignore front matter", () => {
  const home = tmp();
  write(home, "_claude/commands/a/b.md", "---\nname: ignored\n---\n");
  write(home, "_claude/commands/top.md", "x");
  write(home, "_claude/commands/notes.txt", "not a command");
  const items = scan({ configDirName: "_claude", home, managedDir: "", env: {} });
  assert.deepEqual(names(items), ["a:b", "top"]);
});

test("the synced reservation ignores case", () => {
  const home = tmp();
  write(home, "_claude/skills/Synced/SKILL.md", skillMd());
  const items = scan({ configDirName: "_claude", home, managedDir: "", env: {} });
  const [v] = resolveAll(items, index);
  assert.equal(v?.status, "not-loaded");
  assert.equal(v?.reason, "reserved-folder");
});

test("CRLF front matter is read", () => {
  const home = tmp();
  write(home, "_claude/skills/folder/SKILL.md", "---\r\nname: crlf\r\nuser-invocable: false\r\n---\r\nbody\r\n");
  const items = scan({ configDirName: "_claude", home, managedDir: "", env: {} });
  assert.equal(items[0]?.name, "crlf");
  assert.equal(items[0]?.userInvocable, false);
});

test("project walk-up stops at the folder holding .git", () => {
  const base = tmp();
  write(base, "_claude/skills/above/SKILL.md", skillMd());
  mkdirSync(join(base, "repo", ".git"), { recursive: true });
  write(base, "repo/_claude/skills/root-skill/SKILL.md", skillMd());
  write(base, "repo/pkg/_claude/skills/pkg-skill/SKILL.md", skillMd());
  const start = join(base, "repo", "pkg", "sub");
  mkdirSync(start, { recursive: true });
  const items = scan({ configDirName: "_claude", home: join(base, "nohome"), projectDir: start, managedDir: "", env: {} });
  assert.deepEqual(names(items), ["pkg-skill", "root-skill"]);
  assert.deepEqual(items.map((i) => i.layer).sort(), [1, 2]);
});

test("without a git root only the start folder is read", () => {
  const base = tmp();
  write(base, "_claude/skills/parent/SKILL.md", skillMd());
  write(base, "work/_claude/skills/here/SKILL.md", skillMd());
  assert.deepEqual(projectLayers(join(base, "work")).length >= 1, true);
  const items = scan({ configDirName: "_claude", home: join(base, "nohome"), projectDir: join(base, "work"), stopDir: join(base, "work"), managedDir: "", env: {} });
  assert.deepEqual(names(items), ["here"]);
});

test("missing folders are skipped without errors", () => {
  const base = tmp();
  const items = scan({
    configDirName: "_claude",
    home: join(base, "none"),
    projectDir: join(base, "none2"),
    managedDir: join(base, "none3"),
    pluginDirs: [join(base, "none4")],
    env: {},
  });
  assert.deepEqual(items, []);
});

test("--user-dir beats --home and CLAUDE_CONFIG_DIR picks the personal folder", () => {
  const base = tmp();
  write(base, "home/_claude/skills/from-home/SKILL.md", skillMd());
  write(base, "direct/skills/from-user-dir/SKILL.md", skillMd());
  write(base, "envdir/skills/from-env/SKILL.md", skillMd());
  const common = { configDirName: "_claude", managedDir: "" };
  assert.deepEqual(names(scan({ ...common, home: join(base, "home"), env: {} })), ["from-home"]);
  assert.deepEqual(names(scan({ ...common, home: join(base, "home"), userDir: join(base, "direct"), env: {} })), ["from-user-dir"]);
  assert.deepEqual(names(scan({ ...common, env: { CLAUDE_CONFIG_DIR: join(base, "envdir") } })), ["from-env"]);
});

test("managed folder skills and commands are scanned", () => {
  const base = tmp();
  write(base, "managed/skills/corp/SKILL.md", skillMd());
  write(base, "managed/commands/policy.md", "x");
  const items = scan({ configDirName: "_claude", home: join(base, "h"), managedDir: join(base, "managed"), env: {} });
  assert.deepEqual(names(items), ["corp", "policy"]);
  assert.ok(items.every((i) => i.scope === "managed"));
});

test("plugin name comes from plugin.json, then the folder name", () => {
  const base = tmp();
  write(base, "p1/.claude-plugin/plugin.json", JSON.stringify({ name: "rootly" }));
  write(base, "p1/skills/status/SKILL.md", skillMd());
  write(base, "p1/commands/run.md", "x");
  write(base, "folder-name/skills/thing/SKILL.md", skillMd());
  write(base, "rootskill/SKILL.md", skillMd());
  write(base, "broken/.claude-plugin/plugin.json", "{ not json");
  write(base, "broken/skills/x/SKILL.md", skillMd());
  const items = scan({
    configDirName: "_claude",
    home: join(base, "h"),
    managedDir: "",
    pluginDirs: [join(base, "p1"), join(base, "folder-name"), join(base, "rootskill"), join(base, "broken")],
    env: {},
  });
  assert.deepEqual(names(items), ["broken:x", "folder-name:thing", "rootly:run", "rootly:status", "rootskill:rootskill"]);
  assert.equal(items.find((i) => i.name === "rootly:status")?.bare, "status");
});

test("a project folder equal to the personal folder is not counted twice", () => {
  const base = tmp();
  write(base, "home/_claude/skills/once/SKILL.md", skillMd());
  const items = scan({ configDirName: "_claude", home: join(base, "home"), projectDir: join(base, "home"), stopDir: join(base, "home"), managedDir: "", env: {} });
  assert.deepEqual(names(items), ["once"]);
});

test("a folder named SKILL.md is skipped with a warning, not a crash", () => {
  const home = tmp();
  mkdirSync(join(home, "_claude/skills/x/SKILL.md"), { recursive: true });
  write(home, "_claude/skills/ok/SKILL.md", skillMd());
  const items = scan({ configDirName: "_claude", home, managedDir: "", env: {} });
  assert.deepEqual(names(items), ["ok"]);
});

test("cli: unreadable SKILL.md warns on stderr and exits like a normal run", () => {
  const home = tmp();
  mkdirSync(join(home, "_claude/skills/x/SKILL.md"), { recursive: true });
  const r = cli(["check", "--home", home, "--config-dir-name", "_claude", "--managed-dir", "", "--project", tmp(), "--fail-on", "none"]);
  assert.equal(r.code, 0);
  assert.match(r.err, /warning: cannot read .*SKILL\.md: EISDIR/);
});

test("a symlink loop in commands/ does not make up items", () => {
  const home = tmp();
  write(home, "_claude/commands/a.md", "x");
  symlinkSync("..", join(home, "_claude/commands/loop"));
  const items = scan({ configDirName: "_claude", home, managedDir: "", env: {} });
  assert.deepEqual(names(items), ["a"]);
});

test("skill that aliases a built-in gets the skill wording", () => {
  const home = tmp();
  write(home, "_claude/skills/Review/SKILL.md", skillMd());
  const r = cli(["check", "--home", home, "--config-dir-name", "_claude", "--managed-dir", "", "--project", tmp(), "--fail-on", "none"]);
  assert.match(r.out, /a report says a same-named command file hid one/);
  assert.doesNotMatch(r.out, /reported a command file hiding one/);
});

test("cli: unknown option and missing value are translated", () => {
  const a = cli(["check", "--bogus", "--lang", "ko"]);
  assert.equal(a.code, 2);
  assert.match(a.err, /알 수 없는 옵션입니다: --bogus/);
  assert.doesNotMatch(a.err, /Unknown option/);
  const b = cli(["check", "--project"]);
  assert.equal(b.code, 2);
  assert.match(b.err, /option --project needs a value/);
  assert.match(cli(["check", "--bogus"]).err, /unknown option --bogus/);
});
