import type {
  RestauranteBusinessTypeKey,
  RestauranteCuisineKey,
  RestauranteHighlightKey,
  RestauranteLocationPrivacyMode,
  RestaurantePriceLevel,
  RestauranteServiceMode,
} from "./restauranteListingApplicationModel";

export type TaxonomyOption<T extends string = string> = { key: T; labelEs: string; chipEmoji?: string };

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
  { key: "american", labelEs: "Americana", chipEmoji: "🍔" },
  { key: "argentinian", labelEs: "Argentina", chipEmoji: "🥩" },
  { key: "asian", labelEs: "Asiática (general)", chipEmoji: "🍜" },
  { key: "bbq", labelEs: "BBQ / parrilla", chipEmoji: "🔥" },
  { key: "brazilian", labelEs: "Brasileña", chipEmoji: "🥩" },
  { key: "breakfast_brunch", labelEs: "Desayuno / brunch", chipEmoji: "🍳" },
  { key: "burgers", labelEs: "Hamburguesas", chipEmoji: "🍔" },
  { key: "cafe_food", labelEs: "Cafetería", chipEmoji: "☕" },
  { key: "cambodian", labelEs: "Camboyana", chipEmoji: "🍜" },
  { key: "chinese", labelEs: "China", chipEmoji: "🥟" },
  { key: "colombian", labelEs: "Colombiana", chipEmoji: "🌮" },
  { key: "cuban", labelEs: "Cubana", chipEmoji: "🥪" },
  { key: "dessert", labelEs: "Postres / repostería", chipEmoji: "🍰" },
  { key: "filipino", labelEs: "Filipina", chipEmoji: "🍜" },
  { key: "french", labelEs: "Francesa", chipEmoji: "🥐" },
  { key: "fusion", labelEs: "Fusión", chipEmoji: "✨" },
  { key: "greek", labelEs: "Griega", chipEmoji: "🫒" },
  { key: "halal", labelEs: "Halal", chipEmoji: "🕌" },
  { key: "honduran", labelEs: "Hondureña", chipEmoji: "🌮" },
  { key: "hot_dogs", labelEs: "Hot dogs / snacks", chipEmoji: "🌭" },
  { key: "indian", labelEs: "India", chipEmoji: "🍛" },
  { key: "italian", labelEs: "Italiana", chipEmoji: "🍝" },
  { key: "japanese", labelEs: "Japonesa (general)", chipEmoji: "🍱" },
  { key: "korean", labelEs: "Coreana", chipEmoji: "🍲" },
  { key: "latin_mixed", labelEs: "Latina (varias)", chipEmoji: "🌮" },
  { key: "mediterranean", labelEs: "Mediterránea", chipEmoji: "🫒" },
  { key: "mexican", labelEs: "Mexicana", chipEmoji: "🌮" },
  { key: "middle_eastern", labelEs: "Medio Oriente / oriente medio", chipEmoji: "🧆" },
  { key: "nicaraguan", labelEs: "Nicaragüense", chipEmoji: "🌮" },
  { key: "peruvian", labelEs: "Peruana", chipEmoji: "🥘" },
  { key: "pizza", labelEs: "Pizza", chipEmoji: "🍕" },
  { key: "salvadoran", labelEs: "Salvadoreña", chipEmoji: "🫓" },
  { key: "seafood", labelEs: "Mariscos", chipEmoji: "🐟" },
  { key: "soul_southern", labelEs: "Soul / sur de EE. UU.", chipEmoji: "🍗" },
  { key: "spanish", labelEs: "Española", chipEmoji: "🥘" },
  { key: "sushi", labelEs: "Sushi / japonesa sushi", chipEmoji: "🍣" },
  { key: "tex_mex", labelEs: "Tex-Mex", chipEmoji: "🌮" },
  { key: "thai", labelEs: "Tailandesa", chipEmoji: "🍜" },
  { key: "vegan", labelEs: "Vegana", chipEmoji: "🌱" },
  { key: "vegetarian", labelEs: "Vegetariana", chipEmoji: "🥗" },
  { key: "venezuelan", labelEs: "Venezolana", chipEmoji: "🫓" },
  { key: "vietnamese", labelEs: "Vietnamita", chipEmoji: "🍜" },
  { key: "other", labelEs: "Otra", chipEmoji: "🔖" },
];

export const RESTAURANTE_PRICE_LEVELS: { key: RestaurantePriceLevel; labelEs: string }[] = [
  { key: "$", labelEs: "$ Económico" },
  { key: "$$", labelEs: "$$ Moderado" },
  { key: "$$$", labelEs: "$$$ Elevado" },
  { key: "$$$$", labelEs: "$$$$ Fine dining" },
];

export const RESTAURANTE_SERVICE_MODES: TaxonomyOption<RestauranteServiceMode>[] = [
  { key: "dine_in", labelEs: "Comer en local", chipEmoji: "🍽️" },
  { key: "takeout", labelEs: "Para llevar", chipEmoji: "🛍️" },
  { key: "delivery", labelEs: "Entrega a domicilio", chipEmoji: "🚚" },
  { key: "catering", labelEs: "Catering", chipEmoji: "🍽️" },
  { key: "events", labelEs: "Eventos", chipEmoji: "🎉" },
  { key: "pop_up", labelEs: "Pop-up", chipEmoji: "✨" },
  { key: "food_truck", labelEs: "Food truck", chipEmoji: "🚚" },
  { key: "personal_chef", labelEs: "Chef personal", chipEmoji: "👨‍🍳" },
  { key: "meal_prep", labelEs: "Meal prep", chipEmoji: "🍱" },
  { key: "other", labelEs: "Otro", chipEmoji: "🔖" },
];

export const RESTAURANTE_HIGHLIGHTS: TaxonomyOption<RestauranteHighlightKey>[] = [
  { key: "outdoor_seating", labelEs: "Terraza / exterior", chipEmoji: "🌿" },
  { key: "family_friendly", labelEs: "Familiar", chipEmoji: "👨‍👩‍👧‍👦" },
  { key: "good_for_groups", labelEs: "Ideal para grupos", chipEmoji: "👥" },
  { key: "casual", labelEs: "Casual", chipEmoji: "😊" },
  { key: "trendy", labelEs: "De moda", chipEmoji: "✨" },
  { key: "upscale", labelEs: "Elevado / upscale", chipEmoji: "✨" },
  { key: "romantic", labelEs: "Romántico", chipEmoji: "💛" },
  { key: "fast_service", labelEs: "Servicio rápido", chipEmoji: "⚡" },
  { key: "vegetarian_options", labelEs: "Opciones vegetarianas", chipEmoji: "🥗" },
  { key: "vegan_options", labelEs: "Opciones veganas", chipEmoji: "🌱" },
  { key: "gluten_free", labelEs: "Sin gluten", chipEmoji: "🌾" },
  { key: "pet_friendly", labelEs: "Pet friendly", chipEmoji: "🐾" },
  { key: "parking", labelEs: "Estacionamiento", chipEmoji: "🅿️" },
  { key: "wheelchair_accessible", labelEs: "Accesible en silla de ruedas", chipEmoji: "♿" },
  { key: "spanish_spoken", labelEs: "Se habla español", chipEmoji: "🗣️" },
  { key: "great_lunch", labelEs: "Excelente para comida", chipEmoji: "🍽️" },
  { key: "great_dinner", labelEs: "Excelente para cena", chipEmoji: "🍽️" },
  { key: "late_night", labelEs: "Abierto hasta tarde", chipEmoji: "🌙" },
  { key: "brunch", labelEs: "Brunch", chipEmoji: "🍳" },
  { key: "live_music", labelEs: "Música en vivo", chipEmoji: "🎶" },
  { key: "sports", labelEs: "Ambiente deportivo", chipEmoji: "🏈" },
  { key: "full_bar", labelEs: "Bar completo", chipEmoji: "🍹" },
  { key: "coffee_focus", labelEs: "Enfoque café", chipEmoji: "☕" },
  { key: "dessert_focus", labelEs: "Enfoque postres", chipEmoji: "🍰" },
];

export const RESTAURANTE_LOCATION_PRIVACY: TaxonomyOption<RestauranteLocationPrivacyMode>[] = [
  { key: "exact_when_allowed", labelEs: "Dirección exacta cuando aplique" },
  { key: "approximate_map", labelEs: "Ubicación aproximada en mapa" },
  { key: "city_only", labelEs: "Solo ciudad / zona" },
  { key: "hidden_address_text_only", labelEs: "Sin mapa; solo texto de área" },
];

export const RESTAURANTE_LANGUAGES: TaxonomyOption[] = [
  { key: "es", labelEs: "Español", chipEmoji: "🗣️" },
  { key: "en", labelEs: "Inglés", chipEmoji: "🌐" },
  { key: "other_lang", labelEs: "Otro", chipEmoji: "🔖" },
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

export function labelForLanguage(key: string): string {
  return RESTAURANTE_LANGUAGES.find((x) => x.key === key)?.labelEs ?? key;
}

/** Stable catalog keys for “Otra” supplemental text fields */
export const TAXONOMY_KEY_OTHER = "other" as const;
export const TAXONOMY_KEY_OTHER_LANG = "other_lang" as const;

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
