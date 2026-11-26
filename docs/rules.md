# Resolution rules

skillshadow applies these rules in order to every skill and command file it finds.
The rules come from the Claude Code docs (checked 2026-11-26, Claude Code 2.1.332):

- Name resolution table: https://code.claude.com/docs/en/skills.md ("Resolve skills that share a name")
- Built-in names, bundled skills and aliases: https://code.claude.com/docs/en/commands.md
- The bundled /ship case: https://code.claude.com/docs/en/ship-command-troubleshooting.md

| # | Rule | Status | Reason code |
|---|---|---|---|
| 1 | `ship`, `ship-local`, `steward`: where the bundled skill is available it wins and yours is not loaded (always reported; availability is not checked) | not-loaded | reserved-bundled |
| 1 | `synced` (any case): reserved for claude.ai synced skills, the folder is skipped | not-loaded | reserved-folder |
| 1 | `anthropic-skills` and `anthropic-skills:*`: reserved namespace | not-loaded | reserved-namespace |
| 1 | `computer-use`: reserved only on Macs with computer use on (2.1.332 changelog) | ambiguous | reserved-conditional |
| 2 | A command file and a skill share a name: the skill wins | shadowed | skill-over-command |
| 2 | ... and that skill is `user-invocable: false`: nothing runs (issue #29040) | unreachable | skill-not-invocable |
| 3 | Same name, same type, higher scope exists (managed > personal > project) | shadowed | higher-scope |
| 3 | Same name twice in the same scope (for example two project layers): the docs do not say which wins | ambiguous | same-scope-duplicate |
| 4 | Same name as a built-in command, bundled skill or bundled workflow: your item replaces it in local terminal sessions; its aliases still run the built-in | overrides | replaces-builtin |
| 4 | Same name as a built-in alias: docs say aliases are not replaced, issue #61857 reported the opposite | ambiguous | builtin-alias |
| 4 | Same name as a removed command | ok | removed-builtin |
| 5 | Plugin item whose bare name is taken by a built-in or one of your items: reachable only as `/plugin:name` | namespaced-only | plugin-bare-taken |
| 5 | Plugin item whose bare name is free | ok | plugin-bare-free |
| - | Anything else | ok | none |

Names are compared in lower case. A skill's name is its front-matter `name:` if present, otherwise the folder name.
A command file `commands/a/b.md` is `/a:b`; its front matter is ignored. A plugin item is `/<plugin>:<name>`
where the plugin name comes from `.claude-plugin/plugin.json`, otherwise the folder name.

## Why some verdicts are AMBIGUOUS

Where the documentation and user reports disagree, or where the docs say nothing, skillshadow does not guess.
It reports `ambiguous` with the evidence and keeps it out of the default `--fail-on` list.

## Known gaps

- Only the local terminal session is modelled. Non-interactive (`-p`) and IDE sessions have different reserved names.
- The managed (enterprise) folder is read as `<dir>/skills` and `<dir>/commands`; only the Linux path
  `/etc/claude-code` is a default. Use `--managed-dir` elsewhere.
- Nested skill folders (loaded lazily), `--add-dir` folders, MCP server skills and claude.ai synced skills are not scanned.
