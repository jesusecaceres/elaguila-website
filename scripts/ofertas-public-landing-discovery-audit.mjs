import { assertIncludes, assertNotIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const client = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx");
const copy = readRepoFile("app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts");
const coupons = readRepoFile("app/(site)/coupons/page.tsx");

for (const required of [
  "Busca productos, precios y cupones en negocios locales.",
  "Search products, prices, and coupons from local businesses.",
  "searchPlaceholderCompact",
  "city",
  "zip",
  "OfertasLocalesPublicOfferCard",
  "OfertasLocalesPublicItemCard",
  "OfertasFloatingShoppingListCart",
]) {
  assertIncludes("public landing discovery", client + copy, required);
}

assertIncludes("legacy coupons alignment", coupons, 'redirect("/cupones?lang=en")');
assertNotIncludes("public discovery copy", copy, "near you");
assertNotIncludes("public discovery copy", copy, "fake count");

pass("Package 10 public landing supports product/coupon discovery and aligns /coupons to Cupones");
