import { assertIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const app = readRepoFile("app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx");
const filters = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx");
const itemDrawer = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx");
const offerDrawer = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx");
const card = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemCard.tsx");

for (const required of [
  "type=\"button\"",
  "href=",
  "aria-label",
  "aria-modal=\"true\"",
  "role=\"dialog\"",
  "aria-labelledby",
  "alt={",
  "onKeyDown",
  "Escape",
  "focus:ring",
  "min-h-11",
]) {
  assertIncludes("accessibility baseline", app + filters + itemDrawer + offerDrawer + card, required);
}

pass("Package 10 modified surfaces preserve basic semantics, labels, focus styles, drawer labels, alt text, and touch targets");
