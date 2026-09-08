import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const migration = read("supabase/migrations/20260801013000_ofertas_locales_ai_scan_review_publication.sql");
const lifecycle = read("app/lib/ofertas-locales/ofertasLocalesAssetLifecycle.ts");
const admin = read("app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts");
const ownerRoute = read("app/api/ofertas-locales/owner/[id]/source-assets/route.ts");
const publicSearch = read("app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts");

assert.match(migration, /activate_oferta_local_source_version/);
assert.match(migration, /source_lifecycle_status = 'superseded'/);
assert.match(migration, /active_source_asset_id = p_source_asset_version_id/);
assert.match(migration, /public_source_asset_id = p_source_asset_version_id/);
assert.match(lifecycle, /rpc\("activate_oferta_local_source_version"/);
assert.match(lifecycle, /markOfertaLocalSourceVersionActive/);
assert.match(admin, /markOfertaLocalSourceVersionActive/);
assert.match(admin, /source_asset_version_id", sourceId/);
assert.match(ownerRoute, /preserved/);
assert.match(ownerRoute, /leonixAdId/);
assert.match(ownerRoute, /paymentStatus/);
assert.match(ownerRoute, /expiresAt/);
assert.match(publicSearch, /parent\.public_source_asset_id/);

console.log("PASS ofertas-replacement-activation-audit");
