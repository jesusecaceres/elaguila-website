#!/usr/bin/env node
/**
 * REVENUE-OS-RENTAS-PAID-PUBLISH-LOCKDOWN-01 smoke.
 * Lightweight source-level proof — no Stripe payment, no live Supabase mutation.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

function fail(msg) {
  console.error(`smoke-revenue-os-rentas-paid-publish-lockdown-01: FAIL — ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

const privadoPreview = read(
  "app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx",
);
const negocioPreview = read(
  "app/(site)/clasificados/rentas/preview/negocio/components/RentasNegocioPreviewClient.tsx",
);
const paidCheckout = read("app/(site)/clasificados/rentas/preview/shared/rentasPreviewPaidCheckout.ts");
const publishDraft = read("app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts");
const rentasFulfillment = read("app/lib/listingPlans/revenueRentasFulfillment.ts");
const fulfillment = read("app/lib/listingPlans/revenueFulfillment.ts");
const matrix = read("app/lib/listingPlans/revenuePricingMatrix.ts");

for (const [lane, src] of [
  ["privado", privadoPreview],
  ["negocio", negocioPreview],
]) {
  if (!src.includes("PublishCheckoutCheckpoint")) fail(`${lane}: missing PublishCheckoutCheckpoint`);
  if (!src.includes('activationMode: "pending_payment"')) fail(`${lane}: missing pending_payment save`);
  if (!src.includes("startRevenueCategoryCheckout")) fail(`${lane}: missing Revenue OS checkout`);
  if (!src.includes("onCheckout")) fail(`${lane}: missing onCheckout handler`);
  if (src.includes("published=1")) fail(`${lane}: must not use published=1 unpaid redirect`);
}
ok("privado + negocio paid checkpoint pipeline");

if (!negocioPreview.includes("publishLeonixListingFromRentasNegocioDraft")) {
  fail("negocio must use publishLeonixListingFromRentasNegocioDraft");
}
if (negocioPreview.match(/router\.push\([^)]*listing/)) {
  fail("negocio must not router.push to listing before payment");
}
ok("negocio unpaid publish path removed");

if (!paidCheckout.includes("RENTAS_CHECKPOINT_CONFIRMATIONS")) fail("shared paid checkout must use confirmations");
if (!paidCheckout.includes("validateRevenuePromoForCheckout")) fail("promo Apply helper required");
if (paidCheckout.includes("addOn")) fail("Rentas paid checkout must not reference addOns");
ok("rentasPreviewPaidCheckout: confirmations + promo, no addOns");

if (!publishDraft.includes("publishLeonixListingFromRentasNegocioDraft")) {
  fail("draft state must export negocio publish");
}
const negocioFn = publishDraft.slice(
  publishDraft.indexOf("export async function publishLeonixListingFromRentasNegocioDraft"),
  publishDraft.indexOf("export async function publishLeonixListingFromRentasNegocioDraft") + 1200,
);
if (!negocioFn.includes("pending_payment") && !negocioFn.includes("BrPublishDraftOptions")) {
  fail("negocio publish must accept pending_payment options");
}
ok("negocio draft publish supports pending options");

if (!rentasFulfillment.includes("RENTAS_PENDING_CHECKOUT_STATUS")) fail("Rentas pending status constant required");
if (!rentasFulfillment.includes('.eq("status", RENTAS_PENDING_CHECKOUT_STATUS)')) {
  fail("Rentas activation must guard pending status");
}
if (!fulfillment.includes("tryActivateRentasListingAfterEntitlement")) fail("webhook Rentas hook missing");
ok("webhook activation path present");

const rentasMatrix = matrix.slice(matrix.indexOf('packageKey: "rentas_30d"'), matrix.indexOf('packageKey: "rentas_30d"') + 300);
if (!rentasMatrix.includes("addOnInventory: null")) fail("matrix rentas must have null addOnInventory");
if (!rentasMatrix.includes("priceCents: 2499")) fail("matrix rentas price must be 2499");
ok("matrix: rentas_30d @ 2499, no inventory add-on");

console.log("smoke-revenue-os-rentas-paid-publish-lockdown-01: PASS");
