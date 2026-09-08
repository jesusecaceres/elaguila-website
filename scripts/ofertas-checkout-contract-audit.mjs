import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const route = read("app/api/revenue-os/checkout/route.ts");
const checkout = read("app/lib/listingPlans/revenueCheckout.ts");
const stripe = read("app/lib/listingPlans/revenueStripe.ts");
const metadata = read("app/lib/listingPlans/revenueEntitlements.ts");
const server = read("app/lib/ofertas-locales/ofertasLocalesCommercialServer.ts");
const client = read("app/lib/listingPlans/revenueCategoryCheckoutPayload.ts");
const ownerDetail = read("app/(site)/dashboard/ofertas-locales/[id]/page.tsx");

assert.match(route, /validateOfertasLocalesCheckoutOwnership/);
assert.match(route, /serverVerifiedLeonixAdId/);
assert.match(route, /serverVerifiedOwnerUserId/);
assert.match(route, /markOfertaLocalCheckoutStarted/);
assert.match(route, /createRevenueStripeCheckoutSession/);
assert.match(route, /ofertas_parent_checkout_summary_failed/);
assert.doesNotMatch(route, /published_at\s*[:=]|expires_at\s*[:=]/);

assert.match(server, /ownerGate|validateOfertasLocalesCheckoutOwnership/);
assert.match(server, /\.eq\("owner_id", ownerId\)|parent\.owner_id !== ownerId/);
assert.match(server, /entitlement_already_active/);
assert.match(server, /ensureOfertaLocalLeonixAdId/);
assert.match(server, /package_listing_mismatch/);

assert.match(checkout, /const amountCents\s*=/);
assert.match(checkout, /computeRevenueCheckoutSubtotalCents/);
assert.match(stripe, /buildStripeCheckoutMetadataPayload/);
assert.match(stripe, /stripe\.checkout\.sessions\.create/);
assert.match(metadata, /leonix_metadata_schema/);
assert.match(metadata, /leonix_amount_cents/);
assert.match(metadata, /leonix_duration_days/);
assert.match(metadata, /leonix_ai_included/);
assert.match(metadata, /leonix_workflow/);

assert.match(client, /OFERTAS_LOCALES_FLYER_CHECKOUT/);
assert.match(client, /OFERTAS_LOCALES_COUPONS_CHECKOUT/);
assert.match(ownerDetail, /startRevenueCategoryCheckout/);
assert.match(ownerDetail, /Payment does not publish|El pago no publica/);

console.log("PASS ofertas-checkout-contract-audit");
