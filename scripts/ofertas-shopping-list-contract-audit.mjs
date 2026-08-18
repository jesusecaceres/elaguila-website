import { assertIncludes, assertNotIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const panel = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesShoppingListPanel.tsx");
const hook = readRepoFile("app/(site)/clasificados/ofertas-locales/useOfertasLocalesShoppingList.ts");
const model = readRepoFile("app/lib/ofertas-locales/ofertasLocalesShoppingList.ts");
const search = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx");

for (const required of [
  "addFromPublicItem",
  "removeItem",
  "updateQuantity",
  "updateNote",
  "clearList",
  "groupOfertaLocalShoppingListByBusiness",
  "localStorage",
  "ofertaLocalId",
  "sourceAssetVersionId",
  "priceText",
  "quantity",
  "note",
  "mapHandoffNote",
]) {
  assertIncludes("shopping list contract", panel + hook + model, required);
}

assertIncludes("flyer-only add guard", search, 'item.offerType === "weekly_flyer"');
assertIncludes("coupon lane no list panel", search, "!isCupones && listOpen");
assertNotIncludes("shopping list", panel + hook + model, "checkout");
assertNotIncludes("shopping list", panel + hook + model, "reservation");

pass("Package 10 flyer shopping list supports add/remove/grouping/counts without cart or coupon entry");
