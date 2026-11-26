# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [0.1.2] - 2026-11-26

### Fixed

- CI workflow: runs on `main` pushes, `v*` tags, pull requests, a weekly schedule and manual runs,
  uses `actions/checkout@v5` and `actions/setup-node@v5` with Node 22.x and 24.x, prints the Node and
  npm versions, and has a 15-minute limit.
- `--json=yes` (a value on an on/off option) now says the option does not take a value instead of "needs a value".
- The unreadable-file warning only mentions folders when the `SKILL.md` path is a folder (`EISDIR`).
- A one-item summary says "1 item" instead of "1 items".
- README (English and Korean): the `not-loaded` row says the item is not loaded where the reserved
  name applies (for example where the bundled `/ship` is available), the troubleshooting table quotes
  the full "No skills or commands found" message, and the test count is 69.

## [0.1.1] - 2026-11-26

### Fixed

- CI workflow so GitHub Actions passes.
- README troubleshooting table now shows the exact `--project` error text (English and Korean).
- Bug report issue form no longer mentions leftover Python template wording.

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
