import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const publicSearch = read("app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts");
const publicOffer = read("app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts");
const publicDetail = read("app/lib/ofertas-locales/ofertasLocalesPublicDetailHelpers.ts");
const previewGrid = read("app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx");
const publicDetailView = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx");

assert.match(previewGrid, /formatPreviewPrice/);
assert.match(previewGrid, /priceAmount/);
assert.match(previewGrid, /sourcePage/);
assert.match(previewGrid, /resolveOfertaLocalItemCropDisplayUrl/);
assert.match(previewGrid, /cropUrl/);
assert.match(publicSearch, /public_source_asset_id/);
assert.match(publicSearch, /source_asset_version_id/);
assert.match(publicSearch, /review_status !== "approved"/);
assert.match(publicOffer, /public_source_asset_id/);
assert.match(publicOffer, /asset_lifecycle_status/);
assert.match(publicDetail, /fetchPublicOfertaLocalItemsForOfferId/);
assert.match(publicDetail, /isOfertaLocalPublicSearchRowEligible/);
assert.match(publicDetailView, /shopping/i);
assert.doesNotMatch(previewGrid, /recordOfertaLocalPublicAnalyticsEvent/);

console.log("PASS ofertas-preview-public-parity-audit");
