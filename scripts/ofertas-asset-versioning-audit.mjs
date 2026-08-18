import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const migration = read("supabase/migrations/20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql");
const lifecycle = read("app/lib/ofertas-locales/ofertasLocalesAssetLifecycle.ts");
const scan = read("app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts");
const types = read("app/lib/ofertas-locales/ofertasLocalesTypes.ts");
const publicSearch = read("app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts");
const dbSchema = read("app/lib/ofertas-locales/ofertasLocalesDbSchema.ts");

assert.match(migration, /create table if not exists public\.ofertas_local_source_assets/i);
assert.match(migration, /version_number integer not null/i);
assert.match(migration, /lifecycle_status text not null default 'pending_review'/i);
assert.match(migration, /ofertas_source_assets_one_active_idx/i);
assert.match(migration, /alter table public\.oferta_local_scan_jobs\s+add column if not exists source_asset_version_id/i);
assert.match(migration, /alter table public\.oferta_local_items\s+add column if not exists source_asset_version_id/i);
assert.match(migration, /source_lifecycle_status text not null default 'active'/i);

assert.match(lifecycle, /getNextOfertaLocalSourceVersionNumber/);
assert.match(lifecycle, /createOfertaLocalReplacementSourceVersion/);
assert.match(lifecycle, /markOfertaLocalSourceVersionActive/);
assert.match(lifecycle, /markOfertaLocalSourceVersionRemoved/);
assert.match(lifecycle, /cleanup_status: "queued"/);

assert.match(scan, /sourceAssetVersionId/);
assert.match(scan, /source_asset_version_id/);
assert.match(scan, /source_lifecycle_status: "active"/);
assert.match(types, /source_asset_version_id\?: string \| null/);
assert.match(publicSearch, /public_source_asset_id/);
assert.match(publicSearch, /source_lifecycle_status/);
assert.match(dbSchema, /public_source_asset_id/);
assert.match(dbSchema, /asset_lifecycle_status/);

console.log("PASS ofertas-asset-versioning-audit");
