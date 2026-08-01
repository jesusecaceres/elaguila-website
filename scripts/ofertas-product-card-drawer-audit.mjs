import { assertIncludes, assertNotIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const card = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemCard.tsx");
const drawer = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx");
const helper = readRepoFile("app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts");

for (const required of [
  "sourceCropHref",
  "sourceAssetHref",
  "formatOfertaLocalPublicItemPriceDisplay",
  "businessName",
  "sourcePage",
  "onSelect",
  "addToList",
  "removeFromList",
]) {
  assertIncludes("product card/drawer", card + drawer, required);
}

for (const required of ["shareProduct", "smsHref", "item.id", "item.ofertaLocalId", "exactSourceHelper", "businessHubTitle"]) {
  assertIncludes("product drawer Package 10 actions", drawer, required);
}

assertIncludes("source version identity", helper, "sourceAssetVersionId");
assertNotIncludes("product card/drawer", card + drawer, "rating");
assertNotIncludes("product card/drawer", card + drawer, "best price");
assertNotIncludes("product card/drawer", card + drawer, "stock");

pass("Package 10 product cards and drawer show truthful product, source, Business Hub, share, and list actions");
