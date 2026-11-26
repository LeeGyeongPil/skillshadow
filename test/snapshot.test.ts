import assert from "node:assert/strict";
import { test } from "node:test";
import { cli, DEMO, tmp, write } from "./helpers.js";
import { resolveAll } from "../src/resolve.js";
import { scan } from "../src/scan.js";
import { SnapshotError, bundledSnapshotPath, indexSnapshot, loadSnapshot, validateSnapshot } from "../src/snapshot.js";
import { join } from "node:path";

test("bundled snapshot has 147 names in four kinds", () => {
  const s = loadSnapshot();
  assert.equal(s.version, "2.1.332");
  assert.equal(s.host, "claude-code");
  assert.match(s.source, /^https:\/\/code\.claude\.com\//);
  assert.equal(s.fetched, "2026-11-26");
  const counts: Record<string, number> = {};
  for (const e of s.entries) counts[e.kind] = (counts[e.kind] ?? 0) + 1;
  assert.equal(s.entries.length, 147);
  assert.deepEqual(counts, { builtin: 96, "bundled-skill": 25, alias: 25, "bundled-workflow": 1 });
});

test("bundled snapshot lists the reserved names", () => {
  const names = loadSnapshot().reserved.map((r) => r.name).sort();
  assert.deepEqual(names, ["anthropic-skills", "computer-use", "ship", "ship-local", "steward", "synced"]);
});

test("bundled snapshot path points inside the package", () => {
  assert.match(bundledSnapshotPath(), /builtins[\\/]claude-code-2\.1\.332\.json$/);
});

test("alias index maps a command to its aliases", () => {
  const index = indexSnapshot(loadSnapshot());
  assert.deepEqual(index.aliasesOf.get("usage")?.sort(), ["cost", "stats"]);
});

function demoVerdict(snapshotFile: string, name: string, scope: string) {
  const index = indexSnapshot(loadSnapshot(snapshotFile));
  const items = scan({
    configDirName: "_claude",
    home: join(DEMO, "home"),
    projectDir: join(DEMO, "project"),
    stopDir: join(DEMO, "project"),
    managedDir: "",
    pluginDirs: [join(DEMO, "plugins", "rootly")],
    env: {},
  });
  return resolveAll(items, index).find((v) => v.item.key === name && v.item.scope === scope);
}

test("custom builtins: a name added as built-in makes the personal skill OVERRIDES", () => {
  const dir = tmp();
  const file = write(dir, "snap.json", JSON.stringify({ version: "9.9.9", entries: [{ name: "deploy", kind: "builtin" }] }));
  const v = demoVerdict(file, "deploy", "personal");
  assert.equal(v?.status, "overrides");
  assert.equal(v?.reason, "replaces-builtin");
});

test("custom builtins: without the ship reservation /ship is ok", () => {
  const dir = tmp();
  const file = write(dir, "snap.json", JSON.stringify({ version: "9.9.9", entries: [], reserved: [] }));
  const v = demoVerdict(file, "ship", "personal");
  assert.equal(v?.status, "ok");
  // the bundled snapshot still blocks it
  assert.equal(demoVerdict(bundledSnapshotPath(), "ship", "personal")?.status, "not-loaded");
});

test("custom builtins: the rules line shows the custom version", () => {
  const dir = tmp();
  const file = write(dir, "snap.json", JSON.stringify({ version: "9.9.9", fetched: "2030-01-01", entries: [] }));
  const r = cli(["check", "--demo", "--builtins", file, "--json"]);
  assert.match(r.out, /"version": "9.9.9"/);
});

test("validateSnapshot explains what to fix", () => {
  const bad: [unknown, RegExp][] = [
    [[], /JSON object/],
    [{ entries: [] }, /"version"/],
    [{ version: "1" }, /"entries"/],
    [{ version: "1", entries: [{ kind: "builtin" }] }, /entries\[0\].*"name"/],
    [{ version: "1", entries: [{ name: "a", kind: "nope" }] }, /entries\[0\]\.kind/],
    [{ version: "1", entries: [], reserved: [{ name: "a", effect: "x" }] }, /reserved\[0\]\.effect/],
    [{ version: "1", entries: [], reserved: "x" }, /"reserved"/],
  ];
  for (const [data, re] of bad) {
    assert.throws(() => validateSnapshot(data, "f.json"), (e: unknown) => e instanceof SnapshotError && re.test(e.detail));
  }
});

test("loadSnapshot reports unreadable and non-JSON files", () => {
  const dir = tmp();
  assert.throws(() => loadSnapshot(join(dir, "missing.json")), /cannot read/);
  const file = write(dir, "broken.json", "{ nope");
  assert.throws(() => loadSnapshot(file), /not valid JSON/);
});
