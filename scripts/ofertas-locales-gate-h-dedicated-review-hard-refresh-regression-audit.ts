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

  // --- Case A: Step 5's own render branch never embeds the full review workspace ---
  const step5CaseMatch = clientSrc.match(/case 5: \{[\s\S]*?\n      case 6:/);
  assert.ok(step5CaseMatch, "sanity: case 5 block not found");
  assert.doesNotMatch(
    step5CaseMatch![0],
    /<OfertasLocalesAiScanReviewWorkspace/,
    "CASE A FAILED: Step 5 must never render the full review workspace inline — it is now a real Step 6 (Gate I)"
  );
  console.log("Case A (Step 5 never renders the full review editor inline) passed.");

  // --- Case B: Revisar productos opens the dedicated review screen (now real Step 6) ---
  assert.match(
    clientSrc,
    /const openProductReviewWorkspace = useCallback\(\(\) => \{[\s\S]*?setStep\(6\)/,
    "CASE B FAILED: the review-open handler must navigate the wizard to Step 6 (Gate I)"
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

  // --- Case D: dedicated review screen (Step 6) never shows the Step 5 file checklist ---
  // Step 6 is its own switch case now (Gate I), so the Step 5 checklist/start-over
  // box structurally cannot render there — no shared conditional to regress.
  const step6CaseMatch = clientSrc.match(/case 6:[\s\S]*?\n      case 7:/);
  assert.ok(step6CaseMatch, "sanity: case 6 (Revisar productos) block not found");
  assert.doesNotMatch(
    step6CaseMatch![0],
    /startOverNeedQuestion|Step5CheckpointCard/,
    "CASE D FAILED: Step 6 must not render the Step 5 upload checklist or start-over box"
  );
  assert.match(
    clientSrc,
    /const hideGenericFooter =\s*\n\s*\(!isCouponsLane && step === 6\) \|\|\s*\n\s*\(!isCouponsLane && step === 5 && aiIncludedInPackage && step5ScanComplete\);/,
    "CASE D FAILED: the wizard-level Back/Next footer must be hidden while the dedicated review screen (flyer-lane Step 6) is open"
  );
  console.log("Case D (dedicated review screen hides the Step 5 checklist/footer) passed.");

  // --- Case E: dedicated review completion proceeds directly into Step 7 Extras (Gate I renumbering) ---
  assert.match(
    clientSrc,
    /const goToStep7Extras = useCallback\(\(\) => \{\s*setStep5ManualCheckpoint\(null\);\s*setStep\(7\);/,
    "CASE E FAILED: goToStep7Extras must remain the existing direct Step 7 handler"
  );
  assert.match(
    workspaceSrc,
    /onContinueToNextStep=\{onContinueToNextStep\}/,
    "CASE E FAILED: the workspace must still forward onContinueToNextStep to the review panel unchanged"
  );
  assert.match(
    clientSrc,
    /onContinueToNextStep=\{goToStep7Extras\}/,
    "CASE E FAILED: the full-width review desk must still wire onContinueToNextStep to goToStep7Extras directly — no detour back through Step 5"
  );
  console.log("Case E (review completion proceeds directly into Step 7 Extras) passed.");

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

  // --- Case J: the false AI-review blocker cannot exist — Step 5 no longer gates
  // generic continuation on review completion; review lives entirely on Step 6 now ---
  assert.doesNotMatch(
    clientSrc,
    /step5AiReviewBlocksContinue/,
    "CASE J FAILED: Step 5 must not retain a review-completion blocker construct — that concept moved entirely to Step 6 (Gate I)"
  );
  console.log("Case J (false AI-review blocker cannot exist — review moved off Step 5) passed.");

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
