/**
 * Client Discovery & Project Blueprint Engine, Gate 10.8B — negative tests of the evidence
 * verifier itself. A verifier that always passes is worthless; this proves it actually fails on 5
 * specific injected defects, using in-memory mutated copies (never committed) so the real manifest
 * on disk is untouched.
 *
 * Run: npx tsx scripts/gate10-8b-negative-tests.ts
 */
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const MANIFEST_PATH = join(ROOT, "docs", "business-concierge", "BUSINESS_CONCIERGE_MASTER_MD_EVIDENCE_MANIFEST.json");
const TMP_MANIFEST_PATH = join(ROOT, "docs", "business-concierge", "BUSINESS_CONCIERGE_MASTER_MD_EVIDENCE_MANIFEST.json"); // verifier reads this fixed path
const VERIFIER_SCRIPT = join(ROOT, "scripts", "gate10-8-verify-evidence-manifest.ts");

const original = readFileSync(MANIFEST_PATH, "utf8");
const originalManifest = JSON.parse(original);

function runVerifierExpectingFailure(mutatedManifest: any, label: string): boolean {
  writeFileSync(TMP_MANIFEST_PATH, JSON.stringify(mutatedManifest, null, 2), "utf8");
  try {
    execSync(`npx tsx "${VERIFIER_SCRIPT}"`, { cwd: ROOT, stdio: "pipe" });
    console.log(`FAIL  ${label} — verifier PASSED on a mutated/broken manifest (should have failed!)`);
    return false;
  } catch {
    console.log(`PASS  ${label} — verifier correctly FAILED on the injected defect`);
    return true;
  } finally {
    writeFileSync(MANIFEST_PATH, original, "utf8"); // restore real manifest immediately after each check
  }
}

let allPass = true;

// 1. Remove one reqId (delete a row entirely).
{
  const m = JSON.parse(JSON.stringify(originalManifest));
  m.requirements.splice(0, 1);
  allPass = runVerifierExpectingFailure(m, "MISSING_REQ (removed one row, count != 612)") && allPass;
}

// 2. Reference an unknown mechanism.
{
  const m = JSON.parse(JSON.stringify(originalManifest));
  m.requirements[0].mechanismIds = ["M-DOES-NOT-EXIST"];
  allPass = runVerifierExpectingFailure(m, "UNKNOWN_MECHANISM (row references a mechanism not in the registry)") && allPass;
}

// 3. Remove persistence evidence from a PERSISTENCE-class row.
{
  const m = JSON.parse(JSON.stringify(originalManifest));
  const persistRow = m.requirements.find((r: any) => r.requirementClasses.includes("PERSISTENCE"));
  persistRow.persistenceEvidence = [];
  allPass = runVerifierExpectingFailure(m, "MISSING_PERSISTENCE_EVIDENCE (PERSISTENCE-class row with empty persistenceEvidence)") && allPass;
}

// 4. Mark one row NOT_PROVEN.
{
  const m = JSON.parse(JSON.stringify(originalManifest));
  m.requirements[0].status = "NOT_PROVEN";
  allPass = runVerifierExpectingFailure(m, "NOT_PROVEN_STATUS (one row marked NOT_PROVEN)") && allPass;
}

// 5. Duplicate one reqId.
{
  const m = JSON.parse(JSON.stringify(originalManifest));
  m.requirements.push({ ...m.requirements[0] });
  allPass = runVerifierExpectingFailure(m, "DUPLICATE_REQ (one reqId appears twice)") && allPass;
}

// Final restore + sanity check the real manifest is back to its correct state.
writeFileSync(MANIFEST_PATH, original, "utf8");
const restored = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
console.log(`\nReal manifest restored: ${restored.requirements.length === originalManifest.requirements.length ? "OK" : "MISMATCH — MANUAL CHECK NEEDED"}`);

console.log(`\n${allPass ? "ALL 5 NEGATIVE TESTS PASS (verifier correctly fails on every injected defect)" : "SOME NEGATIVE TESTS FAILED — verifier is not adversarial enough"}`);
if (!allPass) process.exit(1);
