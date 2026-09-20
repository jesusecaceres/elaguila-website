/**
 * LEONIX QUICK — reproducible Ofertas verifier sweep.
 *
 * The final drift ledger's headline claim is that this work introduced zero feature
 * regressions in the Ofertas verifier suite. That claim is only auditable if the suite is
 * a reproducible set rather than a hand-counted one, so the set is defined here in code:
 * every script whose filename mentions "ofertas", minus an explicit exclusion list of
 * scripts that would touch staging, the network, a browser, or a worker queue.
 *
 * Emits a JSON result file so the same sweep can be run in a detached origin/main worktree
 * and the two runs joined into a regression differential.
 *
 * Run:  npx tsx scripts/verify-quick-final-ofertas-sweep-01.ts --out /tmp/sweep-branch.json
 * Diff: npx tsx scripts/verify-quick-final-ofertas-sweep-01.ts --diff /tmp/sweep-main.json /tmp/sweep-branch.json
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCRIPTS = path.join(ROOT, "scripts");
const TIMEOUT_MS = 120_000;

/**
 * Excluded because running them could mutate data, hit the network, or drive a browser.
 * Each entry is a substring match on the filename, kept deliberately literal so the
 * exclusion is auditable rather than a broad regex.
 */
const EXCLUDE_SUBSTRINGS = [
  "staging", // staging environment harnesses and smokes
  "screenshot", // require a browser
  "smoke", // exercise a live pipeline end to end
  "worker", // enqueue or drive background worker jobs
] as const;

export type SweepResult = { script: string; pass: boolean };

/** This sweep's own filename mentions "ofertas", so it must never run itself. */
const SELF = path.basename(__filename);

export function sweepSet(names: string[]): string[] {
  return names
    .filter((n) => /ofertas/i.test(n))
    .filter((n) => n.endsWith(".ts") || n.endsWith(".mjs"))
    .filter((n) => n !== SELF)
    .filter((n) => !EXCLUDE_SUBSTRINGS.some((x) => n.toLowerCase().includes(x)))
    .sort();
}

function runOne(name: string): boolean {
  const file = path.join("scripts", name);
  const res = name.endsWith(".mjs")
    ? spawnSync("node", [file], { cwd: ROOT, timeout: TIMEOUT_MS, encoding: "utf8" })
    : spawnSync("npx", ["tsx", file], { cwd: ROOT, timeout: TIMEOUT_MS, encoding: "utf8" });
  return res.status === 0;
}

function sweep(outPath: string | null): void {
  const set = sweepSet(fs.readdirSync(SCRIPTS));
  const results: SweepResult[] = [];
  for (const name of set) {
    const pass = runOne(name);
    results.push({ script: name, pass });
    process.stdout.write(`${pass ? "PASS" : "FAIL"}  ${name}\n`);
  }
  const passed = results.filter((r) => r.pass).length;
  console.log(
    `\nofertas sweep: ${set.length} scripts — ${passed} pass / ${set.length - passed} fail`,
  );
  if (outPath) {
    fs.writeFileSync(outPath, JSON.stringify({ total: set.length, passed, results }, null, 2));
    console.log(`wrote ${outPath}`);
  }
}

function diff(mainFile: string, branchFile: string): void {
  const load = (f: string): Map<string, boolean> =>
    new Map(
      (JSON.parse(fs.readFileSync(f, "utf8")).results as SweepResult[]).map((r) => [
        r.script,
        r.pass,
      ]),
    );
  const main = load(mainFile);
  const branch = load(branchFile);

  const common = [...branch.keys()].filter((k) => main.has(k)).sort();
  const branchOnly = [...branch.keys()].filter((k) => !main.has(k)).sort();
  const mainOnly = [...main.keys()].filter((k) => !branch.has(k)).sort();

  const regressions = common.filter((k) => main.get(k) === true && branch.get(k) === false);
  const improvements = common.filter((k) => main.get(k) === false && branch.get(k) === true);
  const failBoth = common.filter((k) => !main.get(k) && !branch.get(k));

  const mainPass = common.filter((k) => main.get(k)).length;
  const branchPass = common.filter((k) => branch.get(k)).length;

  console.log(`COMMON SET: ${common.length} scripts present in both trees`);
  console.log(`  origin/main : ${mainPass} pass / ${common.length - mainPass} fail`);
  console.log(`  branch      : ${branchPass} pass / ${common.length - branchPass} fail`);
  console.log(`\nFEATURE REGRESSIONS (main PASS -> branch FAIL): ${regressions.length}`);
  for (const r of regressions) console.log(`  - ${r}`);
  console.log(`IMPROVEMENTS (main FAIL -> branch PASS): ${improvements.length}`);
  for (const r of improvements) console.log(`  + ${r}`);
  console.log(`IDENTICAL FAILURES IN BOTH TREES: ${failBoth.length}`);
  console.log(`\nBRANCH-ONLY SCRIPTS (added by this work): ${branchOnly.length}`);
  for (const r of branchOnly) console.log(`  * ${r} (${branch.get(r) ? "PASS" : "FAIL"})`);
  console.log(`MAIN-ONLY SCRIPTS (deleted by this work): ${mainOnly.length}`);
  for (const r of mainOnly) console.log(`  ! ${r}`);

  if (mainOnly.length > 0) {
    console.error("\nFAIL: this work deleted an Ofertas verifier");
    process.exit(1);
  }
  if (regressions.length > 0) {
    console.error("\nFAIL: feature regression detected");
    process.exit(1);
  }
  console.log("\nOK: no deleted verifier and no feature regression");
}

function main(): void {
  const argv = process.argv.slice(2);
  const diffIdx = argv.indexOf("--diff");
  if (diffIdx >= 0) {
    const [a, b] = [argv[diffIdx + 1], argv[diffIdx + 2]];
    if (!a || !b) throw new Error("--diff needs <main.json> <branch.json>");
    diff(a, b);
    return;
  }
  const outIdx = argv.indexOf("--out");
  sweep(outIdx >= 0 ? (argv[outIdx + 1] ?? null) : null);
}

main();
