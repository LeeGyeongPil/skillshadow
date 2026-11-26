#!/usr/bin/env node
// Dev script: regenerate builtins/claude-code-<version>.json from a downloaded commands.md.
// Usage: npm run build && node scripts/build-snapshot.mjs <commands.md> <version> <fetched-date> > out.json
import { readFileSync } from "node:fs";
import { parseCommandsDoc } from "../dist/parse-commands-doc.js";

const [file, version, fetched] = process.argv.slice(2);
if (!file || !version || !fetched) {
  console.error("usage: node scripts/build-snapshot.mjs <commands.md> <version> <fetched YYYY-MM-DD>");
  process.exit(2);
}
const skills = "https://code.claude.com/docs/en/skills.md";
const snapshot = {
  host: "claude-code",
  version,
  fetched,
  source: "https://code.claude.com/docs/en/commands.md",
  entries: parseCommandsDoc(readFileSync(file, "utf8")),
  reserved: [
    { name: "ship", effect: "bundled-wins", note: skills + " (resolve skills that share a name); https://code.claude.com/docs/en/ship-command-troubleshooting.md" },
    { name: "ship-local", effect: "bundled-wins", note: "same page as ship" },
    { name: "steward", effect: "bundled-wins", note: "same page as ship" },
    { name: "synced", effect: "folder-skipped", note: skills + " (reserved for claude.ai synced skills)" },
    { name: "anthropic-skills", effect: "namespace", match: "prefix", note: skills + " (reserved namespace)" },
    { name: "computer-use", effect: "conditional", note: "https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md (2.1.332: reserved when computer use is on, macOS)" },
  ],
};
process.stdout.write(JSON.stringify(snapshot, null, 1) + "\n");
