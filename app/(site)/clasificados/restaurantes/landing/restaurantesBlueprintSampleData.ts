import type { RestauranteCuisineKey } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import {
  getRestaurantesBlueprintLandingFeatured,
  getRestaurantesBlueprintLandingRecent,
} from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import type {
  RestaurantesBlueprintCard,
  RestaurantesCategoryTile,
  RestaurantesCuisineChip,
  RestaurantesQuickFilter,
} from "@/app/clasificados/restaurantes/lib/restaurantesBlueprintTypes";

export type {
  RestaurantesBlueprintCard,
  RestaurantesCategoryTile,
  RestaurantesCuisineChip,
  RestaurantesQuickFilter,
} from "@/app/clasificados/restaurantes/lib/restaurantesBlueprintTypes";

/**
 * Landing-only chips and tiles (not the full results inventory).
 * Featured / Recientes rows come from `getRestaurantesBlueprintLandingFeatured|Recent()` (shared pool).
 */

export const RESTAURANTES_BLUEPRINT_QUICK_FILTERS: RestaurantesQuickFilter[] = [
  {
    id: "open_now",
    labelEs: "Abierto ahora",
    labelEn: "Open now",
    resultParams: { open: "1" },
  },
  {
    id: "near_me",
    labelEs: "Cerca de mí",
    labelEn: "Near me",
    resultParams: { near: "1" },
  },
  {
    id: "delivery",
    labelEs: "Entrega",
    labelEn: "Delivery",
    resultParams: { svc: "delivery" },
  },
  {
    id: "takeout",
    labelEs: "Para llevar",
    labelEn: "Takeout",
    resultParams: { svc: "takeout" },
  },
  {
    id: "family",
    labelEs: "Familiar",
    labelEn: "Family-friendly",
    resultParams: { family: "1" },
  },
  {
    id: "top_rated",
    labelEs: "Mejor valorados",
    labelEn: "Top rated",
    resultParams: { top: "1", sort: "rating-desc" },
  },
  {
    id: "price",
    labelEs: "Precio",
    labelEn: "Price",
    resultParams: { price: "$$" },
  },
];

export const RESTAURANTES_BLUEPRINT_CUISINE_CHIPS: RestaurantesCuisineChip[] = [
  { id: "mex", labelEs: "Mexicana", labelEn: "Mexican", cuisineKey: "mexican" },
  { id: "lat", labelEs: "Latina", labelEn: "Latino", cuisineKey: "latin_mixed" },
  { id: "am", labelEs: "Americana", labelEn: "American", cuisineKey: "american" },
  { id: "bbq", labelEs: "BBQ", labelEn: "BBQ", cuisineKey: "bbq" },
  { id: "cn", labelEs: "China", labelEn: "Chinese", cuisineKey: "chinese" },
  { id: "jp", labelEs: "Japonesa", labelEn: "Japanese", cuisineKey: "japanese" },
];

export const RESTAURANTES_BLUEPRINT_CATEGORY_TILES: RestaurantesCategoryTile[] = [
  {
    id: "mexican",
    labelEs: "Mexicana",
    labelEn: "Mexican",
    cuisineKey: "mexican",
    imageSrc:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "asian",
    labelEs: "Asiático",
    labelEn: "Asian",
    cuisineKey: "asian",
    imageSrc:
      "https://images.unsplash.com/photo-1579584425555-c7ce17fd4351?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "italian",
    labelEs: "Italiano",
    labelEn: "Italian",
    cuisineKey: "italian",
    imageSrc:
      "https://images.unsplash.com/photo-1598866594230-a7c12756260f?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "american",
    labelEs: "Americano",
    labelEn: "American",
    cuisineKey: "american",
    imageSrc:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "breakfast",
    labelEs: "Desayuno",
    labelEn: "Breakfast",
    cuisineKey: "breakfast_brunch",
    imageSrc:
      "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "coffee_dessert",
    labelEs: "Café y postres",
    labelEn: "Coffee & dessert",
    cuisineKey: "cafe_food",
    imageSrc:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
  },
];

/** Data-driven from shared blueprint pool (`restaurantesPublicBlueprintData`). */
export const RESTAURANTES_BLUEPRINT_FEATURED: RestaurantesBlueprintCard[] = getRestaurantesBlueprintLandingFeatured();

/** Data-driven from shared blueprint pool (`restaurantesPublicBlueprintData`). */
export const RESTAURANTES_BLUEPRINT_RECENT: RestaurantesBlueprintCard[] = getRestaurantesBlueprintLandingRecent();
