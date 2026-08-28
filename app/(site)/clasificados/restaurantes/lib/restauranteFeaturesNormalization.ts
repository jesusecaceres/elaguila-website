/**
 * Normalization layer for "Servicios y Características" / "Services and Features" section
 * Groups restaurant application fields into 5 UI-ready categories
 */

import type { RestauranteListingDraft } from "../application/restauranteDraftTypes";
import { resolveRestauranteCustomLanguages } from "@/app/lib/clasificados/restaurantes/restauranteFormCleanupConfig";

export type RestauranteFeaturesLang = "es" | "en";

// UI-ready grouped data structure
export interface GroupedFeatures {
  servicios: {
    title: string;
    description: string;
    items: string[];
  };
  cocina_y_estilo: {
    title: string;
    description: string;
    items: string[];
  };
  ambiente_y_amenidades: {
    title: string;
    description: string;
    items: string[];
  };
  idiomas: {
    title: string;
    description: string;
    items: string[];
  };
  precio: {
    title: string;
    description: string;
    items: string[];
  };
}

type Bilingual = { es: string; en: string };

function t(entry: Bilingual, lang: RestauranteFeaturesLang): string {
  return lang === "en" ? entry.en : entry.es;
}

// Helper function to clean custom values
function cleanCustomValue(value?: string): string {
  if (!value) return '';
  return value.replace(/^Otra:\s*/, '').trim();
}

// Helper function to check if value exists and is not empty
function hasValue(value?: string): boolean {
  return value != null && value.trim().length > 0;
}

// Service mode labels mapping
const SERVICE_MODE_LABELS: Record<string, Bilingual> = {
  dine_in: { es: 'Comer en local', en: 'Dine-in' },
  takeout: { es: 'Para llevar', en: 'Takeout' },
  delivery: { es: 'Entrega a domicilio', en: 'Delivery' },
  catering: { es: 'Catering', en: 'Catering' },
  events: { es: 'Eventos', en: 'Events' },
  pop_up: { es: 'Pop-up', en: 'Pop-up' },
  food_truck: { es: 'Food truck', en: 'Food truck' },
  personal_chef: { es: 'Chef personal', en: 'Personal chef' },
  meal_prep: { es: 'Meal prep', en: 'Meal prep' },
  other: { es: 'Otro', en: 'Other' },
};

// Cuisine labels mapping
const CUISINE_LABELS: Record<string, Bilingual> = {
  mexican: { es: 'Mexicana', en: 'Mexican' },
  italian: { es: 'Italiana', en: 'Italian' },
  japanese: { es: 'Japonesa', en: 'Japanese' },
  chinese: { es: 'China', en: 'Chinese' },
  american: { es: 'Americana', en: 'American' },
  spanish: { es: 'Española', en: 'Spanish' },
  french: { es: 'Francesa', en: 'French' },
  thai: { es: 'Tailandesa', en: 'Thai' },
  indian: { es: 'India', en: 'Indian' },
  mediterranean: { es: 'Mediterránea', en: 'Mediterranean' },
  seafood: { es: 'Mariscos', en: 'Seafood' },
  bbq: { es: 'BBQ', en: 'BBQ' },
  pizza: { es: 'Pizza', en: 'Pizza' },
  burgers: { es: 'Hamburguesas', en: 'Burgers' },
  sandwiches: { es: 'Sándwiches', en: 'Sandwiches' },
  vegetarian: { es: 'Vegetariana', en: 'Vegetarian' },
  vegan: { es: 'Vegana', en: 'Vegan' },
  gluten_free: { es: 'Sin gluten', en: 'Gluten-free' },
  bakery: { es: 'Panadería / repostería', en: 'Bakery / pastry' },
  coffee_shop: { es: 'Cafetería', en: 'Coffee shop' },
  fast_food: { es: 'Comida rápida', en: 'Fast food' },
  latin_mixed: { es: 'Latina variada', en: 'Mixed Latin' },
  fusion: { es: 'Fusión', en: 'Fusion' },
  other: { es: 'Otro', en: 'Other' },
};

// Highlight/feature labels mapping
const HIGHLIGHT_LABELS: Record<string, Bilingual> = {
  family_friendly: { es: 'Familiar', en: 'Family-friendly' },
  outdoor_seating: { es: 'Terraza / exterior', en: 'Outdoor seating' },
  takeout_available: { es: 'Para llevar', en: 'Takeout available' },
  delivery_available: { es: 'Entrega a domicilio', en: 'Delivery available' },
  reservations: { es: 'Reservaciones', en: 'Reservations' },
  wifi: { es: 'WiFi', en: 'WiFi' },
  parking: { es: 'Estacionamiento', en: 'Parking' },
  wheelchair_accessible: { es: 'Accesible en silla de ruedas', en: 'Wheelchair accessible' },
  pet_friendly: { es: 'Pet friendly', en: 'Pet friendly' },
  romantic: { es: 'Romántico', en: 'Romantic' },
  upscale: { es: 'Elegante / upscale', en: 'Upscale' },
  casual: { es: 'Casual', en: 'Casual' },
  quick_service: { es: 'Servicio rápido', en: 'Quick service' },
  late_night: { es: 'Nocturno', en: 'Late night' },
  breakfast: { es: 'Desayuno', en: 'Breakfast' },
  lunch: { es: 'Almuerzo', en: 'Lunch' },
  dinner: { es: 'Cena', en: 'Dinner' },
  brunch: { es: 'Brunch', en: 'Brunch' },
  happy_hour: { es: 'Happy hour', en: 'Happy hour' },
  live_music: { es: 'Música en vivo', en: 'Live music' },
  sports_bar: { es: 'Bar deportivo', en: 'Sports bar' },
  outdoor: { es: 'Exterior', en: 'Outdoor' },
  great_dinner: { es: 'Excelente para cenar', en: 'Great for dinner' },
  vegan_options: { es: 'Opciones veganas', en: 'Vegan options' },
  gluten_free_options: { es: 'Opciones sin gluten', en: 'Gluten-free options' },
  other: { es: 'Otro', en: 'Other' },
};

// Language labels mapping
const LANGUAGE_LABELS: Record<string, Bilingual> = {
  es: { es: 'Español', en: 'Spanish' },
  en: { es: 'Inglés', en: 'English' },
  other_lang: { es: 'Otro', en: 'Other' },
};

const PRICE_LABELS: Record<string, Bilingual> = {
  '$': { es: 'Económico', en: 'Budget' },
  '$$': { es: 'Moderado', en: 'Moderate' },
  '$$$': { es: 'Elegante', en: 'Upscale' },
  '$$$$': { es: 'Lujo', en: 'Fine dining' },
};

const BUSINESS_TYPE_AMBIANCE_LABELS: Record<string, Bilingual> = {
  sit_down: { es: 'Comedor tradicional', en: 'Sit-down dining' },
  fast_casual: { es: 'Servicio rápido casual', en: 'Fast casual' },
  cafe: { es: 'Cafetería', en: 'Cafe' },
  food_truck: { es: 'Food truck', en: 'Food truck' },
  street_vendor: { es: 'Puesto callejero', en: 'Street vendor' },
};

/**
 * Normalize restaurant application data into grouped UI-ready features
 */
export function normalizeRestaurantFeatures(
  draft: RestauranteListingDraft,
  lang: RestauranteFeaturesLang = "es",
): GroupedFeatures {
  const result: GroupedFeatures = {
    servicios: {
      title: lang === "en" ? "Services" : "Servicios",
      description: lang === "en" ? "Ways to enjoy the restaurant" : "Formas de disfrutar del restaurante",
      items: []
    },
    cocina_y_estilo: {
      title: lang === "en" ? "Cuisine and style" : "Cocina y estilo",
      description: lang === "en" ? "Cuisine type and specialties" : "Tipo de cocina y especialidades",
      items: []
    },
    ambiente_y_amenidades: {
      title: lang === "en" ? "Atmosphere and amenities" : "Ambiente y amenidades",
      description:
        lang === "en"
          ? "Atmosphere features and special services"
          : "Características del ambiente y servicios especiales",
      items: []
    },
    idiomas: {
      title: lang === "en" ? "Languages" : "Idiomas",
      description: lang === "en" ? "Languages available for service" : "Idiomas disponibles para atención",
      items: []
    },
    precio: {
      title: lang === "en" ? "Price" : "Precio",
      description: lang === "en" ? "Restaurant price range" : "Rango de precios del restaurante",
      items: []
    }
  };

  // GROUP 1: Servicios (from serviceModes)
  const serviceModes = draft.serviceModes || [];
  for (const mode of serviceModes) {
    if (mode === "pop_up") continue;
    if (mode === "other" && hasValue(draft.serviceModeOtherCustom)) {
      result.servicios.items.push(cleanCustomValue(draft.serviceModeOtherCustom));
    } else if (SERVICE_MODE_LABELS[mode]) {
      result.servicios.items.push(t(SERVICE_MODE_LABELS[mode], lang));
    }
  }
  if (draft.pickupAvailable) result.servicios.items.push(lang === "en" ? "Pickup" : "Recogida");
  if (draft.reservationsAvailable) result.servicios.items.push(lang === "en" ? "Reservations" : "Reservas");

  // GROUP 2: Cocina y estilo (from cuisines)
  // Primary cuisine
  if (draft.primaryCuisine) {
    if (draft.primaryCuisine === 'other' && hasValue(draft.primaryCuisineCustom)) {
      result.cocina_y_estilo.items.push(cleanCustomValue(draft.primaryCuisineCustom));
    } else if (CUISINE_LABELS[draft.primaryCuisine]) {
      result.cocina_y_estilo.items.push(t(CUISINE_LABELS[draft.primaryCuisine], lang));
    }
  }

  // Secondary cuisine
  if (draft.secondaryCuisine) {
    if (draft.secondaryCuisine === 'other' && hasValue(draft.secondaryCuisineCustom)) {
      result.cocina_y_estilo.items.push(cleanCustomValue(draft.secondaryCuisineCustom));
    } else if (CUISINE_LABELS[draft.secondaryCuisine]) {
      result.cocina_y_estilo.items.push(t(CUISINE_LABELS[draft.secondaryCuisine], lang));
    }
  }

  // Additional cuisines
  const additionalCuisines = draft.additionalCuisines || [];
  for (const cuisine of additionalCuisines) {
    if (cuisine === 'other' && hasValue(draft.additionalCuisineOtherCustom)) {
      result.cocina_y_estilo.items.push(cleanCustomValue(draft.additionalCuisineOtherCustom));
    } else if (CUISINE_LABELS[cuisine]) {
      result.cocina_y_estilo.items.push(t(CUISINE_LABELS[cuisine], lang));
    }
  }

  // GROUP 3: Ambiente y amenidades (from highlights and business type)
  const highlights = draft.highlights || [];
  for (const highlight of highlights) {
    if (HIGHLIGHT_LABELS[highlight]) {
      result.ambiente_y_amenidades.items.push(t(HIGHLIGHT_LABELS[highlight], lang));
    }
  }

  // Business type as ambiance feature
  if (draft.businessType) {
    if (draft.businessType === 'other' && hasValue(draft.businessTypeCustom)) {
      result.ambiente_y_amenidades.items.push(cleanCustomValue(draft.businessTypeCustom));
    } else if (BUSINESS_TYPE_AMBIANCE_LABELS[draft.businessType]) {
      result.ambiente_y_amenidades.items.push(t(BUSINESS_TYPE_AMBIANCE_LABELS[draft.businessType], lang));
    }
  }

  // GROUP 4: Idiomas (from languagesSpoken + customLanguages)
  const languages = draft.languagesSpoken || [];
  const customLangs = resolveRestauranteCustomLanguages(draft);
  for (const spokenLang of languages) {
    if (spokenLang === "other_lang") continue;
    if (LANGUAGE_LABELS[spokenLang]) {
      result.idiomas.items.push(t(LANGUAGE_LABELS[spokenLang], lang));
    }
  }
  for (const custom of customLangs) {
    result.idiomas.items.push(cleanCustomValue(custom));
  }

  // GROUP 5: Precio (from priceLevel)
  if (draft.priceLevel && PRICE_LABELS[draft.priceLevel]) {
    result.precio.items.push(`${draft.priceLevel} ${t(PRICE_LABELS[draft.priceLevel], lang)}`);
  }

  // Remove empty groups and deduplicate items within each group
  for (const key in result) {
    const group = result[key as keyof GroupedFeatures];
    group.items = [...new Set(group.items)]; // Remove duplicates
    if (group.items.length === 0) {
      // Keep the group structure but mark it as empty
      // The UI component will decide whether to show empty groups
    }
  }

  return result;
}

/**
 * Check if a grouped features object has any content
 */
export function hasGroupedFeaturesContent(features: GroupedFeatures): boolean {
  return Object.values(features).some(group => group.items.length > 0);
}

/**
 * Get only non-empty groups
 */
export function getNonEmptyGroups(features: GroupedFeatures): Partial<GroupedFeatures> {
  const result: Partial<GroupedFeatures> = {};

  for (const key in features) {
    const group = features[key as keyof GroupedFeatures];
    if (group.items.length > 0) {
      result[key as keyof GroupedFeatures] = group;
    }
  }

  return result;
}
