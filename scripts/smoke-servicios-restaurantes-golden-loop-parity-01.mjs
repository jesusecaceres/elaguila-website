#!/usr/bin/env node
/**
 * Source-level smoke: the full Servicios owner-edit loop keeps dashboard context.
 * dashboard edit → preview → Volver a editar → offers edit — none may use checkpoint/product.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (msg) => {
  console.error(`smoke-servicios-restaurantes-golden-loop-parity-01: FAIL — ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`OK: ${msg}`);

const helper = read("app/(site)/dashboard/lib/serviciosDashboardOffersAddonCheckout.ts");
const misAnuncios = read("app/(site)/dashboard/mis-anuncios/page.tsx");
const serviciosDash = read("app/(site)/dashboard/servicios/page.tsx");

if (!helper.includes('SERVICIOS_DASHBOARD_APPLICATION_BASE = "/publicar/servicios"')) {
  fail("Helper application base must be /publicar/servicios");
}
if (!misAnuncios.includes("serviciosListingEditHref")) fail("Mis anuncios must reference serviciosListingEditHref");
if (!serviciosDash.includes("serviciosListingPreviewHref")) fail("/dashboard/servicios must reference serviciosListingPreviewHref");

const id = "11111111-1111-1111-1111-111111111111";
const slug = "acme-plumbing";
const ad = "LX-SV-TEST-001";
const identity = `listingId=${id}&listingSlug=${slug}&leonixAdId=${ad}`;

function assertNoBadRoutes(label, href, expectations = {}) {
  if (href.includes("/checkpoint")) fail(`${label} must not include checkpoint: ${href}`);
  if (href.includes("product=servicios_profesionales")) fail(`${label} must not include product param: ${href}`);
  if (!href.includes("source=dashboard")) fail(`${label} must include source=dashboard`);
  if (!href.includes(`listingId=${id}`)) fail(`${label} must include listingId`);
  for (const [k, v] of Object.entries(expectations)) {
    if (!href.includes(v)) fail(`${label} must include ${k}=${v}: ${href}`);
  }
  ok(`${label}: ${href}`);
}

// 1. Dashboard edit
const editHref = `/publicar/servicios?edit=1&source=dashboard&${identity}&returnPanel=servicios&mode=listing-edit&lang=es`;
assertNoBadRoutes("dashboard edit", editHref, { mode: "mode=listing-edit" });
if (editHref.startsWith("/clasificados/publicar/servicios?")) fail("dashboard edit must not use checkpoint-redirecting base");

// 2. Dashboard preview
const previewHref = `/clasificados/publicar/servicios/preview?edit=1&source=dashboard&${identity}&returnPanel=servicios&preview=listing&lang=es`;
assertNoBadRoutes("dashboard preview", previewHref, { preview: "preview=listing" });

// 3. Preview → Volver a editar (listing-edit)
const backToEdit = `/publicar/servicios?edit=1&source=dashboard&${identity}&returnPanel=servicios&mode=listing-edit&lang=es`;
assertNoBadRoutes("preview back-to-edit", backToEdit, { mode: "mode=listing-edit" });

// 4. Offers edit
const offersEdit = `/publicar/servicios?edit=1&source=dashboard&${identity}&returnPanel=servicios&mode=offers-edit&focus=coupon-upgrade&lang=es`;
assertNoBadRoutes("offers edit", offersEdit, { mode: "mode=offers-edit", focus: "focus=coupon-upgrade" });

// 5. Preview → Volver a editar (offers-edit preserves focus)
const backToOffers = `/publicar/servicios?edit=1&source=dashboard&${identity}&returnPanel=servicios&mode=offers-edit&focus=coupon-upgrade&lang=es`;
assertNoBadRoutes("preview back-to-offers", backToOffers, { mode: "mode=offers-edit", focus: "focus=coupon-upgrade" });

console.log("\nsmoke-servicios-restaurantes-golden-loop-parity-01: ALL CHECKS PASSED");
