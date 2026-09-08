import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const migration = read("supabase/migrations/20260801013000_ofertas_locales_ai_scan_review_publication.sql");
const lifecycle = read("app/lib/ofertas-locales/ofertasLocalesAssetLifecycle.ts");
const route = read("app/api/ofertas-locales/admin/cleanup-queue/route.ts");

assert.match(migration, /create table if not exists public\.ofertas_local_asset_cleanup_queue/i);
assert.match(migration, /status text not null default 'pending'/i);
assert.match(migration, /attempt_count integer not null default 0/i);
assert.match(migration, /failure_reason text/i);
assert.match(migration, /status in \('pending', 'processing', 'failed', 'completed', 'cancelled'\)/i);
assert.match(lifecycle, /queueOfertaLocalAssetCleanup/);
assert.match(lifecycle, /cleanup_queue_insert_failed/);
assert.match(lifecycle, /source_asset_removed/);
assert.match(route, /resolveOfertasLocalesOwnerOrAdminAuth/);
assert.match(route, /!auth\?\.isAdmin/);
assert.match(route, /GET/);
assert.match(route, /PATCH/);
assert.doesNotMatch(route, /del\(|deleteBlob|remove\(/, "cleanup route must not physically delete storage in Package 7");

console.log("PASS ofertas-cleanup-lifecycle-audit");
