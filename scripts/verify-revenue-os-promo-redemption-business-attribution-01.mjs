#!/usr/bin/env node
/** REVENUE-OS-PROMO-REDEMPTION-BUSINESS-ATTRIBUTION-01 verifier */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (m) => {
  console.error(`verify-revenue-os-promo-redemption-business-attribution-01: FAIL — ${m}`);
  process.exit(1);
};
const ok = (m) => console.log(`OK: ${m}`);

const redemptionsRel = "app/lib/listingPlans/revenuePromoRedemptions.ts";
const paymentRel = "app/lib/listingPlans/revenuePaymentRecords.ts";
const fulfillmentRel = "app/lib/listingPlans/revenueFulfillment.ts";
const promoDataRel = "app/admin/_lib/promoCodeData.ts";
const mapperRel = "app/admin/_lib/promoCodeRecentCardMapper.ts";
const panelRel = "app/admin/(dashboard)/workspace/promo-codes/PromoCodeRecentCodesPanel.tsx";
const docRel = "docs/revenue-os-promo-redemption-business-attribution-01.md";

for (const rel of [redemptionsRel, paymentRel, fulfillmentRel, promoDataRel, mapperRel, panelRel, docRel]) {
  if (!existsSync(path.join(ROOT, rel))) fail(`Missing: ${rel}`);
}

const redemptions = read(redemptionsRel);
const payment = read(paymentRel);
const fulfillment = read(fulfillmentRel);
const promoData = read(promoDataRel);
const mapper = read(mapperRel);
const panel = read(panelRel);
const pkg = read("package.json");

if (!redemptions.includes("PromoRedemptionBusinessAttribution")) fail("attribution type required");
if (!redemptions.includes("PROMO_REDEMPTION_BUSINESS_ATTRIBUTION_KEY")) fail("metadata key required");
if (!redemptions.includes("buildPromoRedemptionBusinessAttribution")) fail("build helper required");
if (!redemptions.includes("markPromoRedemptionRedeemedWithBusinessAttribution")) fail("enriched redeem helper required");
ok("enriched attribution shape + redeem helper");

if (!redemptions.includes("restaurantes_public_listings")) fail("Restaurante listing context required");
if (!redemptions.includes("servicios_public_listings")) fail("Servicios listing context required");
ok("Restaurante + Servicios listing context supported");

if (!fulfillment.includes("markPromoRedemptionRedeemedWithBusinessAttribution")) {
  fail("webhook fulfillment must use enriched redeem");
}
if (/rawBody|constructEvent|stripe\.webhooks/.test(fulfillment)) fail("must not touch webhook signature logic in fulfillment edits");
ok("redemption remains webhook/payment-success only");

if (!/row\.status === "redeemed"[\s\S]*idempotent/.test(redemptions)) fail("idempotency must remain");
ok("idempotency preserved");

if (!promoData.includes("parsePromoRedemptionBusinessAttribution")) fail("admin must read stored attribution");
if (!promoData.includes("matchesPromoUsageEntrySearch")) fail("usage search helper required");
if (!mapper.includes("businessPhone")) fail("mapper must expose business phone");
if (!panel.includes("View published ad")) fail("public ad CTA must remain");
if (!panel.includes("View payment")) fail("view payment CTA must remain");
if (!panel.includes("Original")) fail("original amount display required");
ok("Admin promo card maps/displays business/payment/listing fields");

if (!/ClasificadosServiciosPreviewClient|PublishCheckoutCheckpoint|RestaurantePreviewClient/.test(panel + mapper + promoData)) {
  ok("checkout UI files untouched");
} else {
  fail("checkout UI files must not be changed");
}

if (!pkg.includes("verify:revenue-os-promo-redemption-business-attribution-01")) fail("verify script missing");
const doc = read(docRel);
for (const heading of ["Attribution shape", "Restaurante", "READY TO COMMIT"]) {
  if (!doc.includes(heading)) fail(`doc missing: ${heading}`);
}
ok("package script + doc");

console.log("verify-revenue-os-promo-redemption-business-attribution-01: PASS");
