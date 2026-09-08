/**
 * LIVE HUMAN QA — FINAL REVIEW WORKBENCH SIMPLIFICATION — Gate J regression
 * audit (⚠️58–62).
 *
 * Human production QA of Gate I's real Step 6 proved two remaining layers of
 * clutter:
 *  - Step 5 duplicated its own scan-completion summary in a separate green
 *    box floating above the (already-summarizing) scan checkpoint card.
 *  - Step 6 opened on a redundant intro card ("Archivos · Revisión de
 *    productos" / "Revisar productos" / "Revisa los productos encontrados
 *    antes de continuar" / "El área de revisión de productos está abierta
 *    abajo") that only repeated what the wizard's own step header and rail
 *    already say, before the actual workbench appeared beneath it.
 *
 * Gate J removes both: Step 5's primary CTA now lives directly in the scan
 * checkpoint card's own collapsedActions (no duplicate box), and Step 6's
 * in-card branch is empty for the normal case — the existing, unrebuilt
 * OfertasLocalesAiScanReviewWorkspace is what the user sees immediately.
 *
 * Run: npm run ofertas-locales:gate-j-focused-review-ux-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import { OFERTAS_AI_SCANNER_PROTECTED_PATHS } from "../app/lib/ofertas-locales/ofertasAiScannerProtectedPaths";
import {
  OFERTAS_LOCALES_WIZARD_STEP_COUNT,
  OFERTAS_LOCALES_WIZARD_STEPS,
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
  const viewerSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasClipReviewViewer.tsx",
    "utf8"
  );

  const step5CaseMatch = clientSrc.match(/case 5: \{[\s\S]*?\n      case 6:/);
  assert.ok(step5CaseMatch, "sanity: case 5 block not found");
  const step5Case = step5CaseMatch![0];

  const step6CaseMatch = clientSrc.match(/case 6:[\s\S]*?\n      case 7:/);
  assert.ok(step6CaseMatch, "sanity: case 6 block not found");
  const step6Case = step6CaseMatch![0];

  // --- Case A: wizard remains 8 steps ---
  assert.equal(OFERTAS_LOCALES_WIZARD_STEP_COUNT, 8, "CASE A FAILED: wizard must remain 8 steps");
  console.log("Case A (wizard remains 8 steps) passed.");

  // --- Case B: Step 5 = Archivos ---
  const byId = new Map(OFERTAS_LOCALES_WIZARD_STEPS.map((s) => [s.id, s]));
  assert.equal(byId.get(5)?.labelEs, "Archivos", "CASE B FAILED: Step 5 must be Archivos");
  console.log("Case B (Step 5 = Archivos) passed.");

  // --- Case C: Step 5 contains the upload workflow ---
  assert.match(
    step5Case,
    /title=\{uploadCheckpointTitle\}/,
    "CASE C FAILED: Step 5 must contain the upload checkpoint card"
  );
  console.log("Case C (Step 5 contains upload workflow) passed.");

  // --- Case D: Step 5 contains the AI analysis workflow ---
  assert.match(
    step5Case,
    /title=\{c\.step5CheckpointScanTitle\}[\s\S]*?<OfertasLocalesAiScanPanel/,
    "CASE D FAILED: Step 5 must contain the AI analysis checkpoint card"
  );
  console.log("Case D (Step 5 contains AI analysis workflow) passed.");

  // --- Case E: Step 5 does NOT contain the product audit workspace ---
  assert.doesNotMatch(
    step5Case,
    /<OfertasLocalesAiScanReviewWorkspace/,
    "CASE E FAILED: Step 5 must never render the product audit workspace"
  );
  console.log("Case E (Step 5 does not contain product audit workspace) passed.");

  // --- Case F: Step 5 does NOT contain a third review checkpoint card ---
  assert.doesNotMatch(
    step5Case,
    /step5CheckpointReviewTitle|step5ReviewCardOpen/,
    "CASE F FAILED: Step 5 must not retain a third review checkpoint card"
  );
  console.log("Case F (Step 5 has no third review checkpoint card) passed.");

  // --- Case G: Step 5 has only ONE primary review-transition CTA ---
  const step5CtaUsages = [...step5Case.matchAll(/onClick=\{openProductReviewWorkspace\}/g)];
  assert.equal(
    step5CtaUsages.length,
    1,
    "CASE G FAILED: Step 5 must expose exactly one primary review-transition CTA, not a duplicate top box plus a card action"
  );
  assert.doesNotMatch(
    step5Case,
    /border-emerald-300\/80 bg-emerald-50/,
    "CASE G FAILED: the old duplicate green completion box must be removed from Step 5"
  );
  console.log("Case G (Step 5 has exactly one primary review-transition CTA) passed.");

  // --- Case H: completed Step 5 CTA derives "Ver revisión" (three-state label, unchanged formula) ---
  assert.match(
    clientSrc,
    /const step5ReviewOpenCtaLabel = step5ReviewComplete\s*\?\s*c\.step5ViewReviewCta\s*:\s*step5ReviewTouched\s*\?\s*c\.step5ContinueReviewCta\s*:\s*c\.step5CheckpointReviewProductsCta;/,
    "CASE H FAILED: the completed/partial/unstarted CTA label derivation must remain intact"
  );
  console.log("Case H (completed Step 5 CTA derives Ver revisión) passed.");

  // --- Case I: the CTA advances to the real Step 6 ---
  assert.match(
    clientSrc,
    /const openProductReviewWorkspace = useCallback\(\(\) => \{[\s\S]*?setStep\(6\);/,
    "CASE I FAILED: the review CTA handler must navigate to the real Step 6"
  );
  console.log("Case I (CTA advances to real Step 6) passed.");

  // --- Case J: Step 6 = Revisar productos ---
  assert.equal(byId.get(6)?.labelEs, "Revisar productos", "CASE J FAILED: Step 6 must be Revisar productos");
  console.log("Case J (Step 6 = Revisar productos) passed.");

  // --- Case K: Step 6 does NOT render a redundant intro/checkpoint card above the workbench ---
  assert.doesNotMatch(
    step6Case,
    /step5ReviewScreenBreadcrumb|step5ReviewScreenTitle|step5ReviewWorkspaceOpenHint/,
    "CASE K FAILED: Step 6 must not render the retired breadcrumb/title/hint intro card"
  );
  console.log("Case K (Step 6 has no redundant intro/checkpoint card) passed.");

  // --- Case L: Step 6 renders OfertasLocalesAiScanReviewWorkspace (reused, not rebuilt) ---
  const workspaceUsages = [...clientSrc.matchAll(/<OfertasLocalesAiScanReviewWorkspace\b/g)];
  assert.equal(
    workspaceUsages.length,
    1,
    "CASE L FAILED: OfertasLocalesAiScanReviewWorkspace must be reused exactly once, not rebuilt"
  );
  assert.match(
    clientSrc,
    /const showStep6ReviewDesk =\s*\n\s*step === 6 && aiIncludedInPackage && Boolean\(effectiveOfertaLocalId\?\.trim\(\)\);/,
    "CASE L FAILED: the workspace must be gated on the real Step 6"
  );
  console.log("Case L (Step 6 renders the existing review workspace) passed.");

  // --- Case M: Step 6 contains no upload controls ---
  assert.doesNotMatch(
    step6Case,
    /OfertasLocalesDraftAssetSection|Step5CheckpointCard/,
    "CASE M FAILED: Step 6 must not contain upload controls"
  );
  assert.doesNotMatch(
    workspaceSrc,
    /OfertasLocalesDraftAssetSection/,
    "CASE M FAILED: the reused workspace component must not contain upload controls"
  );
  console.log("Case M (Step 6 contains no upload controls) passed.");

  // --- Case N: Step 6 contains no scanner trigger ---
  assert.doesNotMatch(
    step6Case,
    /OfertasLocalesAiScanPanel|submitOfertaLocalAiScan|handleScanStarted/,
    "CASE N FAILED: Step 6 must not contain a scanner trigger"
  );
  assert.doesNotMatch(
    workspaceSrc,
    /OfertasLocalesAiScanPanel|submitOfertaLocalAiScan/,
    "CASE N FAILED: the reused workspace component must not contain a scanner trigger"
  );
  console.log("Case N (Step 6 contains no scanner trigger) passed.");

  // --- Case O: Step 6 contains no social/Extras fields ---
  assert.doesNotMatch(
    step6Case,
    /socialSectionTitle|facebookUrl|instagramUrl|tiktokUrl|youtubeUrl|xTwitterUrl|linkedinUrl|snapchatUrl|pinterestUrl|googleBusinessUrl|googleReviewUrl|yelpUrl/,
    "CASE O FAILED: Step 6 must not contain any Extras/social fields"
  );
  console.log("Case O (Step 6 contains no social/Extras fields) passed.");

  // --- Case P: Step 6 contains no membership/reward fields ---
  assert.doesNotMatch(
    step6Case,
    /membershipUrl|membershipCtaLabel|digitalCouponUrl|membershipSectionTitle/,
    "CASE P FAILED: Step 6 must not contain membership/reward fields"
  );
  console.log("Case P (Step 6 contains no membership/reward fields) passed.");

  // --- Case Q: page-completion state has a prominent green Siguiente página CTA ---
  assert.match(panelSrc, /const BTN_SUCCESS_LG =/, "CASE Q FAILED: the green completion button style must exist");
  assert.match(
    panelSrc,
    /nextPageSummary \? \(\s*<button type="button" className=\{BTN_SUCCESS_LG\} onClick=\{proceedToNextPage\}>\s*\{c\.aiReviewContinueToPage\}/,
    "CASE Q FAILED: the page-complete state must render the green Siguiente página CTA"
  );
  console.log("Case Q (page completion has prominent green Siguiente página CTA) passed.");

  // --- Case R: Siguiente página moves to the next review page ---
  assert.match(
    panelSrc,
    /const proceedToNextPage = \(\) => \{[\s\S]*?setSelectedPageFilter\(nextPageSummary\.page\);/,
    "CASE R FAILED: proceedToNextPage must advance selectedPageFilter to the next page"
  );
  console.log("Case R (Siguiente página moves to the next review page) passed.");

  // --- Case S: final page completion replaces the next-page CTA with Continuar a Extras ---
  assert.match(
    panelSrc,
    /allPagesComplete \? \(\s*<div className="rounded-xl border border-emerald-300\/80 bg-emerald-50 px-4 py-4">[\s\S]*?onClick=\{\(\) => onContinueToNextStep\?\.\(\)\}[\s\S]{0,100}\{c\.aiReviewContinueToNextStep\}/,
    "CASE S FAILED: allPagesComplete must render the final Continuar a Extras CTA, not the next-page CTA"
  );
  assert.match(
    panelSrc,
    /allPagesComplete \? \([\s\S]*?\) : nextPageSummary \? \(/,
    "CASE S FAILED: the final-completion CTA and the next-page CTA must be mutually exclusive branches"
  );
  console.log("Case S (final page completion shows Continuar a Extras, not Siguiente página) passed.");

  // --- Case T: Continuar a Extras sets the wizard to Step 7 ---
  assert.match(
    clientSrc,
    /const goToStep7Extras = useCallback\(\(\) => \{\s*setStep5ManualCheckpoint\(null\);\s*setStep\(7\);/,
    "CASE T FAILED: goToStep7Extras must set the wizard to Step 7"
  );
  assert.match(
    clientSrc,
    /onContinueToNextStep=\{goToStep7Extras\}/,
    "CASE T FAILED: the review workspace's completion CTA must be wired to goToStep7Extras"
  );
  console.log("Case T (Continuar a Extras sets wizard Step 7) passed.");

  // --- Case U: Step 7 (flyer) / Step 6 (coupon) owns the Extras fields (social, memberships, rewards) ---
  // Extras is shared between lanes at different step numbers (Gate: two-lane
  // execution), so its content lives in one renderExtrasStepContent()
  // function reused by both switch positions rather than duplicated inline.
  const extrasFnMatch = clientSrc.match(
    /function renderExtrasStepContent\(\) \{[\s\S]*?Shared between lanes — final review/
  );
  assert.ok(extrasFnMatch, "sanity: renderExtrasStepContent function not found");
  assert.match(
    extrasFnMatch![0],
    /socialSectionTitle/,
    "CASE U FAILED: Extras must own the social fields"
  );
  assert.match(
    clientSrc,
    /case 7:\s*\n\s*return isCouponsLane \? renderFinalReviewStepContent\(\) : renderExtrasStepContent\(\);/,
    "CASE U FAILED: Step 7 must call renderExtrasStepContent for the flyer lane"
  );
  assert.match(
    clientSrc,
    /case 6:\s*\n\s*if \(isCouponsLane\) \{\s*\n\s*return renderExtrasStepContent\(\);/,
    "CASE U FAILED: Step 6 must call renderExtrasStepContent for the coupon lane"
  );
  console.log("Case U (Step 7 owns Extras fields) passed.");

  // --- Case V: Step 8 remains the final review step ---
  assert.match(
    clientSrc,
    /case 8:\s*\n\s*return renderFinalReviewStepContent\(\);/,
    "CASE V FAILED: Step 8 must call renderFinalReviewStepContent"
  );
  console.log("Case V (Step 8 remains final review) passed.");

  // --- Case W: approved items remain reopenable ---
  assert.match(
    panelSrc,
    /if \(selectedItemId && !pageFilteredItems\.some\(\(item\) => item\.id === selectedItemId\)\) \{\s*setSelectedItemId\(pickDefaultOfertaLocalReviewItemId\(queueItems\)\);/,
    "CASE W FAILED: the orphan-selection check must use pageFilteredItems (all statuses), or approved/rejected reopen regresses"
  );
  assert.doesNotMatch(
    viewerSrc,
    /if \(item\.reviewStatus === "approved"[\s\S]{0,60}return false;/,
    "CASE W FAILED: approved items must not be hidden from selection"
  );
  console.log("Case W (approved items remain reopenable) passed.");

  // --- Case X: bilingual taxonomy remains ---
  const taxonomySrc = fs.readFileSync("app/lib/ofertas-locales/ofertasLocalesProductTaxonomy.ts", "utf8");
  assert.match(
    taxonomySrc,
    /export function getOfertaProductBilingualCategoryDisplay\(/,
    "CASE X FAILED: Gate E's bilingual category display helper must remain"
  );
  console.log("Case X (bilingual taxonomy remains) passed.");

  // --- Case Y: review state survives hard refresh (Gate H reconstruction, step-independent) ---
  const reconstructEffectMatch = clientSrc.match(
    /fetchOfertaLocalReviewItems\(effectiveOfertaLocalId, lastScanJobId\)\.then\(\(result\) => \{[\s\S]*?\}, \[aiIncludedInPackage, effectiveOfertaLocalId, lastScanJobId, aiReviewGate\.totalItems\]\);/
  );
  assert.ok(reconstructEffectMatch, "CASE Y FAILED: the cold-mount review-gate reconstruction effect must still exist");
  assert.doesNotMatch(
    reconstructEffectMatch![0],
    /\bstep\b\s*===|\[step\]/,
    "CASE Y FAILED: the reconstruction effect must run independent of which step the wizard is on"
  );
  console.log("Case Y (review state survives hard refresh) passed.");

  // --- Case Z: 127 completed persisted rows require no re-review (read-only reconstruction/navigation) ---
  assert.doesNotMatch(
    clientSrc,
    /patchOfertaLocalReviewItem/,
    "CASE Z FAILED: OfertasLocalesApplicationClient must never call the item PATCH endpoint directly"
  );
  console.log("Case Z (persisted rows require no re-review) passed.");

  // --- Case AA: no scanner-protected path modified ---
  const touchedFiles = [
    "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
  ];
  const protectedPaths = new Set(OFERTAS_AI_SCANNER_PROTECTED_PATHS.map((e) => e.path));
  for (const file of touchedFiles) {
    assert.ok(!protectedPaths.has(file), `CASE AA FAILED: Gate J touched a scanner-protected path: ${file}`);
  }
  console.log("Case AA (no scanner-protected path modified) passed.");

  // --- Case AB: no new API created ---
  assert.match(
    clientSrc,
    /import \{ fetchOfertaLocalReviewItems \} from "@\/app\/lib\/ofertas-locales\/ofertasLocalesItemReviewClient";/,
    "CASE AB FAILED: review data must still be read via the existing certified fetchOfertaLocalReviewItems path"
  );
  assert.doesNotMatch(
    clientSrc,
    /fetch\(`\/api\/ofertas-locales\/(?!owner\/)[^`]*(review-summary|reconstruct-review|gate-summary|step-6|revisar-productos)/i,
    "CASE AB FAILED: no new bespoke endpoint/route may be introduced"
  );
  console.log("Case AB (no new API created) passed.");

  // --- Case AC: no DB/schema change ---
  const wizardStepsSrc = fs.readFileSync("app/lib/ofertas-locales/ofertasLocalesWizardSteps.ts", "utf8");
  assert.doesNotMatch(
    wizardStepsSrc,
    /CREATE TABLE|ALTER TABLE|supabase|migration/i,
    "CASE AC FAILED: this gate must be purely client-side — no DB/migration involvement"
  );
  console.log("Case AC (no DB/schema change) passed.");

  // --- Case AD: no Stripe changes ---
  assert.doesNotMatch(
    clientSrc,
    /\/dashboard\/ofertas-locales\/|startRevenueCategoryCheckout|redirectToRevenueCategoryCheckout/,
    "CASE AD FAILED: no Stripe/checkout logic may be touched or reintroduced"
  );
  console.log("Case AD (no Stripe changes) passed.");

  console.log("Ofertas Locales Gate J focused review UX audit passed.");
}

run();
