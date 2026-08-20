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
assertIncludes("coupon package key", constants, "ofertas_locales_coupons_30d");
assertIncludes("flyer locked price", constants, "displayPriceUsd: 399");
assertIncludes("coupon locked price", constants, "displayPriceUsd: 199");
assertNotIncludes("checkpoint copy", copy, "$598");
assertNotIncludes("checkpoint copy", copy, "optional AI");
assertNotIncludes("checkpoint copy", copy, "manual-only");
assertNotIncludes("checkpoint copy", copy, "basic package");

pass("Package 10 checkpoint product value is explicit and obsolete pricing/add-on copy is absent");
