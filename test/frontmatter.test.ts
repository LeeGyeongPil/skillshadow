import assert from "node:assert/strict";
import { test } from "node:test";
import { parseFrontmatter } from "../src/frontmatter.js";

test("reads name and flags", () => {
  const fm = parseFrontmatter("---\nname: status\nuser-invocable: false\ndisable-model-invocation: true\n---\nbody");
  assert.deepEqual(fm, { name: "status", userInvocable: false, disableModelInvocation: true });
});

test("handles CRLF line endings and a BOM", () => {
  const fm = parseFrontmatter("﻿---\r\nname: crlf-name\r\nuser-invocable: false\r\n---\r\nbody\r\n");
  assert.equal(fm.name, "crlf-name");
  assert.equal(fm.userInvocable, false);
});

test("strips quotes and trailing comments", () => {
  assert.equal(parseFrontmatter('---\nname: "quoted"\n---').name, "quoted");
  assert.equal(parseFrontmatter("---\nname: 'single'\n---").name, "single");
  assert.equal(parseFrontmatter("---\nname: plain # note\n---").name, "plain");
  assert.equal(parseFrontmatter('---\nuser-invocable: "false"\n---').userInvocable, false);
});

test("returns nothing without a closed front-matter block", () => {
  assert.deepEqual(parseFrontmatter("no front matter"), {});
  assert.deepEqual(parseFrontmatter("---\nname: unclosed\n"), {});
  assert.deepEqual(parseFrontmatter(""), {});
});

test("ignores unknown keys and non-boolean values", () => {
  const fm = parseFrontmatter("---\ndescription: x\nuser-invocable: maybe\n---");
  assert.deepEqual(fm, {});
});
