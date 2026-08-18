import { assertIncludes, pass, readRepoFile } from "./ofertas-package-10-audit-helpers.mjs";

const appCopy = readRepoFile("app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");
const publicCopy = readRepoFile("app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts");
const previewCopy = readRepoFile("app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts");

for (const required of [
  "Ofertas Locales",
  "Volante interactivo",
  "Interactive Flyer",
  "Cupones",
  "Coupons",
  "IA incluida",
  "AI included",
  "30 días",
  "30 days",
  "Lista de compras",
  "Shopping list",
  "Ver volante",
  "View flyer",
  "Ver producto",
  "View product",
  "Ver cupón",
  "View coupon",
  "Negocio",
  "Business",
  "Dirección",
  "Address",
  "Llamar",
  "Call",
  "WhatsApp",
  "Sitio web",
  "Website",
  "Cómo llegar",
  "Directions",
  "Vista previa",
  "Preview",
  "Pendiente de revisión",
  "Pending review",
  "Requiere corrección",
  "Requires correction",
  "Publicado",
  "Published",
  "Vencido",
  "Expired",
]) {
  assertIncludes("ES/EN Package 10 copy", appCopy + publicCopy + previewCopy, required);
}

pass("Package 10 modified customer copy preserves Spanish and English launch parity");
