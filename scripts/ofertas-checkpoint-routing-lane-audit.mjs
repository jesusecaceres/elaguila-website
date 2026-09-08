import { assertIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const app = readRepoFile("app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx");
const search = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx");
const lane = readRepoFile("app/lib/ofertas-locales/ofertasLocalesTwoLaneProductModel.ts");
const constants = readRepoFile("app/lib/ofertas-locales/ofertasLocalesConstants.ts");

for (const required of [
  'requestedProduct = searchParams?.get("product")',
  "initialProductAppliedRef",
  "window.confirm",
  "buildPrimaryAdFormatChangePatch",
  "wantsAiSearchableSpecials: true",
  "OFERTAS_LOCALES_PUBLISH_PRODUCT_CATALOG.interactive_flyer",
  "OFERTAS_LOCALES_PUBLISH_PRODUCT_CATALOG.coupons",
]) {
  assertIncludes("application lane routing", app, required);
}

assertIncludes("coupon publish deeplink", search, "product=coupon_promotion");
assertIncludes("flyer lane maps to weekly flyer", lane, 'offerType: "weekly_flyer"');
assertIncludes("coupon lane maps to coupon", lane, ': "coupon"');
assertIncludes("flyer revenue package", constants, "OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY");
assertIncludes("coupon revenue package", constants, "OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY");

pass("Package 10 checkpoint routing preserves canonical flyer/coupon lanes and server product keys");
