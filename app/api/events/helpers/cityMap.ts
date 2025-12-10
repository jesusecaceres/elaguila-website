// /app/api/events/helpers/cityMap.ts

export interface CityInfo {
  name: string;
  slug: string;
  county: string;
}

export interface CountyGroup {
  county: string;
  cities: CityInfo[];
}

// Utility: convert "San Jose" → "sanjose"
const slugify = (str: string) =>
  str.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");

// ---- COUNTY-GROUPED CITY LIST (PHASE 1 OFFICIAL) ---- //

export const counties: CountyGroup[] = [
  {
    county: "Santa Clara County",
    cities: [
      "San Jose",
      "Santa Clara",
      "Sunnyvale",
      "Milpitas",
      "Campbell",
      "Morgan Hill",
      "Gilroy",
    ].map((name) => ({ name, slug: slugify(name), county: "Santa Clara County" })),
  },

  {
    county: "San Mateo County",
    cities: [
      "Redwood City",
      "San Mateo",
      "Daly City",
      "South San Francisco",
      "San Bruno",
      "Menlo Park",
    ].map((name) => ({ name, slug: slugify(name), county: "San Mateo County" })),
  },

  {
    county: "Alameda County",
    cities: ["Fremont", "Hayward", "Oakland", "San Leandro"].map((name) => ({
      name,
      slug: slugify(name),
      county: "Alameda County",
    })),
  },

  {
    county: "Contra Costa County",
    cities: [
      "Concord",
      "Richmond",
      "Pittsburg",
      "Antioch",
      "Brentwood",
      "San Ramon",
    ].map((name) => ({
      name,
      slug: slugify(name),
      county: "Contra Costa County",
    })),
  },

  {
    county: "San Joaquin County",
    cities: ["Stockton", "Tracy", "Manteca"].map((name) => ({
      name,
      slug: slugify(name),
      county: "San Joaquin County",
    })),
  },

  {
    county: "Stanislaus County",
    cities: ["Modesto", "Riverbank"].map((name) => ({
      name,
      slug: slugify(name),
      county: "Stanislaus County",
    })),
  },

  {
    county: "Merced County",
    cities: ["Los Banos", "Merced"].map((name) => ({
      name,
      slug: slugify(name),
      county: "Merced County",
    })),
  },

  {
    county: "Monterey County",
    cities: ["Salinas", "Monterey"].map((name) => ({
      name,
      slug: slugify(name),
      county: "Monterey County",
    })),
  },

  {
    county: "Santa Cruz County",
    cities: ["Santa Cruz", "Watsonville", "Capitola"].map((name) => ({
      name,
      slug: slugify(name),
      county: "Santa Cruz County",
    })),
  },
];

// ---- FLAT LOOKUPS FOR API PERFORMANCE ---- //

// All cities in ONE flat list
export const allCities: CityInfo[] = counties.flatMap((g) => g.cities);

// Quick lookup: slug → city info
export const cityBySlug: Record<string, CityInfo> = Object.fromEntries(
  allCities.map((city) => [city.slug, city])
);

// Default city (San Jose)
export const DEFAULT_CITY = "sanjose";
