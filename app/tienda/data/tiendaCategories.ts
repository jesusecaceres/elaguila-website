import type { TiendaCategory } from "../types/tienda";

// NOTE: Hrefs are future-facing placeholders. Category routes can be added later at `app/tienda/c/[slug]/page.tsx`.
export const tiendaCategories: TiendaCategory[] = [
  {
    id: "cat-business-cards",
    slug: "business-cards",
    eyebrow: { es: "Esencial", en: "Essential" },
    title: { es: "Tarjetas de Presentación", en: "Business Cards" },
    description: {
      es: "Clásicas, premium y listas para ventas. Acabados y cortes con presencia.",
      en: "Classic and premium options built for sales. Finishes and cuts with presence.",
    },
    href: "/tienda/c/business-cards",
    featured: true,
    accent: "gold",
    familyCount: null,
  },
  {
    id: "cat-flyers",
    slug: "flyers",
    eyebrow: { es: "Promoción", en: "Promotion" },
    title: { es: "Volantes", en: "Flyers" },
    description: {
      es: "Impulsa ofertas, eventos y campañas con impresión nítida.",
      en: "Boost offers, events, and campaigns with crisp print.",
    },
    href: "/tienda/c/flyers",
    accent: "stone",
    familyCount: null,
  },
  {
    id: "cat-brochures",
    slug: "brochures",
    eyebrow: { es: "Ventas", en: "Sales" },
    title: { es: "Brochures", en: "Brochures" },
    description: {
      es: "Presenta tus servicios con un formato editorial y profesional.",
      en: "Present services with an editorial, professional format.",
    },
    href: "/tienda/c/brochures",
    accent: "cream",
    familyCount: null,
  },
  {
    id: "cat-banners",
    slug: "banners",
    eyebrow: { es: "Exterior", en: "Outdoor" },
    title: { es: "Banners", en: "Banners" },
    description: {
      es: "Impacto grande para anuncios, aperturas y promociones.",
      en: "Big impact for announcements, openings, and promos.",
    },
    href: "/tienda/c/banners",
    accent: "sky",
    familyCount: null,
  },
  {
    id: "cat-signs",
    slug: "signs",
    eyebrow: { es: "Señalización", en: "Signage" },
    title: { es: "Letreros", en: "Signs" },
    description: {
      es: "Yard signs, paneles y señalización para orientar y vender.",
      en: "Yard signs, panels, and signage to guide and sell.",
    },
    href: "/tienda/c/signs",
    accent: "sage",
    familyCount: null,
  },
  {
    id: "cat-stickers",
    slug: "stickers-labels",
    eyebrow: { es: "Branding", en: "Branding" },
    title: { es: "Stickers & Etiquetas", en: "Stickers & Labels" },
    description: {
      es: "Marca, empaques y promociones con adhesivos de calidad.",
      en: "Brand packaging and promos with quality adhesive print.",
    },
    href: "/tienda/c/stickers-labels",
    accent: "plum",
    familyCount: null,
  },
  {
    id: "cat-promo",
    slug: "promo-products",
    eyebrow: { es: "Regalos", en: "Giveaways" },
    title: { es: "Productos Promocionales", en: "Promo Products" },
    description: {
      es: "Merch para eventos y clientes. Ideal para fidelización.",
      en: "Merch for events and clients. Built for retention.",
    },
    href: "/tienda/c/promo-products",
    accent: "gold",
    familyCount: null,
  },
  {
    id: "cat-marketing",
    slug: "marketing-materials",
    eyebrow: { es: "Kit", en: "Kit" },
    title: { es: "Materiales de Marketing", en: "Marketing Materials" },
    description: {
      es: "Postcards, menús, folletos y piezas de campaña en un solo lugar.",
      en: "Postcards, menus, handouts, and campaign pieces in one place.",
    },
    href: "/tienda/c/marketing-materials",
    accent: "stone",
    familyCount: null,
  },
];

