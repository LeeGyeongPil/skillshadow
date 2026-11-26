#!/usr/bin/env node
import { run } from "./main.js";

const code = run(process.argv.slice(2), {
  env: process.env,
  cwd: process.cwd(),
  stdout: (s) => process.stdout.write(s),
  stderr: (s) => process.stderr.write(s),
  tty: process.stdout.isTTY === true,
});
process.exitCode = code;
