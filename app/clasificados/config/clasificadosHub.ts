/**
 * Clasificados hub (/clasificados): category keys, ordering, and featured preview limits.
 */

export type Lang = "es" | "en";

export type HubCategoryKey =
  | "en-venta"
  | "rentas"
  | "autos"
  | "servicios"
  | "empleos"
  | "clases"
  | "comunidad"
  | "restaurantes"
  | "travel";

export type HubSellerType = "personal" | "business";

export type HubListing = {
  id: string;
  category: HubCategoryKey;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  postedAgo: { es: string; en: string };
  blurb: { es: string; en: string };
  hasImage: boolean;
  sellerType: HubSellerType;
};

/** Browse grid order on the hub landing. */
export const HUB_CATEGORY_ORDER: readonly HubCategoryKey[] = [
  "rentas",
  "en-venta",
  "empleos",
  "servicios",
  "restaurantes",
  "travel",
  "autos",
  "clases",
  "comunidad",
];

/** Valid `category` values when mapping DB rows for the hub. */
export const HUB_CATEGORY_KEYS: readonly HubCategoryKey[] = [
  "en-venta",
  "rentas",
  "autos",
  "servicios",
  "empleos",
  "clases",
  "comunidad",
  "travel",
  "restaurantes",
];

/** Base numbers used by `buildHubFeaturedLimits` (desktop vs mobile). */
export const HUB_FEATURED_LIMIT_NUMBERS = {
  big3Desktop: 10,
  otherDesktop: 6,
  big3Mobile: 4,
  otherMobile: 3,
} as const;
