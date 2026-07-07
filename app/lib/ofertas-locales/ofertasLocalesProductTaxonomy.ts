import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";

/**
 * Curated, shopper-facing product filter taxonomy for Ofertas Locales flyer
 * products. Raw AI/OCR categories (often English, data-like, inconsistent) are
 * normalized into this small localized set so filter chips read cleanly in both
 * ES and EN. This does NOT change stored data — it is a display + grouping layer
 * used only by the product filter UI.
 */

export type OfertaProductTaxonomyKey =
  | "produce"
  | "bakery"
  | "breakfast"
  | "beverages"
  | "dairy"
  | "meat"
  | "pantry"
  | "condiments"
  | "snacks"
  | "frozen"
  | "deli"
  | "household"
  | "personal_care"
  | "baby"
  | "pets"
  | "other";

export type OfertaProductTaxonomyGroup = {
  key: OfertaProductTaxonomyKey;
  emoji: string;
  es: string;
  en: string;
  /** Lowercased substrings matched against the raw category/subcategory. */
  keywords: string[];
};

/**
 * Ordered display taxonomy. "other" is the guaranteed fallback bucket and has no
 * keywords (nothing matches it directly). Order here defines chip order.
 */
export const OFERTA_PRODUCT_TAXONOMY: readonly OfertaProductTaxonomyGroup[] = [
  {
    key: "produce",
    emoji: "🍎",
    es: "Frutas y verduras",
    en: "Produce",
    keywords: ["produce", "fruit", "fruits", "vegetable", "vegetables", "fruta", "frutas", "verdura", "verduras"],
  },
  {
    key: "bakery",
    emoji: "🥖",
    es: "Panadería",
    en: "Bakery",
    keywords: ["bakery", "bread", "pastry", "pan dulce", "panaderia", "panadería", "pan"],
  },
  {
    key: "breakfast",
    emoji: "🥣",
    es: "Desayuno y cereal",
    en: "Breakfast & Cereal",
    keywords: ["breakfast", "cereal", "cereals", "oatmeal", "desayuno", "cereales"],
  },
  {
    key: "beverages",
    emoji: "🥤",
    es: "Bebidas",
    en: "Beverages",
    keywords: ["beverage", "beverages", "drink", "drinks", "soda", "juice", "water", "coffee", "tea", "bebida", "bebidas", "jugo", "agua", "cafe", "café"],
  },
  {
    key: "dairy",
    emoji: "🧀",
    es: "Lácteos y huevos",
    en: "Dairy & Eggs",
    keywords: ["dairy", "cheese", "egg", "eggs", "milk", "yogurt", "refrigerated", "lacteo", "lacteos", "lácteos", "queso", "huevo", "huevos", "leche"],
  },
  {
    key: "meat",
    emoji: "🍖",
    es: "Carnes y mariscos",
    en: "Meat & Seafood",
    keywords: ["meat", "seafood", "poultry", "chicken", "beef", "pork", "fish", "carne", "carnes", "mariscos", "pollo", "res", "cerdo", "pescado"],
  },
  {
    key: "pantry",
    emoji: "🛒",
    es: "Despensa",
    en: "Pantry",
    keywords: ["pantry", "canned", "baking", "grocery", "pasta", "rice", "dry goods", "despensa", "enlatado", "enlatados", "abarrotes", "arroz"],
  },
  {
    key: "condiments",
    emoji: "🧂",
    es: "Condimentos y salsas",
    en: "Condiments & Sauces",
    keywords: ["condiment", "condiments", "sauce", "sauces", "spice", "spices", "seasoning", "condimento", "condimentos", "salsa", "salsas", "especia", "especias"],
  },
  {
    key: "snacks",
    emoji: "🍪",
    es: "Snacks y dulces",
    en: "Snacks & Candy",
    keywords: ["snack", "snacks", "candy", "chips", "cookies", "sweets", "chocolate", "dulce", "dulces", "botana", "botanas", "galletas"],
  },
  {
    key: "frozen",
    emoji: "🧊",
    es: "Congelados",
    en: "Frozen",
    keywords: ["frozen", "ice cream", "congelado", "congelados", "helado", "helados"],
  },
  {
    key: "deli",
    emoji: "🍽️",
    es: "Deli / preparados",
    en: "Deli / Prepared",
    keywords: ["deli", "prepared", "delicatessen", "preparado", "preparados"],
  },
  {
    key: "household",
    emoji: "🧻",
    es: "Hogar y limpieza",
    en: "Household",
    keywords: ["household", "paper", "cleaning", "home", "detergent", "hogar", "limpieza", "papel", "detergente"],
  },
  {
    key: "personal_care",
    emoji: "🧴",
    es: "Cuidado personal",
    en: "Personal Care",
    keywords: ["personal care", "health", "beauty", "cosmetics", "pharmacy", "cuidado personal", "salud", "belleza", "farmacia"],
  },
  {
    key: "baby",
    emoji: "👶",
    es: "Bebé",
    en: "Baby",
    keywords: ["baby", "infant", "diaper", "diapers", "bebe", "bebé", "pañal", "pañales"],
  },
  {
    key: "pets",
    emoji: "🐾",
    es: "Mascotas",
    en: "Pets",
    keywords: ["pet", "pets", "pet supplies", "dog", "cat", "mascota", "mascotas", "perro", "gato"],
  },
  {
    key: "other",
    emoji: "📦",
    es: "Otros",
    en: "Other",
    keywords: [],
  },
] as const;

const GROUP_BY_KEY: Record<OfertaProductTaxonomyKey, OfertaProductTaxonomyGroup> =
  OFERTA_PRODUCT_TAXONOMY.reduce(
    (acc, group) => {
      acc[group.key] = group;
      return acc;
    },
    {} as Record<OfertaProductTaxonomyKey, OfertaProductTaxonomyGroup>
  );

/**
 * Map a raw category (and optional subcategory) into a display taxonomy key.
 * First keyword match wins in taxonomy order; anything unmatched or empty falls
 * back to "other".
 */
export function normalizeOfertaProductCategory(
  rawCategory: string | null | undefined,
  subcategory?: string | null
): OfertaProductTaxonomyKey {
  const haystack = `${rawCategory ?? ""} ${subcategory ?? ""}`.trim().toLowerCase();
  if (!haystack) return "other";

  for (const group of OFERTA_PRODUCT_TAXONOMY) {
    if (group.keywords.length === 0) continue;
    if (group.keywords.some((kw) => haystack.includes(kw))) return group.key;
  }
  return "other";
}

/** Localized emoji + label for a taxonomy key, e.g. "🍎 Frutas y verduras". */
export function getOfertaProductFilterLabel(
  key: OfertaProductTaxonomyKey,
  lang: OfertasLocalesAppLang
): string {
  const group = GROUP_BY_KEY[key];
  if (!group) return key;
  return `${group.emoji} ${lang === "en" ? group.en : group.es}`;
}

/** Ordered list of taxonomy keys present in the given raw categories. */
export function collectOfertaProductFilterKeys(
  rawCategories: Array<{ category?: string | null; subcategory?: string | null }>
): OfertaProductTaxonomyKey[] {
  const present = new Set<OfertaProductTaxonomyKey>();
  for (const entry of rawCategories) {
    present.add(normalizeOfertaProductCategory(entry.category, entry.subcategory));
  }
  return OFERTA_PRODUCT_TAXONOMY.filter((g) => present.has(g.key)).map((g) => g.key);
}
