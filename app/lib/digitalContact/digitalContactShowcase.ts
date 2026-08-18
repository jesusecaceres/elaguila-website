import type { DigitalContactShowcaseItem } from "./digitalContactTypes";

/**
 * Leonix Showcase — premium capability sections, NOT a "portfolio" grid.
 * Shared across all Digital Contact profiles today; kept as data so it stays
 * configurable per-profile later without touching page/component code.
 */
export const DIGITAL_CONTACT_SHOWCASE_ITEMS: DigitalContactShowcaseItem[] = [
  {
    id: "magazine",
    titleEs: "Revista",
    titleEn: "Magazine",
    descriptionEs: "Publicidad impresa premium que llega a la comunidad cada mes.",
    descriptionEn: "Premium print advertising that reaches the community every month.",
    href: "/magazine",
  },
  {
    id: "business-profiles",
    titleEs: "Perfiles de Negocio",
    titleEn: "Business Profiles",
    descriptionEs: "Presencia digital confiable para negocios locales.",
    descriptionEn: "Trusted digital presence for local businesses.",
    href: "/negocios-locales",
  },
  {
    id: "websites",
    titleEs: "Sitios Web",
    titleEn: "Websites",
    descriptionEs: "Plataformas digitales elegantes — como la que estás viendo ahora.",
    descriptionEn: "Elegant digital platforms — like the one you're using right now.",
    href: "/",
  },
  {
    id: "printing",
    titleEs: "Impresión",
    titleEn: "Printing",
    descriptionEs: "Volantes, folletos y materiales impresos de calidad profesional.",
    descriptionEn: "Flyers, brochures, and professional-quality printed materials.",
    href: "/tienda/c/flyers",
  },
  {
    id: "branding",
    titleEs: "Marca",
    titleEn: "Branding",
    descriptionEs: "Tarjetas de presentación y materiales de marca con acabados premium.",
    descriptionEn: "Business cards and brand materials with premium finishes.",
    href: "/tienda/c/business-cards",
  },
  {
    id: "advertising",
    titleEs: "Publicidad",
    titleEn: "Advertising",
    descriptionEs: "Productos promocionales que mantienen tu marca en primer plano.",
    descriptionEn: "Promotional products that keep your brand top of mind.",
    href: "/productos-promocion",
  },
  {
    id: "community",
    titleEs: "Comunidad",
    titleEn: "Community",
    descriptionEs: "Eventos, clases y recursos que conectan con la comunidad local.",
    descriptionEn: "Events, classes, and resources that connect with the local community.",
    href: "/clasificados/comunidad",
  },
];
