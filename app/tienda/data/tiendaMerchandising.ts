/**
 * Display-only merchandising helpers — do not change routes or registry truth.
 * Used for chips, layout tiers, and promo family “lane” styling.
 */

import type { Lang } from "../types/tienda";
import type { TiendaCategorySlug } from "./tiendaCategories";

export type MerchTier = "flagship" | "core" | "support";

/** Homepage / storefront visual grouping (order + section labels). */
export type StorefrontGroup = {
  id: string;
  title: { en: string; es: string };
  description?: { en: string; es: string };
  slugs: TiendaCategorySlug[];
};

export const tiendaStorefrontGroups: StorefrontGroup[] = [
  {
    id: "flagship",
    title: { en: "Flagship showroom", es: "Vitrina principal" },
    description: {
      en: "Tarjetas and promo — the two lanes most teams start from.",
      es: "Tarjetas y promo — las dos rutas por donde más equipos empiezan.",
    },
    slugs: ["business-cards", "promo-products"],
  },
  {
    id: "campaign",
    title: { en: "Campaign & editorial print", es: "Impresión de campaña y editorial" },
    description: {
      en: "Flyers, brochures, and marketing mailers — coordinated like a single campaign system.",
      es: "Volantes, brochures y mailers — coordinados como un sistema de campaña.",
    },
    slugs: ["flyers", "brochures", "marketing-materials"],
  },
  {
    id: "signage",
    title: { en: "Large format & signage", es: "Gran formato y señalización" },
    description: {
      en: "High-visibility pieces for events, retail, and outdoor presence.",
      es: "Piezas de alto impacto para eventos, punto de venta y exterior.",
    },
    slugs: ["banners", "signs"],
  },
  {
    id: "labels",
    title: { en: "Labels & brand accents", es: "Etiquetas y detalles de marca" },
    description: {
      en: "Stickers and adhesive labels — great add-ons; pair with your core print order.",
      es: "Stickers y etiquetas — complementos ideales; combínalos con tu pedido principal.",
    },
    slugs: ["stickers-labels"],
  },
];

const CATEGORY_CHIPS: Record<TiendaCategorySlug, { en: string[]; es: string[] }> = {
  "business-cards": {
    en: ["Online builder", "Premium stocks", "Upload path"],
    es: ["Constructor en línea", "Papeles premium", "Ruta con subida"],
  },
  "flyers": {
    en: ["Single sheets", "Campaign-ready", "PDF upload"],
    es: ["Hojas sueltas", "Listo para campaña", "Subida PDF"],
  },
  brochures: {
    en: ["Folded formats", "Editorial feel", "Proof before print"],
    es: ["Formatos plegados", "Tono editorial", "Prueba antes de imprimir"],
  },
  banners: {
    en: ["Retractables", "Event impact", "Sized to hardware"],
    es: ["Retráctiles", "Impacto en evento", "A la medida del soporte"],
  },
  signs: {
    en: ["Yard signs", "Outdoor legibility", "High-res art"],
    es: ["Yard signs", "Lectura exterior", "Arte en alta resolución"],
  },
  "stickers-labels": {
    en: ["Die-cut ready", "Brand packs", "Hi-res raster"],
    es: ["Listo para troquel", "Kits de marca", "Raster en alta resolución"],
  },
  "promo-products": {
    en: ["Vendor-backed", "Quote-first", "Mockups before production"],
    es: ["Con proveedor", "Cotización primero", "Mockups antes de producir"],
  },
  "marketing-materials": {
    en: ["Postcards & mailers", "Campaign kits", "Leonix coordination"],
    es: ["Postales y mailers", "Kits de campaña", "Coordinación Leonix"],
  },
};

export function categoryMerchChips(lang: Lang, slug: TiendaCategorySlug): string[] {
  const row = CATEGORY_CHIPS[slug];
  return lang === "en" ? row.en : row.es;
}

export function merchTierForCategorySlug(slug: TiendaCategorySlug): MerchTier {
  if (slug === "business-cards" || slug === "promo-products") return "flagship";
  if (slug === "stickers-labels") return "support";
  return "core";
}

/** Category hero — short bullet hints (display only). */
const CATEGORY_HERO_HINTS: Record<TiendaCategorySlug, { en: string[]; es: string[] }> = {
  "business-cards": {
    en: ["Design online or upload later", "Standard & two-sided families"],
    es: ["Diseña en línea o sube después", "Familias estándar y dos caras"],
  },
  flyers: {
    en: ["Single-page promotional sheets", "Crisp print for offers & events"],
    es: ["Hojas promocionales", "Impresión nítida para ofertas y eventos"],
  },
  brochures: {
    en: ["Folded editorial layouts", "Professional sales collateral"],
    es: ["Piezas plegadas editoriales", "Material de ventas profesional"],
  },
  banners: {
    en: ["Retractable & vertical displays", "Graphics sized to the stand"],
    es: ["Displays retráctiles y verticales", "Gráficos a la medida del soporte"],
  },
  signs: {
    en: ["Yard signs & panels", "Readable at a distance"],
    es: ["Yard signs y paneles", "Legibles a distancia"],
  },
  "stickers-labels": {
    en: ["Labels, stickers, packaging accents", "Vector or hi-res artwork"],
    es: ["Etiquetas, stickers, empaques", "Vector o arte en alta resolución"],
  },
  "promo-products": {
    en: ["Six promo lanes — pens to apparel", "Leonix quotes real vendor options"],
    es: ["Seis familias promo — bolígrafos a apparel", "Leonix cotiza opciones reales"],
  },
  "marketing-materials": {
    en: ["Postcards & campaign mailers", "Pairs with flyers & brochures"],
    es: ["Postales y mailers de campaña", "Complementa volantes y brochures"],
  },
};

export function categoryHeroHints(lang: Lang, slug: TiendaCategorySlug): string[] {
  const row = CATEGORY_HERO_HINTS[slug];
  return lang === "en" ? row.en : row.es;
}

export type PromoFamilyLane = {
  leftBar: string;
  chip: string;
  label: { en: string; es: string };
};

/** Visual identity per promo family — showroom “lanes” (display only). */
export function promoFamilyLane(slug: string): PromoFamilyLane | null {
  const map: Record<string, PromoFamilyLane> = {
    "promo-giveaways": {
      leftBar: "border-l-[4px] border-l-amber-400/90",
      chip: "bg-[rgba(251,191,36,0.14)] text-[rgba(254,243,199,0.95)] border-[rgba(251,191,36,0.35)]",
      label: { en: "Swag & giveaways", es: "Swag y regalos" },
    },
    "promo-pens": {
      leftBar: "border-l-[4px] border-l-sky-400/85",
      chip: "bg-[rgba(56,189,248,0.12)] text-[rgba(224,242,254,0.95)] border-[rgba(56,189,248,0.32)]",
      label: { en: "Writing & pens", es: "Escritura y bolígrafos" },
    },
    "promo-drinkware": {
      leftBar: "border-l-[4px] border-l-cyan-500/80",
      chip: "bg-[rgba(6,182,212,0.12)] text-[rgba(207,250,254,0.95)] border-[rgba(6,182,212,0.35)]",
      label: { en: "Drinkware", es: "Drinkware" },
    },
    "promo-bags": {
      leftBar: "border-l-[4px] border-l-violet-400/85",
      chip: "bg-[rgba(167,139,250,0.12)] text-[rgba(237,233,254,0.95)] border-[rgba(167,139,250,0.32)]",
      label: { en: "Bags & totes", es: "Bolsas y tote" },
    },
    "promo-desk-office": {
      leftBar: "border-l-[4px] border-l-emerald-400/80",
      chip: "bg-[rgba(52,211,153,0.11)] text-[rgba(209,250,229,0.95)] border-[rgba(52,211,153,0.32)]",
      label: { en: "Desk & office", es: "Escritorio y oficina" },
    },
    "promo-apparel-program": {
      leftBar: "border-l-[4px] border-l-rose-400/85",
      chip: "bg-[rgba(251,113,133,0.10)] text-[rgba(255,228,230,0.95)] border-[rgba(251,113,133,0.32)]",
      label: { en: "Apparel & caps", es: "Apparel y gorras" },
    },
  };
  return map[slug] ?? null;
}
