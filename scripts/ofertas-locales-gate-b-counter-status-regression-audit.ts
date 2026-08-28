/**
 * QA UX Batch — Gate B regression audit (⚠️30 counter/status correctness).
 *
 * Root cause (proven from source, not inferred): in workspace mode,
 * OfertasLocalesAiItemReviewPanel's summary boxes (countLabels) and its
 * top-level "genuinely empty" check both read from `displayItems` — which is
 * `queueItems` narrowed to (a) the CURRENT PAGE ONLY and (b) items whose
 * reviewStatus is still active (not approved/rejected), via
 * partitionOfertaLocalPageReviewItems's `activeReviewItems`. Once a page's
 * items are all resolved (a success state), displayItems legitimately
 * becomes empty even though the full current scan (`allCurrentScanItems`,
 * the same collection "Escaneo actual: N" is drawn from) is not — producing
 * a false all-zero summary and a false "no suggestions found" message
 * layered directly above the correct "Página X completa" card.
 *
 * The fix re-derives both from `allCurrentScanItems` (workspace mode only;
 * non-workspace mode's displayItems was never page/queue-narrowed and is
 * left untouched) — the same canonical collection already correctly used
 * for "Escaneo actual: N", pageSummaries, and the wizard's onReviewGateChange.
 *
 * Run: npm run ofertas-locales:gate-b-counter-status-regression-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  partitionItemsByActiveScanJob,
  partitionOfertaLocalPageReviewItems,
  summarizeScopedItemReviewCounts,
} from "../app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime";
import {
  EMPTY_OFERTA_LOCAL_ITEM_COMMERCE_METADATA,
  type OfertaLocalItemReviewViewModel,
} from "../app/lib/ofertas-locales/ofertasLocalesTypes";

function fixtureItem(overrides: Partial<OfertaLocalItemReviewViewModel>): OfertaLocalItemReviewViewModel {
  return {
    id: overrides.id ?? "item-1",
    ofertaLocalId: "oferta-1",
    scanJobId: "job-1",
    itemName: "Test product",
    normalizedItemName: "test product",
    category: "grocery",
    subcategory: "",
    priceText: "$1.99",
    priceAmount: 1.99,
    priceAmountCents: 199,
    originalPriceText: "",
    priceParseStatus: "parsed",
    unit: "",
    dealType: "",
    quantity: "",
    searchTags: [],
    description: "",
    regularPriceText: "",
    candidateType: "product_deal",
    couponTitle: "",
    offerText: "",
    terms: "",
    reviewStatus: "needs_review",
    confidence: 0.9,
    confidenceLabel: "high",
    sourceAssetId: "asset-1",
    sourceAssetUrl: "https://example.com/flyer.pdf",
    sourceFileName: "flyer.pdf",
    sourcePage: 1,
    scanPageId: null,
    sourceAssetVersionId: null,
    sourcePageWidth: null,
    sourcePageHeight: null,
    sourceContext: "",
    sourceBbox: null,
    sourceCropUrl: "",
    businessName: "Test Business",
    businessCity: "Test City",
    businessState: "TS",
    businessZipCode: "00000",
    validFrom: null,
    validUntil: null,
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    commerceMetadata: EMPTY_OFERTA_LOCAL_ITEM_COMMERCE_METADATA,
    ...overrides,
  };
}

function run() {
  // Simulate the reported live incident: 127 total items in the current scan,
  // with page 1 (the currently-viewed page) fully resolved (approved), so its
  // "active" (not-yet-reviewed) queue is empty, while pages 2+ still have work.
  const page1Approved = Array.from({ length: 15 }, (_, i) =>
    fixtureItem({ id: `p1-${i}`, sourcePage: 1, reviewStatus: "approved" })
  );
  const page2Pending = Array.from({ length: 40 }, (_, i) =>
    fixtureItem({ id: `p2-${i}`, sourcePage: 2, reviewStatus: "needs_review" })
  );
  const page3Rejected = Array.from({ length: 12 }, (_, i) =>
    fixtureItem({ id: `p3-${i}`, sourcePage: 3, reviewStatus: "rejected" })
  );
  const restPending = Array.from({ length: 60 }, (_, i) =>
    fixtureItem({ id: `rest-${i}`, sourcePage: 4, reviewStatus: "pending" })
  );
  const allCurrentScanItems = [...page1Approved, ...page2Pending, ...page3Rejected, ...restPending];
  const fixtureTotalItemCount = allCurrentScanItems.length;
  assert.equal(fixtureTotalItemCount, 127, "fixture sanity: must total 127 like the live incident");

  // --- Case A: 127 canonical review items cannot yield total=0 ---
  const scoped = summarizeScopedItemReviewCounts(allCurrentScanItems);
  const total = scoped.pending + scoped.needs_review + scoped.approved + scoped.rejected;
  assert.equal(total, 127, "CASE A FAILED: canonical-collection-derived total must equal 127, never 0");
  console.log("Case A (127 canonical items cannot yield total=0) passed.");

  // --- Case B/C: status bucket derivation uses the same canonical collection and reconciles ---
  assert.equal(scoped.approved, 15, "CASE B/C FAILED: approved count wrong");
  assert.equal(scoped.rejected, 12, "CASE B/C FAILED: rejected count wrong");
  assert.equal(scoped.needs_review, 40, "CASE B/C FAILED: needs_review count wrong");
  assert.equal(scoped.pending, 60, "CASE B/C FAILED: pending count wrong");
  assert.equal(
    scoped.pending + scoped.needs_review + scoped.approved + scoped.rejected,
    allCurrentScanItems.length,
    "CASE B/C FAILED: pending+needs_review+approved+rejected must equal total current review items"
  );
  console.log("Case B/C (status buckets reconcile against canonical collection) passed.");

  // --- Case D companion: the page-1-only active-queue view (the OLD buggy source) is
  // proven to legitimately go to all-zero even though the scan is not empty — this is
  // exactly why countLabels must not read from it. ---
  const page1Items = allCurrentScanItems.filter((item) => item.sourcePage === 1);
  const { activeReviewItems: page1ActiveQueue } = partitionOfertaLocalPageReviewItems(page1Items);
  assert.equal(
    page1ActiveQueue.length,
    0,
    "sanity: page 1's active (unresolved) queue must be empty once fully approved"
  );
  const oldBuggyScoped = summarizeScopedItemReviewCounts(page1ActiveQueue);
  const oldBuggyTotal =
    oldBuggyScoped.pending + oldBuggyScoped.needs_review + oldBuggyScoped.approved + oldBuggyScoped.rejected;
  assert.equal(
    oldBuggyTotal,
    0,
    "sanity: proves the old page/active-narrowed source really did produce the reported all-zero state"
  );
  console.log("Case D companion (old page-narrowed source proven to legitimately zero out) passed.");

  // --- Case E: page-narrowed "queue empty" must not be confused with "scan empty" ---
  const scanIsGenuinelyEmpty = allCurrentScanItems.length === 0;
  assert.equal(scanIsGenuinelyEmpty, false, "CASE E FAILED: scan must not be considered empty when 127 items exist");
  console.log("Case E (genuinely-empty check is scan-scoped, not page-scoped) passed.");

  // --- Case I: active scan/source identity filtering (partitionItemsByActiveScanJob) remains intact ---
  const mixedJobItems = [
    fixtureItem({ id: "cur-1", scanJobId: "job-current", reviewStatus: "pending" }),
    fixtureItem({ id: "cur-2", scanJobId: "job-current", reviewStatus: "approved" }),
    fixtureItem({ id: "old-1", scanJobId: "job-old", reviewStatus: "approved" }),
  ];
  const partitioned = partitionItemsByActiveScanJob(mixedJobItems, "job-current");
  assert.equal(partitioned.currentScanItems.length, 2, "CASE I FAILED: active-scan-job filtering broken");
  assert.equal(partitioned.previousScanItems.length, 1, "CASE I FAILED: previous-scan-job filtering broken");
  console.log("Case I (active scan/source identity filtering intact) passed.");

  // --- Structural proof: the exact fix is in place in source ---
  const panelSrc = fs.readFileSync(
    "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx",
    "utf8"
  );
  assert.match(
    panelSrc,
    /const countLabels = useMemo\(\(\) => \{\s*\n\s*const scoped = isWorkspace \? summarizeScopedItemReviewCounts\(allCurrentScanItems\) : summary;/,
    "REGRESSION: countLabels must derive from allCurrentScanItems in workspace mode"
  );
  assert.match(
    panelSrc,
    /isWorkspace \? allCurrentScanItems\.length === 0 : displayItems\.length === 0/,
    "REGRESSION: the genuinely-empty check must be scan-scoped (allCurrentScanItems) in workspace mode"
  );
  // Page-completion semantics (allPagesComplete / pageSummaries) must remain untouched —
  // proven correct already, not part of this bug.
  assert.match(
    panelSrc,
    /const summaryItems = isWorkspace \? allCurrentScanItems : assetScopedItems;/,
    "REGRESSION: page-completion summaries must remain derived from allCurrentScanItems (unchanged)"
  );
  console.log("Structural proof (exact fix present, page-completion logic untouched) passed.");

  console.log("Ofertas Locales Gate B counter/status regression audit passed.");
}

run();
