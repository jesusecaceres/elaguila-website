import { assertIncludes, assertNotIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const publicCopy = readRepoFile("app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts");
const publicClient = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx");
const itemDrawer = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx");
const offerDrawer = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx");
const appCopy = readRepoFile("app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");
const scan = readRepoFile("app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx");
// Gate F relocated the "no canonical id yet" checkout-pending message from
// Step 7 (checkoutParentRequired) to Preview, alongside the new checkout
// continuation it introduced there.
const previewCopy = readRepoFile("app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts");

for (const required of [
  "pipelineEmptyTitle",
  "approvedEmptyTitle",
  "emptyTitle",
  "loadFailed",
  "sourceUnavailable",
  "productImageUnavailable",
  "Expired",
  "Vencido",
  "submitFailed",
  "No se pudo escanear",
  "Could not scan",
]) {
  assertIncludes("state resilience copy", publicCopy + publicClient + itemDrawer + offerDrawer + appCopy + scan, required);
}

assertIncludes("preview checkout-pending resilience copy", previewCopy, "dashboardLinkPendingEs");

assertNotIncludes("state resilience", publicCopy + appCopy, "database error");
assertNotIncludes("state resilience", publicCopy + appCopy, "secret");

pass("Package 10 customer-visible loading, empty, error, and expired states are explicit and non-secret");
