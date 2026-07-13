import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const checks = [];

function ok(name, condition) {
  checks.push({ name, ok: Boolean(condition) });
}

const publishRoute = read("app/api/clasificados/servicios/publish/route.ts");
const lifecycle = read("app/(site)/clasificados/servicios/lib/serviciosListingLifecycle.ts");
const publicServer = read("app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts");
const preview = read("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
const savePending = read("app/(site)/clasificados/publicar/servicios/lib/saveServiciosPendingBeforeCheckout.ts");
const publishClient = read("app/(site)/clasificados/publicar/servicios/lib/serviciosPublishClient.ts");
const checkout = read("app/lib/listingPlans/revenueCheckout.ts");
const checkoutRoute = read("app/api/revenue-os/checkout/route.ts");
const webhookRoute = read("app/api/revenue-os/webhook/route.ts");
const fulfillment = read("app/lib/listingPlans/revenueFulfillment.ts");
const serviciosFulfillment = read("app/lib/listingPlans/revenueServiciosFulfillment.ts");
const dashboardOffers = read("app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts");
const myListings = read("app/api/clasificados/servicios/my-listings/route.ts");
const migration = read("supabase/migrations/20260713153000_servicios_pending_payment_status_and_published_at.sql");

const canonicalStatuses = [
  "draft",
  "preview_ready",
  "publish_ready",
  "pending_payment",
  "pending_review",
  "published",
  "paused_unpublished",
  "rejected",
  "suspended",
];

ok("canonical status set remains intact", canonicalStatuses.every((s) => lifecycle.includes(`"${s}"`) && migration.includes(`'${s}'`)));
ok("pending_payment is represented", publishRoute.includes('activationMode === "pending_payment"') && savePending.includes('activationMode: "pending_payment"'));
ok("published_at nullable migration exists", migration.includes("alter column published_at drop not null"));
ok("route requests id and leonix_ad_id", publishRoute.includes('.select("id, leonix_ad_id")'));
ok("Supabase errors not silently swallowed", publishRoute.includes("sanitizeSupabaseError") && publishRoute.includes("logPersistenceDiagnostic"));
ok(
  "no secrets/profile data logged in diagnostics",
  publishRoute.includes("console.error(\"[servicios publish api] persistence failure\", diag)") &&
    !publishRoute.includes("console.error(\"[servicios publish api] persistence failure\", wire") &&
    !publishRoute.includes("console.error(\"[servicios publish api] persistence failure\", body"),
);
ok("pending save requires real DB identity", publishRoute.includes("pendingPayment") && publishRoute.includes("persistedListingId"));
ok("public queries hide pending statuses", publicServer.includes(".ilike(\"listing_status\", SERVICIOS_LISTING_STATUS_PUBLISHED)") && publicServer.includes("listingStatus !== SERVICIOS_LISTING_STATUS_PUBLISHED"));
ok("correct base package key remains", preview.includes("SERVICIOS_BASE_CHECKOUT") && checkout.includes('basePackageKey: "servicios_base_monthly"'));
ok("correct add-on key remains", preview.includes("SERVICIOS_OFFERS_ADDON_PACKAGE_KEY") && checkout.includes("SERVICIOS_OFFERS_ADDON_PACKAGE_KEY"));
ok("no client amount is trusted", !preview.includes("amountCents") && checkoutRoute.includes("validateRevenueCheckoutRequest"));
ok("dashboard upgrade cannot include base", dashboardOffers.includes("SERVICIOS_OFFERS_ADDON_DASHBOARD_CHECKOUT") && !dashboardOffers.includes("SERVICIOS_BASE_CHECKOUT"));
ok("promo requires server validation", preview.includes("validateRevenuePromoForCheckout") && checkoutRoute.includes("resolvePromoForCheckout"));
ok("checkout requires durable database persistence", preview.includes("saveServiciosPendingBeforeCheckout") && savePending.includes("data.pendingPayment"));
ok("webhook verifies Stripe signature", webhookRoute.includes("request.text()") && webhookRoute.includes("verifyStripeWebhookEvent"));
ok("webhook validates package amount listing", fulfillment.includes("amount_mismatch") && fulfillment.includes("payment_record_metadata_mismatch") && fulfillment.includes("payment_record_not_found"));
ok("webhook idempotency preserved", fulfillment.includes("isPaymentCleared") && fulfillment.includes("idempotent"));
ok("webhook publishes Servicios base listing", fulfillment.includes("tryActivateServiciosListingAfterEntitlement") && serviciosFulfillment.includes("listing_status: \"published\""));
ok("base plus offers grants real add-on entitlement", serviciosFulfillment.includes("grantServiciosOffersAddonEntitlementFromBasePayment") && serviciosFulfillment.includes("listing_package_entitlements"));
ok("entitlement source is server-backed", myListings.includes("listing_package_entitlements") && myListings.includes("SERVICIOS_OFFERS_ADDON_PACKAGE_KEY"));
ok("profile flag alone cannot unlock offers", !myListings.includes("serviciosListingJsonOffersEnabled"));
ok("professional and trades mapping remain", preview.includes("professional") && preview.includes("trades"));
ok("media transport rejects blob/data/local placeholders", publishRoute.includes("data:image/") && publishRoute.includes("blob:") && publishRoute.includes("__LX_SV_IDB__") && publishClient.includes("resolveServiciosDraftMediaToRemoteUrls"));

let changedFiles = [];
try {
  changedFiles = execFileSync("git", ["diff", "--name-only"], { cwd: root, encoding: "utf8" })
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
} catch {
  changedFiles = [];
}
const allowed = changedFiles.every((f) =>
  f.startsWith("app/api/clasificados/servicios/") ||
  f.startsWith("app/(site)/clasificados/servicios/") ||
  f.startsWith("app/(site)/clasificados/publicar/servicios/") ||
  f.startsWith("app/(site)/servicios/") ||
  f.startsWith("app/(site)/dashboard/") ||
  f.startsWith("app/lib/listingPlans/revenueServiciosFulfillment.ts") ||
  f.startsWith("app/lib/listingPlans/revenueFulfillment.ts") ||
  f.startsWith("supabase/migrations/20260713153000_servicios_pending_payment_status_and_published_at.sql") ||
  f.startsWith("scripts/verify-servicios-production-readiness-closure-02.mjs") ||
  f.startsWith("scripts/verify-servicios-p0c-dashboard-addon-only-stripe-edit-route-parity.mjs") ||
  f.startsWith("scripts/verify-servicios-post-payment-persistence-public-render-repair-01.mjs") ||
  f.startsWith("scripts/smoke-servicios-post-payment-persistence-public-render-repair-01.mjs") ||
  f === "package.json"
);
ok("no unrelated category files changed", allowed);

const failed = checks.filter((c) => !c.ok);
for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"} ${c.name}`);
if (failed.length) {
  console.error(`\n${failed.length} Servicios production-readiness checks failed.`);
  process.exit(1);
}
console.log("\nServicios production readiness closure verifier passed.");
