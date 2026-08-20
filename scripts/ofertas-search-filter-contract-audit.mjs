import { assertIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const client = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx");
const drawer = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx");
const itemHelper = readRepoFile("app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts");
const offerHelper = readRepoFile("app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts");
const apiSearch = readRepoFile("app/api/ofertas-locales/public-search/route.ts");
const apiOffers = readRepoFile("app/api/ofertas-locales/public-offers/route.ts");

for (const required of [
  "business",
  "category",
  "marketType",
  "offerType",
  "city",
  "state",
  "zip",
  "country",
  "sort",
  "clearFilters",
]) {
  assertIncludes("public filter state", client + drawer, required);
}

assertIncludes("item keyword includes business", itemHelper, "item.businessName");
assertIncludes("item business filter parses URL", itemHelper, 'params.get("business")');
assertIncludes("offer business filter parses URL", offerHelper, 'params.get("business")');
assertIncludes("public search approved-only", apiSearch, '.eq("review_status", "approved")');
assertIncludes("public offers approved-only", apiOffers, '.eq("status", "approved")');

pass("Package 10 search/filter contract maps to real stored fields and shareable URL state");
