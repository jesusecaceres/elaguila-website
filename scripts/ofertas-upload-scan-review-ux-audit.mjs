import { assertIncludes, assertNotIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const copy = readRepoFile("app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");
const asset = readRepoFile("app/(site)/publicar/ofertas-locales/OfertasLocalesDraftAssetSection.tsx");
const scan = readRepoFile("app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx");
const scanApi = readRepoFile("app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts");
const review = readRepoFile("app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx");
const itemPanel = readRepoFile("app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx");

for (const required of [
  "laneShoppingMainFlyerAssetHelper",
  "laneCouponMainAssetHelper",
  "aiScanUploadFormats",
  "externalUrlReferenceOnly",
  "assetsUploadPending",
  "assetsFileReceived",
]) {
  assertIncludes("upload copy", copy, required);
}

for (const required of ["validateOfertaLocalClientAssetFile", "uploadOfertaLocalDraftAsset", "fileName"]) {
  assertIncludes("asset upload component", asset, required);
}
assertIncludes("scan source version", scanApi, "sourceAssetVersionId");
assertIncludes("scan source version mismatch guard", scanApi, "source_asset_version_mismatch");

for (const required of ["scanJobId", "currentPage", "totalPages", "failedPages", "Escaneando página"]) {
  assertIncludes("scan progress panel", scan, required);
}

for (const required of ["needsReview", "approvedCount", "rejectedCount", "failedPages", "selectedSourceAssetId"]) {
  assertIncludes("review workspace", review + itemPanel, required);
}

assertNotIncludes("review workspace", review + itemPanel, "bulk complete");
assertNotIncludes("review workspace", review + itemPanel, "optional AI");

pass("Package 10 upload, scan, and review UX uses real source, page, review, and retry state");
