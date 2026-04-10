import type { RestauranteCuisineKey } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";

export type RestaurantesBlueprintCard = {
  id: string;
  name: string;
  cuisineLine: string;
  cityLine: string;
  rating: number;
  imageSrc: string;
};

export type RestaurantesCuisineChip = {
  id: string;
  labelEs: string;
  labelEn: string;
  cuisineKey: string;
};

export type RestaurantesCategoryTile = {
  id: string;
  labelEs: string;
  labelEn: string;
  cuisineKey: RestauranteCuisineKey;
  imageSrc: string;
};

export type RestaurantesQuickFilter = {
  id: string;
  labelEs: string;
  labelEn: string;
  resultParams: Record<string, string | undefined>;
};
