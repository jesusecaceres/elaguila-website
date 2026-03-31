/**
 * Leonix Business Card Template Library V1 — metadata + registry.
 * Layout geometry lives in `businessCardTemplateLayouts.ts`.
 */

export type BusinessCardTemplateFamily = "universal" | "industry" | "signature" | "bilingual";

export type BusinessCardTemplateId =
  | "minimal-black-onyx"
  | "gold-accent-executive"
  | "clean-white-premium"
  | "bold-modern-slab"
  | "monochrome-power"
  | "luxe-editorial"
  | "real-estate-horizon"
  | "auto-dealer-stripe"
  | "dental-clinical-clean"
  | "lawyer-column-trust"
  | "contractor-bold-phone"
  | "restaurant-warm-plate"
  | "leonix-crest-mark"
  | "leonix-gold-diagonal"
  | "leonix-grind-bar"
  | "bilingual-two-column"
  | "bilingual-dual-line";

export const BUSINESS_CARD_TEMPLATE_IDS: BusinessCardTemplateId[] = [
  "minimal-black-onyx",
  "gold-accent-executive",
  "clean-white-premium",
  "bold-modern-slab",
  "monochrome-power",
  "luxe-editorial",
  "real-estate-horizon",
  "auto-dealer-stripe",
  "dental-clinical-clean",
  "lawyer-column-trust",
  "contractor-bold-phone",
  "restaurant-warm-plate",
  "leonix-crest-mark",
  "leonix-gold-diagonal",
  "leonix-grind-bar",
  "bilingual-two-column",
  "bilingual-dual-line",
];

/** Default when opening the template-recommended builder path. */
export const DEFAULT_BUSINESS_CARD_TEMPLATE_ID: BusinessCardTemplateId = "clean-white-premium";

export type BusinessCardTemplateMeta = {
  id: BusinessCardTemplateId;
  slug: string;
  family: BusinessCardTemplateFamily;
  title: { es: string; en: string };
  subtitle: { es: string; en: string };
  styleFamily: string;
  primaryColor: string;
  accentColor: string;
  featured: boolean;
  /** Hint for product page / picker — product slug still controls actual print sides. */
  recommendedSidedness: "one-sided" | "two-sided" | "both";
  /** When true, back layout emphasizes address / map-style lines. */
  mapBlockOnBack: boolean;
  industryTags?: string[];
};

export const BUSINESS_CARD_TEMPLATE_LIBRARY: Record<BusinessCardTemplateId, BusinessCardTemplateMeta> = {
  "minimal-black-onyx": {
    id: "minimal-black-onyx",
    slug: "minimal-black-onyx",
    family: "universal",
    title: { es: "Minimal negro", en: "Minimal black" },
    subtitle: { es: "Alto contraste, tipografía nítida.", en: "High contrast, crisp type." },
    styleFamily: "universal-premium",
    primaryColor: "#0a0a0c",
    accentColor: "#c9a84a",
    featured: true,
    recommendedSidedness: "both",
    mapBlockOnBack: false,
  },
  "gold-accent-executive": {
    id: "gold-accent-executive",
    slug: "gold-accent-executive",
    family: "universal",
    title: { es: "Ejecutivo dorado", en: "Gold accent executive" },
    subtitle: { es: "Crema, acento oro, tono boardroom.", en: "Cream, gold accent, boardroom tone." },
    styleFamily: "universal-premium",
    primaryColor: "#f4efe6",
    accentColor: "#b8923a",
    featured: true,
    recommendedSidedness: "both",
    mapBlockOnBack: false,
  },
  "clean-white-premium": {
    id: "clean-white-premium",
    slug: "clean-white-premium",
    family: "universal",
    title: { es: "Blanco premium", en: "Clean white premium" },
    subtitle: { es: "Equilibrado y legible — punto de partida seguro.", en: "Balanced and readable — safe default." },
    styleFamily: "universal-premium",
    primaryColor: "#fffdf7",
    accentColor: "#1a1a1d",
    featured: true,
    recommendedSidedness: "both",
    mapBlockOnBack: false,
  },
  "bold-modern-slab": {
    id: "bold-modern-slab",
    slug: "bold-modern-slab",
    family: "universal",
    title: { es: "Moderno audaz", en: "Bold modern" },
    subtitle: { es: "Marca grande, contacto compacto.", en: "Big brand name, tight contact." },
    styleFamily: "universal-premium",
    primaryColor: "#1a1a1f",
    accentColor: "#f5f0e6",
    featured: false,
    recommendedSidedness: "one-sided",
    mapBlockOnBack: false,
  },
  "monochrome-power": {
    id: "monochrome-power",
    slug: "monochrome-power",
    family: "universal",
    title: { es: "Monocromo", en: "Monochrome power" },
    subtitle: { es: "Solo negro, gris y blanco — editorial.", en: "Black, white, gray only — editorial." },
    styleFamily: "universal-premium",
    primaryColor: "#eceae7",
    accentColor: "#111113",
    featured: false,
    recommendedSidedness: "both",
    mapBlockOnBack: false,
  },
  "luxe-editorial": {
    id: "luxe-editorial",
    slug: "luxe-editorial",
    family: "universal",
    title: { es: "Editorial de lujo", en: "Luxe editorial" },
    subtitle: { es: "Jerarquía tipo revista, mucho aire.", en: "Magazine hierarchy, generous space." },
    styleFamily: "universal-premium",
    primaryColor: "#faf7f2",
    accentColor: "#2c261c",
    featured: true,
    recommendedSidedness: "two-sided",
    mapBlockOnBack: true,
  },
  "real-estate-horizon": {
    id: "real-estate-horizon",
    slug: "real-estate-horizon",
    family: "industry",
    title: { es: "Horizonte inmobiliario", en: "Real estate horizon" },
    subtitle: { es: "Barra superior, confianza y contacto.", en: "Top bar, trust and contact." },
    styleFamily: "industry-flex",
    primaryColor: "#e8eef2",
    accentColor: "#1e3a4a",
    featured: false,
    recommendedSidedness: "both",
    mapBlockOnBack: true,
    industryTags: ["real estate"],
  },
  "auto-dealer-stripe": {
    id: "auto-dealer-stripe",
    slug: "auto-dealer-stripe",
    family: "industry",
    title: { es: "Dealer con franja", en: "Auto dealer stripe" },
    subtitle: { es: "Energía, marca fuerte, teléfono visible.", en: "Energy, strong mark, phone-forward." },
    styleFamily: "industry-flex",
    primaryColor: "#f2f2f4",
    accentColor: "#b01020",
    featured: false,
    recommendedSidedness: "one-sided",
    mapBlockOnBack: false,
    industryTags: ["automotive"],
  },
  "dental-clinical-clean": {
    id: "dental-clinical-clean",
    slug: "dental-clinical-clean",
    family: "industry",
    title: { es: "Clínico limpio", en: "Dental / clinical clean" },
    subtitle: { es: "Blanco, acento teal, sensación higiénica.", en: "White, teal accent, clinical calm." },
    styleFamily: "industry-flex",
    primaryColor: "#ffffff",
    accentColor: "#0d9488",
    featured: false,
    recommendedSidedness: "both",
    mapBlockOnBack: true,
    industryTags: ["dental", "medical"],
  },
  "lawyer-column-trust": {
    id: "lawyer-column-trust",
    slug: "lawyer-column-trust",
    family: "industry",
    title: { es: "Columna legal", en: "Lawyer column trust" },
    subtitle: { es: "Navy y oro — sobrio y estable.", en: "Navy and gold — sober and stable." },
    styleFamily: "industry-flex",
    primaryColor: "#142032",
    accentColor: "#d4b46a",
    featured: false,
    recommendedSidedness: "both",
    mapBlockOnBack: false,
    industryTags: ["legal", "professional"],
  },
  "contractor-bold-phone": {
    id: "contractor-bold-phone",
    slug: "contractor-bold-phone",
    family: "industry",
    title: { es: "Contratista directo", en: "Contractor bold phone" },
    subtitle: { es: "Amarillo y negro — llamada primero.", en: "Yellow and black — call-first." },
    styleFamily: "industry-flex",
    primaryColor: "#111111",
    accentColor: "#f5c400",
    featured: false,
    recommendedSidedness: "one-sided",
    mapBlockOnBack: false,
    industryTags: ["contractor", "home services"],
  },
  "restaurant-warm-plate": {
    id: "restaurant-warm-plate",
    slug: "restaurant-warm-plate",
    family: "industry",
    title: { es: "Plato cálido", en: "Restaurant warm plate" },
    subtitle: { es: "Cálido, culinario, invitante.", en: "Warm, culinary, inviting." },
    styleFamily: "industry-flex",
    primaryColor: "#2a1810",
    accentColor: "#e8dcc8",
    featured: false,
    recommendedSidedness: "both",
    mapBlockOnBack: true,
    industryTags: ["restaurant", "food"],
  },
  "leonix-crest-mark": {
    id: "leonix-crest-mark",
    slug: "leonix-crest-mark",
    family: "signature",
    title: { es: "Leonix · escudo", en: "Leonix crest mark" },
    subtitle: { es: "Logo hero, halo dorado — sello Leonix.", en: "Logo hero, gold halo — Leonix stamp." },
    styleFamily: "leonix-signature",
    primaryColor: "#0c0c0e",
    accentColor: "#d4af37",
    featured: true,
    recommendedSidedness: "both",
    mapBlockOnBack: false,
  },
  "leonix-gold-diagonal": {
    id: "leonix-gold-diagonal",
    slug: "leonix-gold-diagonal",
    family: "signature",
    title: { es: "Leonix · diagonal", en: "Leonix gold diagonal" },
    subtitle: { es: "Perla + energía diagonal dorada.", en: "Pearl field + diagonal gold energy." },
    styleFamily: "leonix-signature",
    primaryColor: "#f7f2ea",
    accentColor: "#b8860b",
    featured: true,
    recommendedSidedness: "both",
    mapBlockOnBack: false,
  },
  "leonix-grind-bar": {
    id: "leonix-grind-bar",
    slug: "leonix-grind-bar",
    family: "signature",
    title: { es: "Leonix · grind", en: "Leonix grind bar" },
    subtitle: { es: "Barra inferior, actitud — hecho en Leonix.", en: "Bottom bar, attitude — built at Leonix." },
    styleFamily: "leonix-signature",
    primaryColor: "#121214",
    accentColor: "#c9a84a",
    featured: true,
    recommendedSidedness: "one-sided",
    mapBlockOnBack: false,
  },
  "bilingual-two-column": {
    id: "bilingual-two-column",
    slug: "bilingual-two-column",
    family: "bilingual",
    title: { es: "Bilingüe · dos columnas", en: "Bilingual two-column" },
    subtitle: { es: "Nombre + rol EN / ES en paralelo.", en: "Name + role EN / ES side by side." },
    styleFamily: "bilingual",
    primaryColor: "#fffdf9",
    accentColor: "#1c1914",
    featured: false,
    recommendedSidedness: "both",
    mapBlockOnBack: false,
  },
  "bilingual-dual-line": {
    id: "bilingual-dual-line",
    slug: "bilingual-dual-line",
    family: "bilingual",
    title: { es: "Bilingüe · doble línea", en: "Bilingual dual line" },
    subtitle: { es: "Tagline secundario para ES/EN.", en: "Secondary tagline line for ES/EN." },
    styleFamily: "bilingual",
    primaryColor: "#f8f6f1",
    accentColor: "#3d3428",
    featured: false,
    recommendedSidedness: "both",
    mapBlockOnBack: false,
  },
};

export function isBusinessCardTemplateId(x: string): x is BusinessCardTemplateId {
  return (BUSINESS_CARD_TEMPLATE_IDS as string[]).includes(x);
}

export function getBusinessCardTemplateMeta(id: BusinessCardTemplateId): BusinessCardTemplateMeta {
  return BUSINESS_CARD_TEMPLATE_LIBRARY[id];
}

export const TEMPLATE_FAMILY_ORDER: BusinessCardTemplateFamily[] = ["universal", "industry", "signature", "bilingual"];

export function templateFamilyLabel(f: BusinessCardTemplateFamily, lang: "es" | "en"): string {
  const m: Record<BusinessCardTemplateFamily, { es: string; en: string }> = {
    universal: { es: "Premium universal", en: "Universal premium" },
    industry: { es: "Por oficio (flexible)", en: "Industry-flexible" },
    signature: { es: "Leonix signature", en: "Leonix signature" },
    bilingual: { es: "Bilingüe", en: "Bilingual-friendly" },
  };
  return lang === "en" ? m[f].en : m[f].es;
}
