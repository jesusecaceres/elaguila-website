/**
 * Gate SERVICIOS-P7-BLOCKER-REPAIR-01 — Repair B (SERVICIOS-INCLUDED-OFFERS-1) regression proof.
 *
 * B4: coupons/offers are INCLUDED in `servicios_base_monthly`, but the publish route authorized
 * offer persistence with the RETIRED `servicios_offers_addon` entitlement — which nothing grants any
 * more — so every new $399 customer's coupons were silently stripped, while the dashboard's
 * "enable offers" action reported success.
 *
 * Execution-first. This runs the REAL shared plan policy (`decideCategoryListingPlan` /
 * `decideBusinessToolsAccess`), the REAL first-publish rule, and the EXACT strip function the
 * route calls (moved into an importable module for this reason). Source assertions then prove the
 * route, the my-listings API, the dashboard and the enable route all use the same authority.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-included-offers.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  decideBusinessToolsAccess,
  decideCategoryListingPlan,
  type EntitlementRowFacts,
} from "../app/lib/listingPlans/categoryCommercialPlanPolicy";
import { getRevenuePackageDefinition } from "../app/lib/listingPlans/revenuePricingMatrix";
import { serviciosSaveAwaitsBasePurchase } from "../app/(site)/clasificados/servicios/lib/serviciosOwnerMutationPolicy";
import {
  decideServiciosOffersPersistence,
  enforceServiciosOffersEntitlementServerTruth,
  trustedServiciosOfferContentFromExisting,
} from "../app/(site)/clasificados/servicios/lib/serviciosOffersEntitlementEnforcement";
import type { ServiciosBusinessProfile } from "../app/(site)/servicios/types/serviciosBusinessProfile";

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
function stripComments(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const src = (rel: string) => stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"));

// ---------------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------------

const NOW = Date.parse("2026-09-10T12:00:00Z");
const FUTURE = "2026-10-10T12:00:00Z";
const PAST = "2026-08-01T12:00:00Z";
const ent = (over: Partial<EntitlementRowFacts>): EntitlementRowFacts => ({
  id: "ent",
  packageKey: "servicios_base_monthly",
  grantSource: "stripe_webhook",
  packageTier: null,
  status: "active",
  startsAt: "2026-08-10T12:00:00Z",
  endsAt: FUTURE,
  ...over,
});
function couponsAccess(rows: EntitlementRowFacts[], override: "grace" | "suspended" | null = null) {
  const plan = decideCategoryListingPlan({ category: "servicios", rows, nowMs: NOW, subscriptionOverride: override });
  return decideBusinessToolsAccess({ plan, capability: "coupons_offers" });
}

const INCOMING = {
  coupons: [{ id: "c-new", title: "10% de descuento" }],
  couponFlyer: { url: "https://blob.example/flyer-new.jpg" },
  couponMoreOffers: { url: "https://example.com/more-new", label: "Más" },
};
const STORED = {
  coupons: [{ id: "c-old", title: "Consulta gratis" }],
  couponFlyer: { url: "https://blob.example/flyer-old.jpg" },
  couponMoreOffers: { url: "https://example.com/more-old", label: "Old" },
};
const wireWith = (offers: object) =>
  ({ identity: { businessName: "Plomería QA" }, ...offers }) as unknown as ServiciosBusinessProfile;

/** The route's whole offers step, composed from the exact functions it calls. */
function persistedOffers(opts: {
  capabilityAllowed: boolean;
  hasExistingRow: boolean;
  previousStatus: string | null;
  pendingPaymentRequested: boolean;
  previousWire: ServiciosBusinessProfile | null;
}) {
  const entitled = decideServiciosOffersPersistence({
    capabilityAllowed: opts.capabilityAllowed,
    awaitsBasePurchase: serviciosSaveAwaitsBasePurchase({
      hasExistingRow: opts.hasExistingRow,
      previousStatus: opts.previousStatus,
      pendingPaymentRequested: opts.pendingPaymentRequested,
    }),
  });
  const out = enforceServiciosOffersEntitlementServerTruth(
    wireWith(INCOMING),
    entitled,
    trustedServiciosOfferContentFromExisting(opts.previousWire),
  );
  return out as unknown as typeof INCOMING;
}

// ---------------------------------------------------------------------------------
// 1. Commercial truth
// ---------------------------------------------------------------------------------

check("TRUTH: servicios_base_monthly is $399/mo and INCLUDES coupons_offers", () => {
  const base = getRevenuePackageDefinition("servicios_base_monthly");
  assert.ok(base);
  assert.equal(base.priceCents, 39900);
  assert.ok(base.capabilities?.includes("coupons_offers"));
});
check("TRUTH: servicios_offers_addon is retired and cannot be sold", () => {
  const addon = getRevenuePackageDefinition("servicios_offers_addon");
  assert.ok(addon, "the historical definition stays for legacy reads");
  assert.equal(addon.newSalesRetired, true);
  assert.equal(addon.stripeEligible, false);
});

// ---------------------------------------------------------------------------------
// 2. Capability authority (the real shared policy)
// ---------------------------------------------------------------------------------

check("B4: a new base customer HAS coupons_offers — no add-on needed", () => {
  assert.equal(couponsAccess([ent({})]).allowed, true);
});
check("B4 regression: with ONLY a base entitlement, the retired-add-on gate found nothing — the capability does", () => {
  const rows = [ent({})];
  const oldGateWouldFind = rows.some((r) => r.packageKey === "servicios_offers_addon" && r.status === "active");
  assert.equal(oldGateWouldFind, false, "the pre-repair gate looked only for servicios_offers_addon");
  assert.equal(couponsAccess(rows).allowed, true, "the included capability must be found");
});
check("B4: grace keeps included offers usable (locked grace doctrine)", () => {
  assert.equal(couponsAccess([ent({})], "grace").allowed, true);
});
check("B4: a suspended subscription blocks offer edits", () => {
  assert.equal(couponsAccess([ent({})], "suspended").allowed, false);
});
check("B4: an expired base plan blocks offer edits", () => {
  assert.equal(couponsAccess([ent({ endsAt: PAST })]).allowed, false);
});
check("B4: no plan at all blocks offer edits", () => {
  assert.equal(couponsAccess([]).allowed, false);
});
check("COMPAT: a historical servicios_offers_addon holder still qualifies", () => {
  const d = couponsAccess([ent({ packageKey: "servicios_offers_addon" })]);
  assert.equal(d.allowed, true);
  assert.equal(d.reasonCode, "legacy_addon_entitlement");
});
check("COMPAT: base + legacy add-on together still qualifies", () => {
  assert.equal(couponsAccess([ent({}), ent({ id: "e2", packageKey: "servicios_offers_addon" })]).allowed, true);
});

// ---------------------------------------------------------------------------------
// 3. First publish — no row, no entitlement yet
// ---------------------------------------------------------------------------------

check("FIRST PUBLISH: a brand-new pending-payment save awaits its base purchase", () => {
  assert.equal(serviciosSaveAwaitsBasePurchase({ hasExistingRow: false, previousStatus: null, pendingPaymentRequested: true }), true);
});
check("FIRST PUBLISH: a re-save of a still-pending row awaits its base purchase", () => {
  assert.equal(serviciosSaveAwaitsBasePurchase({ hasExistingRow: true, previousStatus: "pending_payment", pendingPaymentRequested: true }), true);
});
check("FIRST PUBLISH: an ordinary (non-checkout) save never counts as awaiting purchase", () => {
  assert.equal(serviciosSaveAwaitsBasePurchase({ hasExistingRow: false, previousStatus: null, pendingPaymentRequested: false }), false);
});
check("SCOPE: published / paused / suspended rows never qualify through 'awaiting purchase'", () => {
  for (const previousStatus of ["published", "paused_unpublished", "suspended", "rejected", "pending_review"]) {
    assert.equal(
      serviciosSaveAwaitsBasePurchase({ hasExistingRow: true, previousStatus, pendingPaymentRequested: true }),
      false,
      `${previousStatus} must need the real capability`,
    );
  }
});

// ---------------------------------------------------------------------------------
// 4. The strip path the route runs — end-to-end customer journey
// ---------------------------------------------------------------------------------

check("JOURNEY 1 — application → first pending save: the customer's coupons PERSIST", () => {
  const out = persistedOffers({ capabilityAllowed: false, hasExistingRow: false, previousStatus: null, pendingPaymentRequested: true, previousWire: null });
  assert.deepEqual(out.coupons, INCOMING.coupons);
  assert.deepEqual(out.couponFlyer, INCOMING.couponFlyer);
  assert.deepEqual(out.couponMoreOffers, INCOMING.couponMoreOffers);
});
check("JOURNEY 2 — after payment, a dashboard edit of the coupons PERSISTS (republish keeps them)", () => {
  const out = persistedOffers({
    capabilityAllowed: couponsAccess([ent({})]).allowed,
    hasExistingRow: true,
    previousStatus: "published",
    pendingPaymentRequested: false,
    previousWire: wireWith(STORED),
  });
  assert.deepEqual(out.coupons, INCOMING.coupons, "an entitled owner's edit must be saved");
});
check("JOURNEY 3 — the pre-repair defect: base customer, published, retired-key gate → stripped", () => {
  const out = persistedOffers({ capabilityAllowed: false, hasExistingRow: true, previousStatus: "published", pendingPaymentRequested: false, previousWire: null });
  assert.deepEqual(out.coupons, [], "this is exactly what every new $399 customer used to get");
});
check("JOURNEY 4 — lapsed plan: new edits are refused but STORED offers are never erased", () => {
  const out = persistedOffers({
    capabilityAllowed: couponsAccess([ent({ endsAt: PAST })]).allowed,
    hasExistingRow: true,
    previousStatus: "published",
    pendingPaymentRequested: false,
    previousWire: wireWith(STORED),
  });
  assert.deepEqual(out.coupons, STORED.coupons);
  assert.deepEqual(out.couponFlyer, STORED.couponFlyer);
});
check("JOURNEY 5 — historical add-on holder keeps editing offers", () => {
  const out = persistedOffers({
    capabilityAllowed: couponsAccess([ent({ packageKey: "servicios_offers_addon" })]).allowed,
    hasExistingRow: true,
    previousStatus: "published",
    pendingPaymentRequested: false,
    previousWire: wireWith(STORED),
  });
  assert.deepEqual(out.coupons, INCOMING.coupons);
});
check("AUTHORITY: content presence alone never unlocks offers", () => {
  // Stored content exists, but no capability and not awaiting purchase: incoming edits are refused.
  const out = persistedOffers({ capabilityAllowed: false, hasExistingRow: true, previousStatus: "published", pendingPaymentRequested: false, previousWire: wireWith(STORED) });
  assert.deepEqual(out.coupons, STORED.coupons);
});

// ---------------------------------------------------------------------------------
// 5. One authority everywhere (server route, dashboard API, dashboard UI, enable route)
// ---------------------------------------------------------------------------------

const PUBLISH = src("app/api/clasificados/servicios/publish/route.ts");
const MY_LISTINGS = src("app/api/clasificados/servicios/my-listings/route.ts");
const ENABLE = src("app/api/dashboard/enable-included-capability/route.ts");
const MIS = src("app/(site)/dashboard/mis-anuncios/page.tsx");

check("ROUTE: offers are authorized by the included capability, never the retired key", () => {
  assert.match(PUBLISH, /resolveBusinessToolsAccess\(\{[\s\S]*?capability: "coupons_offers",[\s\S]*?\}\)/);
  assert.ok(!/SERVICIOS_OFFERS_ADDON_PACKAGE_KEY|fetchAddonEntitlementsForListings/.test(PUBLISH));
  assert.match(PUBLISH, /enforceServiciosOffersEntitlementServerTruth\(\s*wire,\s*serviciosOffersEntitled,/);
});
check("ROUTE: the offers step runs the importable module (so this verifier tests the real path)", () => {
  assert.match(PUBLISH, /from "@\/app\/clasificados\/servicios\/lib\/serviciosOffersEntitlementEnforcement"/);
  assert.ok(!/function enforceServiciosOffersEntitlementServerTruth/.test(PUBLISH), "no private copy may remain in the route");
});
check("ROUTE: a failed capability lookup fails CLOSED (never grants offers)", () => {
  assert.match(PUBLISH, /capability: "coupons_offers",\s*\}\)\.catch\(\(\) => null\)/);
});
check("DASHBOARD API: my-listings derives offers availability from the same capability", () => {
  assert.match(MY_LISTINGS, /capability: "coupons_offers"/);
  assert.ok(!/SERVICIOS_OFFERS_ADDON_PACKAGE_KEY/.test(MY_LISTINGS));
});
check("DASHBOARD UI: mis-anuncios shows Servicios offers from the capability", () => {
  assert.match(MIS, /dashboardHasCapabilityForKey\(\s*entitlementBadges,\s*\[item\.id, item\.slug \?\? "", item\.leonixAdId \?\? ""\],\s*"coupons_offers",\s*\)/);
});
check("NO FALSE-GREEN: the enable route returns success only after verifying the SAME capability", () => {
  const idxAccess = ENABLE.indexOf("resolveBusinessToolsAccess({ category, listingSource, listingId, capability })");
  const idxRefuse = ENABLE.indexOf("if (!access.allowed)");
  const idxServiciosOk = ENABLE.indexOf("capabilityVerified: true");
  assert.ok(idxAccess > 0 && idxRefuse > idxAccess && idxServiciosOk > idxRefuse);
});
check("NO NEW SALE: the offers add-on is absent from the checkout add-on allowlist", () => {
  const checkout = src("app/lib/listingPlans/revenueCheckout.ts");
  const start = checkout.indexOf("const CHECKOUT_ADDON_ALLOWLIST");
  const block = checkout.slice(start, checkout.indexOf("\n};", start));
  assert.ok(start > 0 && !/\bservicios:\s*\{/.test(block));
});
check("PUBLIC: offers render on the included capability (Gate E.3.2 truth), failing closed", () => {
  const page = src("app/(site)/clasificados/servicios/[slug]/page.tsx");
  assert.match(page, /resolveBusinessToolsAccess\(\{[\s\S]*?capability: "coupons_offers",[\s\S]*?\}\)\.catch\(\(\) => null\)/);
  assert.match(page, /const serviciosOffersVisible = serviciosOffersAccess\?\.allowed === true;/);
  assert.match(page, /coupons: \[\], couponFlyer: undefined, couponMoreOffers: undefined/, "unentitled render must hide offers");
});
check("PUBLIC: rendering is gated by persisted content, never by the retired package key", () => {
  for (const rel of [
    "app/(site)/servicios/components/ServiciosProfileView.tsx",
    "app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx",
    "app/(site)/clasificados/servicios/[slug]/page.tsx",
  ]) {
    assert.ok(!/servicios_offers_addon|SERVICIOS_OFFERS_ADDON_PACKAGE_KEY/.test(src(rel)), `${rel} must not gate on the retired key`);
  }
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-servicios-included-offers: PASS");
