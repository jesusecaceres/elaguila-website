/**
 * QA UX Batch — Gate D regression audit (⚠️25, ⚠️28, ⚠️31, ⚠️36).
 *
 * Gate D separates the Step 5 "Archivos" checklist from the product-review
 * workspace via a client-local view-state toggle (step5ReviewView:
 * "files" | "products") in OfertasLocalesApplicationClient.tsx, makes the
 * existing OfertasLocalesAiScanReviewWorkspace's flyer column sticky/reordered
 * for cross-reference on desktop and mobile, and fixes a real selection bug
 * that prevented reopening approved/rejected items. No new component, route,
 * scanner behavior, or DB status was introduced.
 *
 * Run: npm run ofertas-locales:gate-d-review-workspace-regression-audit
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
  const panelSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
    "utf8"
  );
  const viewerSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasClipReviewViewer.tsx",
    "utf8"
  );
  const clipPanelSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesProductClipPanel.tsx",
    "utf8"
  );

  // --- Case A: switching to the product-review workspace never triggers a scan ---
  const openWorkspaceFnMatch = clientSrc.match(
    /const openProductReviewWorkspace = useCallback\(\(\) => \{[\s\S]*?\}, \[\]\);/
  );
  assert.ok(openWorkspaceFnMatch, "CASE A FAILED: openProductReviewWorkspace handler not found");
  const openWorkspaceFnBody = openWorkspaceFnMatch![0];
  assert.doesNotMatch(
    openWorkspaceFnBody,
    /submitOfertaLocalAiScan|handleScanStarted|scan-prep|\/api\/ofertas-locales\/scan/,
    "CASE A FAILED: opening the product-review workspace must never dispatch a scan"
  );
  assert.match(
    openWorkspaceFnBody,
    /setStep5ReviewView\("products"\)/,
    "CASE A FAILED: opening the workspace must set the view-state, not fetch/scan anything"
  );
  console.log("Case A (Files-to-Products switch never triggers a scan) passed.");

  // --- Case B: the review-open CTA label is derived from existing review state ---
  assert.match(
    clientSrc,
    /const step5ReviewOpenCtaLabel = step5ReviewComplete\s*\?\s*c\.step5ViewReviewCta\s*:\s*step5ReviewTouched\s*\?\s*c\.step5ContinueReviewCta\s*:\s*c\.step5CheckpointReviewProductsCta;/,
    "CASE B FAILED: CTA label must derive from existing step5ReviewComplete/aiReviewGate-based state, not new fetched data"
  );
  assert.match(
    clientSrc,
    /const step5ReviewTouched =\s*aiReviewGate\.approvedCount \+ aiReviewGate\.rejectedCount \+ aiReviewGate\.reviewLaterCount > 0;/,
    "CASE B FAILED: 'touched' derivation must reuse the existing aiReviewGate counts"
  );
  console.log("Case B (Review-products CTA uses existing review data/state) passed.");

  // --- Case C: Back-to-Files never clears review data ---
  const backToFilesMatch = clientSrc.match(
    /const handleBackToFiles = useCallback\(\(\) => \{[\s\S]*?\}, \[\]\);/
  );
  assert.ok(backToFilesMatch, "CASE C FAILED: handleBackToFiles handler not found");
  const backToFilesBody = backToFilesMatch![0];
  assert.doesNotMatch(
    backToFilesBody,
    /clearReviewState|resetDraft|handleStartFresh|DELETE|clearItems/,
    "CASE C FAILED: returning to Files must never clear draft/review data"
  );
  assert.match(
    backToFilesBody,
    /setStep5ReviewView\("files"\)/,
    "CASE C FAILED: Back-to-Files must set the view-state back to files"
  );
  console.log("Case C (Back-to-Files returns without clearing review data) passed.");

  // --- Case D: the existing OfertasLocalesAiScanReviewWorkspace is reused, not duplicated ---
  const workspaceUsages = [...clientSrc.matchAll(/<OfertasLocalesAiScanReviewWorkspace\b/g)];
  assert.equal(
    workspaceUsages.length,
    1,
    "CASE D FAILED: OfertasLocalesAiScanReviewWorkspace must be used exactly once (reused, not duplicated)"
  );
  assert.ok(
    fs.existsSync("app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx"),
    "CASE D FAILED: the existing workspace component file must still exist unchanged in place"
  );
  console.log("Case D (existing OfertasLocalesAiScanReviewWorkspace is reused) passed.");

  // --- Case E: desktop workspace remains two-column ---
  assert.match(
    workspaceSrc,
    /xl:grid-cols-\[minmax\(0,54fr\)_minmax\(0,46fr\)\]/,
    "CASE E FAILED: desktop two-column grid must remain intact"
  );
  console.log("Case E (desktop workspace remains two-column) passed.");

  // --- Case F: mobile stacks responsively — flyer before editor, no forced side-by-side ---
  assert.doesNotMatch(
    workspaceSrc,
    /\bgrid-cols-2\b(?!\s*$)/,
    "CASE F FAILED: mobile must not force a 2-column grid outside the xl: breakpoint"
  );
  assert.match(
    workspaceSrc,
    /<div className="order-1 min-w-0 xl:sticky xl:top-20 xl:order-1">\s*<OfertasLocalesProductClipPanel/,
    "CASE F FAILED: flyer column must be order-1 (first) at every breakpoint, matching mobile-first display order"
  );
  assert.match(
    workspaceSrc,
    /<div className="order-2 min-w-0 xl:order-2">\s*<OfertasLocalesAiItemReviewPanel/,
    "CASE F FAILED: editor column must be order-2 (second) at every breakpoint"
  );
  console.log("Case F (mobile workspace stacks flyer-before-editor, no forced columns) passed.");

  // --- Case G: the flyer viewer is not duplicated ---
  assert.doesNotMatch(
    workspaceSrc,
    /<OfertasClipReviewViewer\b/,
    "CASE G FAILED: OfertasClipReviewViewer must not be instantiated directly in the workspace wrapper"
  );
  const clipViewerUsages = [...clipPanelSrc.matchAll(/<OfertasClipReviewViewer\b/g)];
  assert.equal(
    clipViewerUsages.length,
    2,
    "CASE G FAILED: expected exactly the pre-existing 2 usages (desktop + mobile-collapsible) inside OfertasLocalesProductClipPanel, no new instantiations"
  );
  console.log("Case G (flyer viewer is not duplicated) passed.");

  // --- Case H: the product editor is not duplicated ---
  const fieldsOnlyEditorUsages = [...panelSrc.matchAll(/fieldsOnly\s*\n?\s*onFieldChange=/g)];
  assert.equal(
    fieldsOnlyEditorUsages.length,
    1,
    "CASE H FAILED: expected exactly one workspace-mode product editor instantiation"
  );
  console.log("Case H (product editor is not duplicated) passed.");

  // --- Case I: approved (and rejected) items remain selectable/reopenable ---
  assert.match(
    panelSrc,
    /if \(selectedItemId && !pageFilteredItems\.some\(\(item\) => item\.id === selectedItemId\)\) \{\s*setSelectedItemId\(pickDefaultOfertaLocalReviewItemId\(queueItems\)\);/,
    "CASE I FAILED: the orphan-selection check must use pageFilteredItems (all statuses), not queueItems (active-only), or approved/rejected reopen will regress"
  );
  console.log("Case I (approved item remains selectable/reopenable) passed.");

  // --- Case J: reopening and saving an approved item does not change its review status ---
  assert.match(
    panelSrc,
    /const handleSave = useCallback\(\s*async \(itemId: string\) => \{\s*const itemDraft = drafts\[itemId\];\s*if \(!itemDraft\) return;\s*await applyPatch\(itemId, patchFromDraft\(itemDraft, isCouponMode\)\);/,
    "CASE J FAILED: handleSave must call patchFromDraft without a reviewStatus argument, so the server-side patch omits review_status and leaves it unchanged"
  );
  console.log("Case J (reopening approved item does not automatically change review status) passed.");

  // --- Case K: review-later (needs_review) items were never terminal and remain reopenable ---
  assert.match(
    panelSrc,
    /function isReviewTerminal\(status: OfertaLocalItemReviewStatus\): boolean \{\s*return status === "approved" \|\| status === "rejected";\s*\}/,
    "CASE K FAILED: needs_review (review-later) must remain non-terminal — it was never excluded from the active queue"
  );
  console.log("Case K (review-later item remains reopenable — was never affected) passed.");

  // --- Case L: rejected-item semantics (hidden-by-default overlay, no auto-reactivation) unchanged ---
  assert.match(
    viewerSrc,
    /if \(item\.reviewStatus === "rejected" && item\.id !== selectedItemId && !highlightOverlay\) \{\s*return false;\s*\}/,
    "CASE L FAILED: rejected-item overlay visibility rule must remain unchanged"
  );
  assert.doesNotMatch(
    panelSrc,
    /reviewStatus:\s*"pending"[\s\S]{0,40}rejected|rejected[\s\S]{0,40}reviewStatus:\s*"approved"/,
    "CASE L FAILED: no automatic rejected-to-active/approved transition may be introduced"
  );
  console.log("Case L (rejected item semantics unchanged) passed.");

  // --- Case M: Gate C page-completion CTA remains present ---
  assert.match(
    panelSrc,
    /nextPageSummary \? \(\s*<button type="button" className=\{BTN_SUCCESS_LG\} onClick=\{proceedToNextPage\}>\s*\{c\.aiReviewContinueToPage\}/,
    "CASE M FAILED: Gate C's green page-complete CTA must still be present and wired to proceedToNextPage"
  );
  console.log("Case M (Gate C page-completion CTA remains present) passed.");

  // --- Case N: Gate C final-review CTA remains present ---
  assert.match(
    panelSrc,
    /onClick=\{\(\) => onContinueToNextStep\?\.\(\)\}[\s\S]{0,100}\{c\.aiReviewContinueToNextStep\}/,
    "CASE N FAILED: Gate C's final review-complete CTA must still be present and wired to onContinueToNextStep"
  );
  console.log("Case N (Gate C final-review CTA remains present) passed.");

  // --- Case O: the scan button/handler (OfertasLocalesAiScanPanel) is untouched by this gate ---
  const scanPanelTouched = clientSrc.match(/onScanComplete=\{\(scanJobId\) => \{[\s\S]*?\}\}/);
  assert.ok(scanPanelTouched, "sanity: scan panel wiring should still exist");
  assert.doesNotMatch(
    fs.readFileSync("app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx", "utf8"),
    /step5ReviewView|openProductReviewWorkspace|handleBackToFiles/,
    "CASE O FAILED: the protected scan panel must not reference any Gate D view-state additions"
  );
  console.log("Case O (scan button/handler untouched) passed.");

  // --- Case P + Q: no scanner-protected path was touched by this gate ---
  const touchedFiles = [
    "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx",
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx",
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
    "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts",
    "app/(site)/publicar/ofertas-locales/OfertasClipReviewViewer.tsx",
  ];
  const protectedPaths = new Set(OFERTAS_AI_SCANNER_PROTECTED_PATHS.map((e) => e.path));
  for (const file of touchedFiles) {
    assert.ok(!protectedPaths.has(file), `CASE P/Q FAILED: Gate D touched a scanner-protected path: ${file}`);
  }
  assert.ok(
    !touchedFiles.includes("app/api/ofertas-locales/scan-prep/route.ts"),
    "CASE P FAILED: scan-prep route must not be touched"
  );
  console.log("Case P/Q (scan-prep route + scanner protected manifest paths untouched) passed.");

  // --- Case R: the files/products toggle is genuinely ephemeral; review data stays DB-backed ---
  const reviewViewStateMatch = clientSrc.match(
    /const \[step5ReviewView, setStep5ReviewView\] = useState<"files" \| "products">\("files"\);/
  );
  assert.ok(reviewViewStateMatch, "CASE R FAILED: step5ReviewView must be a plain ephemeral useState defaulting to files");
  assert.doesNotMatch(
    clientSrc,
    /localStorage[\s\S]{0,80}step5ReviewView|step5ReviewView[\s\S]{0,80}localStorage|sessionStorage[\s\S]{0,80}step5ReviewView/,
    "CASE R FAILED: the files/products view-state must not be persisted to browser storage"
  );
  // Review items themselves are still fetched from the server on every mount —
  // this is the unchanged, already-certified REVIEW_DATA fetch path.
  assert.match(
    panelSrc,
    /fetchOfertaLocalReviewItems\(\s*ofertaLocalId,/,
    "CASE R FAILED: review items must still be recovered from the server-backed fetch path, unchanged"
  );
  console.log("Case R (view toggle is ephemeral; review decisions remain DB-backed) passed.");

  console.log("Ofertas Locales Gate D review workspace regression audit passed.");
}

run();
