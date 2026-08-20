import { assertIncludes, assertNotIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const publicCopy = readRepoFile("app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts");
const publicClient = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx");
const itemDrawer = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx");
const offerDrawer = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx");
const appCopy = readRepoFile("app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");
const scan = readRepoFile("app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx");

for (const required of [
  "pipelineEmptyTitle",
  "approvedEmptyTitle",
  "emptyTitle",
  "loadFailed",
  "sourceUnavailable",
  "productImageUnavailable",
  "Expired",
  "Vencido",
  "checkoutParentRequired",
  "submitFailed",
  "No se pudo escanear",
  "Could not scan",
]) {
  assertIncludes("state resilience copy", publicCopy + publicClient + itemDrawer + offerDrawer + appCopy + scan, required);
}

assertNotIncludes("state resilience", publicCopy + appCopy, "database error");
assertNotIncludes("state resilience", publicCopy + appCopy, "secret");

pass("Package 10 customer-visible loading, empty, error, and expired states are explicit and non-secret");
