import type { RestaurantesBlueprintCard } from "@/app/clasificados/restaurantes/lib/restaurantesBlueprintTypes";

/**
 * Single structured pool for Restaurantes public blueprint (landing sections + results shell).
 * Swap this module’s exports for query-mapped data later without redesigning UI shells.
 */

export type RestaurantesPublicBlueprintPrice = "$" | "$$" | "$$$" | "$$$$";

export type RestaurantesPublicBlueprintRow = {
  id: string;
  name: string;
  slug: string;
  primaryCuisineKey: string;
  secondaryCuisineKey?: string;
  cuisineLine: string;
  city: string;
  zip?: string;
  rating: number;
  priceLevel: RestaurantesPublicBlueprintPrice;
  imageSrc: string;
  serviceModes: Array<"dine_in" | "takeout" | "delivery">;
  familyFriendly: boolean;
  /** Promoted placements (future: paid/featured tiers). */
  promoted: boolean;
  /** Demo stand-in until stored hours + “open now” evaluation exists. */
  openNowDemo: boolean;
  veganOptions: boolean;
  glutenFreeOptions: boolean;
  halalCuisine: boolean;
  listedAt: string;
};

/** Full demo inventory for results filtering / sorting. */
export const RESTAURANTES_PUBLIC_BLUEPRINT_ROWS: RestaurantesPublicBlueprintRow[] = [
  {
    id: "bp-01",
    name: "Casa Tapatía",
    slug: "casa-tapatia",
    primaryCuisineKey: "mexican",
    secondaryCuisineKey: "tex_mex",
    cuisineLine: "Cocina mexicana regional · barbacoa, antojitos y mezcal seleccionado",
    city: "San José",
    zip: "10101",
    rating: 4.9,
    priceLevel: "$$",
    imageSrc: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    serviceModes: ["dine_in", "takeout", "delivery"],
    familyFriendly: true,
    promoted: true,
    openNowDemo: true,
    veganOptions: true,
    glutenFreeOptions: false,
    halalCuisine: false,
    listedAt: "2026-03-12T18:00:00.000Z",
  },
  {
    id: "bp-02",
    name: "Sushi Naru",
    slug: "sushi-naru",
    primaryCuisineKey: "japanese",
    secondaryCuisineKey: "sushi",
    cuisineLine: "Japonesa · omakase y rolls",
    city: "Escazú",
    zip: "10203",
    rating: 4.8,
    priceLevel: "$$$",
    imageSrc: "https://images.unsplash.com/photo-1579584425555-c7ce17fd4351?auto=format&fit=crop&w=900&q=80",
    serviceModes: ["dine_in", "takeout"],
    familyFriendly: false,
    promoted: true,
    openNowDemo: true,
    veganOptions: true,
    glutenFreeOptions: true,
    halalCuisine: false,
    listedAt: "2026-03-18T20:30:00.000Z",
  },
  {
    id: "bp-03",
    name: "Santa Pasta",
    slug: "santa-pasta",
    primaryCuisineKey: "italian",
    cuisineLine: "Italiana · pasta fresca y vinos",
    city: "Heredia",
    zip: "40101",
    rating: 4.7,
    priceLevel: "$$",
    imageSrc: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80",
    serviceModes: ["dine_in", "delivery"],
    familyFriendly: true,
    promoted: true,
    openNowDemo: false,
    veganOptions: true,
    glutenFreeOptions: true,
    halalCuisine: false,
    listedAt: "2026-02-02T16:00:00.000Z",
  },
  {
    id: "bp-04",
    name: "La Trattoria Roma",
    slug: "la-trattoria-roma",
    primaryCuisineKey: "italian",
    cuisineLine: "Italiana · horno de leña",
    city: "Cartago",
    zip: "30101",
    rating: 4.6,
    priceLevel: "$$",
    imageSrc: "https://images.unsplash.com/photo-1595299585323-38d6b0865b47?auto=format&fit=crop&w=900&q=80",
    serviceModes: ["dine_in", "takeout"],
    familyFriendly: true,
    promoted: false,
    openNowDemo: true,
    veganOptions: false,
    glutenFreeOptions: true,
    halalCuisine: false,
    listedAt: "2026-04-02T14:20:00.000Z",
  },
  {
    id: "bp-05",
    name: "El Sabor del Norte",
    slug: "el-sabor-del-norte",
    primaryCuisineKey: "latin_mixed",
    secondaryCuisineKey: "seafood",
    cuisineLine: "Latina norteña · cortes y mariscos",
    city: "Alajuela",
    zip: "20101",
    rating: 4.5,
    priceLevel: "$$$",
    imageSrc: "https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=900&q=80",
    serviceModes: ["dine_in", "takeout", "delivery"],
    familyFriendly: true,
    promoted: false,
    openNowDemo: true,
    veganOptions: false,
    glutenFreeOptions: false,
    halalCuisine: false,
    listedAt: "2026-04-05T11:00:00.000Z",
  },
  {
    id: "bp-06",
    name: "Ramen House",
    slug: "ramen-house",
    primaryCuisineKey: "japanese",
    cuisineLine: "Japonesa · ramen y donburi",
    city: "Curridabat",
    zip: "11801",
    rating: 4.8,
    priceLevel: "$$",
    imageSrc: "https://images.unsplash.com/photo-1569718216969-217a2d9e1a6c?auto=format&fit=crop&w=900&q=80",
    serviceModes: ["dine_in", "takeout"],
    familyFriendly: true,
    promoted: false,
    openNowDemo: true,
    veganOptions: true,
    glutenFreeOptions: false,
    halalCuisine: false,
    listedAt: "2026-04-08T19:45:00.000Z",
  },
  {
    id: "bp-07",
    name: "Brasa Norteña BBQ",
    slug: "brasa-nortena-bbq",
    primaryCuisineKey: "bbq",
    secondaryCuisineKey: "american",
    cuisineLine: "BBQ y parrilla · ahumados lentos, costillas y sides caseros",
    city: "San José",
    zip: "10102",
    rating: 4.4,
    priceLevel: "$$",
    imageSrc: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=80",
    serviceModes: ["dine_in", "takeout", "delivery"],
    familyFriendly: true,
    promoted: false,
    openNowDemo: false,
    veganOptions: false,
    glutenFreeOptions: true,
    halalCuisine: false,
    listedAt: "2026-01-20T22:00:00.000Z",
  },
  {
    id: "bp-08",
    name: "Dim Sum Central",
    slug: "dim-sum-central",
    primaryCuisineKey: "chinese",
    cuisineLine: "China · dim sum y wok",
    city: "San José",
    zip: "10103",
    rating: 4.5,
    priceLevel: "$$",
    imageSrc: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80",
    serviceModes: ["dine_in", "takeout"],
    familyFriendly: true,
    promoted: false,
    openNowDemo: true,
    veganOptions: true,
    glutenFreeOptions: false,
    halalCuisine: false,
    listedAt: "2026-03-28T17:10:00.000Z",
  },
  {
    id: "bp-09",
    name: "Al-Andalus Grill",
    slug: "al-andalus-grill",
    primaryCuisineKey: "halal",
    secondaryCuisineKey: "middle_eastern",
    cuisineLine: "Halal · parrilla mediterránea",
    city: "Heredia",
    zip: "40102",
    rating: 4.6,
    priceLevel: "$$",
    imageSrc: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80",
    serviceModes: ["dine_in", "takeout", "delivery"],
    familyFriendly: true,
    promoted: false,
    openNowDemo: true,
    veganOptions: true,
    glutenFreeOptions: true,
    halalCuisine: true,
    listedAt: "2026-02-14T13:30:00.000Z",
  },
  {
    id: "bp-10",
    name: "Café Esquina",
    slug: "cafe-esquina",
    primaryCuisineKey: "cafe_food",
    secondaryCuisineKey: "dessert",
    cuisineLine: "Café de especialidad · postres, brunch y pan recién horneado",
    city: "Escazú",
    zip: "10201",
    rating: 4.3,
    priceLevel: "$",
    imageSrc: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
    serviceModes: ["dine_in", "takeout"],
    familyFriendly: true,
    promoted: false,
    openNowDemo: true,
    veganOptions: true,
    glutenFreeOptions: true,
    halalCuisine: false,
    listedAt: "2026-04-09T08:00:00.000Z",
  },
  {
    id: "bp-11",
    name: "Stacks Pancake House",
    slug: "stacks-pancake-house",
    primaryCuisineKey: "breakfast_brunch",
    cuisineLine: "Desayuno · pancakes y huevos",
    city: "Curridabat",
    zip: "11802",
    rating: 4.4,
    priceLevel: "$",
    imageSrc: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=80",
    serviceModes: ["dine_in", "takeout"],
    familyFriendly: true,
    promoted: false,
    openNowDemo: true,
    veganOptions: true,
    glutenFreeOptions: true,
    halalCuisine: false,
    listedAt: "2026-04-01T07:30:00.000Z",
  },
  {
    id: "bp-12",
    name: "Burger Garage",
    slug: "burger-garage",
    primaryCuisineKey: "burgers",
    secondaryCuisineKey: "american",
    cuisineLine: "Americana · burgers y malteadas",
    city: "Alajuela",
    zip: "20102",
    rating: 4.2,
    priceLevel: "$",
    imageSrc: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80",
    serviceModes: ["dine_in", "takeout", "delivery"],
    familyFriendly: true,
    promoted: false,
    openNowDemo: false,
    veganOptions: true,
    glutenFreeOptions: false,
    halalCuisine: false,
    listedAt: "2025-12-10T21:00:00.000Z",
  },
];

const FEATURED_IDS = new Set(["bp-01", "bp-02", "bp-03"]);
const RECENT_IDS = new Set(["bp-04", "bp-05", "bp-06"]);

function rowToLandingCard(row: RestaurantesPublicBlueprintRow): RestaurantesBlueprintCard {
  return {
    id: row.id,
    name: row.name,
    cuisineLine: row.cuisineLine,
    cityLine: row.city,
    rating: row.rating,
    imageSrc: row.imageSrc,
  };
}

export function getRestaurantesBlueprintLandingFeatured(): RestaurantesBlueprintCard[] {
  return RESTAURANTES_PUBLIC_BLUEPRINT_ROWS.filter((r) => FEATURED_IDS.has(r.id)).map(rowToLandingCard);
}

export function getRestaurantesBlueprintLandingRecent(): RestaurantesBlueprintCard[] {
  return RESTAURANTES_PUBLIC_BLUEPRINT_ROWS.filter((r) => RECENT_IDS.has(r.id)).map(rowToLandingCard);
}

export function isBlueprintPromotedId(id: string): boolean {
  return FEATURED_IDS.has(id);
}

export function isBlueprintRecentId(id: string): boolean {
  return RECENT_IDS.has(id);
}
