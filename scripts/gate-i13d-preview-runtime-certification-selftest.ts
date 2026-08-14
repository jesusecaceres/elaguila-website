/**
 * Work Package I.13D — Full-Catalog Preview Runtime Certification self-test.
 *
 * This package implemented no surviving code fix: one fix attempt (removing an explicit Suspense
 * wrapper from dealers-de-autos/results/page.tsx) was tested live and disproven, then fully
 * reverted, in this package. A later package (Globalization P1) identified the real, shared root
 * cause — a redundant global <Suspense> in app/layout.tsx swallowing the reveal for every locally-
 * suspending page. dealers-de-autos/results/page.tsx keeps its own local Suspense boundary (Next.js
 * requires one wherever useSearchParams() is called, checked at build time regardless of runtime
 * behavior) — removing it, as this package's disproven attempt did, was never the fix; removing the
 * redundant ancestor boundary one layout level up was. This test therefore asserts that the ledger
 * honestly records: (1) the real Vercel
 * Preview that was located and why it couldn't be used; (2) both disclosed operational mistakes
 * and their required owner follow-up; (3) the two fix hypotheses tested and disproven this
 * package; (4) the corrected classification reasoning; (5) that the diff contains no surviving
 * source change.
 *
 * Run from repo root:
 *   npx tsx scripts/gate-i13d-preview-runtime-certification-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");

function readSource(rel: string): string {
  return readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

async function main() {
  const ledgerSrc = readSource("docs/gate-i5-7f-full-catalog-route-contract-matrix.md");
  const sectionStart = ledgerSrc.indexOf("Work Package I.13D Update Log");
  const sectionEnd = ledgerSrc.indexOf("Work Package I.13C Update Log");
  assert.ok(sectionStart > -1, "ledger must record an I.13D section");
  assert.ok(sectionEnd > sectionStart, "the I.13D section must precede the I.13C section (most-recent-first ordering)");
  const section = ledgerSrc.slice(sectionStart, sectionEnd);

  /* ============================================================================================
   * The real Preview must be recorded precisely: URL, commit, environment, and the exact
   * access blocker — not glossed over as simply "unavailable."
   * ========================================================================================== */
  assert.ok(section.includes("c17ebc9c"), "ledger must record the exact commit the real Preview was built from");
  assert.ok(/leonix-media-af8omrpog-jesus-caceres-projects\.vercel\.app/.test(section), "ledger must record the real Preview URL");
  assert.ok(/production_environment: false/.test(section), "ledger must record that the deployment was confirmed Preview, not production");
  assert.ok(/SSO|Deployment Protection/.test(section), "ledger must name the exact access blocker (Vercel SSO / Deployment Protection)");

  /* ============================================================================================
   * Both disclosed mistakes must be recorded honestly, with the exact owner action required —
   * not summarized away or omitted now that the session has moved on.
   * ========================================================================================== */
  assert.ok(/elaguila-website.*Vercel project|stray Vercel project/i.test(section), "ledger must disclose the stray Vercel project mistake");
  assert.ok(/SUPABASE_SERVICE_ROLE_KEY/.test(section) && /rotate/i.test(section), "ledger must disclose the secrets-exposure mistake and recommend credential rotation");

  /* ============================================================================================
   * Both fix hypotheses tested this package must be recorded as tested-and-disproven, not
   * silently dropped or implied to still be open.
   * ========================================================================================== */
  assert.ok(/static.*dynamic|dynamic.*static/i.test(section), "ledger must record the static-vs-dynamic route classification finding");
  assert.ok(/Suspense/.test(section), "ledger must record the Suspense-wrapper hypothesis");
  assert.ok(/did not fix the stuck state|reverted/i.test(section), "ledger must state plainly that the Suspense-wrapper fix attempt failed and was reverted");

  /* ============================================================================================
   * The classification must be honest — not upgraded to a false certainty in either direction.
   * ========================================================================================== */
  assert.ok(/MIXED \/ UNRESOLVED|MIXED\/UNRESOLVED/.test(section), "ledger must record an honest, non-overclaiming classification");
  assert.ok(!/PREVIEW READY/.test(section), "I.13D's own section must not claim PREVIEW READY given the unresolved finding");

  /* ============================================================================================
   * NOTE: this file previously asserted, here, that I.13D's own working-tree diff (at the moment
   * of ITS commit) contained only the ledger and this test — a one-time, package-specific check
   * of that package's own commit, not a permanent invariant. It was removed because it could never
   * legitimately pass again once a later package (Globalization P1) made real, kept changes to
   * dealers-de-autos/results/page.tsx and app/layout.tsx. The historical facts about I.13D's own
   * package (its disproven, reverted attempt) remain asserted above via the ledger section checks.
   * ========================================================================================== */

  console.log("gate-i13d-preview-runtime-certification-selftest: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
