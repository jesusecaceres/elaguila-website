import { assertIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const detail = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx");
const itemDrawer = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx");
const offerDrawer = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx");
const previewHelpers = readRepoFile("app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts");
const analytics = readRepoFile("app/lib/ofertas-locales/ofertasLocalesPublicAnalytics.ts");

for (const required of [
  "businessHubTitle",
  "phoneHref",
  "websiteHref",
  "directionsHref",
  "whatsappHref",
  "socialLinks",
  "share",
]) {
  assertIncludes("Business Hub actions", detail + itemDrawer + offerDrawer, required);
}

assertIncludes("tel href helper", previewHelpers, "buildOfertaLocalTelHref");
assertIncludes("directions helper", previewHelpers, "resolveOfertaLocalDirectionsHref");
assertIncludes("canonical analytics", analytics, "trackOfertaLocalEvent");

pass("Package 10 Offer Hub and Business Hub expose only real conditional shopper actions with canonical analytics hooks");
