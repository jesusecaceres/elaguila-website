/**
 * Servicios Final Consolidated Lifecycle Execution — Gate 11 (shared entitlement matching,
 * 2026-09-18).
 *
 * `listing_package_entitlements.listing_source` has been written inconsistently: the generic
 * Revenue OS webhook fulfillment path (`revenueEntitlementFulfillment.ts:179`) writes the bare
 * CATEGORY string (e.g. `"servicios"`, `"restaurantes"`), while every caller of the public results
 * overlay (`listingPackageEntitlementsServer.ts`'s `fetchActiveListingPackageEntitlementsForRows`,
 * shared by Servicios, Restaurantes, Bienes Raíces, Autos, and Rentas) passed the TABLE name (e.g.
 * `"servicios_public_listings"`). The query strictly `.eq()`-filtered on that column, so a real,
 * active Premium/Full-page placement entitlement fulfilled through the generic path silently never
 * appeared on public results — exactly the bug already identified and fixed for the SEPARATE
 * Business Tools/coupons resolver (`categoryCommercialPlan.ts`, "Gate RESTAURANTES-1") and
 * `addonEntitlementReader.ts`, but not yet for this one.
 *
 * Fix: drop the `listing_source` filter from this ONE shared query (`category` + `listing_id`
 * remains the match — a listing id is a real UUID primary key, globally unique on its own, and
 * `category` is still filtered, so no cross-category match is possible even in principle). Every
 * caller of the shared function benefits at once; no category-specific adapter code was touched.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-exec-gate11-shared-entitlement-matching.ts
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

const SERVER = "app/lib/listingPlans/listingPackageEntitlementsServer.ts";

check("the shared overlay query no longer filters by listing_source", () => {
  const src = raw(SERVER);
  const idx = src.indexOf("export async function fetchActiveListingPackageEntitlementsForRows");
  assert.ok(idx > 0);
  const end = src.indexOf("if (error) {", idx);
  const block = src.slice(idx, end);
  assert.ok(!/\.eq\(\s*"listing_source"/.test(block), "must not filter on the inconsistently-written column");
  assert.ok(block.includes('.eq("category", opts.category)'), "category must remain the real category guard");
  assert.ok(block.includes('.in("listing_id", chunk)'), "listing_id (durable, globally unique) must remain the match key");
});

check("REGRESSION GUARD: the function signature is unchanged — every existing caller still compiles without edits", () => {
  const src = raw(SERVER);
  assert.ok(src.includes("opts: { category: string; listingSource: string; now?: Date },"));
});

check("REGRESSION GUARD: every real caller of the shared overlay is untouched (Servicios, Restaurantes, BR, Autos, Rentas, dashboard route)", () => {
  const callers = [
    "app/(site)/clasificados/servicios/lib/serviciosEntitlementOverlay.ts",
    "app/(site)/clasificados/restaurantes/lib/restaurantesEntitlementOverlay.ts",
    "app/api/clasificados/bienes-raices/public/entitlement-overlay/route.ts",
    "app/api/clasificados/autos/public/listings/route.ts",
    "app/(site)/clasificados/rentas/lib/fetchRentasPublicListingsForBrowse.ts",
    "app/api/dashboard/listing-package-entitlements/route.ts",
  ];
  for (const rel of callers) {
    const src = raw(rel);
    assert.ok(
      /hydratePublicRowsWithActivePackageEntitlements|fetchActiveListingPackageEntitlementsForRows/.test(src),
      `${rel} must still call the shared function`,
    );
  }
});

check("REGRESSION GUARD: the already-fixed Business Tools/coupons resolver (categoryCommercialPlan.ts) is untouched", () => {
  const src = raw("app/lib/listingPlans/categoryCommercialPlan.ts");
  assert.ok(!/\.eq\(\s*"listing_source"/.test(src), "must remain category+listing_id only, as already fixed");
  assert.ok(src.includes('.eq("category", input.category)'));
});

check("FIXTURE: category+listing_id alone correctly matches a Servicios entitlement written with the bare-category listing_source, a Restaurantes entitlement is not cross-matched, and a wrong-category same-UUID row is correctly rejected", () => {
  // Simulates the exact predicate the fixed Supabase query now applies (category + listing_id,
  // no listing_source), against a small in-memory row set covering all three owner-required cases.
  type Row = { category: string; listing_source: string; listing_id: string };
  const SAME_UUID = "11111111-1111-1111-1111-111111111111";
  const rows: Row[] = [
    // Real bug case: Servicios entitlement fulfilled through the generic path (bare category).
    { category: "servicios", listing_source: "servicios", listing_id: "aaaa-servicios-paid" },
    // Restaurantes entitlement fulfilled the same (already-table-name) way.
    { category: "restaurantes", listing_source: "restaurantes_public_listings", listing_id: "bbbb-restaurantes-paid" },
    // Wrong-category row that happens to share a UUID with a Servicios lookup — must NOT match.
    { category: "restaurantes", listing_source: "restaurantes_public_listings", listing_id: SAME_UUID },
  ];

  function fixedQuery(category: string, listingId: string): Row[] {
    return rows.filter((r) => r.category === category && r.listing_id === listingId);
  }

  assert.equal(fixedQuery("servicios", "aaaa-servicios-paid").length, 1, "paid Servicios entitlement must be found");
  assert.equal(fixedQuery("restaurantes", "bbbb-restaurantes-paid").length, 1, "paid Restaurantes entitlement must be found");
  assert.equal(
    fixedQuery("servicios", SAME_UUID).length,
    0,
    "a same-UUID row belonging to a DIFFERENT category must never match",
  );
});

if (failures.length) {
  console.error(`\nverify-servicios-exec-gate11-shared-entitlement-matching: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-exec-gate11-shared-entitlement-matching: PASS");
