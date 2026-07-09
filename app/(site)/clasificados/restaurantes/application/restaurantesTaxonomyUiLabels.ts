/**
 * English UI labels for Restaurantes taxonomy (filters/chips only).
 * Seller-entered listing content is not translated here.
 */

import type { RestaurantesDiscoveryLang } from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";

export type TaxonomyUiLang = RestaurantesDiscoveryLang;

const CUISINE_EN: Record<string, string> = {
  american: "American",
  argentinian: "Argentinian",
  asian: "Asian (general)",
  bbq: "BBQ / grill",
  brazilian: "Brazilian",
  breakfast_brunch: "Breakfast / brunch",
  burgers: "Burgers",
  cafe_food: "Café",
  cambodian: "Cambodian",
  chinese: "Chinese",
  colombian: "Colombian",
  cuban: "Cuban",
  dessert: "Desserts / bakery",
  filipino: "Filipino",
  french: "French",
  fusion: "Fusion",
  greek: "Greek",
  halal: "Halal",
  honduran: "Honduran",
  hot_dogs: "Hot dogs / snacks",
  indian: "Indian",
  italian: "Italian",
  japanese: "Japanese (general)",
  korean: "Korean",
  latin_mixed: "Latin (mixed)",
  mediterranean: "Mediterranean",
  mexican: "Mexican",
  middle_eastern: "Middle Eastern",
  nicaraguan: "Nicaraguan",
  peruvian: "Peruvian",
  pizza: "Pizza",
  salvadoran: "Salvadoran",
  seafood: "Seafood",
  soul_southern: "Soul / Southern US",
  spanish: "Spanish",
  sushi: "Sushi",
  tex_mex: "Tex-Mex",
  thai: "Thai",
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  venezuelan: "Venezuelan",
  vietnamese: "Vietnamese",
  other: "Other",
};

const BUSINESS_TYPE_EN: Record<string, string> = {
  sit_down: "Sit-down restaurant",
  fast_casual: "Fast casual",
  cafe: "Café / coffee",
  bar: "Bar / cantina",
  bakery: "Bakery / pastry",
  food_truck: "Food truck",
  ghost_kitchen: "Ghost kitchen / delivery",
  catering_only: "Catering only",
  personal_chef: "Personal chef",
  pop_up: "Pop-up / temporary",
  home_based_food: "Home-based food business",
  street_vendor: "Street vendor / stand",
  other: "Other",
};

const PRICE_LEVEL_EN: Record<string, string> = {
  $: "$ Budget-friendly",
  $$: "$$ Moderate",
  $$$: "$$$ Upscale",
  $$$$: "$$$$ Fine dining",
};

const HIGHLIGHT_EN: Record<string, string> = {
  outdoor_seating: "Outdoor seating",
  family_friendly: "Family-friendly",
  good_for_groups: "Good for groups",
  casual: "Casual",
  trendy: "Trendy",
  upscale: "Upscale",
  romantic: "Romantic",
  fast_service: "Fast service",
  vegetarian_options: "Vegetarian options",
  vegan_options: "Vegan options",
  gluten_free: "Gluten-free",
  pet_friendly: "Pet-friendly",
  parking: "Parking",
  wheelchair_accessible: "Wheelchair accessible",
  spanish_spoken: "Spanish spoken",
  great_lunch: "Great for lunch",
  great_dinner: "Great for dinner",
  late_night: "Open late",
  brunch: "Brunch",
  live_music: "Live music",
  sports: "Sports atmosphere",
  full_bar: "Full bar",
  coffee_focus: "Coffee focus",
  dessert_focus: "Dessert focus",
};

const SPOKEN_LANGUAGE_EN: Record<string, string> = {
  es: "Spanish",
  en: "English",
  other_lang: "Other",
};

const DIET_EN: Record<string, string> = {
  vegan: "Vegan (options)",
  glutenfree: "Gluten-free",
  halal: "Halal",
};

export function taxonomyUiLabel(
  labelEs: string,
  key: string,
  enMap: Record<string, string>,
  lang: TaxonomyUiLang,
): string {
  if (lang === "es") return labelEs;
  return enMap[key] ?? labelEs;
}

export function cuisineUiLabel(key: string, labelEs: string, lang: TaxonomyUiLang): string {
  return taxonomyUiLabel(labelEs, key, CUISINE_EN, lang);
}

export function businessTypeUiLabel(key: string, labelEs: string, lang: TaxonomyUiLang): string {
  return taxonomyUiLabel(labelEs, key, BUSINESS_TYPE_EN, lang);
}

export function priceLevelUiLabel(key: string, labelEs: string, lang: TaxonomyUiLang): string {
  return taxonomyUiLabel(labelEs, key, PRICE_LEVEL_EN, lang);
}

export function highlightUiLabel(key: string, labelEs: string, lang: TaxonomyUiLang): string {
  return taxonomyUiLabel(labelEs, key, HIGHLIGHT_EN, lang);
}

export function spokenLanguageUiLabel(key: string, labelEs: string, lang: TaxonomyUiLang): string {
  return taxonomyUiLabel(labelEs, key, SPOKEN_LANGUAGE_EN, lang);
}

export function dietUiLabel(key: string, lang: TaxonomyUiLang): string {
  if (lang === "es") {
    const es: Record<string, string> = {
      vegan: "Vegano (opciones)",
      glutenfree: "Sin gluten",
      halal: "Halal",
    };
    return es[key] ?? key;
  }
  return DIET_EN[key] ?? key;
}
