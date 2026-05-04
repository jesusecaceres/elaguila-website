/**
 * Normalization layer for "Servicios y Características" section
 * Groups restaurant application fields into 5 UI-ready categories
 */

import type { RestauranteListingDraft } from "../application/restauranteDraftTypes";

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
const SERVICE_MODE_LABELS: Record<string, string> = {
  'dine_in': 'Comer en local',
  'takeout': 'Para llevar',
  'delivery': 'Entrega a domicilio',
  'catering': 'Catering',
  'events': 'Eventos',
  'pop_up': 'Pop-up',
  'food_truck': 'Food truck',
  'personal_chef': 'Chef personal',
  'meal_prep': 'Meal prep',
  'other': 'Otro'
};

// Cuisine labels mapping
const CUISINE_LABELS: Record<string, string> = {
  'mexican': 'Mexicana',
  'italian': 'Italiana',
  'japanese': 'Japonesa',
  'chinese': 'China',
  'american': 'Americana',
  'spanish': 'Española',
  'french': 'Francesa',
  'thai': 'Tailandesa',
  'indian': 'India',
  'mediterranean': 'Mediterránea',
  'seafood': 'Mariscos',
  'bbq': 'BBQ',
  'pizza': 'Pizza',
  'burgers': 'Hamburguesas',
  'sandwiches': 'Sándwiches',
  'vegetarian': 'Vegetariana',
  'vegan': 'Vegana',
  'gluten_free': 'Sin gluten',
  'bakery': 'Panadería / repostería',
  'coffee_shop': 'Cafetería',
  'fast_food': 'Comida rápida',
  'latin_mixed': 'Latina variada',
  'fusion': 'Fusión',
  'other': 'Otro'
};

// Highlight/feature labels mapping
const HIGHLIGHT_LABELS: Record<string, string> = {
  'family_friendly': 'Familiar',
  'outdoor_seating': 'Terraza / exterior',
  'takeout_available': 'Para llevar',
  'delivery_available': 'Entrega a domicilio',
  'reservations': 'Reservaciones',
  'wifi': 'WiFi',
  'parking': 'Estacionamiento',
  'wheelchair_accessible': 'Accesible en silla de ruedas',
  'pet_friendly': 'Pet friendly',
  'romantic': 'Romántico',
  'upscale': 'Elegante / upscale',
  'casual': 'Casual',
  'quick_service': 'Servicio rápido',
  'late_night': 'Nocturno',
  'breakfast': 'Desayuno',
  'lunch': 'Almuerzo',
  'dinner': 'Cena',
  'brunch': 'Brunch',
  'happy_hour': 'Happy hour',
  'live_music': 'Música en vivo',
  'sports_bar': 'Bar deportivo',
  'outdoor': 'Exterior',
  'great_dinner': 'Excelente para cenar',
  'vegan_options': 'Opciones veganas',
  'gluten_free_options': 'Opciones sin gluten',
  'other': 'Otro'
};

// Language labels mapping
const LANGUAGE_LABELS: Record<string, string> = {
  'spanish': 'Español',
  'english': 'Inglés',
  'other_lang': 'Otro'
};

/**
 * Normalize restaurant application data into grouped UI-ready features
 */
export function normalizeRestaurantFeatures(draft: RestauranteListingDraft): GroupedFeatures {
  const result: GroupedFeatures = {
    servicios: {
      title: 'Servicios',
      description: 'Formas de disfrutar del restaurante',
      items: []
    },
    cocina_y_estilo: {
      title: 'Cocina y estilo',
      description: 'Tipo de cocina y especialidades',
      items: []
    },
    ambiente_y_amenidades: {
      title: 'Ambiente y amenidades',
      description: 'Características del ambiente y servicios especiales',
      items: []
    },
    idiomas: {
      title: 'Idiomas',
      description: 'Idiomas disponibles para atención',
      items: []
    },
    precio: {
      title: 'Precio',
      description: 'Rango de precios del restaurante',
      items: []
    }
  };

  // GROUP 1: Servicios (from serviceModes)
  const serviceModes = draft.serviceModes || [];
  for (const mode of serviceModes) {
    if (mode === 'other' && hasValue(draft.serviceModeOtherCustom)) {
      result.servicios.items.push(cleanCustomValue(draft.serviceModeOtherCustom));
    } else if (SERVICE_MODE_LABELS[mode]) {
      result.servicios.items.push(SERVICE_MODE_LABELS[mode]);
    }
  }

  // GROUP 2: Cocina y estilo (from cuisines)
  // Primary cuisine
  if (draft.primaryCuisine) {
    if (draft.primaryCuisine === 'other' && hasValue(draft.primaryCuisineCustom)) {
      result.cocina_y_estilo.items.push(cleanCustomValue(draft.primaryCuisineCustom));
    } else if (CUISINE_LABELS[draft.primaryCuisine]) {
      result.cocina_y_estilo.items.push(CUISINE_LABELS[draft.primaryCuisine]);
    }
  }

  // Secondary cuisine
  if (draft.secondaryCuisine) {
    if (draft.secondaryCuisine === 'other' && hasValue(draft.secondaryCuisineCustom)) {
      result.cocina_y_estilo.items.push(cleanCustomValue(draft.secondaryCuisineCustom));
    } else if (CUISINE_LABELS[draft.secondaryCuisine]) {
      result.cocina_y_estilo.items.push(CUISINE_LABELS[draft.secondaryCuisine]);
    }
  }

  // Additional cuisines
  const additionalCuisines = draft.additionalCuisines || [];
  for (const cuisine of additionalCuisines) {
    if (cuisine === 'other' && hasValue(draft.additionalCuisineOtherCustom)) {
      result.cocina_y_estilo.items.push(cleanCustomValue(draft.additionalCuisineOtherCustom));
    } else if (CUISINE_LABELS[cuisine]) {
      result.cocina_y_estilo.items.push(CUISINE_LABELS[cuisine]);
    }
  }

  // GROUP 3: Ambiente y amenidades (from highlights and business type)
  const highlights = draft.highlights || [];
  for (const highlight of highlights) {
    if (HIGHLIGHT_LABELS[highlight]) {
      result.ambiente_y_amenidades.items.push(HIGHLIGHT_LABELS[highlight]);
    }
  }

  // Business type as ambiance feature
  if (draft.businessType) {
    if (draft.businessType === 'other' && hasValue(draft.businessTypeCustom)) {
      result.ambiente_y_amenidades.items.push(cleanCustomValue(draft.businessTypeCustom));
    } else if (draft.businessType === 'sit_down') {
      result.ambiente_y_amenidades.items.push('Comedor tradicional');
    } else if (draft.businessType === 'fast_casual') {
      result.ambiente_y_amenidades.items.push('Servicio rápido casual');
    } else if (draft.businessType === 'cafe') {
      result.ambiente_y_amenidades.items.push('Cafetería');
    } else if (draft.businessType === 'food_truck') {
      result.ambiente_y_amenidades.items.push('Food truck');
    } else if (draft.businessType === 'street_vendor') {
      result.ambiente_y_amenidades.items.push('Puesto callejero');
    }
  }

  // GROUP 4: Idiomas (from languagesSpoken)
  const languages = draft.languagesSpoken || [];
  for (const lang of languages) {
    if (lang === 'other_lang' && hasValue(draft.languageOtherCustom)) {
      result.idiomas.items.push(cleanCustomValue(draft.languageOtherCustom));
    } else if (lang === 'other_lang') {
      // Fallback for other_lang without custom value
      result.idiomas.items.push('Otro');
    } else if (LANGUAGE_LABELS[lang]) {
      result.idiomas.items.push(LANGUAGE_LABELS[lang]);
    }
  }

  // GROUP 5: Precio (from priceLevel)
  if (draft.priceLevel) {
    const priceLabels: Record<string, string> = {
      '$': 'Económico',
      '$$': 'Moderado',
      '$$$': 'Elegante',
      '$$$$': 'Lujo'
    };
    if (priceLabels[draft.priceLevel]) {
      result.precio.items.push(`${draft.priceLevel} ${priceLabels[draft.priceLevel]}`);
    }
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
