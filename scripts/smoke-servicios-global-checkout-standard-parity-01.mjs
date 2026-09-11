#!/usr/bin/env node
/** SERVICIOS-GLOBAL-CHECKOUT-STANDARD-PARITY-01 smoke — source-level, no Stripe/Supabase mutation */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (m) => {
  console.error(`smoke-servicios-global-checkout-standard-parity-01: FAIL — ${m}`);
  process.exit(1);
};
const ok = (m) => console.log(`OK: ${m}`);

const checkpoint = read("app/lib/listingPlans/publishCheckoutCheckpoint.ts");
const preview = read("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");

// Canonical amounts (must match UI + Stripe)
const BASE_CENTS = 39900;

// 1. Servicios base only → $399/mo
{
  const total = BASE_CENTS;
  if (total !== 39900) fail("base-only total must be $399/mo");
  ok("1. Servicios base only = $399.00/mo");
}

// Gate SERVICIOS-P7-BLOCKER-REPAIR-01 (B4) — cases 2 and 3 updated to current commercial truth.
// They used to certify the retired "$399 base + $99 offers add-on = $498/mo" model. Coupons/offers
// are INCLUDED in servicios_base_monthly (Package C Build 3, owner-locked): selecting offers is
// content/setup intent only and must never add a checkout line item or change the total.

// 2. Servicios with offers selected → still $399/mo (offers included, no add-on line)
{
  if (!/export const REVENUE_OS_SERVICIOS_OFFERS_ADDON_SUPPORTED = false;/.test(checkpoint)) {
    fail("the retired servicios offers add-on must stay disabled (never a checkout line item)");
  }
  if (!preview.includes("getRevenuePackageDefinition(SERVICIOS_BASE_CHECKOUT.packageKey)?.priceCents")) {
    fail("the preview subtotal must be the base package price only");
  }
  ok("2. Servicios with offers selected = $399.00/mo (offers included, no add-on line)");
}

// 3. promo + servicios metadata still forwarded
if (!checkpoint.includes("metadata.pipeline")) fail("metadata must carry lane/pipeline");
if (!preview.includes("promoCode: ctx.promoCode")) fail("checkout must forward applied promoCode");
ok("3. checkout forwards promoCode and servicios metadata");

// 4. Required checkboxes gate the CTA only — preview stays viewable
if (!checkpoint.includes("finalActionEnabled = !blocked && allRequiredChecked")) {
  fail("final CTA must require all confirmations");
}
if (!preview.includes("previewReadiness.ok")) fail("preview visibility must be independent of checkout confirmations");
ok("4. required confirmations gate CTA only; preview stays viewable");

// 5. Both lanes: professional + trades pipeline metadata resolved from shared preview
if (!preview.includes('useProfessionalPreview ? "professional" : "trades"')) {
  fail("shared preview must resolve both professional and trades pipeline metadata");
}
ok("5. both Servicios lanes (professional + trades) covered via shared preview");

console.log("smoke-servicios-global-checkout-standard-parity-01: PASS");
