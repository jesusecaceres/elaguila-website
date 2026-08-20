import { assertIncludes, assertNotIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const copy = readRepoFile("app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");
const app = readRepoFile("app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx");

for (const required of [
  "Sube flyer, volante o PDF completo",
  "Upload a full flyer, ad, or PDF",
  "Cada producto puede abrir su página exacta del volante",
  "Each product can open its exact flyer page",
  "Sube imagen, hoja o documento de cupones",
  "Upload a coupon image, coupon sheet, or document",
  "Sin Lista de compras, carrito ni redención falsa",
  "No shopping list, cart, or fake redemption",
]) {
  assertIncludes("lane-aware application copy", copy, required);
}

assertIncludes("flyer lane predicate", app, "isOfertaLocalShoppingSpecialsLane");
assertIncludes("coupon lane predicate", app, "isOfertaLocalLocalCouponsLane");
assertNotIncludes("application copy", copy, "AI add-on");
assertNotIncludes("application copy", copy, "optional AI");

pass("Package 10 application lane copy has ES/EN flyer and coupon parity without coupon shopping-list/cart promises");
