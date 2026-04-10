import type { RestauranteCuisineKey } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";

/**
 * Blueprint-only sample records. Replace arrays with API/DB data later without redesigning the shell.
 */

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
  /** Canonical cuisine key for `cuisine=` on resultados (see `DISCOVERY_CUISINE_ALIASES` + taxonomy). */
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
  /** Query params for `buildRestaurantesResultsHref` — must map to real listing fields when wired. */
  resultParams: Record<string, string | undefined>;
};

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
    resultParams: { top: "1" },
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

export const RESTAURANTES_BLUEPRINT_FEATURED: RestaurantesBlueprintCard[] = [
  {
    id: "feat-1",
    name: "Casa Tapatía",
    cuisineLine: "Mexicana regional · barbacoa y antojitos",
    cityLine: "San José",
    rating: 4.9,
    imageSrc:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "feat-2",
    name: "Sushi Naru",
    cuisineLine: "Japonesa · omakase y rolls",
    cityLine: "Escazú",
    rating: 4.8,
    imageSrc:
      "https://images.unsplash.com/photo-1579584425555-c7ce17fd4351?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "feat-3",
    name: "Santa Pasta",
    cuisineLine: "Italiana · pasta fresca y vinos",
    cityLine: "Heredia",
    rating: 4.7,
    imageSrc:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80",
  },
];

export const RESTAURANTES_BLUEPRINT_RECENT: RestaurantesBlueprintCard[] = [
  {
    id: "rec-1",
    name: "La Trattoria Roma",
    cuisineLine: "Italiana · horno de leña",
    cityLine: "Cartago",
    rating: 4.6,
    imageSrc:
      "https://images.unsplash.com/photo-1595299585323-38d6b0865b47?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "rec-2",
    name: "El Sabor del Norte",
    cuisineLine: "Latina norteña · cortes y mariscos",
    cityLine: "Alajuela",
    rating: 4.5,
    imageSrc:
      "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "rec-3",
    name: "Ramen House",
    cuisineLine: "Japonesa · ramen y donburi",
    cityLine: "Curridabat",
    rating: 4.8,
    imageSrc:
      "https://images.unsplash.com/photo-1569718216969-217a2d9e1a6c?auto=format&fit=crop&w=900&q=80",
  },
];
