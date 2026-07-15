#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (msg) => {
  console.error(`verify-leonix-paid-listing-lifecycle-engine-01: FAIL - ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`OK: ${msg}`);

const files = {
  types: "app/lib/listingLifecycle/listingLifecycleTypes.ts",
  config: "app/lib/listingLifecycle/listingLifecycleConfig.ts",
  resolver: "app/lib/listingLifecycle/resolveListingLifecycle.ts",
  checkout: "app/lib/listingLifecycle/listingRenewalCheckout.ts",
  fulfillment: "app/lib/listingLifecycle/listingRenewalFulfillment.ts",
  notifications: "app/lib/listingLifecycle/listingExpirationNotifications.ts",
  labels: "app/lib/listingLifecycle/listingLifecycleLabels.ts",
  statusUi: "app/(site)/dashboard/components/ListingLifecycleStatusCard.tsx",
  renewalUi: "app/(site)/dashboard/components/ListingRenewalAction.tsx",
  matrix: "docs/leonix-paid-listing-lifecycle-retrofit-matrix-01.md",
};

for (const rel of Object.values(files)) {
  if (!existsSync(path.join(ROOT, rel))) fail(`missing ${rel}`);
}

const src = Object.fromEntries(Object.entries(files).map(([k, rel]) => [k, read(rel)]));

for (const needle of ["fixed_days", "subscription", "fixed_term_months", "free"]) {
  if (!src.types.includes(needle)) fail(`duration type missing ${needle}`);
}
if (!src.config.includes("RENTAS_LISTING_LIFECYCLE_CONFIG")) fail("Rentas adapter missing");
if (!src.config.includes('packageKey: RENTAS_LIFECYCLE_PACKAGE_KEY')) fail("Rentas package config not canonical");
if (!src.config.includes("durationDays: RENTAS_LIFECYCLE_DURATION_DAYS")) fail("Rentas duration not central");
if (!src.config.includes("renewalPriceCents: 2499")) fail("Rentas renewal price must be 2499");
if (!src.config.includes("renewalEligibleBeforeExpiryDays: RENTAS_RENEWAL_ELIGIBLE_BEFORE_EXPIRY_DAYS")) fail("Rentas renewal window not central");
if (!src.config.includes("[1, 3, 6, 12]")) fail("business term support must include 1/3/6/12");
if (/allowedTermMonths[^\n]*9|BUSINESS_FIXED_TERM_MONTHS[^\n]*9/.test(src.config)) fail("business term support must not include 9 months");
ok("typed config supports Rentas and future duration structures");

for (const needle of ["pending_payment", "expiring_soon", "expired", "suspended", "missing_expires_at", "computeFixedDayRenewalExpiresAt"]) {
  if (!src.resolver.includes(needle)) fail(`resolver missing ${needle}`);
}
if (!src.resolver.includes("Date.now") || !src.resolver.includes("toISOString")) fail("resolver must use deterministic serializable date output");
ok("deterministic resolver states and renewal formula present");

if (!src.checkout.includes('operation: "renew_listing"')) fail("client renewal checkout operation missing");
if (src.checkout.includes("getAdminSupabase")) fail("browser checkout must not import admin Supabase");
if (!src.fulfillment.includes("validateRentasRenewalCheckoutOwnership")) fail("server owner validation missing");
if (!src.fulfillment.includes("resolveListingLifecycle")) fail("server renewal validation must use lifecycle resolver");
ok("client/server renewal boundary is separated");

for (const needle of ["before_7d", "before_3d", "before_1d", "expires_today", "after_3d", "dedupeKey"]) {
  if (!src.notifications.includes(needle)) fail(`notification schedule missing ${needle}`);
}
ok("reminder schedule and dedupe shape present");

for (const category of ["Servicios", "Restaurantes", "Bienes Raices", "Autos", "Empleos", "Varios/En Venta", "Clases", "Rentas"]) {
  if (!src.matrix.includes(category)) fail(`matrix missing ${category}`);
}
if (/discount/i.test(src.config)) fail("lifecycle config must not invent business discounts");
ok("retrofit matrix complete enough for prior paid categories");

console.log("verify-leonix-paid-listing-lifecycle-engine-01: PASS");
