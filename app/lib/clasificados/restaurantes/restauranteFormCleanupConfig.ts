import type { RestauranteBusinessTypeKey } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import {
  RESTAURANTE_BUSINESS_TYPES,
  TAXONOMY_KEY_OTHER_LANG,
} from "@/app/clasificados/restaurantes/application/restauranteTaxonomy";

/** Business types removed from Restaurante form — owned by Comida Local pipeline. */
export const RESTAURANTE_FORM_EXCLUDED_BUSINESS_TYPE_KEYS: RestauranteBusinessTypeKey[] = [
  "pop_up",
  "home_based_food",
  "street_vendor",
];

/** Active Tipo de negocio options for `/publicar/restaurantes`. */
export const RESTAURANTE_FORM_BUSINESS_TYPES = RESTAURANTE_BUSINESS_TYPES.filter(
  (o) => !RESTAURANTE_FORM_EXCLUDED_BUSINESS_TYPE_KEYS.includes(o.key),
);

export function isExcludedRestauranteFormBusinessType(key: string): boolean {
  return (RESTAURANTE_FORM_EXCLUDED_BUSINESS_TYPE_KEYS as readonly string[]).includes(key);
}

export function normalizeLanguageToken(value: string): string {
  return value.trim().toLowerCase();
}

export function isDuplicateCustomLanguage(
  candidate: string,
  languagesSpoken: string[] | undefined,
  existingCustom: string | undefined,
  resolveLanguageLabel: (key: string) => string,
): boolean {
  const norm = normalizeLanguageToken(candidate);
  if (!norm) return true;
  if (existingCustom && normalizeLanguageToken(existingCustom) === norm) return true;
  for (const key of languagesSpoken ?? []) {
    if (key === TAXONOMY_KEY_OTHER_LANG) continue;
    if (normalizeLanguageToken(resolveLanguageLabel(key)) === norm) return true;
  }
  return false;
}
