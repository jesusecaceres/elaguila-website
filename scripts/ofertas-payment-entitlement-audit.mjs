import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const webhookRoute = read("app/api/revenue-os/webhook/route.ts");
const webhook = read("app/lib/listingPlans/revenueWebhook.ts");
const fulfillment = read("app/lib/listingPlans/revenueFulfillment.ts");
const entitlement = read("app/lib/listingPlans/revenueEntitlementFulfillment.ts");
const server = read("app/lib/ofertas-locales/ofertasLocalesCommercialServer.ts");
const successView = read("app/(site)/revenue-os/pago/_components/RevenueOsPagoResultView.tsx");

assert.match(webhookRoute, /verifyStripeWebhookEvent/);
assert.match(webhookRoute, /REVENUE_WEBHOOK_EVENT_CHECKOUT_COMPLETED/);
assert.match(webhook, /stripe\.webhooks\.constructEvent/);
assert.match(webhook, /leonix_metadata_schema/);
assert.match(webhook, /amountCents/);
assert.match(webhook, /durationDays/);
assert.match(webhook, /aiIncluded/);

assert.match(fulfillment, /isStripeSessionPaid/);
assert.match(fulfillment, /amount_mismatch/);
assert.match(fulfillment, /currency_mismatch/);
assert.match(fulfillment, /ofertas_metadata_contract_mismatch/);
assert.match(fulfillment, /tryFulfillOfertasLocalesParentAfterEntitlement/);
assert.match(fulfillment, /markOfertaLocalEntitlementFulfilled/);
assert.match(fulfillment, /idempotent:\s*true/);
assert.doesNotMatch(fulfillment, /published_at\s*[:=]|expires_at\s*[:=]|status:\s*"approved"/);

assert.match(entitlement, /listing_package_entitlements/);
assert.match(entitlement, /payment_record_id/);
assert.match(entitlement, /packageEntitlementEndsAt/);
assert.match(server, /\.from\("ofertas_locales"\)/);
assert.match(server, /\.update\(\{/);
assert.match(server, /payment_status:\s*"paid"/);
assert.match(server, /entitlement_status:\s*"active"/);
assert.doesNotMatch(server, /insert\(\{[\s\S]*ofertas_locales/);
assert.doesNotMatch(server, /published_at\s*[:=]|expires_at\s*[:=]|status:\s*"approved"/);
assert.match(server, /parent\["expires_at"\]/);

assert.match(successView, /The 30-day public term starts only when Leonix approves/);
assert.match(successView, /El término público de 30 días empieza solo cuando Leonix aprueba/);

console.log("PASS ofertas-payment-entitlement-audit");
