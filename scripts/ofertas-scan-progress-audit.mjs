import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const migration = read("supabase/migrations/20260801013000_ofertas_locales_ai_scan_review_publication.sql");
const progress = read("app/lib/ofertas-locales/ofertasLocalesScanProgress.ts");
const scan = read("app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts");
const gemini = read("app/lib/ofertas-locales/ofertasLocalesGeminiScanPipeline.ts");
const itemsRoute = read("app/api/ofertas-locales/items/route.ts");
const runtime = read("app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime.ts");

assert.match(migration, /create table if not exists public\.oferta_local_scan_pages/i);
assert.match(migration, /total_pages integer not null default 0/i);
assert.match(migration, /completed_pages integer not null default 0/i);
assert.match(migration, /failed_pages integer not null default 0/i);
assert.match(progress, /seedOfertaLocalScanPages/);
assert.match(progress, /updateOfertaLocalScanJobProgress/);
assert.match(progress, /updateOfertaLocalScanPageProgress/);
assert.match(gemini, /onPagesPrepared/);
assert.match(gemini, /onPageStarted/);
assert.match(gemini, /onPageFinished/);
assert.match(scan, /completedPages \+= 1/);
assert.match(scan, /failedPages \+= 1/);
assert.match(itemsRoute, /total_pages, completed_pages, failed_pages, current_page, current_stage/);
assert.match(runtime, /formatOfertaLocalPersistedScanProgress/);

console.log("PASS ofertas-scan-progress-audit");
