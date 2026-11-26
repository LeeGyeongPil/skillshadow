import assert from "node:assert/strict";
import { test } from "node:test";
import { messageKeys, resolveLang, translator } from "../src/i18n.js";
import { cli } from "./helpers.js";

test("en and ko define exactly the same message keys", () => {
  assert.deepEqual(messageKeys("en"), messageKeys("ko"));
});

test("every placeholder used in en also appears in ko", () => {
  const en = translator("en");
  const ko = translator("ko");
  for (const key of messageKeys("en")) {
    // A placeholder left unresolved would be replaced by "", so compare with sentinel values.
    const vars = Object.fromEntries(["name", "bare", "kind", "winner", "winnerScope", "scope", "aliases", "target", "note", "effect", "path", "type", "status", "message", "fix", "version", "host", "fetched", "total", "counts", "failing", "failOn", "detail", "file", "value", "allowed", "option", "command"].map((k) => [k, `@@${k}@@`]));
    const used = (s: string): string[] => [...new Set(s.match(/@@\w+@@/g) ?? [])].sort();
    const k = key as Parameters<typeof en>[0];
    assert.deepEqual(used(ko(k, vars)), used(en(k, vars)), `placeholders differ for ${key}`);
  }
});

test("precedence: --lang > SKILLSHADOW_LANG > LC_ALL > LC_MESSAGES > LANG", () => {
  assert.equal(resolveLang("ko", { SKILLSHADOW_LANG: "en", LC_ALL: "en_US.UTF-8" }), "ko");
  assert.equal(resolveLang(undefined, { SKILLSHADOW_LANG: "ko", LC_ALL: "en_US.UTF-8" }), "ko");
  assert.equal(resolveLang(undefined, { LC_ALL: "ko_KR.UTF-8", LC_MESSAGES: "en_US", LANG: "en_US" }), "ko");
  assert.equal(resolveLang(undefined, { LC_MESSAGES: "ko_KR.UTF-8", LANG: "en_US" }), "ko");
  assert.equal(resolveLang(undefined, { LANG: "ko_KR.UTF-8" }), "ko");
  assert.equal(resolveLang(undefined, { LANG: "en_US.UTF-8" }), "en");
  assert.equal(resolveLang(undefined, {}), "en");
});

test("an unknown SKILLSHADOW_LANG falls through to the locale variables", () => {
  assert.equal(resolveLang(undefined, { SKILLSHADOW_LANG: "fr", LANG: "ko_KR.UTF-8" }), "ko");
  assert.equal(resolveLang(undefined, { SKILLSHADOW_LANG: "fr", LANG: "de_DE" }), "en");
});

test("help switches language with --lang", () => {
  const en = cli(["--help", "--lang", "en"]).out;
  const ko = cli(["--help", "--lang", "ko"]).out;
  assert.match(en, /find out which of your Claude Code skills/);
  assert.match(ko, /사용법/);
  assert.notEqual(en, ko);
});

test("check table and explain follow the language, JSON codes do not", () => {
  const en = cli(["check", "--demo", "--lang", "en"]).out;
  const ko = cli(["check", "--demo", "--lang", "ko"]).out;
  assert.match(en, /Practice fixture/);
  assert.match(en, /STATUS/);
  assert.match(ko, /연습용 픽스처/);
  assert.match(ko, /상태/);
  assert.match(cli(["explain", "usage", "--demo", "--lang", "ko"]).out, /판정: OVERRIDES/);
  const jEn = JSON.parse(cli(["check", "--demo", "--json", "--lang", "en"]).out);
  const jKo = JSON.parse(cli(["check", "--demo", "--json", "--lang", "ko"]).out);
  const codes = (j: { items: { status: string; reason: string }[] }): string[] => j.items.map((i) => `${i.status}/${i.reason}`);
  assert.deepEqual(codes(jEn), codes(jKo));
  assert.notEqual(jEn.items[0].message, jKo.items[0].message);
});

test("environment variables choose the language when --lang is absent", () => {
  assert.match(cli(["check", "--demo"], { SKILLSHADOW_LANG: "ko" }).out, /연습용 픽스처/);
  assert.match(cli(["check", "--demo"], { LANG: "ko_KR.UTF-8" }).out, /연습용 픽스처/);
  assert.match(cli(["check", "--demo"], { LANG: "ko_KR.UTF-8", SKILLSHADOW_LANG: "en" }).out, /Practice fixture/);
  assert.match(cli(["check", "--demo", "--lang", "en"], { SKILLSHADOW_LANG: "ko" }).out, /Practice fixture/);
});
