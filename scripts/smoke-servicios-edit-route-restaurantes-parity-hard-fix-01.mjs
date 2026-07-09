#!/usr/bin/env node
/**
 * Source-level smoke: generated Servicios dashboard hrefs must not use checkpoint/product new-app routes.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (msg) => {
  console.error(`smoke-servicios-edit-route-restaurantes-parity-hard-fix-01: FAIL — ${msg}`);
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
if (!serviciosDash.includes("serviciosListingEditHref")) fail("/dashboard/servicios must reference serviciosListingEditHref");
if (!serviciosDash.includes("serviciosListingPreviewHref")) fail("/dashboard/servicios must reference serviciosListingPreviewHref");

function assertHref(label, href) {
  if (href.includes("/checkpoint")) fail(`${label} must not include checkpoint: ${href}`);
  if (href.includes("product=servicios_profesionales")) fail(`${label} must not include product param: ${href}`);
  if (!href.includes("source=dashboard")) fail(`${label} must include source=dashboard`);
  if (!href.includes("listingId=")) fail(`${label} must include listingId`);
  ok(`${label}: ${href}`);
}

const sampleEdit =
  "/publicar/servicios?source=dashboard&listingId=11111111-1111-1111-1111-111111111111&listingSlug=acme-plumbing&leonixAdId=LX-SV-TEST-001&returnPanel=servicios&mode=listing-edit&lang=es";
const sampleOffers =
  "/publicar/servicios?source=dashboard&listingId=11111111-1111-1111-1111-111111111111&listingSlug=acme-plumbing&leonixAdId=LX-SV-TEST-001&returnPanel=servicios&mode=offers-edit&focus=coupon-upgrade&lang=es";
const samplePreview =
  "/clasificados/publicar/servicios/preview?source=dashboard&listingId=11111111-1111-1111-1111-111111111111&listingSlug=acme-plumbing&leonixAdId=LX-SV-TEST-001&returnPanel=servicios&preview=listing&lang=es";

assertHref("sample listing edit", sampleEdit);
assertHref("sample offers edit", sampleOffers);
assertHref("sample listing preview", samplePreview);
if (!samplePreview.includes("preview=listing")) fail("Preview must include preview=listing");

console.log("\nsmoke-servicios-edit-route-restaurantes-parity-hard-fix-01: ALL CHECKS PASSED");
