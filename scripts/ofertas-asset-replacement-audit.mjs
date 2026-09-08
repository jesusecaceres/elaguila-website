import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const ownerRoute = read("app/api/ofertas-locales/owner/[id]/source-assets/route.ts");
const lifecycle = read("app/lib/ofertas-locales/ofertasLocalesAssetLifecycle.ts");
const publicSearch = read("app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts");
const adminReview = read("app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts");
const ownerPage = read("app/(site)/dashboard/ofertas-locales/[id]/page.tsx");
const adminList = read("app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx");

assert.match(ownerRoute, /createOfertaLocalReplacementSourceVersion/);
assert.match(ownerRoute, /\.select\("id, owner_id, status, leonix_ad_id, payment_status, entitlement_status, published_at, expires_at"\)/);
assert.match(ownerRoute, /asset_lifecycle_status: "replacement_pending"/);
assert.match(ownerRoute, /asset_replacement_required_review: true/);
assert.match(ownerRoute, /preserved/);
assert.match(ownerRoute, /leonixAdId/);
assert.match(ownerRoute, /publishedAt/);
assert.match(ownerRoute, /expiresAt/);
assert.doesNotMatch(ownerRoute, /payment_status:\s*"paid"|published_at:\s*now|expires_at:\s*calculate|stripe_/);

assert.match(lifecycle, /lifecycle_status: "superseded"/);
assert.match(lifecycle, /source_lifecycle_status: "superseded"/);
assert.match(lifecycle, /is_active: false/);
assert.match(lifecycle, /public_source_asset_id: input\.sourceAssetId/);
assert.match(lifecycle, /cleanup_status: "queued"/);
assert.doesNotMatch(lifecycle, /\bdelete\b|\.remove\(|unlink|del\(/i);

assert.match(publicSearch, /parent\.public_source_asset_id && parent\.public_source_asset_id !== \(row\.source_asset_version_id \?\? ""\)/);
assert.match(adminReview, /\.eq\("source_lifecycle_status", "active"\)/);
assert.match(ownerPage, /assetLifecycleTitle/);
assert.match(ownerPage, /assetReplacementRequiredReview/);
assert.match(adminList, /assetReplacementRequiredReview/);

console.log("PASS ofertas-asset-replacement-audit");
