/**
 * FINAL REVIEW-WORKBENCH UX FIX — page-complete empty-space progression.
 *
 * ⚠️66: when the current review page has nothing left to review, the
 * "Selected product editor" work area (the primary right-side panel next
 * to the flyer) previously fell back to a single grey placeholder line —
 * a large, effectively empty box directly under the review counters. It
 * now shows a prominent completion card in that same slot:
 *   - pages 1..N-1: "Página completa" + "Siguiente página →", reusing the
 *     existing proceedToNextPage() page-navigation function unchanged.
 *   - final page (allPagesComplete): "Revisión completa" +
 *     "Continuar a Extras →", reusing the existing onContinueToNextStep
 *     callback (already wired to Step 7 by the prior repair batch).
 *
 * Run: npm run ofertas-locales:page-progression-repair-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import { OFERTAS_AI_SCANNER_PROTECTED_PATHS } from "../app/lib/ofertas-locales/ofertasAiScannerProtectedPaths";

type Verdict = { id: string; label: string; ok: boolean };
const results: Verdict[] = [];

function check(id: string, label: string, fn: () => void) {
  try {
    fn();
    results.push({ id, label, ok: true });
    console.log(`${id} ${label} -> TRUE`);
  } catch (err) {
    results.push({ id, label, ok: false });
    console.log(`${id} ${label} -> FALSE (${(err as Error).message})`);
  }
}

const panelSrc = fs.readFileSync(
  "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
  "utf8"
);
const copySrc = fs.readFileSync(
  "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts",
  "utf8"
);

// Isolate the "Selected product editor" ternary so assertions can't
// accidentally match the older, untouched status boxes further down.
const editorMatch = panelSrc.match(
  /\{focusedItem \? \(\s*<ItemReviewCard[\s\S]*?\) : isWorkspace && currentPageSummary[\s\S]*?\n {14}\)\}/
);
assert.ok(editorMatch, "the 'Selected product editor' branch must exist");
const editorBlock = editorMatch![0];

check("01", "Incomplete current page shows the normal editor (ItemReviewCard branch untouched)", () => {
  assert.match(editorBlock, /focusedItem \? \(\s*<ItemReviewCard/);
});

check("02", "Incomplete page does not show the completion CTA (gated on needsReview === 0)", () => {
  assert.match(editorBlock, /currentPageSummary && currentPageSummary\.needsReview === 0 \? \(/);
});

check("03", "Completed page 1–N-1 shows 'Página completa' (reuses aiReviewPageCompleteCheck)", () => {
  assert.match(editorBlock, /formatReviewCopy\(c\.aiReviewPageCompleteCheck, \{ page: currentPageSummary\.page \}\)/);
  assert.match(editorBlock, /\{c\.aiReviewPageCompleteBody\}/);
});

check("04", "Completed page shows a green 'Siguiente página →' CTA", () => {
  assert.match(editorBlock, /className=\{`\$\{BTN_SUCCESS_LG\} mt-4`\} onClick=\{proceedToNextPage\}>\s*\n\s*\{c\.aiReviewContinueToPage\}/);
});

check("05", "The CTA uses the existing page-navigation function (no new navigation system)", () => {
  const proceedFnMatches = panelSrc.match(/const proceedToNextPage = \(\) => \{/g) ?? [];
  assert.equal(proceedFnMatches.length, 1, "proceedToNextPage must not be duplicated/forked");
  assert.match(editorBlock, /onClick=\{proceedToNextPage\}/);
});

check("06", "Existing top page controls (guided page grid, selectReviewPage) remain functional", () => {
  assert.match(panelSrc, /onClick=\{\(\) => selectReviewPage\(page\)\}/);
});

check("07", "Next page loads via the unchanged setSelectedPageFilter(nextPageSummary.page) path", () => {
  assert.match(panelSrc, /setSelectedPageFilter\(nextPageSummary\.page\);/);
});

check("08", "Completed page no longer leaves a blank editor/work area (placeholder is only the final fallback, not the complete-state branch)", () => {
  const placeholderMatches = editorBlock.match(/Selecciona un producto abajo para editarlo/g) ?? [];
  assert.equal(placeholderMatches.length, 1, "the placeholder must not be duplicated");
  assert.match(
    editorBlock,
    /\) : \(\s*<p className="text-xs text-\[#1E1814\]\/60">\s*\{lang === "en" \? "Select a product below to edit it\." : "Selecciona un producto abajo para editarlo\."\}\s*<\/p>\s*\)\}$/,
    "the placeholder must be the trailing fallback arm, after both completion branches"
  );
});

check("09", "Final page shows 'Revisión completa' (reuses aiReviewCompleteTitle)", () => {
  assert.match(editorBlock, /allPagesComplete \? \(/);
  assert.match(editorBlock, /\{c\.aiReviewCompleteTitle\}/);
});

check("10", "Final page shows 'Continuar a Extras →' (reuses aiReviewContinueToNextStep)", () => {
  assert.match(editorBlock, /\{c\.aiReviewContinueToNextStep\}/);
});

check("11", "Final CTA uses the existing Step 7 route (onContinueToNextStep callback, not a new one)", () => {
  assert.match(editorBlock, /onClick=\{\(\) => onContinueToNextStep\?\.\(\)\}/);
});

check("12", "127-review persisted state preserved (counts still derived from allCurrentScanItems, untouched elsewhere)", () => {
  assert.match(editorBlock, /allCurrentScanItems\.length/);
  assert.match(panelSrc, /partitionItemsByActiveScanJob\(assetScopedItems, activeScanJobId\)/);
});

check("13", "8-page persisted state preserved (pageSummaries computation untouched)", () => {
  assert.match(panelSrc, /const pageSummaries = useMemo\(\(\) => \{/);
});

check("14", "Mobile completion CTA is structurally reachable (no fixed desktop-only width/hidden classes on the new card)", () => {
  assert.doesNotMatch(editorBlock, /\bhidden\b(?!-)/);
  assert.doesNotMatch(editorBlock, /\bxl:hidden\b/);
  assert.doesNotMatch(editorBlock, /\bw-\[\d/);
});

check("15", "Scanner protected paths NONE", () => {
  const touchedFiles = [
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
    "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts",
  ];
  const protectedPaths = new Set(OFERTAS_AI_SCANNER_PROTECTED_PATHS.map((e) => e.path));
  for (const file of touchedFiles) {
    assert.ok(!protectedPaths.has(file), `touched protected path: ${file}`);
  }
});

check("16", "New page-complete copy exists in both ES and EN", () => {
  assert.match(copySrc, /aiReviewPageCompleteBody: "Has revisado todos los productos de esta página\."/);
  assert.match(copySrc, /aiReviewPageCompleteBody: "You've reviewed all the products on this page\."/);
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} TRUE.`);
if (failed.length > 0) {
  console.log("FALSE items:", failed.map((f) => f.id).join(", "));
  throw new Error(`Page-progression repair audit requires all TRUE — FALSE items: ${failed.map((f) => f.id).join(", ")}`);
}
console.log("\nOfertas Locales page-progression repair audit passed.");
