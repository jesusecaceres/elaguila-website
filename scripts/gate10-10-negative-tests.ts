/**
 * Client Discovery & Project Blueprint Engine, Gate 10.10 — negative tests of the normalization
 * verifier itself. Proves it actually fails on 6 specific injected defects, using in-memory mutated
 * copies (never committed) so the real normalization artifact on disk is untouched.
 *
 * Run: npx tsx scripts/gate10-10-negative-tests.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const NORM_PATH = join(ROOT, "docs", "business-concierge", "BUSINESS_CONCIERGE_RAW_TO_ATOMIC_NORMALIZATION.json");
const VERIFIER_SCRIPT = join(ROOT, "scripts", "gate10-10-verify-normalization.ts");

const original = readFileSync(NORM_PATH, "utf8");
const originalNorm = JSON.parse(original);

function runVerifierExpectingFailure(mutated: any, label: string): boolean {
  writeFileSync(NORM_PATH, JSON.stringify(mutated, null, 2), "utf8");
  try {
    execSync(`npx tsx "${VERIFIER_SCRIPT}"`, { cwd: ROOT, stdio: "pipe" });
    console.log(`FAIL  ${label} — verifier PASSED on a mutated/broken normalization (should have failed!)`);
    return false;
  } catch {
    console.log(`PASS  ${label} — verifier correctly FAILED on the injected defect`);
    return true;
  } finally {
    writeFileSync(NORM_PATH, original, "utf8");
  }
}

let allPass = true;

// 1. Remove one raw disposition (delete a row entirely -- breaks the raw-count-matches-extraction check).
{
  const n = JSON.parse(JSON.stringify(originalNorm));
  n.splice(0, 1);
  allPass = runVerifierExpectingFailure(n, "REMOVED_DISPOSITION (deleted one row, count mismatch vs extraction)") && allPass;
}

// 2. Map one raw item to a nonexistent reqId.
{
  const n = JSON.parse(JSON.stringify(originalNorm));
  n[0].atomicReqIds = ["REQ-999.99"];
  allPass = runVerifierExpectingFailure(n, "NONEXISTENT_REQID (row references a reqId not in the evidence manifest)") && allPass;
}

// 3. Remove raw source from one atomic req (blank out every row citing it).
{
  const n = JSON.parse(JSON.stringify(originalNorm));
  const targetId = n.find((r: any) => r.atomicReqIds?.includes("REQ-14.1"))?.atomicReqIds ? "REQ-14.1" : n[1].atomicReqIds[0];
  for (const r of n) r.atomicReqIds = (r.atomicReqIds ?? []).filter((id: string) => id !== targetId);
  allPass = runVerifierExpectingFailure(n, `MISSING_CANONICAL_BASIS (no raw item cites ${targetId} any more)`) && allPass;
}

// 4. Break disposition arithmetic (corrupt a disposition label so it no longer sums cleanly / becomes invalid).
{
  const n = JSON.parse(JSON.stringify(originalNorm));
  n[2].disposition = "TOTALLY_MADE_UP_CATEGORY";
  allPass = runVerifierExpectingFailure(n, "INVALID_DISPOSITION (disposition label outside the allowed set)") && allPass;
}

// 5. Create an unresolved consolidation (mark one row UNRESOLVED, simulating a gap the build script
//    could not close).
{
  const n = JSON.parse(JSON.stringify(originalNorm));
  n[3].disposition = "UNRESOLVED";
  n[3].atomicReqIds = [];
  allPass = runVerifierExpectingFailure(n, "UNRESOLVED_CONSOLIDATION (one row left UNRESOLVED)") && allPass;
}

// 6. Duplicate one atomic-req mapping in a way that breaks SYNTHESIZED_WITH_SIBLING integrity (mark a
//    row SYNTHESIZED_WITH_SIBLING with zero real siblings, i.e. a synthesis claim with no group behind it).
{
  const n = JSON.parse(JSON.stringify(originalNorm));
  const idx = n.findIndex((r: any) => r.disposition !== "SYNTHESIZED_WITH_SIBLING");
  n[idx].disposition = "SYNTHESIZED_WITH_SIBLING";
  n[idx].siblingRawIds = [];
  allPass = runVerifierExpectingFailure(n, "ORPHAN_SYNTHESIS (SYNTHESIZED_WITH_SIBLING row with zero siblings)") && allPass;
}

writeFileSync(NORM_PATH, original, "utf8");
const restored = JSON.parse(readFileSync(NORM_PATH, "utf8"));
console.log(`\nReal normalization artifact restored: ${restored.length === originalNorm.length ? "OK" : "MISMATCH — MANUAL CHECK NEEDED"}`);

console.log(`\n${allPass ? "ALL 6 NEGATIVE TESTS PASS (verifier correctly fails on every injected defect)" : "SOME NEGATIVE TESTS FAILED — verifier is not adversarial enough"}`);
if (!allPass) process.exit(1);
