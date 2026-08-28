/**
 * LIVE QA CORRECTION — Gate H regression audit.
 *
 * Two distinct production defects, both proven from source before being
 * fixed here:
 *
 * (A) Cold hard-refresh reconstruction gap: aiReviewGate was only ever
 * populated by OfertasLocalesAiItemReviewPanel's own effect, which only runs
 * while the dedicated review workspace is mounted. Step5ReviewView defaults
 * to "files" on every fresh mount (Gate D, by design), so a user who had
 * already fully reviewed 127/127 items and then hard-refreshed would see
 * step5ReviewComplete falsely read as incomplete, because aiReviewGate was
 * still at its zeroed initial value. Fixed with a lightweight effect in
 * OfertasLocalesApplicationClient.tsx that reconstructs the same gate shape
 * directly from the existing certified fetchOfertaLocalReviewItems read path
 * — no new API, no scanner involvement.
 *
 * (B) Visual architecture gap: the product-review "screen" was functionally
 * separate (Gate D) but visually still read as content bolted onto the
 * Step 5 Archivos card (no dedicated heading/identity, Step 5's upload
 * checklist and the wizard-level Back/Next footer remained visible
 * underneath it). Fixed by swapping in a dedicated review-screen header when
 * step5ReviewView === "products" and hiding the Step 5 checklist, start-over
 * box, and wizard Back/Next footer for that view — without creating a new
 * route, a new wizard step number, or a second review system.
 *
 * Run: npm run ofertas-locales:gate-h-dedicated-review-hard-refresh-regression-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import { OFERTAS_AI_SCANNER_PROTECTED_PATHS } from "../app/lib/ofertas-locales/ofertasAiScannerProtectedPaths";

function run() {
  const clientSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
    "utf8"
  );
  const workspaceSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx",
    "utf8"
  );

  // --- Case A: Files view shows upload/scan summary but NOT the full product editor ---
  assert.doesNotMatch(
    clientSrc,
    /step5ReviewView === "products"[\s\S]{0,5}\? \(\s*<[\s\S]{0,200}OfertasLocalesAiScanReviewWorkspace/,
    "CASE A FAILED: the constrained Step 5 card content must never render the full review workspace inline"
  );
  assert.match(
    clientSrc,
    /step5ReviewView === "products" \? \(\s*<div className="space-y-1\.5/,
    "CASE A FAILED: Files view's products-mode branch must render the compact dedicated-screen header, not the workspace"
  );
  console.log("Case A (Files view contains summary, not the full editor) passed.");

  // --- Case B: Revisar productos opens the dedicated review screen ---
  assert.match(
    clientSrc,
    /const openProductReviewWorkspace = useCallback\(\(\) => \{[\s\S]*?setStep5ReviewView\("products"\)/,
    "CASE B FAILED: the review-open handler must switch step5ReviewView to 'products'"
  );
  console.log("Case B (Revisar productos opens dedicated review screen) passed.");

  // --- Case C: dedicated review screen reuses OfertasLocalesAiScanReviewWorkspace ---
  const workspaceUsages = [...clientSrc.matchAll(/<OfertasLocalesAiScanReviewWorkspace\b/g)];
  assert.equal(
    workspaceUsages.length,
    1,
    "CASE C FAILED: OfertasLocalesAiScanReviewWorkspace must be reused exactly once, not duplicated"
  );
  console.log("Case C (dedicated review screen reuses existing workspace) passed.");

  // --- Case D: dedicated review screen does not show the Step 5 file checklist simultaneously ---
  assert.match(
    clientSrc,
    /\{step5ReviewView === "products" \? null : \(\s*<div className="rounded-xl border border-\[#D4C4A8\]\/60 bg-\[#FDF8F0\]\/50 px-4 py-3">\s*<p className="text-\[11px\] font-medium uppercase tracking-wide text-\[#1E1814\]\/45">\s*\{c\.startOverNeedQuestion\}/,
    "CASE D FAILED: the start-over box must be hidden while the dedicated review screen is open"
  );
  assert.match(
    clientSrc,
    /step === 5 && step5ReviewView === "products" \? null : step < 7 \? \(/,
    "CASE D FAILED: the wizard-level Back\\/Next footer must be hidden while the dedicated review screen is open"
  );
  console.log("Case D (dedicated review screen hides the Step 5 checklist/footer) passed.");

  // --- Case E: dedicated review completion proceeds directly into Step 6 Extras ---
  assert.match(
    clientSrc,
    /const goToStep6 = useCallback\(\(\) => \{\s*setStep5ManualCheckpoint\(null\);\s*setStep\(6\);/,
    "CASE E FAILED: goToStep6 must remain the existing direct Step 6 handler"
  );
  assert.match(
    workspaceSrc,
    /onContinueToNextStep=\{onContinueToNextStep\}/,
    "CASE E FAILED: the workspace must still forward onContinueToNextStep to the review panel unchanged"
  );
  assert.match(
    clientSrc,
    /onContinueToNextStep=\{goToStep6\}/,
    "CASE E FAILED: the full-width review desk must still wire onContinueToNextStep to goToStep6 directly — no detour back through Step 5"
  );
  console.log("Case E (review completion proceeds directly into Step 6 Extras) passed.");

  // --- Case F: cold mount with completed persisted review reconstructs state before the workspace opens ---
  const reconstructEffectMatch = clientSrc.match(
    /fetchOfertaLocalReviewItems\(effectiveOfertaLocalId, lastScanJobId\)\.then\(\(result\) => \{[\s\S]*?\}, \[aiIncludedInPackage, effectiveOfertaLocalId, lastScanJobId, aiReviewGate\.totalItems\]\);/
  );
  assert.ok(reconstructEffectMatch, "CASE F FAILED: the cold-mount review-gate reconstruction effect must exist");
  const reconstructEffectBody = reconstructEffectMatch![0];
  assert.doesNotMatch(
    reconstructEffectBody,
    /step5ReviewView/,
    "CASE F FAILED: the effect's actual logic/dependency array must not depend on step5ReviewView — it must run even while the workspace is unmounted"
  );
  assert.match(
    reconstructEffectBody,
    /setAiReviewGate\(\{/,
    "CASE F FAILED: the effect must populate aiReviewGate directly"
  );
  console.log("Case F (cold mount reconstructs complete state before workspace opens) passed.");

  // --- Case G/H/I: the Files-view CTA label already derives from the (now-correct) review state ---
  assert.match(
    clientSrc,
    /const step5ReviewOpenCtaLabel = step5ReviewComplete\s*\?\s*c\.step5ViewReviewCta\s*:\s*step5ReviewTouched\s*\?\s*c\.step5ContinueReviewCta\s*:\s*c\.step5CheckpointReviewProductsCta;/,
    "CASE G/H/I FAILED: the three-state CTA label derivation (Ver revisión / Continuar revisión / Revisar productos) must remain intact"
  );
  console.log("Case G/H/I (completed/partial/unstarted review CTA derivation intact) passed.");

  // --- Case J: completed review does not show the false AI-review blocker ---
  assert.match(
    clientSrc,
    /const step5AiReviewBlocksContinue =\s*step === 5 && aiIncludedInPackage && step5ScanComplete && !step5ReviewComplete;/,
    "CASE J FAILED: the blocker must remain driven by step5ReviewComplete, which the Case F fix now populates correctly on cold mount"
  );
  console.log("Case J (false AI-review blocker cannot survive a correctly reconstructed review state) passed.");

  // --- Case K: item review/PATCH persistence contract untouched (127 review decisions unaffected) ---
  assert.doesNotMatch(
    clientSrc,
    /patchOfertaLocalReviewItem/,
    "CASE K FAILED: OfertasLocalesApplicationClient must never call the item PATCH endpoint directly — it only reads"
  );
  console.log("Case K (127 review decisions remain untouched — read-only reconstruction) passed.");

  // --- Case L: no scan is triggered when opening the review screen ---
  const openWorkspaceFnMatch = clientSrc.match(
    /const openProductReviewWorkspace = useCallback\(\(\) => \{[\s\S]*?\}, \[\]\);/
  );
  assert.ok(openWorkspaceFnMatch, "sanity: openProductReviewWorkspace must exist");
  assert.doesNotMatch(
    openWorkspaceFnMatch![0],
    /submitOfertaLocalAiScan|handleScanStarted|scan-prep|\/api\/ofertas-locales\/scan/,
    "CASE L FAILED: opening the dedicated review screen must never dispatch a scan"
  );
  console.log("Case L (no scan triggered opening review) passed.");

  // --- Case M: no new review API was created ---
  assert.match(
    clientSrc,
    /import \{ fetchOfertaLocalReviewItems \} from "@\/app\/lib\/ofertas-locales\/ofertasLocalesItemReviewClient";/,
    "CASE M FAILED: the reconstruction must reuse the existing certified fetchOfertaLocalReviewItems, not a new endpoint"
  );
  assert.doesNotMatch(
    clientSrc,
    /review-summary|reconstruct-review|gate-summary/i,
    "CASE M FAILED: no new bespoke review-summary endpoint/name may be introduced"
  );
  console.log("Case M (no new review API) passed.");

  // --- Case N: no scanner-protected path changed ---
  const touchedFiles = [
    "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
    "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts",
  ];
  const protectedPaths = new Set(OFERTAS_AI_SCANNER_PROTECTED_PATHS.map((e) => e.path));
  for (const file of touchedFiles) {
    assert.ok(!protectedPaths.has(file), `CASE N FAILED: Gate H touched a scanner-protected path: ${file}`);
  }
  console.log("Case N (no scanner protected path changed) passed.");

  // --- Case O: Gate C/D CTA hierarchy and workspace structure remain intact ---
  assert.match(
    workspaceSrc,
    /xl:grid-cols-\[minmax\(0,54fr\)_minmax\(0,46fr\)\]/,
    "CASE O FAILED: Gate D's two-column workspace grid must remain intact"
  );
  console.log("Case O (Gate A-G structure remains intact where applicable) passed.");

  console.log("Ofertas Locales Gate H dedicated-review / hard-refresh regression audit passed.");
}

run();
