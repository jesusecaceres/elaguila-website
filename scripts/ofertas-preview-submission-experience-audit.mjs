import { assertIncludes, assertNotIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const previewCopy = readRepoFile("app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts");
const previewCard = readRepoFile("app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx");
const previewHero = readRepoFile("app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewHeroVisual.tsx");
const appCopy = readRepoFile("app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");
const app = readRepoFile("app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx");

for (const required of [
  "Vista previa — todavía no está publicado",
  "Preview — not published yet",
  "Business Hub",
  "OfertasLocalesPdfFlyerPreview",
  "OfertasLocalesPreviewProductGrid",
]) {
  assertIncludes("preview experience", previewCopy + previewCard + previewHero, required);
}

for (const required of [
  "El pago autoriza el envío para revisión",
  "Payment authorizes review submission",
  "30-day public term starts after Leonix approval",
  "No hay publicación instantánea",
  "no instant publication",
  "submitNotPublicUntilReview",
]) {
  assertIncludes("submission truth", appCopy + app, required);
}

// Gate F relocated the checkout continuation from Step 7 to Preview.
assertIncludes("preview checkout continuation", previewCopy + previewCard, "continueToDashboardEs");

assertNotIncludes("preview", previewCopy + previewCard, "public impression");

pass("Package 10 preview and submission states distinguish preview, checkout, review, and public approval truth");
