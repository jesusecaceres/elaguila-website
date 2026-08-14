/**
 * Globalization Package A Gate 1 — aggregate gate self-test runner.
 *
 * Before this script existed, none of the scripts/gate-*-selftest.ts proofs (60 at the time of
 * writing) had an npm entry or an aggregate runner — every gate had to be invoked by hand as
 * `npx tsx scripts/<name>.ts`, so nothing in CI or a build ever exercised the whole suite
 * (recorded as risk #11 in the Package A master plan). This runner closes that gap:
 *
 *   npm run test:gates                    # run every gate self-test
 *   npm run test:gates -- p3 i11a         # substring-filter which gates run
 *
 * Each self-test runs in its own tsx child process (they are written as standalone scripts
 * with top-level side effects — running them in-process would let one test's module state or
 * process.exit leak into the next). Exit code is non-zero if any gate fails. Output for
 * passing gates is suppressed; a failing gate's full stdout/stderr is replayed so the failure
 * is diagnosable straight from the summary.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const scriptsDir = path.join(repoRoot, "scripts");
const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");

if (!existsSync(tsxCli)) {
  console.error(`run-all-gates: tsx CLI not found at ${tsxCli} — run npm install first.`);
  process.exit(2);
}

const allGateFiles = readdirSync(scriptsDir)
  .filter((file) => /^gate-.*-selftest\.ts$/.test(file))
  .sort();

const filters = process.argv.slice(2).map((arg) => arg.toLowerCase()).filter(Boolean);
const selected = filters.length
  ? allGateFiles.filter((file) => filters.some((needle) => file.toLowerCase().includes(needle)))
  : allGateFiles;

if (selected.length === 0) {
  console.error(
    filters.length
      ? `run-all-gates: no gate self-test matches filter(s): ${filters.join(", ")}`
      : "run-all-gates: no scripts/gate-*-selftest.ts files found.",
  );
  process.exit(2);
}

type GateResult = {
  file: string;
  ok: boolean;
  ms: number;
  stdout: string;
  stderr: string;
  status: number | null;
};

const results: GateResult[] = [];
const suiteStarted = Date.now();

for (const file of selected) {
  const started = Date.now();
  const child = spawnSync(process.execPath, [tsxCli, path.join("scripts", file)], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 180_000,
    env: process.env,
  });
  const ms = Date.now() - started;
  const ok = child.status === 0;
  results.push({
    file,
    ok,
    ms,
    stdout: child.stdout ?? "",
    stderr: child.stderr ?? "",
    status: child.status,
  });
  console.log(`${ok ? "PASS" : "FAIL"}  ${file}  (${(ms / 1000).toFixed(1)}s)`);
}

const failed = results.filter((result) => !result.ok);
const suiteSeconds = ((Date.now() - suiteStarted) / 1000).toFixed(1);

console.log("");
console.log(
  `run-all-gates: ${results.length - failed.length}/${results.length} gate self-tests passed in ${suiteSeconds}s`,
);

if (failed.length > 0) {
  for (const failure of failed) {
    console.error("");
    console.error(`===== FAILED: ${failure.file} (exit ${failure.status ?? "signal/timeout"}) =====`);
    if (failure.stdout.trim()) console.error(failure.stdout.trim());
    if (failure.stderr.trim()) console.error(failure.stderr.trim());
  }
  process.exit(1);
}
