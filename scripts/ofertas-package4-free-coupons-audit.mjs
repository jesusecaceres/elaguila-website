/**
 * Ofertas Locales — Package 4 (owner lock 2026-08-25): free community coupon publishing +
 * interactive flyer $399 protection.
 *
 * Follows the established Ofertas *-audit.mjs pattern (source-text assertions, no live DB/React) —
 * updates existing audits rather than a parallel framework; this file covers the assertions not
 * already pinned elsewhere.
 *
 * Run: node scripts/ofertas-package4-free-coupons-audit.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const constants = read("app/lib/ofertas-locales/ofertasLocalesConstants.ts");
const commercial = read("app/lib/ofertas-locales/ofertasLocalesCommercial.ts");
const commercialServer = read("app/lib/ofertas-locales/ofertasLocalesCommercialServer.ts");
const operationalStatus = read("app/lib/ofertas-locales/ofertasLocalesOperationalStatus.ts");
const ownerHelpers = read("app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts");
const adminHelpers = read("app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts");
const adminReviewMutations = read("app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts");
const publishRoute = read("app/api/ofertas-locales/publish/route.ts");
const ownerRoute = read("app/api/ofertas-locales/owner/[id]/route.ts");
const applicationClient = read("app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx");
const applicationCopy = read("app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");
const commercialSummary = read("app/(site)/publicar/ofertas-locales/OfertasLocalesCommercialSummary.tsx");
const dashboardOwnerPage = read("app/(site)/dashboard/ofertas-locales/[id]/page.tsx");
const revenueMatrix = read("app/lib/listingPlans/revenuePricingMatrix.ts");
const revenueCheckoutRoute = read("app/api/revenue-os/checkout/route.ts");
const revenueListingSource = read("app/lib/listingPlans/revenueListingSourceResolver.ts");

function pass(msg) {
  console.log(`PASS ${msg}`);
}

/* 1 — free coupon package is the current new-sale package. */
{
  assert.match(constants, /OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY\s*=\s*"ofertas_locales_coupons_free"/);
  assert.match(commercial, /packageKey:\s*OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY/, "OFERTAS_LOCALES_COMMERCIAL_PRODUCTS.coupons must resolve to the free package key");
  assert.match(commercial, /amountCents:\s*0,/, "the current coupons commercial product must be $0");
  assert.match(constants, /revenuePackageKey:\s*OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY/);
  assert.match(constants, /displayPriceUsd:\s*0,/);
  pass("free coupon package is the current new-sale package (amountCents 0 / displayPriceUsd 0)");
}

/* 2 — free coupon cannot enter Stripe / checkout. */
{
  assert.match(revenueMatrix, /VIAJES_BUSINESS_FREE_PACKAGE_KEY|OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY/);
  assert.match(commercialServer, /product\.amountCents === 0/, "checkout ownership gate must reject amountCents 0");
  assert.match(commercialServer, /package_not_checkout_eligible/);
  pass("free coupon package cannot reach Stripe checkout (defense-in-depth + Revenue OS matrix)");
}

/* 3 & 4 — retired $199 coupon remains resolvable and cannot enter Stripe. */
{
  assert.match(constants, /OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY\s*=\s*"ofertas_locales_coupons_30d"/);
  assert.match(constants, /OFERTAS_LOCALES_COUPONS_PRICE_CENTS\s*=\s*19900/);
  assert.match(commercial, /OFERTAS_LOCALES_HISTORICAL_COMMERCIAL_PRODUCTS/);
  assert.match(commercial, /newSalesRetired:\s*true/);
  assert.match(revenueMatrix, /ofertas_locales_coupons_30d/);
  assert.match(revenueMatrix, /priceCents:\s*19900/);
  assert.match(commercialServer, /product\.newSalesRetired/);
  assert.match(commercialServer, /package_retired/);
  pass("historical $199 coupon package remains resolvable and stays blocked from checkout");
}

/* 5 — no current coupon UI says $199. */
{
  assert.doesNotMatch(applicationCopy, /\$199/);
  assert.doesNotMatch(applicationClient, /\$199/);
  pass("no current coupon UI copy mentions $199");
}

/* 6 — no current coupon CTA points to a paid checkout. */
{
  assert.match(publishRoute, /entitlement\.source !== "free"/);
  assert.match(ownerRoute, /entitlement\.source !== "free"/);
  assert.match(applicationClient, /isOfertaLocalLocalCouponsLane\(draft\) \? c\.continueToMyDashboard/);
  assert.match(commercialSummary, /isFreeProduct/);
  pass("no current coupon CTA routes through a paid checkout screen");
}

/* 7 — coupon moderation remains (admin approve/reject/archive untouched; free-lane bypass added, not a new moderation system). */
{
  assert.match(adminReviewMutations, /export type OfertaLocalAdminReviewAction = "approve" \| "reject" \| "archive"/);
  assert.match(adminReviewMutations, /isFreeProductLane/);
  assert.match(adminReviewMutations, /validateOfertaLocalPartnerCourtesyEligibility/, "paid/courtesy gate must remain for non-free lanes");
  pass("coupon moderation (approve/reject/archive) is preserved; only the free lane bypasses payment/courtesy");
}

/* 8 — coupon expiration remains truthful (30-day public term, approval-driven, independent of price). */
{
  assert.match(commercial, /durationDays:\s*OFERTAS_LOCALES_PUBLIC_TERM_DAYS/);
  assert.match(adminReviewMutations, /calculateOfertaLocalPublicTermExpiresAt\(now\)/);
  assert.match(adminReviewMutations, /parentUpdate\.published_at = now/);
  pass("free coupons keep the truthful 30-day public term, set only at admin approval");
}

/* 9, 10, 11 — flyer remains $399, Stripe-eligible, and routes through paid checkout. */
{
  assert.match(commercial, /amountCents:\s*OFERTAS_LOCALES_FLYER_PRICE_CENTS/);
  assert.match(constants, /OFERTAS_LOCALES_FLYER_PRICE_CENTS\s*=\s*39900/);
  assert.match(revenueMatrix, /ofertas_locales_flyer_30d/);
  assert.match(revenueMatrix, /priceCents:\s*39900/);
  assert.match(revenueMatrix, /stripeEligible:\s*true/);
  assert.match(
    revenueCheckoutRoute,
    /isOfertasLocalesCheckoutEarly\s*=\s*[\s\S]{0,80}OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY/,
    "only the flyer key may reach the Ofertas checkout ownership gate",
  );
  assert.doesNotMatch(
    revenueCheckoutRoute.slice(
      revenueCheckoutRoute.indexOf("isOfertasLocalesCheckoutEarly"),
      revenueCheckoutRoute.indexOf("isViajesBusinessMonthlyRetiredEarly"),
    ),
    /OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY|OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY/,
    "no coupons key (historical or free) may trigger the still-sellable Ofertas checkout gate",
  );
  pass("Ofertas interactive flyer stays $399/30 days, Stripe-eligible, and is the only Ofertas checkout entry");
}

/* 12 — flyer AI/search/shopping-list product contract remains distinct from the free coupon (Gate 5: FREE COUPON != PAID FLYER). */
{
  assert.match(constants, /productSearchIncluded:\s*true/);
  assert.match(constants, /flyerViewerIncluded:\s*true/);
  assert.match(constants, /shoppingListIncluded:\s*true/);
  assert.match(constants, /productSearchIncluded:\s*false/);
  assert.match(constants, /productShoppingListIncluded:\s*false/);
  assert.match(applicationCopy, /Sin Lista de compras, carrito ni redención falsa/);
  assert.match(applicationCopy, /No shopping list, cart, or fake redemption/);
  pass("free coupon publishing does not inherit the paid flyer's AI-search/shopping-list capabilities");
}

/* 13 — historical coupon records remain readable (label + price), including in the admin discrepancy check. */
{
  assert.match(commercial, /getOfertaLocalCommercialProductByPackageKey[\s\S]{0,400}?OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY/);
  assert.match(
    adminHelpers,
    /getOfertaLocalCommercialProductForOfferType\(row\.offer_type\)/,
    "admin discrepancy check must derive the expected product from offer_type, not a hardcoded historical key",
  );
  assert.doesNotMatch(
    adminHelpers,
    /getOfertaLocalCommercialProductByPackageKey\("ofertas_locales_coupons_30d"\)/,
    "the hardcoded-historical-key discrepancy bug must not be reintroduced",
  );
  pass("historical $199 coupon rows remain readable and are never flagged as a commercial discrepancy");
}

/* 14 — Package 1 canonical listing_source resolver is unchanged by this package. */
{
  assert.match(revenueListingSource, /"ofertas-locales":\s*"ofertas_locales"/);
  pass("Package 1 canonical listing_source mapping for ofertas-locales is unchanged");
}

/* Free-lane readiness derivation: operational status + dashboard checkoutEligible both key off
 * the offer type's expected product (correct before AND after first submission). */
{
  assert.match(operationalStatus, /freeProductLane/);
  assert.match(operationalStatus, /commercialReady\s*=\s*freeProductLane \|\| courtesyActive \|\| paidEntitlement/);
  assert.match(ownerHelpers, /getOfertaLocalCommercialProductForOfferType\(row\.offer_type\)\?\.amountCents !== 0/);
  pass("commercial readiness and checkout eligibility are derived from the offer type, not stale persisted state");
}

/* Dashboard/admin truth: free product shows a truthful non-payment note, no stale "Pay" CTA logic path. */
{
  assert.match(dashboardOwnerPage, /freeNoPaymentNote/);
  assert.match(dashboardOwnerPage, /getOfertaLocalCommercialProductForOfferType\(offer\.offerType\)\?\.amountCents === 0/);
  pass("dashboard payment/package block shows truthful free-vs-paid commercial state");
}

console.log("\nPASS ofertas-package4-free-coupons-audit");
