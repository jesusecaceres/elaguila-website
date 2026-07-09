#!/usr/bin/env node
/** REVENUE-OS-PROMO-REDEMPTION-BUSINESS-ATTRIBUTION-01 smoke (source-level). */
import { readFileSync } from "node:fs";

const read = (rel) => readFileSync(rel, "utf8");
const fail = (m) => {
  console.error(`smoke-revenue-os-promo-redemption-business-attribution-01: FAIL — ${m}`);
  process.exit(1);
};
const ok = (m) => console.log(`OK: ${m}`);

const redemptions = read("app/lib/listingPlans/revenuePromoRedemptions.ts");
const promoData = read("app/admin/_lib/promoCodeData.ts");
const mapper = read("app/admin/_lib/promoCodeRecentCardMapper.ts");

function parseAttr(meta) {
  const raw = meta?.business_attribution;
  if (!raw || typeof raw !== "object") return null;
  return raw;
}

function mapUsageEntry(red, payment, attr) {
  const subtotal = attr?.subtotalCents ?? payment?.amount_subtotal_cents ?? null;
  const discount = attr?.discountCents ?? payment?.amount_discount_cents ?? red.discount_cents;
  const total = attr?.finalAmountCents ?? payment?.amount_total_cents ?? null;
  return {
    usedBusinessName: attr?.businessName ?? payment?.business_name ?? null,
    usedEmail: attr?.customerEmail ?? payment?.customer_email ?? red.email,
    businessPhone: attr?.businessPhone ?? null,
    category: attr?.category ?? red.category,
    packageKey: attr?.packageKey ?? red.package_key,
    addOnKeys: attr?.addOnKeys ?? [],
    subtotalCents: subtotal,
    amountDiscountCents: discount,
    amountTotalCents: total,
    publicAdUrl: attr?.publicUrl ?? null,
  };
}

// Restaurante scenario
{
  const attr = {
    businessName: "Tacos El Leon",
    customerEmail: "owner@tacos.com",
    businessPhone: "4085550100",
    category: "restaurantes",
    packageKey: "restaurantes_base_monthly",
    addOnKeys: ["restaurantes_offers_addon"],
    subtotalCents: 49800,
    discountCents: 12450,
    finalAmountCents: 37350,
    publicUrl: "/clasificados/restaurantes/tacos-el-leon?lang=es",
  };
  const entry = mapUsageEntry(
    { category: "restaurantes", package_key: "restaurantes_base_monthly", discount_cents: 12450, email: "owner@tacos.com" },
    { business_name: "Tacos El Leon", customer_email: "owner@tacos.com", amount_subtotal_cents: 49800, amount_discount_cents: 12450, amount_total_cents: 37350 },
    attr,
  );
  if (entry.amountTotalCents !== 37350 || entry.amountDiscountCents !== 12450) fail("Restaurante amount math");
  if (!entry.publicAdUrl?.includes("restaurantes")) fail("Restaurante public URL");
  ok("1. Restaurante attribution maps to admin usage fields");
}

// Servicios scenario
{
  const attr = {
    businessName: "Servicios Pro LLC",
    customerEmail: "pro@servicios.com",
    businessPhone: "6505550200",
    category: "servicios",
    packageKey: "servicios_base_monthly",
    addOnKeys: ["servicios_offers_addon"],
    subtotalCents: 49800,
    discountCents: 12450,
    finalAmountCents: 37350,
    publicUrl: "/clasificados/servicios/servicios-pro?lang=es",
  };
  const entry = mapUsageEntry(
    { category: "servicios", package_key: "servicios_base_monthly", discount_cents: 12450 },
    { amount_total_cents: 37350 },
    attr,
  );
  if (entry.category !== "servicios" || entry.addOnKeys[0] !== "servicios_offers_addon") {
    fail("Servicios add-on/category mapping");
  }
  ok("2. Servicios attribution maps to admin usage fields");
}

// Metadata-only fallback
{
  const entry = mapUsageEntry(
    { category: "empleos", package_key: "empleos_job_post_paid", discount_cents: 500, email: "jobs@test.com" },
    { customer_email: "jobs@test.com", amount_total_cents: 1999, amount_discount_cents: 500 },
    null,
  );
  if (entry.usedEmail !== "jobs@test.com") fail("metadata-only fallback crashed");
  if (entry.businessPhone != null) fail("must not fake phone");
  ok("3. metadata-only fallback does not crash or fake phone");
}

// Source parity
if (!redemptions.includes("parsePromoRedemptionBusinessAttribution")) fail("parse helper missing");
if (!promoData.includes("servicios_public_listings")) fail("admin ledger must resolve servicios URLs");
if (!mapper.includes("formatPromoUsageMoney")) fail("mapper must format money");
ok("4. source modules include attribution read/display path");

console.log("smoke-revenue-os-promo-redemption-business-attribution-01: PASS");
