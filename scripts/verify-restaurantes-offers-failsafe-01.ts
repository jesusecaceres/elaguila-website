/**
 * RESTAURANTES — FULL OFFERS FAIL-SAFE (owner rule 2026-09-24).
 *
 * Proven Quick -> linked offers HIDDEN. Proven Full -> SHOWN. Unknown / lookup error / no rows must
 * NEVER hide valid stored Full content (production d043fede3 always showed linked offers; the Quick
 * repair must not turn absence of evidence into a hide). Coupon capability logic is untouched.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-restaurantes-offers-failsafe-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  restauranteLinkedOffersVisible,
  restauranteListingIsProvenQuick,
} from "../app/(site)/clasificados/restaurantes/lib/restauranteLinkedOffersVisibility";

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
const raw = (rel: string) => readFileSync(rel, "utf8").replace(/\r\n/g, "\n");

const NOW = Date.parse("2026-09-24T12:00:00Z");
const quick = { packageKey: "restaurantes_quick_monthly", packageTier: "digital_only", status: "active", endsAt: null };
const full = { packageKey: "restaurantes_base_monthly", packageTier: "digital_only", status: "active", endsAt: null };
const vis = (
  entitlementLookup: "ok" | "error",
  rows: Parameters<typeof restauranteLinkedOffersVisible>[0]["rows"],
) => restauranteLinkedOffersVisible({ entitlementLookup, rows, nowMs: NOW });

check("Quick (live simple entitlement, no full) hides offers", () => {
  assert.equal(vis("ok", [quick]), false);
  assert.equal(restauranteListingIsProvenQuick({ entitlementLookup: "ok", rows: [quick], nowMs: NOW }), true);
  // Untiered row (tier null) is still the Simple base package.
  assert.equal(vis("ok", [{ ...quick, packageTier: null }]), false);
  // scheduled (paid, starts later) counts as live per the project's liveness doctrine.
  assert.equal(vis("ok", [{ ...quick, status: "scheduled" }]), false);
});

check("Full (live full entitlement) shows offers", () => {
  assert.equal(vis("ok", [full]), true);
  assert.equal(vis("ok", [{ packageKey: null, packageTier: "half_page", status: "active" }]), true, "print half page = Full access");
});

check("lookup error never misclassifies a Full listing as Quick (offers shown)", () => {
  assert.equal(vis("error", []), true);
  assert.equal(vis("error", null), true);
  // Even if a stale Quick row was somehow handed over alongside an error, error is not proof.
  assert.equal(vis("error", [quick]), true);
});

check("no rows / unknown / undefined rows shows (absence of evidence never hides)", () => {
  assert.equal(vis("ok", []), true);
  assert.equal(vis("ok", undefined), true);
  assert.equal(vis("ok", null), true);
  // Rows that name no product (unknown key) are not evidence of Quick.
  assert.equal(vis("ok", [{ packageKey: "some_unrelated_key", packageTier: null, status: "active" }]), true);
  // A lone quarter-page print row is not the Quick base package.
  assert.equal(vis("ok", [{ packageKey: null, packageTier: "quarter_page", status: "active" }]), true);
});

check("BOTH simple and full live rows resolve Full (shown), in any row order", () => {
  assert.equal(vis("ok", [quick, full]), true);
  assert.equal(vis("ok", [full, quick]), true);
  // Quick base + half-page print row is Full too.
  assert.equal(vis("ok", [quick, { packageKey: null, packageTier: "half_page", status: "active" }]), true);
});

check("non-live rows are not evidence: expired/revoked Quick row alone does not hide; expired Full does not rescue Quick", () => {
  const past = new Date(NOW - 86_400_000).toISOString();
  assert.equal(vis("ok", [{ ...quick, endsAt: past }]), true, "expired Quick row is not a live Simple package");
  assert.equal(vis("ok", [{ ...quick, status: "revoked" }]), true);
  assert.equal(vis("ok", [quick, { ...full, endsAt: past }]), false, "an EXPIRED Full row does not keep a live Quick listing showing offers");
  assert.equal(vis("ok", [quick, { ...full, status: "expired" }]), false);
});

check("a live legacy offers add-on (paid for offers) is never treated as Quick, in any row order; an expired add-on is not evidence", () => {
  const addon = { packageKey: "restaurantes_offers_addon", packageTier: "digital_only", status: "active", endsAt: null };
  assert.equal(vis("ok", [quick, addon]), true, "Quick base + live offers add-on shows offers");
  assert.equal(vis("ok", [addon, quick]), true);
  const past = new Date(NOW - 86_400_000).toISOString();
  assert.equal(vis("ok", [quick, { ...addon, endsAt: past }]), false, "an EXPIRED add-on does not rescue a Quick listing");
});

check("source: [slug]/page.tsx uses the helper and no longer gates linkedOffers by the coupons capability", () => {
  const page = raw("app/(site)/clasificados/restaurantes/[slug]/page.tsx");
  assert.ok(page.includes("restauranteLinkedOffersVisibleForListing"), "page imports/uses the server wrapper");
  assert.ok(page.includes("linkedOffers={linkedOffersVisible ? linkedOffers : []}"));
  assert.ok(!page.includes("couponsIncluded ? linkedOffers"), "linkedOffers must not follow the fail-closed coupons capability");
  // Coupon behavior unchanged (production): still capability-gated.
  assert.ok(page.includes("coupons: couponsIncluded ? shellData.coupons : undefined"));
  assert.ok(page.includes("couponFlyer: couponsIncluded ? shellData.couponFlyer : undefined"));
  assert.ok(page.includes("couponMoreOffers: couponsIncluded ? shellData.couponMoreOffers : undefined"));
  // Linked offers are still fetched exactly as in production.
  assert.ok(page.includes("fetchRestauranteLinkedOffersForPublicPage(getAdminSupabase(), row.id, lang)"));
});

check("source: server wrapper fails open (never throws, error -> not proven Quick) and the pure module is IO-free", () => {
  const server = raw("app/(site)/clasificados/restaurantes/lib/restauranteLinkedOffersVisibilityServer.ts");
  assert.ok(server.includes('entitlementLookup: "error"'));
  assert.ok(/catch\s*\{[\s\S]*entitlementLookup: "error"/.test(server), "thrown lookup maps to error");
  assert.ok(server.includes('.eq("category", "restaurantes")') && server.includes('.eq("listing_id", id)'));
  assert.ok(!server.includes(".eq(\"listing_source\""), "listing_source is written inconsistently; never filtered");
  const pure = raw("app/(site)/clasificados/restaurantes/lib/restauranteLinkedOffersVisibility.ts");
  const pureImports = pure.split("\n").filter((l) => /^import /.test(l)).join("\n");
  assert.ok(!/server-only|supabase/.test(pureImports) && !pure.includes("fetch("), "pure module has no IO");
});

check("source: coupon capability logic untouched (still fails closed)", () => {
  const cap = raw("app/(site)/clasificados/restaurantes/lib/restauranteCouponCapabilityServer.ts");
  assert.ok(/catch\s*\{\s*return false;\s*\}/.test(cap));
  assert.ok(cap.includes("return access.allowed === true;"));
});

check("source: prospect preview never renders linked offers (already private + empty; no duplicated gate)", () => {
  const prev = raw("app/(site)/vista-previa/[category]/ProspectRealCategoryPreview.tsx");
  assert.ok(prev.includes("linkedOffers={[]}"));
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nverify-restaurantes-offers-failsafe-01: all checks passed");
