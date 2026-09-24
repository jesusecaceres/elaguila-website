/**
 * Leonix bilingual discovery — Comida Local adapter, WAVE 4 (2026-09-24).
 *
 * Canonical basis: `food_type` (`COMIDA_LOCAL_FOOD_TYPE_OPTIONS` — language-neutral ids such as
 * "tacos", "mariscos", "postres"); ES + EN labels come from that live catalog. Dish / venue words
 * (birria, pupusas, seafood, bakery, coffee, catering, ...) are approved aliases of the existing ids.
 * `food_type_custom` and `que_vendes` are owner text in its original language. No translation call.
 */
import { COMIDA_LOCAL_FOOD_TYPE_OPTIONS } from "@/app/lib/clasificados/comida-local/comidaLocalConstants";
import type { ComidaLocalPublicListingRow } from "@/app/lib/clasificados/comida-local/comidaLocalPublicTypes";
import {
  createCatalogDiscoveryAdapter,
  filterRowsByCatalogDiscoveryKeyword,
  type CatalogConcept,
} from "../catalogDiscovery";

export const COMIDA_LOCAL_CONCEPT_KIND = { foodType: "foodType" } as const;

const FOOD_TYPE_ALIASES: Record<string, readonly string[]> = {
  tacos: ["taco", "taqueria", "birria", "carne asada", "quesabirria", "tacos de birria"],
  pupusas: ["pupusa", "pupuseria", "comida salvadoreña", "salvadoran food"],
  tamales: ["tamal", "tamalero"],
  antojitos: ["snacks", "street food", "comida callejera", "antojito", "elotes", "esquites"],
  postres: ["dessert", "desserts", "sweets", "pastel", "pasteles", "cake", "cakes", "pan dulce", "bakery", "panaderia", "reposteria", "pastry", "helados", "ice cream"],
  bebidas: ["drinks", "beverages", "aguas frescas", "coffee", "cafe", "café", "jugos", "juices", "licuados", "smoothies"],
  mariscos: ["seafood", "shrimp", "camarones", "ceviche", "pescado", "fish", "coctel de camaron"],
  "comida-casera": ["home cooking", "homemade", "home style", "home-style", "comida casera", "comida hecha en casa", "home cooked"],
  "comida-eventos": ["catering", "event catering", "eventos", "events", "banquete", "party food", "comida para fiestas"],
};

export const COMIDA_LOCAL_CONCEPT_CATALOG: readonly CatalogConcept[] = COMIDA_LOCAL_FOOD_TYPE_OPTIONS.filter(
  (o) => o.value !== "otro",
).map(
  (o): CatalogConcept => ({
    kind: COMIDA_LOCAL_CONCEPT_KIND.foodType,
    id: o.value,
    es: o.labelEs,
    en: o.labelEn,
    aliases: FOOD_TYPE_ALIASES[o.value] ?? [],
  }),
);

export const comidaLocalDiscoveryAdapter = createCatalogDiscoveryAdapter<ComidaLocalPublicListingRow>({
  category: "comida-local",
  catalog: COMIDA_LOCAL_CONCEPT_CATALOG,
  rowConcepts(row) {
    const id = (row.food_type ?? "").trim();
    return id && id !== "otro" ? [{ kind: COMIDA_LOCAL_CONCEPT_KIND.foodType, id }] : [];
  },
  rowLiterals: (row) => [
    row.business_name,
    row.food_type,
    row.food_type_custom,
    row.city_display,
    row.city_canonical,
    row.zone_note,
  ],
  rowCustomText: (row) => [row.que_vendes],
});

/** Keyword (`q`) filter only — city / foodType / service / priceLevel facets stay in `filterComidaLocalPublicRows`. */
export function filterComidaLocalRowsByKeyword(
  rows: ComidaLocalPublicListingRow[],
  rawQ: string,
): ComidaLocalPublicListingRow[] {
  return filterRowsByCatalogDiscoveryKeyword(comidaLocalDiscoveryAdapter, rows, rawQ);
}
