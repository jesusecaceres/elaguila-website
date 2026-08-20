import { assertIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const app = readRepoFile("app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx");
const filters = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx");
const search = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx");
const itemDrawer = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx");
const offerDrawer = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx");
const list = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesShoppingListPanel.tsx");
const detail = readRepoFile("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx");

for (const required of [
  "sm:grid-cols-2",
  "min-h-11",
  "max-h-[92vh]",
  "rounded-t-2xl",
  "bottom-[max(1rem,env(safe-area-inset-bottom))]",
  "overflow-y-auto",
  "grid-cols-1",
  "lg:grid-cols-3",
  "max-w-[400px]",
]) {
  assertIncludes("mobile/tablet classes", app + filters + search + itemDrawer + offerDrawer + list + detail, required);
}

pass("Package 10 mobile/tablet parity has stacked cards, thumb targets, safe drawers, filters, and shopping list spacing");
