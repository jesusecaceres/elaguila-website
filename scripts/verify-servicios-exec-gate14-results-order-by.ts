/**
 * Servicios Final Consolidated Lifecycle Execution — Gate 14 (results discovery, 2026-09-18).
 *
 * `listServiciosPublicListingsFromDb`'s query `.limit(fetchCap)` (up to 800) had no `.order()`
 * before it. Postgres/PostgREST give no ordering guarantee for an unordered LIMIT once total
 * published rows exceed the cap, so the SAME query could silently return a different arbitrary
 * subset of real published listings on different requests — some real listings could disappear
 * from discovery/sitemap/related-listings entirely, non-deterministically.
 *
 * Fix: added `.order("published_at", { ascending: false, nullsFirst: false })` before `.limit()` —
 * the owner's own suggested canonical, always-present column. This is purely about making the
 * DB-level truncation deterministic; the existing in-process
 * `compareServiciosPublicDiscoveryNewestFirst` sort (republished_at -> published_at -> updated_at
 * coalesce, matching the DB's own `republish_sort_at` generated column) remains the actual final
 * discovery order for the fetched rows, and any paid-priority/entitlement ranking applied further
 * downstream (e.g. the results page's own overlay + sort) is untouched. `republish_sort_at` itself
 * is deliberately NOT used for this ORDER BY — Gate 13 keeps that column unwired from ranking in
 * this pass. pending_payment rows remain excluded (the `.ilike("listing_status", "published")`
 * filter is untouched).
 *
 * This single fix cascades to every caller of the shared read model: the results page
 * (`resultados/page.tsx`, `listServiciosPublicListingsRaw(500)`), the sitemap, and the related-
 * listings candidate pool — all call through `listServiciosPublicListingsFromDb`.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-exec-gate14-results-order-by.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) =>
  stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n"));

const SERVER = "app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts";

check("the fetchCap query now has a deterministic ORDER BY before LIMIT", () => {
  const src = raw(SERVER);
  const idx = src.indexOf("export async function listServiciosPublicListingsFromDb");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 900);
  const orderIdx = block.indexOf('.order("published_at"');
  const limitIdx = block.indexOf(".limit(fetchCap);");
  assert.ok(orderIdx > 0 && limitIdx > 0, "both .order() and .limit(fetchCap) must be present");
  assert.ok(orderIdx < limitIdx, "ORDER BY must be applied before LIMIT");
  assert.ok(block.includes("ascending: false") && block.includes("nullsFirst: false"));
});

check("pending_payment rows remain excluded — the published-only filter is untouched", () => {
  const src = raw(SERVER);
  const idx = src.indexOf("export async function listServiciosPublicListingsFromDb");
  const block = src.slice(idx, idx + 900);
  assert.ok(block.includes('.ilike("listing_status", SERVICIOS_LISTING_STATUS_PUBLISHED)'));
});

check("REGRESSION GUARD: republish_sort_at is NOT used for this ORDER BY (Gate 13 keeps it unwired from ranking)", () => {
  const src = raw(SERVER);
  const idx = src.indexOf("export async function listServiciosPublicListingsFromDb");
  const block = src.slice(idx, idx + 900);
  assert.ok(!block.includes("republish_sort_at"));
});

check("REGRESSION GUARD: the existing in-process discovery sort (Golden ordering) is untouched", () => {
  const src = raw(SERVER);
  assert.ok(src.includes(".sort(compareServiciosPublicDiscoveryNewestFirst)"));
});

check("REGRESSION GUARD: every real caller of the shared read model still routes through the one fixed function", () => {
  const callers = [
    "app/(site)/clasificados/servicios/resultados/page.tsx",
    "app/sitemap.ts",
    "app/(site)/clasificados/servicios/lib/serviciosRelatedListings.ts",
  ];
  for (const rel of callers) {
    const src = raw(rel);
    assert.ok(src.includes("listServiciosPublicListingsRaw"), `${rel} must still call the shared reader`);
  }
  const server = raw(SERVER);
  assert.ok(server.includes("const db = await listServiciosPublicListingsFromDb(dbFetchLimit);"), "listServiciosPublicListingsRaw must still delegate to the fixed function");
});

if (failures.length) {
  console.error(`\nverify-servicios-exec-gate14-results-order-by: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-exec-gate14-results-order-by: PASS");
