#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (msg) => {
  console.error(`verify-rentas-lifecycle-renewal-dashboard-global-engine-01: FAIL - ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`OK: ${msg}`);

const files = {
  matrix: "app/lib/listingPlans/revenuePricingMatrix.ts",
  route: "app/api/revenue-os/checkout/route.ts",
  paymentRecords: "app/lib/listingPlans/revenuePaymentRecords.ts",
  fulfillment: "app/lib/listingPlans/revenueRentasFulfillment.ts",
  publicSelect: "app/(site)/clasificados/rentas/lib/rentasListingPublicSelect.ts",
  publicMap: "app/(site)/clasificados/rentas/data/mapListingRowToRentasPublicListing.ts",
  dashboard: "app/(site)/dashboard/mis-anuncios/page.tsx",
  manageCard: "app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx",
  editHydration: "app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration.ts",
  privadoForm: "app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx",
  negocioForm: "app/(site)/clasificados/publicar/rentas/negocio/application/RentasNegocioForm.tsx",
  adminRepublish: "app/admin/_lib/classifiedsRepublishCapability.ts",
  adminSelect: "app/admin/_lib/listingsAdminSelect.ts",
  webhook: "app/api/revenue-os/webhook/route.ts",
  notifications: "app/lib/listingLifecycle/listingExpirationNotifications.ts",
  migration: "supabase/migrations/20260714231500_rentas_lifecycle_reminders_and_expiration_index.sql",
  pkg: "package.json",
};

for (const rel of Object.values(files)) {
  if (!existsSync(path.join(ROOT, rel))) fail(`missing ${rel}`);
}
const src = Object.fromEntries(Object.entries(files).map(([k, rel]) => [k, read(rel)]));

const rentasBlock = src.matrix.slice(Math.max(0, src.matrix.indexOf('packageKey: "rentas_30d"') - 160), src.matrix.indexOf('packageKey: "rentas_30d"') + 500);
if (!rentasBlock.includes('category: "rentas"')) fail("rentas_30d category must be rentas");
if (!rentasBlock.includes("priceCents: 2499")) fail("rentas_30d price must be $24.99");
if (!rentasBlock.includes("durationDays: 30")) fail("rentas_30d duration must be 30 days");
ok("Rentas package truth confirmed");

for (const needle of ["validateRentasRenewalCheckoutOwnership", 'body.operation === "renew_listing"', "serverVerifiedCurrentExpiresAt", "buildDashboardMisAnunciosReturnPath(locale, \"rentas\")"]) {
  if (!src.route.includes(needle)) fail(`checkout route missing ${needle}`);
}
if (src.route.includes("body.amountCents")) fail("checkout route must not trust client price");
if (!src.paymentRecords.includes("operation") || !src.paymentRecords.includes("current_expires_at")) fail("payment records must store renewal metadata");
ok("renewal checkout owner validation and server price authority present");

for (const needle of ["expires_at", "computeFixedDayRenewalExpiresAt", "paymentRecordIsRenewal", "renewal_applied_at", "updateRentasPaymentRowResilient"]) {
  if (!src.fulfillment.includes(needle)) fail(`Rentas fulfillment missing ${needle}`);
}
if (!src.webhook.includes("const rawBody = await request.text()") || !src.webhook.includes("verifyStripeWebhookEvent")) fail("raw webhook signature path changed or missing");
ok("verified same-row renewal fulfillment and idempotency present");

if (!src.publicSelect.includes("expires_at")) fail("Rentas public select must include expires_at");
if (!src.publicMap.includes("resolveListingLifecycle") || !src.publicMap.includes("lifecycle.isPubliclyVisible")) fail("public mapper must enforce lifecycle visibility");
ok("public expiration enforcement present");

if (!src.dashboard.includes("startListingRenewalCheckout")) fail("dashboard renewal checkout not wired");
if (!src.dashboard.includes("catKey !== \"rentas\"")) fail("Rentas free republish must be blocked in dashboard");
if (!src.manageCard.includes("ListingLifecycleStatusCard") || !src.manageCard.includes("ListingRenewalAction")) fail("shared lifecycle UI not mounted");
if (!src.manageCard.includes("Renovar") && !src.manageCard.includes("Renew")) fail("renewal language not present through shared UI");
ok("owner dashboard lifecycle UI and renewal CTA present");

for (const needle of ["source\") === \"dashboard\"", "mode\") === \"listing-edit\"", "hydrateRentasDashboardEditDraft", "photoDataUrls", "videoUrls", "contact_phone", "contact_email"]) {
  if (!(src.editHydration + src.privadoForm + src.negocioForm).includes(needle)) fail(`edit hydration missing ${needle}`);
}
ok("dashboard edit hydration present");

if (!src.adminRepublish.includes("Rentas uses paid renewal")) fail("admin/generic republish must be disabled for Rentas");
if (!src.adminSelect.includes("published_at") || !src.adminSelect.includes("expires_at")) fail("admin listing select missing lifecycle timestamps");
ok("admin lifecycle fields present");

for (const needle of ["before_7d", "before_3d", "before_1d", "expires_today", "after_3d", "dedupeKey"]) {
  if (!src.notifications.includes(needle)) fail(`reminder missing ${needle}`);
}
if (!src.migration.includes("listing_lifecycle_reminder_events") || !src.migration.includes("listings_rentas_active_expires_at_idx")) fail("Rentas lifecycle migration missing reminder storage or expiration index");
ok("reminder schedule present");

const diffFiles = execFileSync("git", ["diff", "--name-only"], { cwd: ROOT, encoding: "utf8" })
  .split(/\r?\n/)
  .map((f) => f.trim().replace(/\\/g, "/"))
  .filter(Boolean);
const forbidden = diffFiles.filter((f) => f.startsWith("app/(site)/clasificados/bienes-raices/") || f.startsWith("app/lib/clasificados/bienes-raices/"));
if (forbidden.length) fail(`Bienes active files changed: ${forbidden.join(", ")}`);
ok("Bienes active files protected");

if (!src.pkg.includes("verify:rentas-lifecycle-renewal-dashboard-global-engine-01")) fail("package verify script missing");
if (!src.pkg.includes("verify:leonix-paid-listing-lifecycle-engine-01")) fail("package engine verify script missing");
if (!src.pkg.includes("smoke:rentas-lifecycle-renewal-dashboard-global-engine-01")) fail("package smoke script missing");

console.log("verify-rentas-lifecycle-renewal-dashboard-global-engine-01: PASS");
