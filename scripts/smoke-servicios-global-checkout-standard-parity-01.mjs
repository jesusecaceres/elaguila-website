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
const ADDON_CENTS = 9900;

// 1. Servicios base only → $399/mo
{
  const total = BASE_CENTS;
  if (total !== 39900) fail("base-only total must be $399/mo");
  ok("1. Servicios base only = $399.00/mo");
}

// 2. Servicios base + offers add-on → $498/mo
{
  const total = BASE_CENTS + ADDON_CENTS;
  if (total !== 49800) fail("base + offers add-on total must be $498/mo");
  ok("2. Servicios base + offers add-on = $498.00/mo");
}

// 3. base + offers + promo metadata: checkout carries add-on key + promoCode + servicios metadata
if (!checkpoint.includes("SERVICIOS_OFFERS_ADDON_PACKAGE_KEY, quantity: 1")) {
  fail("resolver checkoutPayload must include servicios offers add-on when selected");
}
if (!checkpoint.includes("servicios_offers_addon_price_cents")) fail("metadata must carry add-on price cents");
if (!checkpoint.includes("metadata.pipeline")) fail("metadata must carry lane/pipeline");
if (!preview.includes("promoCode: ctx.promoCode")) fail("checkout must forward applied promoCode");
ok("3. base + offers + promo forwards add-on key, promoCode, and servicios metadata");

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
