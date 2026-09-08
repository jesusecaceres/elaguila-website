import { assertIncludes, assertNotIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const card = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferCard.tsx");
const drawer = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx");
const search = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx");

for (const required of [
  "couponDetails",
  "shareCoupon",
  "terms",
  "validThrough",
  "businessHubTitle",
  "smsHref",
  "Leonix does not verify redemption",
  "Leonix no verifica redenciones",
]) {
  assertIncludes("coupon card/detail", card + drawer, required);
}

assertIncludes("coupon surface excludes product results", search, "!isCupones && !loading && filteredItems.length > 0");
assertIncludes("coupon surface excludes shopping panel", search, "!isCupones && listOpen");
assertNotIncludes("coupon card/detail", card + drawer, "Add to list");
assertNotIncludes("coupon card/detail", card + drawer, "Redeem now");
assertNotIncludes("coupon card/detail", card + drawer, "cart");

pass("Package 10 coupon cards/details keep terms, validity, Business Hub, share, and no list/cart/fake redemption");
