import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";
import { cli, ROOT, skillMd, tmp, write } from "./helpers.js";

test("exit codes", () => {
  assert.equal(cli(["check", "--demo"]).code, 1);
  assert.equal(cli(["check", "--demo", "--fail-on", "none"]).code, 0);
  assert.equal(cli(["check", "--demo", "--fail-on", "ambiguous"]).code, 1); // /checkpoint
  assert.equal(cli(["check", "--demo", "--fail-on", "namespaced-only,ambiguous"]).code, 1);
  const missing = cli(["check", "--project", "/definitely/not/here"]);
  assert.equal(missing.code, 2);
  assert.match(missing.err, /--project folder not found/);
  assert.equal(cli(["check", "--bogus"]).code, 2);
  assert.equal(cli([]).code, 2);
  assert.equal(cli(["frobnicate"]).code, 2);
  assert.equal(cli(["explain"]).code, 2);
  assert.equal(cli(["check", "--lang", "fr"]).code, 2);
  assert.equal(cli(["check", "--demo", "--fail-on", "bogus"]).code, 2);
  assert.equal(cli(["check", "--plugin-dir", "/definitely/not/here"]).code, 2);
});

test("a clean folder exits 0", () => {
  const home = tmp();
  write(home, "_claude/skills/fine/SKILL.md", skillMd());
  const r = cli(["check", "--home", home, "--config-dir-name", "_claude", "--project", home, "--managed-dir", ""]);
  assert.equal(r.code, 0);
  assert.match(r.out, /Nothing matches --fail-on/);
});

test("an empty setup says so", () => {
  const home = tmp();
  const r = cli(["check", "--home", home, "--project", home, "--managed-dir", ""]);
  assert.equal(r.code, 0);
  assert.match(r.out, /No skills or commands found/);
});

test("--json shape", () => {
  const r = cli(["check", "--demo", "--json"]);
  assert.equal(r.code, 1);
  const doc = JSON.parse(r.out);
  assert.deepEqual(doc.rules, { host: "claude-code", version: "2.1.332", fetched: "2026-11-26", session: "local-terminal" });
  assert.equal(doc.summary.total, 12);
  assert.equal(doc.summary.failing, 4);
  assert.deepEqual(doc.summary.fail_on, ["not-loaded", "shadowed", "unreachable"]);
  assert.equal(doc.summary.by_status["not-loaded"], 2);
  assert.equal(doc.items.length, 12);
  for (const item of doc.items) {
    assert.deepEqual(Object.keys(item).sort(), ["message", "name", "path", "reason", "scope", "status", "type"]);
  }
  const ship = doc.items.find((i: { name: string }) => i.name === "ship");
  assert.equal(ship.status, "not-loaded");
  assert.equal(ship.reason, "reserved-bundled");
  assert.match(ship.message, /bundled \/ship wins/);
});

test("check table lists statuses and the practice-fixture banner", () => {
  const r = cli(["check", "--demo"]);
  assert.match(r.out, /Practice fixture/);
  assert.match(r.out, /Rules: Claude Code 2\.1\.332 \(docs fetched 2026-11-26\)/);
  for (const word of ["NOT-LOADED", "OVERRIDES", "SHADOWED", "UNREACHABLE", "AMBIGUOUS", "NAMESPACED-ONLY"]) {
    assert.match(r.out, new RegExp(word));
  }
  assert.doesNotMatch(r.out, /\u001b\[/); // no colors when not a TTY
});

test("explain", () => {
  const usage = cli(["explain", "usage", "--demo", "--lang", "en"]);
  assert.equal(usage.code, 0);
  assert.match(usage.out, /OVERRIDES/);
  assert.match(usage.out, /\/cost/);
  assert.match(usage.out, /2\.1\.332/);
  assert.match(usage.out, /1\. Is \/usage a reserved name\? No\./);
  assert.match(usage.out, /still runs the built-in/);

  const ship = cli(["explain", "/ship", "--demo"]);
  assert.match(ship.out, /Is \/ship a reserved name\? Yes/);
  assert.match(ship.out, /NOT-LOADED/);
  assert.match(ship.out, /Fix: Rename the skill folder/);

  const deploy = cli(["explain", "deploy", "--demo"]);
  assert.match(deploy.out, /SHADOWED/);
  assert.match(deploy.out, /OK/);

  const plugin = cli(["explain", "status", "--demo"]);
  assert.match(plugin.out, /rootly:status/);
  assert.match(plugin.out, /NAMESPACED-ONLY/);
});

test("explain of an unknown name prints not found and exits 0", () => {
  const r = cli(["explain", "no-such-thing", "--demo"]);
  assert.equal(r.code, 0);
  assert.match(r.out, /not found/);
});

test("explain of a built-in you do not shadow describes the built-in", () => {
  const r = cli(["explain", "compact", "--demo"]);
  assert.equal(r.code, 0);
  assert.match(r.out, /Claude Code builtin/);
  const alias = cli(["explain", "cost", "--demo"]);
  assert.match(alias.out, /alias of \/usage/);
  const reserved = cli(["explain", "steward-x", "--demo"]);
  assert.match(reserved.out, /not found/);
});

test("invalid snapshot", () => {
  const dir = tmp();
  const bad = write(dir, "bad.json", JSON.stringify({ entries: [] }));
  const r = cli(["check", "--demo", "--builtins", bad]);
  assert.equal(r.code, 2);
  assert.match(r.err, /error: invalid snapshot .*bad\.json: missing string field "version"/);
  const missing = cli(["check", "--demo", "--builtins", join(dir, "nope.json")]);
  assert.equal(missing.code, 2);
  assert.match(missing.err, /invalid snapshot/);
});

test("--version prints the package version", () => {
  assert.match(cli(["--version"]).out, /^skillshadow \d+\.\d+\.\d+\n$/);
});

test("the compiled binary runs end to end", () => {
  const bin = join(ROOT, "dist-test", "src", "cli.js");
  const r = spawnSync(process.execPath, [bin, "check", "--demo", "--json"], {
    env: { PATH: process.env.PATH ?? "", LANG: "C" },
    encoding: "utf8",
  });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /"version": "2\.1\.332"/);
  const help = spawnSync(process.execPath, [bin, "--help", "--lang", "ko"], { encoding: "utf8" });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /사용법/);
});

test("package.json has no runtime dependencies and the bundled files exist", async () => {
  const { readFileSync, existsSync } = await import("node:fs");
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  assert.equal(pkg.dependencies, undefined);
  assert.ok(existsSync(join(ROOT, "builtins", "claude-code-2.1.332.json")));
  assert.ok(existsSync(join(ROOT, "fixtures", "demo", "home", "_claude")));
});
