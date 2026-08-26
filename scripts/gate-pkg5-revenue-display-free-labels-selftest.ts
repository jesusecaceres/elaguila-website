/**
 * Globalization Reconcile Package 5 — scoped gated audit closing every remaining live-app
 * reference that still presented free Viajes/Cupones as paid.
 *
 * Pins: revenueAdPlanBadgeLabel() must label an active free-package entitlement (e.g.
 * viajes_business_free, ofertas_locales_coupons_free) as "Gratis"/"Free" rather than falling
 * through to the generic "business"/"monthly_subscription" paid-label branch just because the
 * package's customerType string happens to contain "business" — while every genuinely paid
 * package (current or historical) keeps its existing, correct paid label unchanged.
 *
 * Run from repo root: npx tsx scripts/gate-pkg5-revenue-display-free-labels-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

import { revenueAdPlanBadgeLabel } from "../app/lib/listingPlans/revenueDisplay";
import { getRevenuePackageDefinition } from "../app/lib/listingPlans/revenuePricingMatrix";

const REPO_ROOT = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(REPO_ROOT, p), "utf8");

/* 1 — current free packages must resolve as billingMode "free" (sanity, protects the fix's premise). */
{
  const viajesFree = getRevenuePackageDefinition("viajes_business_free");
  const couponsFree = getRevenuePackageDefinition("ofertas_locales_coupons_free");
  assert.ok(viajesFree && viajesFree.billingMode === "free");
  assert.ok(couponsFree && couponsFree.billingMode === "free");
  // The exact substring-match trap this gate closes: both customerTypes contain "business".
  assert.ok(viajesFree!.customerType.includes("business"));
  assert.ok(couponsFree!.customerType.includes("business"));
}

/* 2 — free Viajes business listing must show Gratis/Free, not Negocio pagado/Paid business. */
{
  const es = revenueAdPlanBadgeLabel({ category: "viajes", packageKey: "viajes_business_free", lang: "es" });
  const en = revenueAdPlanBadgeLabel({ category: "viajes", packageKey: "viajes_business_free", lang: "en" });
  assert.equal(es, "Gratis");
  assert.equal(en, "Free");
}

/* 3 — free Cupones listing must show Gratis/Free, not Negocio pagado/Paid business. */
{
  const es = revenueAdPlanBadgeLabel({ category: "ofertas-locales", packageKey: "ofertas_locales_coupons_free", lang: "es" });
  const en = revenueAdPlanBadgeLabel({ category: "ofertas-locales", packageKey: "ofertas_locales_coupons_free", lang: "en" });
  assert.equal(es, "Gratis");
  assert.equal(en, "Free");
}

/* 4 — regression guard: the historical PAID Viajes package keeps its correct paid label. */
{
  const es = revenueAdPlanBadgeLabel({ category: "viajes", packageKey: "viajes_business_monthly", lang: "es" });
  const en = revenueAdPlanBadgeLabel({ category: "viajes", packageKey: "viajes_business_monthly", lang: "en" });
  assert.equal(es, "Negocio pagado");
  assert.equal(en, "Paid business");
}

/* 5 — regression guard: the historical PAID Cupones package keeps its dedicated paid label. */
{
  const es = revenueAdPlanBadgeLabel({ category: "ofertas-locales", packageKey: "ofertas_locales_coupons_30d", lang: "es" });
  const en = revenueAdPlanBadgeLabel({ category: "ofertas-locales", packageKey: "ofertas_locales_coupons_30d", lang: "en" });
  assert.equal(es, "Cupón Leonix pagado");
  assert.equal(en, "Paid Leonix coupon");
}

/* 6 — regression guard: the Ofertas flyer ($399, paid) keeps its dedicated paid label — never free. */
{
  const es = revenueAdPlanBadgeLabel({ category: "ofertas-locales", packageKey: "ofertas_locales_flyer_30d", lang: "es" });
  const en = revenueAdPlanBadgeLabel({ category: "ofertas-locales", packageKey: "ofertas_locales_flyer_30d", lang: "en" });
  assert.equal(es, "Volante Leonix pagado");
  assert.equal(en, "Paid Leonix flyer");
}

/* 7 — regression guard: an unrelated genuinely-paid "business" package (Autos dealer, monthly
 * subscription) is unaffected by the new free-first check. */
{
  const es = revenueAdPlanBadgeLabel({ category: "autos", packageKey: "autos_dealer_monthly", lang: "es" });
  const en = revenueAdPlanBadgeLabel({ category: "autos", packageKey: "autos_dealer_monthly", lang: "en" });
  assert.equal(es, "Negocio pagado");
  assert.equal(en, "Paid business");
}

/* 8 — activeUntil formatting still composes correctly onto the new free label. */
{
  const label = revenueAdPlanBadgeLabel({
    category: "viajes",
    packageKey: "viajes_business_free",
    lang: "en",
    activeUntil: "2026-12-31T00:00:00.000Z",
  });
  assert.ok(label?.startsWith("Free · Active until"), `unexpected label: ${label}`);
}

/* 9 — stale doc-comment fix: the Viajes checkpoint page no longer describes the negocios lane
 * as paid. */
{
  const checkpointPage = read("app/(site)/publicar/viajes/checkpoint/page.tsx");
  assert.ok(!/paid \(negocios/i.test(checkpointPage), "checkpoint page header comment must not call the negocios lane paid");
  assert.ok(/free negocios/i.test(checkpointPage), "checkpoint page header comment must describe the negocios lane as free");
}

console.log("gate-pkg5-revenue-display-free-labels-selftest: all assertions passed.");
