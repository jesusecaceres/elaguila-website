import { assertIncludes, assertNotIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const copy = readRepoFile("app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");
const constants = readRepoFile("app/lib/ofertas-locales/ofertasLocalesConstants.ts");

for (const required of [
  "Volante interactivo Leonix",
  "IA incluida",
  "Crear volante interactivo",
  "Cupones Leonix",
  "Publicar cupones",
  "30 días públicos completos después de aprobación",
  "Business Hub",
  "Lista de compras",
  "Sin Lista de compras, carrito ni redención falsa",
  "Leonix Interactive Flyer",
  "Create interactive flyer",
  "Leonix Coupons",
  "Publish coupons",
  "AI included",
  "30 full public days after approval",
  "No shopping list, cart, or fake redemption",
]) {
  assertIncludes("checkpoint product value copy", copy, required);
}

assertIncludes("flyer package key", constants, "ofertas_locales_flyer_30d");
// Owner lock 2026-08-25 (Package 4): community coupon publishing is free — the current new-sale
// package key/price live in ofertasLocalesCommercial.ts (OFERTAS_LOCALES_COMMERCIAL_PRODUCTS),
// not the constants catalog checked here. The historical $199 key/price remain in constants.ts
// for old payment/entitlement reads only — asserted, never presented as current truth.
assertIncludes("historical coupon package key preserved", constants, "ofertas_locales_coupons_30d");
assertIncludes("historical coupon price preserved", constants, "OFERTAS_LOCALES_COUPONS_PRICE_CENTS = 19900");
assertIncludes("free coupon package key", constants, "ofertas_locales_coupons_free");
assertIncludes("flyer locked price", constants, "displayPriceUsd: 399");
assertIncludes("current coupon publish catalog price is free", constants, "displayPriceUsd: 0");
assertNotIncludes("checkpoint copy", copy, "$598");
assertNotIncludes("checkpoint copy", copy, "optional AI");
assertNotIncludes("checkpoint copy", copy, "manual-only");
assertNotIncludes("checkpoint copy", copy, "basic package");
assertNotIncludes("checkpoint copy", copy, "$199");
assertIncludes("free coupon CTA copy ES", copy, "Publica tu cupón gratis");
assertIncludes("free coupon CTA copy EN", copy, "Publish your coupon free");

pass("Package 10 checkpoint product value is explicit and obsolete pricing/add-on copy is absent");
pass("Package 4 free-coupon product value and copy are current and no $199 remains in checkpoint copy");
