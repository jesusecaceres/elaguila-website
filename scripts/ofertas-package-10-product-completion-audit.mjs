import { assertIncludes, assertNotIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const appCopy = readRepoFile("app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");
const app = readRepoFile("app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx");
const publicCopy = readRepoFile("app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts");
const publicSearch = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx");
const itemDrawer = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx");
const offerDrawer = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx");
const list = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesShoppingListPanel.tsx");
const listModel = readRepoFile("app/lib/ofertas-locales/ofertasLocalesShoppingList.ts");
const doc = readRepoFile("docs/OFERTAS_PACKAGE_10_COMPLETE_PRODUCT_EXPERIENCE.md");
// Gate F relocated the checkout continuation from Step 7 to the Preview
// screen (the final visual inspection point) — see ofertas-advertiser-journey-audit.mjs.
const previewCard = readRepoFile("app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx");
const previewCopy = readRepoFile("app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts");

for (const required of [
  "Crear volante interactivo",
  "Publicar cupones",
  "ofertas_locales_flyer_30d",
  "ofertas_locales_coupons_30d",
  "requestedProduct",
  "continueToDashboardEs",
  "Busca productos, precios y cupones en negocios locales.",
  "business",
  "shareProduct",
  "shareCoupon",
  "businessHubTitle",
  "addFromPublicItem",
  "sourceAssetVersionId",
  "No shopping list, cart, or fake redemption",
  "PACKAGE 10",
]) {
  assertIncludes(
    "Package 10 completion surface",
    appCopy + app + publicCopy + publicSearch + itemDrawer + offerDrawer + list + listModel + doc + previewCard + previewCopy,
    required
  );
}

assertNotIncludes("Package 10 completion", appCopy + publicCopy + itemDrawer + offerDrawer, "$598");
assertNotIncludes("Package 10 completion", appCopy + publicCopy + itemDrawer + offerDrawer, "AI add-on");
assertNotIncludes("Package 10 completion", offerDrawer, "Redeem now");

pass("Package 10 complete advertiser-to-shopper product experience is connected and documented");
