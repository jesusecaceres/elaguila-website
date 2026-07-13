import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const checks = [];

function ok(name, condition) {
  checks.push({ name, ok: Boolean(condition) });
}

const pricing = read("app/lib/listingPlans/revenuePricingMatrix.ts");
const checkpoint = read("app/lib/listingPlans/publishCheckoutCheckpoint.ts");
const payload = read("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
const checkout = read("app/lib/listingPlans/revenueCheckout.ts");
const checkoutRoute = read("app/api/revenue-os/checkout/route.ts");
const fulfillment = read("app/lib/listingPlans/revenueFulfillment.ts");
const dealerFulfillment = read("app/lib/listingPlans/revenueAutosDealerFulfillment.ts");
const preview = read("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
const helper = read("app/(site)/clasificados/autos/negocios/lib/autosDealerRevenueCheckout.ts");
const dashboard = read("app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout.ts");
const publicService = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
const apiListings = read("app/api/clasificados/autos/listings/route.ts");
const webhookRoute = read("app/api/revenue-os/webhook/route.ts");

ok("canonical base package exists", pricing.includes('packageKey: "autos_dealer_monthly"'));
ok("canonical base price $399 exists", pricing.includes("priceCents: 39900"));
ok("canonical inventory package exists", pricing.includes('packageKey: "autos_dealer_inventory_pack_monthly"'));
ok("canonical inventory price $129 exists", pricing.includes("priceCents: 12900"));
ok("base included capacity 10", pricing.includes('includedInventory: "10 active vehicles"') && checkpoint.includes("AUTOS_DEALER_BASE_INCLUDED_VEHICLES = 10"));
ok("add-on capacity +10", pricing.includes('includedInventory: "+10 additional active vehicles"') && checkpoint.includes("AUTOS_DEALER_INVENTORY_PACK_ADDITIONAL_VEHICLES = 10"));
ok("dealer checkout payload constant", payload.includes("AUTOS_DEALER_CHECKOUT") && payload.includes('packageKey: "autos_dealer_monthly"'));
ok("shared checkpoint mounted on preview", preview.includes("PublishCheckoutCheckpoint") && preview.includes("autosDealerPreviewCheckpointConfig"));
ok("promo apply wired with add-ons", preview.includes("applyAutosDealerPreviewPromoCode") && helper.includes("validateRevenuePromoForCheckout") && helper.includes("addOns"));
ok("newsletter source wired", preview.includes("CHECKOUT_NEWSLETTER_SOURCES.autosDealer"));
ok("dealer confirmations present", checkpoint.includes("AUTOS_DEALER_CHECKPOINT_CONFIRMATIONS"));
ok("pending save before Stripe", preview.includes("/api/clasificados/autos/listings") && checkoutRoute.includes("setAutosListingPendingPayment"));
ok("Revenue OS base checkout used", preview.includes("startRevenueCategoryCheckout") && preview.includes("AUTOS_DEALER_CHECKOUT"));
ok("inventory add-on allowlisted only with dealer base", checkout.includes("basePackageKey: \"autos_dealer_monthly\"") && checkout.includes("AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY"));
ok("dashboard upgrade add-on only excludes base", dashboard.includes("AUTOS_DEALER_INVENTORY_PACK_DASHBOARD_CHECKOUT") && !dashboard.includes("autos_dealer_monthly"));
ok("webhook base activation exists", fulfillment.includes("tryActivateAutosDealerListingAfterEntitlement") && dealerFulfillment.includes("tryActivateAutosListingAfterPayment"));
ok("webhook inventory entitlement activation exists", dealerFulfillment.includes("listing_package_entitlements") && dealerFulfillment.includes("AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY"));
ok("Autos Privado separation preserved", dealerFulfillment.includes('row.lane !== "negocios"') && checkout.includes("listing_not_dealer"));
ok("child persistence path exists", apiListings.includes("createAutosClassifiedsListingWithInventoryParent") && publicService.includes("listActiveDealerInventoryByGroupId"));
ok("public dealer-child render exists", publicService.includes("relatedDealerListings") && publicService.includes("status !== \"active\""));
ok(
  "raw Revenue OS webhook signature route unchanged in principle",
  webhookRoute.includes("request.text()") && webhookRoute.includes("verifyStripeWebhookEvent"),
);

const failed = checks.filter((c) => !c.ok);
for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"} ${c.name}`);
if (failed.length) {
  console.error(`\n${failed.length} verifier checks failed.`);
  process.exit(1);
}
console.log("\nAutos dealer Revenue OS inventory entitlement parity verifier passed.");
