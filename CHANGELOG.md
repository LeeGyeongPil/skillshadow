# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-11-26

### Added

- `check` command: judges every skill and command file in the managed, personal and project scopes
  and from `--plugin-dir` folders; table or `--json` output; `--fail-on` and exit codes 0/1/2.
- `explain <name>` command: step-by-step resolution path, the aliases that still run a built-in, and fix hints.
- Bundled snapshot of Claude Code 2.1.332 built-in names (147 names in four kinds plus reserved names)
  and `--builtins <file>` to replace it.
- `--demo` practice fixture, `--home`, `--user-dir`, `--managed-dir`, `--config-dir-name` options.
- English and Korean output (`--lang`, `SKILLSHADOW_LANG`, `LC_ALL`, `LC_MESSAGES`, `LANG`).
- `scripts/build-snapshot.mjs` to regenerate the snapshot from the official commands page.
