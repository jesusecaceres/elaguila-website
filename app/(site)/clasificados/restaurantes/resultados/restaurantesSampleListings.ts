import type { RestauranteHighlightKey, RestauranteServiceMode } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";

/**
 * Structured sample rows for the public results blueprint — shape mirrors application/results-driving fields.
 * Swap for query-driven data later without redesigning cards.
 */
export type RestauranteResultsSampleRow = {
  id: string;
  businessName: string;
  businessTypeKey: string;
  primaryCuisineKey: string;
  secondaryCuisineKey?: string;
  cityCanonical: string;
  zipCode?: string;
  neighborhood?: string;
  priceLevel?: "$" | "$$" | "$$$" | "$$$$";
  serviceModeKeys: RestauranteServiceMode[];
  highlightKeys: RestauranteHighlightKey[];
  movingVendor: boolean;
  homeBasedBusiness: boolean;
  foodTruck: boolean;
  popUp: boolean;
  summaryShort: string;
  heroImageUrl?: string;
  /** Demo “promoted” slot — optional; not live billing */
  sponsored?: boolean;
  externalRatingValue?: number;
  externalReviewCount?: number;
  /** Sort helper — ISO-ish strings for client sort */
  listedAt: string;
};

export const RESTAURANTE_RESULTS_SAMPLE_LISTINGS: RestauranteResultsSampleRow[] = [
  {
    id: "r-sample-01",
    businessName: "Casa Oaxaca Sur",
    businessTypeKey: "sit_down",
    primaryCuisineKey: "mexican",
    secondaryCuisineKey: "seafood",
    cityCanonical: "San Jose",
    zipCode: "95112",
    neighborhood: "Downtown",
    priceLevel: "$$",
    serviceModeKeys: ["dine_in", "takeout", "delivery"],
    highlightKeys: ["family_friendly", "great_dinner"],
    movingVendor: false,
    homeBasedBusiness: false,
    foodTruck: false,
    popUp: false,
    summaryShort: "Mole tradicional y pescado del día en ambiente cálido.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&auto=format&fit=crop",
    sponsored: true,
    externalRatingValue: 4.7,
    externalReviewCount: 128,
    listedAt: "2025-11-02",
  },
  {
    id: "r-sample-02",
    businessName: "Birriería El Pariente",
    businessTypeKey: "fast_casual",
    primaryCuisineKey: "mexican",
    cityCanonical: "San Jose",
    zipCode: "95116",
    priceLevel: "$",
    serviceModeKeys: ["takeout", "delivery", "catering"],
    highlightKeys: ["fast_service", "late_night"],
    movingVendor: false,
    homeBasedBusiness: true,
    foodTruck: false,
    popUp: false,
    summaryShort: "Birria de res estilo Jalisco; pedidos para llevar y catering.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80&auto=format&fit=crop",
    listedAt: "2025-10-18",
  },
  {
    id: "r-sample-03",
    businessName: "Rolling Sushi SF",
    businessTypeKey: "food_truck",
    primaryCuisineKey: "sushi",
    secondaryCuisineKey: "japanese",
    cityCanonical: "San Francisco",
    zipCode: "94103",
    priceLevel: "$$",
    serviceModeKeys: ["food_truck", "takeout", "pop_up"],
    highlightKeys: ["trendy", "fast_service"],
    movingVendor: true,
    homeBasedBusiness: false,
    foodTruck: true,
    popUp: true,
    summaryShort: "Food truck con menú omakase compacto; ruta semanal en SOMA.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80&auto=format&fit=crop",
    sponsored: true,
    listedAt: "2025-12-01",
  },
  {
    id: "r-sample-04",
    businessName: "Nonna’s Table",
    businessTypeKey: "sit_down",
    primaryCuisineKey: "italian",
    cityCanonical: "Palo Alto",
    zipCode: "94301",
    priceLevel: "$$$",
    serviceModeKeys: ["dine_in", "takeout"],
    highlightKeys: ["romantic", "upscale", "full_bar"],
    movingVendor: false,
    homeBasedBusiness: false,
    foodTruck: false,
    popUp: false,
    summaryShort: "Pasta fresca y vinos italianos; reservas recomendadas.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&auto=format&fit=crop",
    listedAt: "2025-09-05",
  },
  {
    id: "r-sample-05",
    businessName: "Taco Truck Los Primos",
    businessTypeKey: "food_truck",
    primaryCuisineKey: "tex_mex",
    cityCanonical: "Oakland",
    zipCode: "94607",
    priceLevel: "$",
    serviceModeKeys: ["food_truck", "takeout"],
    highlightKeys: ["late_night", "casual"],
    movingVendor: true,
    homeBasedBusiness: false,
    foodTruck: true,
    popUp: false,
    summaryShort: "Tacos y quesabirrias; ubicación publicada diariamente.",
    listedAt: "2025-08-22",
  },
  {
    id: "r-sample-06",
    businessName: "Bloom Vegan Kitchen",
    businessTypeKey: "fast_casual",
    primaryCuisineKey: "vegan",
    secondaryCuisineKey: "vegetarian",
    cityCanonical: "Berkeley",
    zipCode: "94704",
    priceLevel: "$$",
    serviceModeKeys: ["dine_in", "takeout", "delivery"],
    highlightKeys: ["vegan_options", "vegetarian_options", "pet_friendly"],
    movingVendor: false,
    homeBasedBusiness: false,
    foodTruck: false,
    popUp: false,
    summaryShort: "Bowls y burgers 100% plant-based.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80&auto=format&fit=crop",
    listedAt: "2025-07-14",
  },
  {
    id: "r-sample-07",
    businessName: "Sazón Casero",
    businessTypeKey: "home_based_food",
    primaryCuisineKey: "salvadoran",
    secondaryCuisineKey: "mexican",
    cityCanonical: "San Jose",
    zipCode: "95127",
    priceLevel: "$",
    serviceModeKeys: ["takeout", "delivery", "meal_prep"],
    highlightKeys: ["family_friendly"],
    movingVendor: false,
    homeBasedBusiness: true,
    foodTruck: false,
    popUp: false,
    summaryShort: "Pupusas y tamales desde cocina certificada; entrega local.",
    listedAt: "2025-11-20",
  },
  {
    id: "r-sample-08",
    businessName: "Perla Marina",
    businessTypeKey: "sit_down",
    primaryCuisineKey: "seafood",
    secondaryCuisineKey: "peruvian",
    cityCanonical: "Redwood City",
    zipCode: "94063",
    priceLevel: "$$$",
    serviceModeKeys: ["dine_in", "takeout"],
    highlightKeys: ["great_dinner", "full_bar"],
    movingVendor: false,
    homeBasedBusiness: false,
    foodTruck: false,
    popUp: false,
    summaryShort: "Ceviche y arroces; bar de pisco.",
    listedAt: "2025-06-30",
  },
  {
    id: "r-sample-09",
    businessName: "K-BBQ Alley",
    businessTypeKey: "fast_casual",
    primaryCuisineKey: "korean",
    cityCanonical: "Santa Clara",
    zipCode: "95050",
    priceLevel: "$$",
    serviceModeKeys: ["dine_in", "takeout"],
    highlightKeys: ["good_for_groups", "casual"],
    movingVendor: false,
    homeBasedBusiness: false,
    foodTruck: false,
    popUp: false,
    summaryShort: "Parrilla coreana rápida cerca del estadio.",
    listedAt: "2025-10-01",
  },
  {
    id: "r-sample-10",
    businessName: "Café y Pan Dulce",
    businessTypeKey: "cafe",
    primaryCuisineKey: "cafe_food",
    secondaryCuisineKey: "dessert",
    cityCanonical: "San Jose",
    zipCode: "95113",
    priceLevel: "$",
    serviceModeKeys: ["dine_in", "takeout"],
    highlightKeys: ["coffee_focus", "brunch"],
    movingVendor: false,
    homeBasedBusiness: false,
    foodTruck: false,
    popUp: false,
    summaryShort: "Panadería y espresso; brunch los fines de semana.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&auto=format&fit=crop",
    listedAt: "2025-12-12",
  },
];
