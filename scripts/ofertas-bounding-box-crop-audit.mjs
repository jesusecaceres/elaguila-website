import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const migration = read("supabase/migrations/20260801013000_ofertas_locales_ai_scan_review_publication.sql");
const bbox = read("app/lib/ofertas-locales/ofertasLocalesBoundingBoxes.ts");
const crop = read("app/lib/ofertas-locales/ofertasLocalesScanCropGenerator.ts");
const reviewMapper = read("app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts");
const publicSearch = read("app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts");
const scan = read("app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts");

assert.match(migration, /source_page_width integer/i);
assert.match(migration, /source_page_height integer/i);
assert.match(migration, /source_bbox_format text not null default 'normalized_0_1'/i);
assert.match(bbox, /normalizeOfertaLocalSourceBbox/);
assert.match(bbox, /clamp01/);
assert.match(bbox, /xMax - xMin < 0\.002/);
assert.match(crop, /normalizedBboxToPixelCropRect/);
assert.match(crop, /createOfertaLocalScanCropStoragePath/);
assert.match(crop, /scanJobId/);
assert.match(crop, /sourceAssetId/);
assert.match(reviewMapper, /normalizeOfertaLocalSourceBbox/);
assert.match(publicSearch, /normalizeOfertaLocalSourceBbox/);
assert.match(scan, /source_bbox_format: "normalized_0_1"/);

console.log("PASS ofertas-bounding-box-crop-audit");
