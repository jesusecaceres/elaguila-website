#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (msg) => {
  console.error(`verify-owner-command-center-gate20-fixed-term-renewal-01: FAIL - ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`OK: ${msg}`);

const files = {
  lifecycleConfig: "app/lib/listingLifecycle/listingLifecycleConfig.ts",
  resolveLifecycle: "app/lib/listingLifecycle/resolveListingLifecycle.ts",
  renewalFulfillment: "app/lib/listingLifecycle/listingRenewalFulfillment.ts",
  renewalCheckout: "app/lib/listingLifecycle/listingRenewalCheckout.ts",
  checkoutRoute: "app/api/revenue-os/checkout/route.ts",
  revenueFulfillment: "app/lib/listingPlans/revenueFulfillment.ts",
  autosService: "app/lib/clasificados/autos/autosClassifiedsListingService.ts",
  autosTypes: "app/lib/clasificados/autos/autosClassifiedsTypes.ts",
  autosPrivadoFulfillment: "app/lib/listingPlans/revenueAutosPrivadoFulfillment.ts",
  bienesFsboFulfillment: "app/lib/listingPlans/revenueBienesFsboFulfillment.ts",
  pricingMatrix: "app/lib/listingPlans/revenuePricingMatrix.ts",
  browseEligibility: "app/(site)/clasificados/lib/listingPublicBrowseEligibility.ts",
  brFetchPublished: "app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts",
  autosDealerSection: "app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx",
  misAnuncios: "app/(site)/dashboard/mis-anuncios/page.tsx",
  migration: "supabase/migrations/20260910120000_autos_privado_lifecycle_expires_at.sql",
};

for (const rel of Object.values(files)) {
  if (!existsSync(path.join(ROOT, rel))) fail(`missing ${rel}`);
}
const src = Object.fromEntries(Object.entries(files).map(([k, rel]) => [k, read(rel)]));

// 1. Locked commercial truth, unchanged from the pricing matrix — never a new/invented price.
const autosBlock = src.pricingMatrix.slice(
  Math.max(0, src.pricingMatrix.indexOf('packageKey: "autos_privado_30d"') - 160),
  src.pricingMatrix.indexOf('packageKey: "autos_privado_30d"') + 400,
);
if (!autosBlock.includes("priceCents: 2499") || !autosBlock.includes("durationDays: 30")) fail("autos_privado_30d price/duration truth changed");
const fsboBlock = src.pricingMatrix.slice(
  Math.max(0, src.pricingMatrix.indexOf('packageKey: "br_fsbo_45d"') - 160),
  src.pricingMatrix.indexOf('packageKey: "br_fsbo_45d"') + 400,
);
if (!fsboBlock.includes("priceCents: 4999") || !fsboBlock.includes("durationDays: 45")) fail("br_fsbo_45d price/duration truth changed");
ok("Autos Privado ($24.99/30d) and Bienes Raíces FSBO ($49.99/45d) commercial truth unchanged");

// 2. Lifecycle config registered (not a duplicate engine — same config/resolver Rentas uses).
for (const needle of ["AUTOS_PRIVADO_LISTING_LIFECYCLE_CONFIG", "BR_FSBO_LISTING_LIFECYCLE_CONFIG", "AUTOS_PRIVADO_LIFECYCLE_DURATION_DAYS = 30", "BR_FSBO_LIFECYCLE_DURATION_DAYS = 45"]) {
  if (!src.lifecycleConfig.includes(needle)) fail(`lifecycle config missing ${needle}`);
}
const registryBlock = src.lifecycleConfig.slice(
  src.lifecycleConfig.indexOf("LISTING_LIFECYCLE_CONFIGS: readonly"),
  src.lifecycleConfig.indexOf("] as const;", src.lifecycleConfig.indexOf("LISTING_LIFECYCLE_CONFIGS: readonly")),
);
if (!registryBlock.includes("AUTOS_PRIVADO_LISTING_LIFECYCLE_CONFIG") || !registryBlock.includes("BR_FSBO_LISTING_LIFECYCLE_CONFIG")) {
  fail("both new configs must be registered in LISTING_LIFECYCLE_CONFIGS (not orphaned constants)");
}
ok("both fixed-term configs registered in the one shared LISTING_LIFECYCLE_CONFIGS registry");

// 3. Checkout route: real ownership gate per category, server-verified price/expiry, no client trust.
for (const needle of [
  "isAutosPrivadoRenewalEarly",
  "isBienesFsboRenewalEarly",
  "validateAutosPrivadoRenewalCheckoutOwnership",
  "validateBienesFsboRenewalCheckoutOwnership",
  "isAutosPrivadoRenewal || isBienesFsboRenewal",
]) {
  if (!src.checkoutRoute.includes(needle)) fail(`checkout route missing ${needle}`);
}
if (src.checkoutRoute.includes("body.amountCents")) fail("checkout route must not trust a client-supplied price");
ok("renewal checkout owner validation and server-verified state present for both categories");

// 4. Same-row, no-recharge fulfillment: extends expires_at, never inserts, never resets status.
for (const needle of ["tryRenewAutosPrivadoListingAfterPayment", "computeFixedDayRenewalExpiresAt", "eq(\"lane\", \"privado\")"]) {
  if (!src.autosService.includes(needle)) fail(`Autos service missing ${needle}`);
}
if (!src.autosTypes.includes("expires_at")) fail("AutosClassifiedsListingRow must expose expires_at");
if (!src.autosPrivadoFulfillment.includes("paymentRecordIsRenewal") || !src.autosPrivadoFulfillment.includes("isRenewalAlreadyApplied")) {
  fail("Autos Privado fulfillment missing renewal detection or idempotency guard");
}
if (!src.bienesFsboFulfillment.includes("paymentRecordIsRenewal") || !src.bienesFsboFulfillment.includes("isRenewalAlreadyApplied")) {
  fail("Bienes FSBO fulfillment missing renewal detection or idempotency guard");
}
const fsboRenewUpdateBlock = src.bienesFsboFulfillment.slice(
  src.bienesFsboFulfillment.indexOf("newExpiresAt"),
  src.bienesFsboFulfillment.indexOf("newExpiresAt") + 1200,
);
if (!fsboRenewUpdateBlock.includes('.eq("status", "active")') || !fsboRenewUpdateBlock.includes('.eq("is_published", true)')) {
  fail("Bienes FSBO renewal update must be scoped to the existing active+published row (same-row, not a new insert)");
}
if (!src.renewalFulfillment.includes("markRenewalPaymentApplied") || !src.renewalFulfillment.includes("isRenewalAlreadyApplied")) {
  fail("shared webhook-retry idempotency guard missing");
}
ok("same-row renewal fulfillment (Autos Privado + Bienes FSBO) with shared webhook-retry idempotency guard present");

// 5. Webhook dispatcher threads paymentRecordId/metadata through so idempotency + audit both work.
const dispatcherThreadingCount = (
  src.revenueFulfillment.match(/paymentMetadata:\s*input\.paymentRecord\.metadata,\s*paymentRecordId:\s*input\.paymentRecord\.id,/g) ?? []
).length;
if (dispatcherThreadingCount < 2) {
  fail("revenueFulfillment dispatcher must pass paymentRecordId + metadata to both category activators");
}
ok("webhook dispatcher threads payment identity through to both category fulfillment adapters");

// 6. Public visibility: expired (but still status=active) rows excluded from discovery, never deleted.
if (!src.browseEligibility.includes("expires_at") || !src.browseEligibility.includes("expiresMs <= Date.now()")) {
  fail("shared BR/listings browse-eligibility predicate must gate on expires_at");
}
if (!src.brFetchPublished.includes("expires_at")) fail("BR published-listings browse query must select expires_at");
if (!src.autosService.includes("lane !== \"privado\" || !r.expires_at") && !src.autosService.includes('r.lane !== "privado" || !r.expires_at')) {
  fail("Autos active-pool query must gate expired Privado rows out of public discovery");
}
ok("expired fixed-term rows excluded from public discovery pools without deleting the row");

// 7. Migration is additive-only — no drops, no renames, no destructive backfill.
if (!src.migration.includes("add column if not exists expires_at timestamptz null")) fail("migration must additively add a nullable expires_at column");
if (/drop column|drop table|rename column/i.test(src.migration)) fail("migration must never drop or rename anything");
ok("migration is additive-only (nullable column + index), no destructive changes");

// 8. Owner dashboard: real renew CTA wired for both categories, not just a status label.
if (!src.autosDealerSection.includes("ListingRenewalAction") || !src.autosDealerSection.includes("startAutosPrivadoRenewal")) {
  fail("Autos Privado dashboard section missing the real renewal CTA");
}
if (!src.misAnuncios.includes("startBienesFsboRenewal") || !src.misAnuncios.includes("BR_FSBO_LISTING_LIFECYCLE_CONFIG")) {
  fail("mis-anuncios dashboard missing the real Bienes FSBO renewal CTA wiring");
}
ok("owner dashboard renewal CTA wired for both Autos Privado and Bienes Raíces FSBO");

console.log("verify-owner-command-center-gate20-fixed-term-renewal-01: PASS");
