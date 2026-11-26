// English message table. Every user-visible sentence lives here (and in ko.ts).
export const en = {
  // ---- general ----
  "rules.line": "Rules: {host} {version} (docs fetched {fetched}), session: local terminal",
  "demo.banner": "Practice fixture - not your files (mock mode: the real rule engine runs on bundled sample files)",
  "col.status": "STATUS",
  "col.name": "NAME",
  "col.scope": "SCOPE",
  "col.type": "TYPE",
  "col.detail": "DETAIL",
  "summary.line": "{total} items: {counts}",
  "summary.line.one": "{total} item: {counts}",
  "summary.failing": "{failing} item(s) match --fail-on ({failOn}); exit code 1.",
  "summary.clean": "Nothing matches --fail-on ({failOn}).",
  "summary.empty": "No skills or commands found. Check --home, --project or --config-dir-name.",
  "failon.none": "none",

  // ---- verdict messages ----
  "msg.none": "no conflict",
  "msg.removed-builtin": "same name as a removed built-in; nothing to conflict with",
  "msg.plugin-bare-free": "reachable as /{name}; bare /{bare} is free too",
  "msg.reserved-bundled": "bundled /{name} wins where it is available; yours is not loaded there",
  "msg.reserved-folder": "name reserved for claude.ai synced skills; the folder is skipped",
  "msg.reserved-namespace": "reserved namespace; it does not load",
  "msg.reserved-conditional": "reserved when computer use is on (macOS); may not load there",
  "msg.skill-over-command": "skill {winner} wins over this command file",
  "msg.skill-not-invocable": "skill {winner} wins but is user-invocable: false, so typing /{name} runs nothing",
  "msg.higher-scope": "{winnerScope} {winner} has higher precedence",
  "msg.replaces-builtin.noalias": "replaces {kind} /{name} in local terminal sessions",
  "msg.replaces-builtin": "replaces {kind} /{name} in local terminal sessions; alias {aliases} still runs the built-in",
  "msg.builtin-alias": "built-in alias of /{target}; docs say aliases are not replaced, but issue #61857 reported a command file hiding one",
  "msg.builtin-alias.skill": "built-in alias of /{target}; docs say aliases are not replaced, but a report says a same-named command file hid one, so a skill may be affected too",
  "msg.same-scope-duplicate": "another {scope} item has the same name ({winner}); the docs do not say which wins",
  "msg.plugin-bare-taken": "bare /{bare} is taken by {kind}; use /{name}",

  // ---- fix hints (explain) ----
  "fix.none": "",
  "fix.removed-builtin": "",
  "fix.plugin-bare-free": "",
  "fix.reserved-bundled": "Rename the skill folder (and its name: field) to something else.",
  "fix.reserved-folder": "Rename the skill folder (and its name: field) to something else.",
  "fix.reserved-namespace": "Rename the skill folder (and its name: field) to something else.",
  "fix.reserved-conditional": "Rename it if you use computer use on a Mac.",
  "fix.skill-over-command": "Delete or rename one of the two.",
  "fix.skill-not-invocable": "Remove user-invocable: false from the skill, or rename the command file.",
  "fix.higher-scope": "Rename one of them if you need both; the higher scope always wins.",
  "fix.replaces-builtin": "If you meant to replace the built-in, nothing to do. Otherwise rename your skill.",
  "fix.builtin-alias": "Rename yours to be safe, or run /{name} in Claude Code to see which one answers.",
  "fix.same-scope-duplicate": "Keep one of them.",
  "fix.plugin-bare-taken": "Call it with the prefix, /{name}.",

  // ---- explain steps ----
  "step.reserved-miss": "Is /{name} a reserved name? No.",
  "step.reserved-hit": "Is /{name} a reserved name? Yes ({effect}). {note}",
  "step.reserved-conditional": "Is /{name} a reserved name? Only on some machines. {note}",
  "step.skill-vs-command-miss": "Does a skill with the same name exist? No.",
  "step.skill-beats-command": "A skill with the same name exists ({winner}); skills win over command files.",
  "step.skill-blocks-command": "A skill with the same name exists ({winner}) and is user-invocable: false, so /{name} runs nothing (issue #29040).",
  "step.scope-miss": "Does a higher-scope item share the name? No.",
  "step.scope-hit": "A {winnerScope} item has the same name ({winner}); {winnerScope} beats {scope}.",
  "step.scope-duplicate": "Another {scope} item has the same name ({winner}); the docs do not define which one wins.",
  "step.builtin-hit": "Is /{name} a Claude Code {kind}? Yes; a same-named skill of yours replaces it in local terminal sessions.",
  "step.builtin-aliases": "Its aliases are not replaced: alias {aliases} still runs the built-in.",
  "step.builtin-no-aliases": "It has no aliases to worry about.",
  "step.builtin-alias": "Is /{name} a built-in? Yes, an alias of /{target}.",
  "step.builtin-removed": "Is /{name} a built-in? It was removed, so nothing is in the way.",
  "step.builtin-miss": "Is /{name} a built-in, bundled skill or alias? No. Nothing is in the way.",
  "step.plugin-namespace": "Plugin items are always reachable with their prefix: /{name}.",
  "step.plugin-bare-builtin": "Bare /{bare} is a built-in ({kind}), so it keeps the bare name.",
  "step.plugin-bare-local": "Bare /{bare} is used by your item {winner}.",
  "step.plugin-bare-free": "Bare /{bare} is free, so it also works without the prefix.",

  // ---- explain frame ----
  "explain.title": "/{name} - {scope} {type}: {path}",
  "explain.verdict": "Verdict: {status} - {message}",
  "explain.fix": "Fix: {fix}",
  "explain.notfound": "/{name} not found among your skills and commands.",
  "explain.builtin-only": "/{name} is a Claude Code {kind} ({version}); you have no skill or command with this name.",
  "explain.builtin-aliases": "Aliases that run it: {aliases}",
  "explain.alias-of": "/{name} is an alias of /{target}.",
  "explain.reserved": "/{name} is a reserved name ({effect}): creating a skill with it will not load.",

  // ---- errors ----
  "err.prefix": "error",
  "warn.prefix": "warning",
  "err.usage": "{detail}. Run with --help to see the options.",
  "err.no-command": "missing command. Use `check` or `explain <name>` (see --help).",
  "err.unknown-command": "unknown command \"{command}\". Use `check` or `explain <name>`.",
  "err.explain-name": "`explain` needs a name, for example: skillshadow explain ship",
  "err.invalid-lang": "invalid --lang \"{value}\"; use en or ko.",
  "err.invalid-fail-on": "invalid --fail-on value \"{value}\"; use none or a comma list of: {allowed}.",
  "err.path-missing": "{option} folder not found: {path}. Pass an existing folder.",
  "err.unknown-option": "unknown option {option}. Run with --help to see the options.",
  "err.option-value": "option {option} needs a value. Run with --help to see the options.",
  "err.option-no-value": "option {option} does not take a value. Run with --help to see the options.",
  "err.scan-read": "cannot read {file}: {code}. Check its permissions or remove it; it is skipped.",
  "err.scan-read-dir": "cannot read {file}: {code}. It is a folder, not a file, so it is skipped.",
  "err.snapshot": "invalid snapshot {file}: {detail}",

  // ---- help ----
  "help.text": `skillshadow - find out which of your Claude Code skills and slash commands do not actually run

Usage:
  skillshadow check [options]            judge every skill and command file you have
  skillshadow explain <name> [options]   show the step-by-step resolution of one name
  skillshadow check --demo               try it on a bundled practice fixture

Options:
  --project <dir>          project folder to start from (default: current folder)
  --home <dir>             parent of the personal config folder (default: your home)
  --user-dir <dir>         personal config folder itself (default: $CLAUDE_CONFIG_DIR or ~/.claude)
  --managed-dir <dir>      managed (enterprise) folder with skills/ and commands/
  --plugin-dir <dir>       plugin folder to include (repeatable)
  --config-dir-name <n>    config folder name inside home/project (default: .claude)
  --builtins <file>        use this built-in names snapshot instead of the bundled one
  --json                   print JSON instead of a table (check only)
  --fail-on <list|none>    statuses that make check exit 1
                           (default: not-loaded,shadowed,unreachable)
  --demo                   use the bundled practice fixture, not your files
  --lang <en|ko>           output language (or SKILLSHADOW_LANG, LC_ALL, LANG)
  -h, --help               show this help
  -v, --version            show the version

Statuses: ok, overrides, shadowed, not-loaded, unreachable, ambiguous, namespaced-only
Exit codes: 0 nothing to fix, 1 found items matching --fail-on, 2 usage error
`,
  "version.line": "skillshadow {version}",
} as const;

export type MessageKey = keyof typeof en;
