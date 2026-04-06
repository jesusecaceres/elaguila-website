import type {
  RestauranteBusinessTypeKey,
  RestauranteCuisineKey,
  RestauranteHighlightKey,
  RestauranteLocationPrivacyMode,
  RestaurantePriceLevel,
  RestauranteServiceMode,
} from "./restauranteListingApplicationModel";

export type TaxonomyOption<T extends string = string> = { key: T; labelEs: string };

/** Controlled business types — keys stable for drafts; labels clarified for QA. */
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
  { key: "pop_up", labelEs: "Pop-up / temporal" },
  { key: "home_based_food", labelEs: "Negocio desde casa / comida en casa" },
  { key: "street_vendor", labelEs: "Puesto / stand / street food" },
  { key: "other", labelEs: "Otro" },
];

/**
 * Primary / secondary / additional cuisines share this single catalog.
 * Keys are stable strings; unknown legacy keys still render via `labelForCuisine` fallback.
 */
export const RESTAURANTE_CUISINES: TaxonomyOption<RestauranteCuisineKey>[] = [
  { key: "american", labelEs: "Americana" },
  { key: "argentinian", labelEs: "Argentina" },
  { key: "asian", labelEs: "Asiática (general)" },
  { key: "bbq", labelEs: "BBQ / parrilla" },
  { key: "brazilian", labelEs: "Brasileña" },
  { key: "breakfast_brunch", labelEs: "Desayuno / brunch" },
  { key: "burgers", labelEs: "Hamburguesas" },
  { key: "cafe_food", labelEs: "Cafetería" },
  { key: "cambodian", labelEs: "Camboyana" },
  { key: "chinese", labelEs: "China" },
  { key: "colombian", labelEs: "Colombiana" },
  { key: "cuban", labelEs: "Cubana" },
  { key: "dessert", labelEs: "Postres / repostería" },
  { key: "filipino", labelEs: "Filipina" },
  { key: "french", labelEs: "Francesa" },
  { key: "fusion", labelEs: "Fusión" },
  { key: "greek", labelEs: "Griega" },
  { key: "halal", labelEs: "Halal" },
  { key: "honduran", labelEs: "Hondureña" },
  { key: "hot_dogs", labelEs: "Hot dogs / snacks" },
  { key: "indian", labelEs: "India" },
  { key: "italian", labelEs: "Italiana" },
  { key: "japanese", labelEs: "Japonesa (general)" },
  { key: "korean", labelEs: "Coreana" },
  { key: "latin_mixed", labelEs: "Latina (varias)" },
  { key: "mediterranean", labelEs: "Mediterránea" },
  { key: "mexican", labelEs: "Mexicana" },
  { key: "middle_eastern", labelEs: "Medio Oriente / oriente medio" },
  { key: "nicaraguan", labelEs: "Nicaragüense" },
  { key: "peruvian", labelEs: "Peruana" },
  { key: "pizza", labelEs: "Pizza" },
  { key: "salvadoran", labelEs: "Salvadoreña" },
  { key: "seafood", labelEs: "Mariscos" },
  { key: "soul_southern", labelEs: "Soul / sur de EE. UU." },
  { key: "spanish", labelEs: "Española" },
  { key: "sushi", labelEs: "Sushi / japonesa sushi" },
  { key: "tex_mex", labelEs: "Tex-Mex" },
  { key: "thai", labelEs: "Tailandesa" },
  { key: "vegan", labelEs: "Vegana" },
  { key: "vegetarian", labelEs: "Vegetariana" },
  { key: "venezuelan", labelEs: "Venezolana" },
  { key: "vietnamese", labelEs: "Vietnamita" },
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

/** Section D / G — subtle examples only (not submitted as defaults). */
export const RESTAURANTE_CONTACT_PLACEHOLDERS: Record<string, string> = {
  websiteUrl: "https://tusitio.com",
  phoneNumber: "(408) 555-0142",
  email: "nombre@negocio.com",
  whatsAppNumber: "14085550142",
  instagramUrl: "https://instagram.com/tu_negocio",
  facebookUrl: "https://facebook.com/tu_negocio",
  tiktokUrl: "https://tiktok.com/@tu_negocio",
  youtubeUrl: "https://youtube.com/@tu_negocio",
  reservationUrl: "https://tusitio.com/reservas",
  orderUrl: "https://tusitio.com/pedido",
  menuUrl: "https://tusitio.com/menu",
  verUbicacionUrl: "https://maps.google.com/?q=...",
  videoUrl: "https://youtube.com/watch?v=…",
  googleReviewUrl: "https://maps.google.com/...",
  yelpReviewUrl: "https://yelp.com/biz/...",
};
