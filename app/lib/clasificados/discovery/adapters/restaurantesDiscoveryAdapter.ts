/**
 * Leonix bilingual discovery — Restaurantes adapter, WAVE 4 (2026-09-24).
 *
 * Canonical basis (keys Restaurantes ALREADY persists):
 *   cuisine      primaryCuisineKey / secondaryCuisineKey / additionalCuisineKeys (`RESTAURANTE_CUISINES`,
 *                English snake_case keys; ES + EN labels come from the live taxonomy, not a copy)
 *   serviceMode  serviceModes / serviceModeKeys (+ the foodTruck operating flag)
 * Dish / venue words (tacos, pupusas, birria, panadería, coffee, fast food, …) are approved ALIASES of the
 * existing cuisine keys — no new ids are stored. Literals and owner text are the fields the old matchers
 * searched, in their original language. No translation call, no server-only, no fetch.
 */
import {
  RESTAURANTE_CUISINES,
  RESTAURANTE_SERVICE_MODES,
  labelForCuisine,
  labelForServiceMode,
} from "@/app/clasificados/restaurantes/application/restauranteTaxonomy";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import type { RestaurantePublicResultsRow } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingMapper";
import {
  compileCatalogDiscoveryQuery,
  createCatalogDiscoveryAdapter,
  filterRowsByCatalogDiscoveryKeyword,
  type CatalogConcept,
} from "../catalogDiscovery";
import type { CanonicalConceptRef } from "../canonicalTaxonomyAdapter";

export const RESTAURANTES_CONCEPT_KIND = { cuisine: "cuisine", serviceMode: "serviceMode" } as const;

const CUISINE_ALIASES: Record<string, readonly string[]> = {
  mexican: ["tacos", "taco", "taqueria", "taquerias", "birria", "tamales", "pozole", "antojitos", "carne asada", "quesadillas", "burritos", "mexican food", "comida mexicana"],
  salvadoran: ["pupusas", "pupusa", "pupuseria", "comida salvadoreña", "salvadorean"],
  honduran: ["baleadas", "comida hondureña"],
  seafood: ["mariscos", "marisqueria", "shrimp", "camarones", "ceviche", "fish", "pescado"],
  pizza: ["pizzeria", "pizzas"],
  dessert: ["panaderia", "panadería", "bakery", "pan dulce", "pasteleria", "pastry", "postres", "reposteria", "sweets", "ice cream", "helados"],
  cafe_food: ["cafeteria", "cafetería", "coffee", "cafe", "café", "coffee shop"],
  burgers: ["hamburguesas", "hamburgers", "burger", "fast food", "comida rapida", "comida rápida"],
  hot_dogs: ["hot dog", "hotdogs", "snacks", "fast food", "comida rapida", "comida rápida"],
  bbq: ["barbecue", "parrilla", "grill", "asado", "barbacoa"],
  breakfast_brunch: ["breakfast", "desayuno", "brunch"],
  latin_mixed: ["latin", "latino", "latina", "comida latina"],
  japanese: ["japones", "japonesa", "ramen"],
  chinese: ["chino", "comida china"],
  italian: ["italiano", "comida italiana"],
  vegan: ["vegano", "plant based", "plant-based"],
  vegetarian: ["vegetariano"],
  tex_mex: ["texmex", "tex mex"],
  american: ["americano", "comida americana"],
};

const SERVICE_ALIASES: Record<string, readonly string[]> = {
  food_truck: ["food truck", "foodtruck", "taco truck", "camion de comida", "troca de comida", "loncheria"],
  catering: ["catering", "banquetes", "banquete", "eventos", "event catering"],
  delivery: ["delivery", "a domicilio", "domicilio", "entrega"],
  takeout: ["takeout", "take out", "to go", "para llevar"],
  dine_in: ["dine in", "dine-in", "comer aqui", "comer en el local"],
  meal_prep: ["meal prep", "comidas preparadas"],
  personal_chef: ["personal chef", "chef personal", "chef a domicilio"],
  pop_up: ["pop up", "popup", "pop-up"],
};

export const RESTAURANTES_CONCEPT_CATALOG: readonly CatalogConcept[] = [
  ...RESTAURANTE_CUISINES.filter((c) => c.key !== "other").map(
    (c): CatalogConcept => ({
      kind: RESTAURANTES_CONCEPT_KIND.cuisine,
      id: c.key,
      es: labelForCuisine(c.key, "es"),
      en: labelForCuisine(c.key, "en"),
      aliases: CUISINE_ALIASES[c.key] ?? [],
    }),
  ),
  ...RESTAURANTE_SERVICE_MODES.filter((m) => m.key !== "other").map(
    (m): CatalogConcept => ({
      kind: RESTAURANTES_CONCEPT_KIND.serviceMode,
      id: m.key,
      es: labelForServiceMode(m.key, "es"),
      en: labelForServiceMode(m.key, "en"),
      aliases: SERVICE_ALIASES[m.key] ?? [],
      expandTerms: false,
    }),
  ),
];

const CUISINE_IDS = new Set(RESTAURANTE_CUISINES.map((c) => c.key as string));
const SERVICE_IDS = new Set(RESTAURANTE_SERVICE_MODES.map((m) => m.key as string));

function restaurantConcepts(input: {
  cuisineKeys: readonly (string | null | undefined)[];
  serviceModes: readonly string[];
  foodTruck?: boolean;
}): CanonicalConceptRef[] {
  const out: CanonicalConceptRef[] = [];
  const seen = new Set<string>();
  const add = (kind: string, id: string) => {
    const k = `${kind}:${id}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ kind, id });
  };
  for (const key of input.cuisineKeys) {
    const id = (key ?? "").trim();
    if (id && CUISINE_IDS.has(id) && id !== "other") add(RESTAURANTES_CONCEPT_KIND.cuisine, id);
  }
  for (const mode of input.serviceModes) {
    if (SERVICE_IDS.has(mode) && mode !== "other") add(RESTAURANTES_CONCEPT_KIND.serviceMode, mode);
  }
  if (input.foodTruck) add(RESTAURANTES_CONCEPT_KIND.serviceMode, "food_truck");
  return out;
}

/** Discovery blueprint rows (`filterRestaurantesBlueprintRows`). */
export const restaurantesBlueprintDiscoveryAdapter = createCatalogDiscoveryAdapter<RestaurantesPublicBlueprintRow>({
  category: "restaurantes",
  catalog: RESTAURANTES_CONCEPT_CATALOG,
  rowConcepts: (row) =>
    restaurantConcepts({
      cuisineKeys: [row.primaryCuisineKey, row.secondaryCuisineKey, ...(row.additionalCuisineKeys ?? [])],
      serviceModes: row.serviceModes ?? [],
      foodTruck: row.foodTruck === true,
    }),
  rowLiterals: (row) => [
    row.name,
    row.slug,
    row.leonixAdId,
    row.cuisineLine,
    row.primaryCuisineKey,
    row.secondaryCuisineKey,
    ...(row.additionalCuisineKeys ?? []),
    row.city,
    row.zip,
    row.neighborhood,
    row.serviceAreaText,
  ],
  rowCustomText: (row) => [row.description],
});

/** Client results rows (`RestauranteResultsClient`). */
export const restaurantesResultsDiscoveryAdapter = createCatalogDiscoveryAdapter<RestaurantePublicResultsRow>({
  category: "restaurantes",
  catalog: RESTAURANTES_CONCEPT_CATALOG,
  rowConcepts: (row) =>
    restaurantConcepts({
      cuisineKeys: [row.primaryCuisineKey, row.secondaryCuisineKey],
      serviceModes: row.serviceModeKeys ?? [],
      foodTruck: row.foodTruck === true,
    }),
  rowLiterals: (row) => [row.businessName, row.cityCanonical, row.neighborhood],
  rowCustomText: (row) => [row.summaryShort],
});

/** Compile the keyword once per filter call; returns a per-row predicate. */
export function restaurantesBlueprintKeywordMatcher(rawQ: string): (row: RestaurantesPublicBlueprintRow) => boolean {
  const q = compileCatalogDiscoveryQuery(restaurantesBlueprintDiscoveryAdapter, rawQ);
  if (q.empty) return () => true;
  return (row) => q.matches(restaurantesBlueprintDiscoveryAdapter.documentFor(row));
}

export function filterRestaurantesResultsRowsByKeyword(
  rows: RestaurantePublicResultsRow[],
  rawQ: string,
): RestaurantePublicResultsRow[] {
  return filterRowsByCatalogDiscoveryKeyword(restaurantesResultsDiscoveryAdapter, rows, rawQ);
}
