/**
 * QA UX Batch — Gate C regression audit (⚠️26, ⚠️27, ⚠️29, ⚠️32, ⚠️38).
 *
 * Gate C is a MOVE/RELABEL/RESTYLE pass over the workspace review panel's
 * page-completion and product-action CTAs. No new business logic, state, or
 * handlers were introduced — every button in the new hierarchy still calls
 * the exact same pre-existing handler it called before this gate:
 *   - proceedToNextPage / onContinueToNextStep (page + review progression)
 *   - handleApproveAndNext / handleSave / handleReviewLater / handleConfirmReject
 *   - goPreviousItem / goNextItem (product nav)
 *   - onPageChange (flyer page nav, in OfertasClipReviewViewer)
 *
 * The only real change to page-completion boolean logic was removing a
 * duplicate render of the same allPagesComplete/nextPageSummary CTA that
 * previously appeared twice in the same panel (once above the product
 * editor, once below it) — consolidated into a single strong CTA below the
 * product action buttons, closest to the user's current review position.
 *
 * Run: npm run ofertas-locales:gate-c-review-navigation-regression-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import { ofertasLocalesAppCopy } from "../app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy";
import { OFERTAS_AI_SCANNER_PROTECTED_PATHS } from "../app/lib/ofertas-locales/ofertasAiScannerProtectedPaths";

function run() {
  const panelSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
    "utf8"
  );
  const viewerSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasClipReviewViewer.tsx",
    "utf8"
  );
  const cEs = ofertasLocalesAppCopy("es");
  const cEn = ofertasLocalesAppCopy("en");

  // --- Case A: a completed non-final page renders a prominent Next Page CTA
  // when another page exists, gated on the pre-existing nextPageSummary state ---
  assert.match(
    panelSrc,
    /currentPageSummary\.needsReview === 0 \? \(\s*allPagesComplete \? \([\s\S]*?\) : nextPageSummary \? \(\s*<button type="button" className=\{BTN_SUCCESS_LG\} onClick=\{proceedToNextPage\}>\s*\{c\.aiReviewContinueToPage\}/,
    "CASE A FAILED: completed non-final page must render a BTN_SUCCESS_LG 'next page' CTA wired to the existing proceedToNextPage handler, gated on the existing nextPageSummary state"
  );
  assert.equal(cEs.aiReviewContinueToPage, "Siguiente página →", "CASE A FAILED: Spanish next-page CTA label wrong");
  assert.equal(cEn.aiReviewContinueToPage, "Next page →", "CASE A FAILED: English next-page CTA label wrong");
  console.log("Case A (prominent Next Page CTA on completed non-final page) passed.");

  // --- Case B: the final completed page renders "Continue to next step", not "Next Page" ---
  assert.match(
    panelSrc,
    /allPagesComplete \? \(\s*<div className="rounded-xl border border-emerald-300\/80 bg-emerald-50 px-4 py-4">[\s\S]*?onClick=\{\(\) => onContinueToNextStep\?\.\(\)\}[\s\S]{0,100}\{c\.aiReviewContinueToNextStep\}/,
    "CASE B FAILED: allPagesComplete must render the Continue-to-next-step CTA wired to onContinueToNextStep"
  );
  // The two outcomes are mutually exclusive (allPagesComplete ? A : nextPageSummary ? B : null),
  // so the "Next Page" CTA structurally cannot render on the same branch as the final-review CTA.
  assert.match(
    panelSrc,
    /allPagesComplete \? \([\s\S]*?\) : nextPageSummary \? \(/,
    "CASE B FAILED: final-review CTA and next-page CTA must be mutually exclusive branches of the same ternary"
  );
  assert.equal(cEs.aiReviewContinueToNextStep, "Continuar a Extras →", "CASE B FAILED: Spanish continue-to-next-step label wrong");
  assert.equal(cEn.aiReviewContinueToNextStep, "Continue to Extras →", "CASE B FAILED: English continue-to-next-step label wrong");
  console.log("Case B (final page renders Continue-to-next-step, not Next Page) passed.");

  // --- Case C: page counts in the completion card are computed dynamically, never hardcoded ---
  assert.match(
    panelSrc,
    /formatReviewCopy\(c\.aiReviewCompletePagesCount, \{\s*completed: pageSummaries\.filter\(\(page\) => page\.needsReview === 0\)\.length,\s*total: pageSummaries\.length,\s*\}\)/,
    "CASE C FAILED: completion card page count must be derived from pageSummaries at render time, not hardcoded"
  );
  assert.doesNotMatch(
    panelSrc,
    /aiReviewCompletePagesCount, \{\s*completed: 8/,
    "CASE C FAILED: page count must not be hardcoded to 8 or any other literal"
  );
  console.log("Case C (completion page count is dynamic, not hardcoded) passed.");

  // --- Case D: the page-completion CTA reuses the pre-existing page-completion state
  // (currentPageSummary, nextPageSummary, allPagesComplete) — no new state was introduced ---
  assert.match(
    panelSrc,
    /const allPagesComplete = pageSummaries\.length > 0 && pageSummaries\.every\(\(page\) => page\.needsReview === 0\);/,
    "CASE D FAILED: allPagesComplete must remain the original derivation — no rewritten page-completion logic"
  );
  assert.match(
    panelSrc,
    /const nextPageSummary =\s*currentPageIndex >= 0 && currentPageIndex < pageSummaries\.length - 1/,
    "CASE D FAILED: nextPageSummary must remain the original derivation"
  );
  console.log("Case D (page-completion CTA reuses existing page-completion state) passed.");

  // --- Case E: product navigation buttons still invoke the existing previous/next product handlers ---
  assert.match(
    panelSrc,
    /onClick=\{goPreviousItem\}[\s\S]{0,150}\{c\.aiReviewPreviousItem\}/,
    "CASE E FAILED: previous-product button must still call goPreviousItem"
  );
  assert.match(
    panelSrc,
    /onClick=\{goNextItem\}[\s\S]{0,150}\{c\.aiReviewNextItem\}/,
    "CASE E FAILED: next-product button must still call goNextItem"
  );
  console.log("Case E (product navigation still invokes existing handlers) passed.");

  // --- Case F: page navigation (flyer viewer) still invokes the existing onPageChange handler ---
  assert.match(
    viewerSrc,
    /onClick=\{\(\) => onPageChange\?\.\(safePage - 1\)\}\s*>\s*\{lang === "en" \? "Previous page" : "Página anterior"\}/,
    "CASE F FAILED: previous-page control must still call onPageChange(safePage - 1) and be clearly labeled"
  );
  assert.match(
    viewerSrc,
    /onClick=\{\(\) => onPageChange\?\.\(safePage \+ 1\)\}\s*>\s*\{lang === "en" \? "Next page" : "Página siguiente"\}/,
    "CASE F FAILED: next-page control must still call onPageChange(safePage + 1) and be clearly labeled"
  );
  console.log("Case F (page navigation still invokes existing onPageChange handler) passed.");

  // --- Case G: "Approve and continue" still invokes the existing approve handler ---
  assert.match(
    panelSrc,
    /onClick=\{\(\) => void handleApproveAndNext\(focusedItem\.id\)\}[\s\S]{0,60}\{c\.aiReviewApproveAndNext\}/,
    "CASE G FAILED: primary product action must still call handleApproveAndNext"
  );
  assert.equal(cEs.aiReviewApproveAndNext, "Aprobar y continuar", "CASE G FAILED: Spanish approve label must read 'Aprobar y continuar'");
  assert.equal(cEn.aiReviewApproveAndNext, "Approve and continue", "CASE G FAILED: English approve label must read 'Approve and continue'");
  console.log("Case G (Approve and continue still invokes the existing approve handler) passed.");

  // --- Case H: "Save changes" still invokes the existing save handler ---
  assert.match(
    panelSrc,
    /onClick=\{\(\) => void handleSave\(focusedItem\.id\)\}[\s\S]{0,60}\{c\.aiReviewSaveEdits\}/,
    "CASE H FAILED: save-edits button must still call handleSave"
  );
  console.log("Case H (Save changes still invokes the existing save handler) passed.");

  // --- Case I: "Review later" still invokes the existing review-later handler ---
  assert.match(
    panelSrc,
    /onClick=\{\(\) => handleReviewLater\(focusedItem\.id\)\}[\s\S]{0,60}\{c\.aiReviewReviewLater\}/,
    "CASE I FAILED: review-later button must still call handleReviewLater"
  );
  console.log("Case I (Review later still invokes the existing review-later handler) passed.");

  // --- Case J: reject still invokes the existing confirm-then-reject flow ---
  assert.match(
    panelSrc,
    /onClick=\{\(\) => setRejectConfirmItemId\(focusedItem\.id\)\}[\s\S]{0,60}\{c\.aiReviewRejectProduct\}/,
    "CASE J FAILED: reject button must still open the existing confirm dialog (setRejectConfirmItemId)"
  );
  assert.match(
    panelSrc,
    /onClick=\{\(\) => void handleConfirmReject\(focusedItem\.id\)\}/,
    "CASE J FAILED: confirm-reject action must still call handleConfirmReject"
  );
  console.log("Case J (Reject still invokes the existing reject flow) passed.");

  // --- Case K: completion CTAs never dispatch scanner execution ---
  assert.doesNotMatch(
    panelSrc,
    /onClick=\{[^}]*(submitOfertaLocalAiScan|scan-prep|\/api\/ofertas-locales\/scan)/,
    "CASE K FAILED: no CTA introduced in this gate may trigger a scan"
  );
  console.log("Case K (completion CTA does not modify scanner execution) passed.");

  // --- Case L: no scanner-protected path touched by this gate ---
  const touchedFiles = [
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
    "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts",
    "app/(site)/publicar/ofertas-locales/OfertasClipReviewViewer.tsx",
  ];
  const protectedPaths = new Set(OFERTAS_AI_SCANNER_PROTECTED_PATHS.map((e) => e.path));
  for (const file of touchedFiles) {
    assert.ok(!protectedPaths.has(file), `CASE L FAILED: Gate C touched a scanner-protected path: ${file}`);
  }
  console.log("Case L (no scanner protected path modified) passed.");

  // --- Case M: the final review-complete state cannot render unless allPagesComplete is true ---
  assert.match(
    panelSrc,
    /\{currentPageSummary\.needsReview === 0 \? \(\s*allPagesComplete \? \(\s*<div className="rounded-xl border border-emerald-300\/80 bg-emerald-50 px-4 py-4">\s*<p className="text-base font-semibold text-emerald-950">\{c\.aiReviewCompleteTitle\}<\/p>/,
    "CASE M FAILED: the review-complete card must be gated directly behind the existing allPagesComplete boolean, not a weaker condition"
  );
  console.log("Case M (final review state cannot appear unless allPagesComplete is true) passed.");

  console.log("Ofertas Locales Gate C review/navigation regression audit passed.");
}

run();
