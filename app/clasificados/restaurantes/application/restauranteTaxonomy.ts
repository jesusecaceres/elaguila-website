import type {
  RestauranteBusinessTypeKey,
  RestauranteCuisineKey,
  RestauranteHighlightKey,
  RestauranteLocationPrivacyMode,
  RestaurantePriceLevel,
  RestauranteServiceMode,
} from "./restauranteListingApplicationModel";

export type TaxonomyOption<T extends string = string> = { key: T; labelEs: string };

export const RESTAURANTE_BUSINESS_TYPES: TaxonomyOption<RestauranteBusinessTypeKey>[] = [
  { key: "sit_down", labelEs: "Restaurante de mesa" },
  { key: "fast_casual", labelEs: "Fast casual" },
  { key: "cafe", labelEs: "Café / coffee" },
  { key: "bar", labelEs: "Bar / cantina" },
  { key: "bakery", labelEs: "Panadería / repostería" },
  { key: "food_truck", labelEs: "Food truck" },
  { key: "ghost_kitchen", labelEs: "Cocina oculta / delivery" },
  { key: "catering_only", labelEs: "Solo catering" },
  { key: "personal_chef", labelEs: "Chef personal" },
  { key: "pop_up", labelEs: "Pop-up" },
  { key: "other", labelEs: "Otro" },
];

export const RESTAURANTE_CUISINES: TaxonomyOption<RestauranteCuisineKey>[] = [
  { key: "mexican", labelEs: "Mexicana" },
  { key: "italian", labelEs: "Italiana" },
  { key: "american", labelEs: "Americana" },
  { key: "mediterranean", labelEs: "Mediterránea" },
  { key: "asian", labelEs: "Asiática" },
  { key: "seafood", labelEs: "Mariscos" },
  { key: "bbq", labelEs: "BBQ / parrilla" },
  { key: "vegetarian", labelEs: "Vegetariana" },
  { key: "fusion", labelEs: "Fusión" },
  { key: "dessert", labelEs: "Postres" },
  { key: "other", labelEs: "Otra" },
];

export const RESTAURANTE_PRICE_LEVELS: { key: RestaurantePriceLevel; labelEs: string }[] = [
  { key: "$", labelEs: "$ Económico" },
  { key: "$$", labelEs: "$$ Moderado" },
  { key: "$$$", labelEs: "$$$ Elevado" },
  { key: "$$$$", labelEs: "$$$$ Fine dining" },
];

export const RESTAURANTE_SERVICE_MODES: TaxonomyOption<RestauranteServiceMode>[] = [
  { key: "dine_in", labelEs: "Comer en local" },
  { key: "takeout", labelEs: "Para llevar" },
  { key: "delivery", labelEs: "Entrega a domicilio" },
  { key: "catering", labelEs: "Catering" },
  { key: "events", labelEs: "Eventos" },
  { key: "pop_up", labelEs: "Pop-up" },
  { key: "food_truck", labelEs: "Food truck" },
  { key: "personal_chef", labelEs: "Chef personal" },
  { key: "meal_prep", labelEs: "Meal prep" },
  { key: "other", labelEs: "Otro" },
];

export const RESTAURANTE_HIGHLIGHTS: TaxonomyOption<RestauranteHighlightKey>[] = [
  { key: "outdoor_seating", labelEs: "Terraza / exterior" },
  { key: "family_friendly", labelEs: "Familiar" },
  { key: "good_for_groups", labelEs: "Ideal para grupos" },
  { key: "casual", labelEs: "Casual" },
  { key: "trendy", labelEs: "De moda" },
  { key: "upscale", labelEs: "Elevado / upscale" },
  { key: "romantic", labelEs: "Romántico" },
  { key: "fast_service", labelEs: "Servicio rápido" },
  { key: "vegetarian_options", labelEs: "Opciones vegetarianas" },
  { key: "vegan_options", labelEs: "Opciones veganas" },
  { key: "gluten_free", labelEs: "Sin gluten" },
  { key: "pet_friendly", labelEs: "Pet friendly" },
  { key: "parking", labelEs: "Estacionamiento" },
  { key: "wheelchair_accessible", labelEs: "Accesible en silla de ruedas" },
  { key: "spanish_spoken", labelEs: "Se habla español" },
  { key: "great_lunch", labelEs: "Excelente para comida" },
  { key: "great_dinner", labelEs: "Excelente para cena" },
  { key: "late_night", labelEs: "Abierto hasta tarde" },
  { key: "brunch", labelEs: "Brunch" },
  { key: "live_music", labelEs: "Música en vivo" },
  { key: "sports", labelEs: "Ambiente deportivo" },
  { key: "full_bar", labelEs: "Bar completo" },
  { key: "coffee_focus", labelEs: "Enfoque café" },
  { key: "dessert_focus", labelEs: "Enfoque postres" },
];

export const RESTAURANTE_LOCATION_PRIVACY: TaxonomyOption<RestauranteLocationPrivacyMode>[] = [
  { key: "exact_when_allowed", labelEs: "Dirección exacta cuando aplique" },
  { key: "approximate_map", labelEs: "Ubicación aproximada en mapa" },
  { key: "city_only", labelEs: "Solo ciudad / zona" },
  { key: "hidden_address_text_only", labelEs: "Sin mapa; solo texto de área" },
];

export const RESTAURANTE_LANGUAGES: TaxonomyOption[] = [
  { key: "es", labelEs: "Español" },
  { key: "en", labelEs: "Inglés" },
  { key: "zh", labelEs: "Chino" },
  { key: "vi", labelEs: "Vietnamita" },
  { key: "tl", labelEs: "Tagalo" },
  { key: "other_lang", labelEs: "Otro" },
];

export const RESTAURANTE_PICKUP_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export const RESTAURANTE_EVENT_SIZES = [
  { key: "10-25", labelEs: "10 – 25 personas" },
  { key: "25-75", labelEs: "25 – 75 personas" },
  { key: "75-150", labelEs: "75 – 150 personas" },
  { key: "150+", labelEs: "150+ personas" },
] as const;

export function labelForBusinessType(key: string): string {
  return RESTAURANTE_BUSINESS_TYPES.find((x) => x.key === key)?.labelEs ?? key;
}

export function labelForCuisine(key: string): string {
  return RESTAURANTE_CUISINES.find((x) => x.key === key)?.labelEs ?? key;
}

export function labelForHighlight(key: string): string {
  return RESTAURANTE_HIGHLIGHTS.find((x) => x.key === key)?.labelEs ?? key;
}

export function labelForServiceMode(key: RestauranteServiceMode): string {
  return RESTAURANTE_SERVICE_MODES.find((x) => x.key === key)?.labelEs ?? key;
}
