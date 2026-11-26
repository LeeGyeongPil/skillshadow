import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parseCommandsDoc } from "../src/parse-commands-doc.js";
import { ROOT } from "./helpers.js";

const entries = parseCommandsDoc(readFileSync(join(ROOT, "test", "fixtures", "commands-excerpt.md"), "utf8"));
const byName = new Map(entries.map((e) => [e.name, e]));

test("classifies builtin, bundled skill and bundled workflow rows", () => {
  assert.equal(byName.get("alpha")?.kind, "builtin");
  assert.equal(byName.get("beta")?.kind, "bundled-skill");
  assert.equal(byName.get("flow")?.kind, "bundled-workflow");
});

test("classifies rows that are aliases (Alias for / Alias of)", () => {
  assert.deepEqual(byName.get("gamma"), { name: "gamma", kind: "alias", aliasOf: "alpha" });
  assert.deepEqual(byName.get("delta"), { name: "delta", kind: "alias", aliasOf: "alpha" });
});

test("extracts extra aliases from Alias:, Aliases: and Also available as", () => {
  assert.equal(byName.get("epsilon")?.kind, "builtin");
  assert.deepEqual(byName.get("eps"), { name: "eps", kind: "alias", aliasOf: "epsilon" });
  assert.deepEqual(byName.get("z1"), { name: "z1", kind: "alias", aliasOf: "zeta" });
  assert.deepEqual(byName.get("z2"), { name: "z2", kind: "alias", aliasOf: "zeta" });
  assert.deepEqual(byName.get("h"), { name: "h", kind: "alias", aliasOf: "eta" });
});

test("marks removed rows", () => {
  assert.deepEqual(byName.get("old"), { name: "old", kind: "builtin", removed: true });
});

test("handles escaped pipes and ignores prose", () => {
  assert.equal(byName.get("pipe")?.kind, "builtin");
  assert.equal(byName.get("two")?.kind, "builtin");
  assert.equal(byName.has("ignored"), false);
});

test("counts every distinct name once", () => {
  assert.equal(entries.length, new Set(entries.map((e) => e.name)).size);
  assert.equal(entries.length, 15);
});
