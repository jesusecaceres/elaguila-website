/**
 * Package 2 (Gate 11) — owner-locked commercial catalog pins: Viajes business free,
 * Cupones free, Ofertas Locales interactive flyer and Restaurantes/Servicios coupons_offers
 * capability protected.
 *
 * Run from repo root: npx tsx scripts/gate-pkgC-viajes-cupones-free-catalog-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  getRevenuePackageDefinition,
  isStripeEligiblePackageKey,
  isPromoEligiblePackageKey,
  OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY,
  OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY,
  OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY,
  VIAJES_BUSINESS_FREE_PACKAGE_KEY,
} from "../app/lib/listingPlans/revenuePricingMatrix";
import { resolveCanonicalListingSourceForPackageKey } from "../app/lib/listingPlans/revenueListingSourceResolver";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

/* 1 — historical Viajes $399 package still resolves and is now retired for new sales. */
{
  const def = getRevenuePackageDefinition("viajes_business_monthly");
  assert.ok(def, "historical viajes_business_monthly must remain resolvable");
  assert.equal(def!.priceCents, 39900, "historical price must never be rewritten");
  assert.equal(def!.billingMode, "monthly_subscription");
  assert.equal(def!.newSalesRetired, true);
  assert.equal(isStripeEligiblePackageKey("viajes_business_monthly"), false);
  assert.equal(isPromoEligiblePackageKey("viajes_business_monthly"), false);
}

/* 2 — canonical FREE Viajes business package exists and cannot enter Stripe. */
{
  const def = getRevenuePackageDefinition(VIAJES_BUSINESS_FREE_PACKAGE_KEY);
  assert.ok(def, "viajes_business_free must exist");
  assert.equal(def!.priceCents, 0);
  assert.equal(def!.billingMode, "free");
  assert.equal(isStripeEligiblePackageKey(VIAJES_BUSINESS_FREE_PACKAGE_KEY), false);
  assert.equal(isPromoEligiblePackageKey(VIAJES_BUSINESS_FREE_PACKAGE_KEY), false);
  // Free must never imply premium/placement.
  assert.equal(def!.placementEligible, false, "free Viajes must not grant placement eligibility");
  assert.notEqual(def!.placementTierKey, "website_business");
  assert.notEqual(def!.placementTierKey, "partner_premium");
}

/* 3 — historical Cupones $199 package still resolves and is now retired for new sales. */
{
  const def = getRevenuePackageDefinition(OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY);
  assert.ok(def, "historical ofertas_locales_coupons_30d must remain resolvable");
  assert.equal(def!.priceCents, 19900, "historical price must never be rewritten");
  assert.equal(def!.billingMode, "one_time");
  assert.equal(def!.durationDays, 30);
  assert.equal(def!.newSalesRetired, true);
  assert.equal(isStripeEligiblePackageKey(OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY), false);
}

/* 4 — canonical FREE Cupones package exists and cannot enter Stripe; content lifecycle
 * (durationDays) is preserved even though billing is free. */
{
  const def = getRevenuePackageDefinition(OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY);
  assert.ok(def, "ofertas_locales_coupons_free must exist");
  assert.equal(def!.priceCents, 0);
  assert.equal(def!.billingMode, "free");
  assert.equal(def!.durationDays, 30, "free coupons still carry a truthful content-expiration window");
  assert.equal(isStripeEligiblePackageKey(OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY), false);
  assert.equal(def!.placementEligible, false, "free coupons must not grant placement eligibility");
}

/* 5 — Ofertas Locales interactive flyer ($399/30d) is completely untouched by the Cupones
 * free change, and is distinct from every coupon package key. */
{
  const def = getRevenuePackageDefinition(OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY);
  assert.ok(def);
  assert.equal(def!.priceCents, 39900);
  assert.equal(def!.billingMode, "one_time");
  assert.equal(def!.durationDays, 30);
  assert.equal(def!.pipeline, "interactive_flyer");
  assert.equal(isStripeEligiblePackageKey(OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY), true);
  assert.notEqual(OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY, OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY);
  assert.notEqual(OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY, OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY);
}

/* 6 — Restaurantes/Servicios $399 base packages still bundle coupons_offers; retired $79
 * add-ons remain retired (not resurrected by this package). */
{
  const restaurantes = getRevenuePackageDefinition("restaurantes_base_monthly");
  assert.ok(restaurantes);
  assert.equal(restaurantes!.priceCents, 39900);
  assert.ok(restaurantes!.capabilities?.includes("coupons_offers"));

  const servicios = getRevenuePackageDefinition("servicios_base_monthly");
  assert.ok(servicios);
  assert.equal(servicios!.priceCents, 39900);
  assert.ok(servicios!.capabilities?.includes("coupons_offers"));

  for (const key of ["restaurantes_offers_addon", "servicios_offers_addon"]) {
    const addon = getRevenuePackageDefinition(key);
    assert.ok(addon, `${key} must remain resolvable`);
    assert.equal(addon!.newSalesRetired, true, `${key} must remain retired`);
    assert.equal(isStripeEligiblePackageKey(key), false, `${key} must remain blocked from Stripe`);
  }
}

/* 7 — checkout route rejects every retired/free key before reaching Stripe, and still allows
 * the flyer. */
{
  const route = read("app/api/revenue-os/checkout/route.ts");
  assert.ok(route.includes("isViajesBusinessMonthlyRetiredEarly"));
  assert.ok(route.includes("isOfertasCouponsRetiredEarly"));
  assert.ok(route.includes("package_retired_now_free"));
  // The coupons key must no longer be part of the still-sellable Ofertas ownership gate.
  const earlyBlock = route.slice(
    route.indexOf("const isOfertasLocalesCheckoutEarly"),
    route.indexOf("const isViajesBusinessMonthlyRetiredEarly"),
  );
  assert.ok(
    !earlyBlock.includes("OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY"),
    "retired coupons key must not trigger the still-sellable Ofertas ownership gate",
  );
  assert.ok(
    earlyBlock.includes("OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY"),
    "the flyer key must still trigger the Ofertas ownership gate (still sellable)",
  );
}

/* 8 — Package 1's canonical listing-source resolver recognizes the two new free package keys
 * (category-based resolution — no resolver change was required or made). */
{
  assert.equal(
    resolveCanonicalListingSourceForPackageKey(VIAJES_BUSINESS_FREE_PACKAGE_KEY),
    "viajes_staged_listings",
  );
  assert.equal(
    resolveCanonicalListingSourceForPackageKey(OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY),
    "ofertas_locales",
  );
}

console.log("gate-pkgC-viajes-cupones-free-catalog-selftest: all assertions passed.");
