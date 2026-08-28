/**
 * LIVE HUMAN QA ARCHITECTURE CORRECTION — Gate I regression audit (⚠️55–57).
 *
 * Gate H made product review a visually-dedicated screen but kept it as a
 * Step 5 sub-view (`step5ReviewView`), so the wizard rail stayed on
 * "5 Archivos" while a user reviewed 127 products — a deliberate risk-reduction
 * compromise. Live human QA on production proved that compromise confusing:
 * the rail identity didn't match the task, and Step 5 exposed competing
 * "Continuar al siguiente paso" / generic "Siguiente" CTAs.
 *
 * Gate I promotes product review to a REAL numbered wizard step, deliberately
 * renumbering the wizard from 7 to 8 steps:
 *   1 Oferta, 2 Negocio, 3 Detalles, 4 Ubicación, 5 Archivos,
 *   6 Revisar productos (NEW), 7 Extras (was 6), 8 Revisar (was 7).
 * The existing OfertasLocalesAiScanReviewWorkspace is reused unchanged — no
 * new component, route, API, or DB schema change.
 *
 * Run: npm run ofertas-locales:gate-i-wizard-step-promotion-regression-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import { OFERTAS_AI_SCANNER_PROTECTED_PATHS } from "../app/lib/ofertas-locales/ofertasAiScannerProtectedPaths";
import {
  OFERTAS_LOCALES_WIZARD_STEP_COUNT,
  OFERTAS_LOCALES_WIZARD_STEPS,
  clampWizardStep,
} from "../app/lib/ofertas-locales/ofertasLocalesWizardSteps";

function run() {
  const clientSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
    "utf8"
  );
  const workspaceSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx",
    "utf8"
  );
  const panelSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
    "utf8"
  );
  const wizardStepsSrc = fs.readFileSync(
    "app/lib/ofertas-locales/ofertasLocalesWizardSteps.ts",
    "utf8"
  );

  // --- Case A: wizard has 8 real steps ---
  assert.equal(OFERTAS_LOCALES_WIZARD_STEP_COUNT, 8, "CASE A FAILED: wizard must have 8 real steps");
  assert.equal(OFERTAS_LOCALES_WIZARD_STEPS.length, 8, "CASE A FAILED: step metadata array must have 8 entries");
  assert.equal(clampWizardStep(99), 8, "CASE A FAILED: clampWizardStep must clamp to the new max of 8");
  assert.equal(clampWizardStep(0), 1, "sanity: clampWizardStep still clamps low end to 1");
  console.log("Case A (wizard has 8 real steps) passed.");

  // --- Case B/C/D/E: step identities ---
  const byId = new Map(OFERTAS_LOCALES_WIZARD_STEPS.map((s) => [s.id, s]));
  assert.equal(byId.get(5)?.labelEs, "Archivos", "CASE B FAILED: Step 5 must be Archivos/Files");
  assert.equal(byId.get(5)?.labelEn, "Files", "CASE B FAILED: Step 5 must be Archivos/Files");
  assert.equal(byId.get(6)?.labelEs, "Revisar productos", "CASE C FAILED: Step 6 must be Revisar productos");
  assert.equal(byId.get(6)?.labelEn, "Review products", "CASE C FAILED: Step 6 must be Review products");
  assert.equal(byId.get(7)?.labelEs, "Extras", "CASE D FAILED: Step 7 must be Extras");
  assert.equal(byId.get(7)?.labelEn, "Extras", "CASE D FAILED: Step 7 must be Extras");
  assert.equal(byId.get(8)?.labelEs, "Revisar", "CASE E FAILED: Step 8 must be Revisar/Review");
  assert.equal(byId.get(8)?.labelEn, "Review", "CASE E FAILED: Step 8 must be Revisar/Review");
  console.log("Case B/C/D/E (step identities: 5 Files, 6 Review products, 7 Extras, 8 Review) passed.");

  // --- Case F: Step 5's own render branch never embeds the full review workspace ---
  const step5CaseMatch = clientSrc.match(/case 5: \{[\s\S]*?\n      case 6:/);
  assert.ok(step5CaseMatch, "sanity: case 5 block not found");
  assert.doesNotMatch(
    step5CaseMatch![0],
    /<OfertasLocalesAiScanReviewWorkspace|Step5CheckpointCard[\s\S]{0,80}step5CheckpointReviewTitle/,
    "CASE F FAILED: Step 5 must never render the full review workspace or a review checkpoint card"
  );
  console.log("Case F (Step 5 does not render the full review workspace) passed.");

  // --- Case G: Step 5's review CTA advances to the real Step 6 ---
  assert.match(
    clientSrc,
    /const openProductReviewWorkspace = useCallback\(\(\) => \{[\s\S]*?setStep\(6\);/,
    "CASE G FAILED: Step 5's review CTA handler must navigate to Step 6"
  );
  assert.match(
    clientSrc,
    /step5ScanRequired && step5ScanComplete && step5UploadComplete \? \(/,
    "CASE G FAILED: Step 5's completion summary + primary CTA must be gated on upload+scan completion, not review"
  );
  console.log("Case G (Step 5 review CTA advances to Step 6) passed.");

  // --- Case H: Step 6 rail identity is "Revisar productos" (not "Archivos") ---
  assert.equal(
    byId.get(6)?.labelEs,
    "Revisar productos",
    'CASE H FAILED: the wizard rail must highlight "6 Revisar productos" on the review step, not "5 Archivos"'
  );
  console.log('Case H (Step 6 rail identity is "Revisar productos") passed.');

  // --- Case I: Step 6 reuses OfertasLocalesAiScanReviewWorkspace, not a rebuild ---
  const workspaceUsages = [...clientSrc.matchAll(/<OfertasLocalesAiScanReviewWorkspace\b/g)];
  assert.equal(
    workspaceUsages.length,
    1,
    "CASE I FAILED: OfertasLocalesAiScanReviewWorkspace must be reused exactly once, not duplicated/rebuilt"
  );
  assert.match(
    clientSrc,
    /const showStep6ReviewDesk =\s*\n\s*step === 6 && aiIncludedInPackage && Boolean\(effectiveOfertaLocalId\?\.trim\(\)\);/,
    "CASE I FAILED: the review desk must be gated on the real Step 6"
  );
  console.log("Case I (Step 6 reuses the existing review workspace) passed.");

  // --- Case J: Step 6 completion advances directly to Step 7 Extras ---
  assert.match(
    clientSrc,
    /const goToStep7Extras = useCallback\(\(\) => \{\s*setStep5ManualCheckpoint\(null\);\s*setStep\(7\);/,
    "CASE J FAILED: goToStep7Extras must set the wizard to Step 7"
  );
  assert.match(
    clientSrc,
    /onContinueToNextStep=\{goToStep7Extras\}/,
    "CASE J FAILED: the review desk's completion CTA must be wired to goToStep7Extras"
  );
  assert.match(
    panelSrc,
    /onClick=\{\(\) => onContinueToNextStep\?\.\(\)\}[\s\S]{0,100}\{c\.aiReviewContinueToNextStep\}/,
    "CASE J FAILED: the panel's final-page completion CTA must still be wired to onContinueToNextStep"
  );
  console.log("Case J (Step 6 completion advances directly to Step 7 Extras) passed.");

  // --- Case K: Gate C's green next-page CTA remains green/prominent ---
  assert.match(panelSrc, /const BTN_SUCCESS_LG =/, "CASE K FAILED: Gate C's green progression button style must remain");
  assert.match(
    panelSrc,
    /nextPageSummary \? \(\s*<button type="button" className=\{BTN_SUCCESS_LG\} onClick=\{proceedToNextPage\}>\s*\{c\.aiReviewContinueToPage\}/,
    "CASE K FAILED: Gate C's green page-complete CTA must remain wired to proceedToNextPage"
  );
  console.log("Case K (Gate C next-page CTA remains green/prominent) passed.");

  // --- Case L: completed review state (Gate H reconstruction) survives hard refresh
  // regardless of which step the wizard cold-mounts on ---
  const reconstructEffectMatch = clientSrc.match(
    /fetchOfertaLocalReviewItems\(effectiveOfertaLocalId, lastScanJobId\)\.then\(\(result\) => \{[\s\S]*?\}, \[aiIncludedInPackage, effectiveOfertaLocalId, lastScanJobId, aiReviewGate\.totalItems\]\);/
  );
  assert.ok(reconstructEffectMatch, "CASE L FAILED: Gate H's cold-mount review-gate reconstruction effect must still exist");
  assert.doesNotMatch(
    reconstructEffectMatch![0],
    /\bstep\b\s*===|\[step\]/,
    "CASE L FAILED: the reconstruction effect must run independent of which step the wizard is on"
  );
  console.log("Case L (completed review state survives hard refresh on any step) passed.");

  // --- Case M: no scan is triggered by entering Step 6 ---
  const openWorkspaceFnMatch = clientSrc.match(
    /const openProductReviewWorkspace = useCallback\(\(\) => \{[\s\S]*?\}, \[\]\);/
  );
  assert.ok(openWorkspaceFnMatch, "sanity: openProductReviewWorkspace must exist");
  assert.doesNotMatch(
    openWorkspaceFnMatch![0],
    /submitOfertaLocalAiScan|handleScanStarted|scan-prep|\/api\/ofertas-locales\/scan/,
    "CASE M FAILED: opening Step 6 must never dispatch a scan"
  );
  assert.doesNotMatch(
    clientSrc,
    /useEffect\(\(\) => \{[\s\S]{0,200}step === 6[\s\S]{0,200}(submitOfertaLocalAiScan|handleScanStarted)/,
    "CASE M FAILED: no effect keyed on step === 6 may dispatch a scan"
  );
  console.log("Case M (no scan triggered by entering Step 6) passed.");

  // --- Case N: no review statuses are mutated by step navigation ---
  assert.doesNotMatch(
    clientSrc,
    /patchOfertaLocalReviewItem/,
    "CASE N FAILED: OfertasLocalesApplicationClient must never call the item PATCH endpoint directly"
  );
  const onStepClickMatch = clientSrc.match(/onStepClick=\{\(s\) => \{[\s\S]*?\n\s{14}\}\}/);
  assert.ok(onStepClickMatch, "sanity: onStepClick handler must exist");
  assert.doesNotMatch(
    onStepClickMatch![0],
    /reviewStatus|patchOfertaLocalReviewItem|approve|reject/i,
    "CASE N FAILED: rail step navigation must never touch review status"
  );
  console.log("Case N (no review statuses are mutated by step navigation) passed.");

  // --- Case O: old stored step numbers (from the 7-step wizard) are safely compatibility-mapped ---
  assert.match(
    clientSrc,
    /const safeStoredStep = storedStep === 6 \|\| storedStep === 7 \? 5 : storedStep;/,
    "CASE O FAILED: a stored step of 6 or 7 from the previous 7-step wizard must be safely remapped to Step 5"
  );
  console.log("Case O (old stored step numbers are compatibility-mapped safely) passed.");

  // --- Case P: Step 8 preserves Gate F's Preview behavior exactly ---
  assert.match(
    clientSrc,
    /case 8:\s*\n\s*return \(\s*\n\s*<div className="space-y-6">\s*\n\s*<div className="rounded-xl border border-\[#D4C4A8\]\/70 bg-\[#FDF8F0\]\/90 px-4 py-4">\s*\n\s*<h3 className="text-base font-semibold text-\[#1E1814\]">\{c\.step7FinalReviewTitle\}<\/h3>/,
    "CASE P FAILED: Step 8 must be the final-review case, unchanged from Gate F"
  );
  assert.match(
    clientSrc,
    /step7ConfirmationsComplete \?\s*\(\s*<Link href=\{previewHref\} className=\{`\$\{BTN_PRIMARY\} min-h-11`\}>/,
    "CASE P FAILED: the Preview CTA must remain gated by step7ConfirmationsComplete, unchanged"
  );
  assert.doesNotMatch(
    clientSrc,
    /\/dashboard\/ofertas-locales\//,
    "CASE P FAILED: Step 8 must not reintroduce a direct payment/checkout link (Gate F)"
  );
  console.log("Case P (Step 8 preserves Gate F Preview behavior) passed.");

  // --- Case Q: no scanner-protected path modified ---
  const touchedFiles = [
    "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
    "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts",
    "app/lib/ofertas-locales/ofertasLocalesWizardSteps.ts",
  ];
  const protectedPaths = new Set(OFERTAS_AI_SCANNER_PROTECTED_PATHS.map((e) => e.path));
  for (const file of touchedFiles) {
    assert.ok(!protectedPaths.has(file), `CASE Q FAILED: Gate I touched a scanner-protected path: ${file}`);
  }
  console.log("Case Q (no scanner-protected path modified) passed.");

  // --- Case R: no new API was introduced ---
  assert.match(
    clientSrc,
    /import \{ fetchOfertaLocalReviewItems \} from "@\/app\/lib\/ofertas-locales\/ofertasLocalesItemReviewClient";/,
    "CASE R FAILED: review data must still be read via the existing certified fetchOfertaLocalReviewItems path"
  );
  assert.doesNotMatch(
    clientSrc,
    /fetch\(`\/api\/ofertas-locales\/(?!owner\/)[^`]*(review-summary|reconstruct-review|gate-summary|step-6|revisar-productos)/i,
    "CASE R FAILED: no new bespoke endpoint/route may be introduced for Step 6"
  );
  console.log("Case R (no new API introduced) passed.");

  // --- Case S: no DB schema change ---
  assert.doesNotMatch(
    wizardStepsSrc,
    /CREATE TABLE|ALTER TABLE|supabase|migration/i,
    "CASE S FAILED: wizard step promotion must be purely client-side — no DB/migration involvement"
  );
  console.log("Case S (no database change) passed.");

  console.log("Ofertas Locales Gate I wizard step promotion regression audit passed.");
}

run();
