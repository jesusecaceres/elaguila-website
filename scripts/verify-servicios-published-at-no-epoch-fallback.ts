/**
 * Servicios Paid-Publish Blocker repair — Gate 4 verifier (2026-09-17).
 *
 * `mapDbRowToServiciosPublicListingRow` (serviciosPublicListingsServer.ts) used to convert a
 * missing/empty `published_at` into `new Date(0).toISOString()`, which renders as Dec 31, 1969 in
 * US Pacific time on the owner dashboard. A pending/unpublished row must show a truthful null
 * (rendered "—"/"Not published" by the dashboard's own `formatDateIso(...) ?? "—"`), never a fake
 * epoch date. This proves the fallback is gone and stays gone.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-published-at-no-epoch-fallback.ts
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

const SERVER_FILE = "app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts";
const SORT_FILE = "app/(site)/clasificados/servicios/lib/serviciosPublicListingSort.ts";
const DASHBOARD_FILE = "app/(site)/dashboard/mis-anuncios/page.tsx";

check("mapDbRowToServiciosPublicListingRow no longer fabricates new Date(0) for missing published_at", () => {
  const src = raw(SERVER_FILE);
  const fnStart = src.indexOf("function mapDbRowToServiciosPublicListingRow(");
  assert.ok(fnStart > 0, "function must exist");
  const fnEnd = src.indexOf("\n}\n", fnStart);
  const body = src.slice(fnStart, fnEnd);
  assert.ok(!/new Date\(0\)/.test(body), "no Unix-epoch fallback may remain in this function");
  assert.ok(
    /published_at\s*=\s*\n?\s*typeof r\.published_at === "string" && r\.published_at\.trim\(\) \? r\.published_at\.trim\(\) : null;/.test(
      body,
    ),
    "published_at must fall back to real null, not a fabricated timestamp",
  );
});

check("ServiciosPublicListingRow.published_at type is honestly nullable", () => {
  const src = raw(SERVER_FILE);
  assert.ok(
    /published_at:\s*string \| null;/.test(src),
    "the row type must declare published_at as string | null, matching real DB truth",
  );
});

check("ServiciosPublicListingSortInput.published_at accepts null (sort must not assume a real row is published)", () => {
  const src = raw(SORT_FILE);
  assert.ok(/published_at:\s*string \| null;/.test(src));
});

check("discovery/results sort comparators already degrade a null published_at to epoch-ms 0 safely (no crash, no fake date shown)", () => {
  const src = raw(SORT_FILE);
  assert.ok(src.includes("const pub = r.published_at?.trim();"), "coalesce comparator null-safe on published_at");
  assert.ok(src.includes("function parseIsoMs(iso: string | null | undefined): number {"), "results comparator's ISO parser is null-safe");
});

check("dashboard already renders a null publishedAt as a truthful dash, never invents a date", () => {
  const src = raw(DASHBOARD_FILE);
  assert.ok(src.includes("function formatDateIso(iso?: string | null) {"));
  const fnStart = src.indexOf("function formatDateIso(iso?: string | null) {");
  const fnEnd = src.indexOf("\n}\n", fnStart);
  const body = src.slice(fnStart, fnEnd);
  assert.ok(body.includes("if (!iso) return null;"), "null/empty input must return null, never a fabricated date");
  assert.ok(
    /formatDateIso\(item\.publishedAt\) \?\? "—"/.test(src),
    "dashboard must fall back to an em dash, never a raw epoch-derived string",
  );
});

check("REGRESSION GUARD: no source file under app/ reintroduces new Date(0) as a servicios published_at fallback", () => {
  const src = raw(SERVER_FILE);
  const epochHits = [...src.matchAll(/new Date\(0\)/g)];
  assert.equal(epochHits.length, 0, "serviciosPublicListingsServer.ts must contain zero Unix-epoch fallbacks");
});

if (failures.length) {
  console.error(`\nverify-servicios-published-at-no-epoch-fallback: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-published-at-no-epoch-fallback: PASS");
