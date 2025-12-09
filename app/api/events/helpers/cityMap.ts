// ------------------------------------------------------------
// cityMap.ts
// El Águila — City + County Directory for Events System
// ------------------------------------------------------------

export type CitySlug =
  | "sanjose"
  | "santaclara"
  | "sunnyvale"
  | "mountainview"
  | "milpitas"
  | "cupertino"
  | "paloalto"
  | "campbell"
  | "losgatos"
  | "morganhill"
  | "gilroy"
  | "redwoodcity"
  | "sanmateo"
  | "burlingame"
  | "dalecity"
  | "ssf"
  | "oakland"
  | "fremont"
  | "hayward"
  | "berkeley"
  | "alameda"
  | "pleasanton"
  | "livermore"
  | "dublin"
  | "santacruz"
  | "watsonville"
  | "monterey"
  | "salinas"
  | "marina"
  | "seaside"
  | "carmel"
  | "pacificgrove"
  | "hollister"
  | "modesto"
  | "turlock"
  | "stockton"
  | "lodi"
  | "tracy"
  | "manteca"
  | "merced"
  | "atwater"
  | "losbanos"
  | "madera"
  | "fresno";

export interface CityInfo {
  name: string;
  slug: CitySlug;
  county: string;
}

// ------------------------------------------------------------
// COUNTY → CITY STRUCTURE
// Used to GROUP dropdown UI
// ------------------------------------------------------------

export const counties: Record<string, CityInfo[]> = {
  "Santa Clara County": [
    { name: "San José", slug: "sanjose", county: "Santa Clara County" },
    { name: "Santa Clara", slug: "santaclara", county: "Santa Clara County" },
    { name: "Sunnyvale", slug: "sunnyvale", county: "Santa Clara County" },
    { name: "Mountain View", slug: "mountainview", county: "Santa Clara County" },
    { name: "Milpitas", slug: "milpitas", county: "Santa Clara County" },
    { name: "Cupertino", slug: "cupertino", county: "Santa Clara County" },
    { name: "Palo Alto", slug: "paloalto", county: "Santa Clara County" },
    { name: "Campbell", slug: "campbell", county: "Santa Clara County" },
    { name: "Los Gatos", slug: "losgatos", county: "Santa Clara County" },
    { name: "Morgan Hill", slug: "morganhill", county: "Santa Clara County" },
    { name: "Gilroy", slug: "gilroy", county: "Santa Clara County" },
  ],

  "San Mateo County": [
    { name: "Redwood City", slug: "redwoodcity", county: "San Mateo County" },
    { name: "San Mateo", slug: "sanmateo", county: "San Mateo County" },
    { name: "Burlingame", slug: "burlingame", county: "San Mateo County" },
    { name: "Daly City", slug: "dalecity", county: "San Mateo County" },
    { name: "South San Francisco", slug: "ssf", county: "San Mateo County" },
  ],

  "Alameda County": [
    { name: "Oakland", slug: "oakland", county: "Alameda County" },
    { name: "Fremont", slug: "fremont", county: "Alameda County" },
    { name: "Hayward", slug: "hayward", county: "Alameda County" },
    { name: "Berkeley", slug: "berkeley", county: "Alameda County" },
    { name: "Alameda", slug: "alameda", county: "Alameda County" },
    { name: "Pleasanton", slug: "pleasanton", county: "Alameda County" },
    { name: "Livermore", slug: "livermore", county: "Alameda County" },
    { name: "Dublin", slug: "dublin", county: "Alameda County" },
  ],

  "Santa Cruz County": [
    { name: "Santa Cruz", slug: "santacruz", county: "Santa Cruz County" },
    { name: "Watsonville", slug: "watsonville", county: "Santa Cruz County" },
  ],

  "Monterey County": [
    { name: "Monterey", slug: "monterey", county: "Monterey County" },
    { name: "Salinas", slug: "salinas", county: "Monterey County" },
    { name: "Marina", slug: "marina", county: "Monterey County" },
    { name: "Seaside", slug: "seaside", county: "Monterey County" },
    { name: "Carmel", slug: "carmel", county: "Monterey County" },
    { name: "Pacific Grove", slug: "pacificgrove", county: "Monterey County" },
  ],

  "San Benito County": [
    { name: "Hollister", slug: "hollister", county: "San Benito County" },
  ],

  "Stanislaus County": [
    { name: "Modesto", slug: "modesto", county: "Stanislaus County" },
    { name: "Turlock", slug: "turlock", county: "Stanislaus County" },
  ],

  "San Joaquin County": [
    { name: "Stockton", slug: "stockton", county: "San Joaquin County" },
    { name: "Lodi", slug: "lodi", county: "San Joaquin County" },
    { name: "Tracy", slug: "tracy", county: "San Joaquin County" },
    { name: "Manteca", slug: "manteca", county: "San Joaquin County" },
  ],

  "Merced County": [
    { name: "Merced", slug: "merced", county: "Merced County" },
    { name: "Atwater", slug: "atwater", county: "Merced County" },
    { name: "Los Baños", slug: "losbanos", county: "Merced County" },
  ],

  "Madera County": [
    { name: "Madera", slug: "madera", county: "Madera County" },
  ],

  "Fresno County": [
    { name: "Fresno", slug: "fresno", county: "Fresno County" },
  ],
};

// ------------------------------------------------------------
// FLAT CITY LIST (used internally by API)
// ------------------------------------------------------------

export const allCities: CityInfo[] = Object.values(counties).flat();

// ------------------------------------------------------------
// CASE-INSENSITIVE MATCHING FOR RAW CITY NAMES
// ------------------------------------------------------------

export function matchCity(raw: string | undefined): CityInfo | null {
  if (!raw) return null;

  const clean = raw.toLowerCase().replace(/\./g, "").trim();

  // Normalize weird cases
  if (clean === "san jose" || clean === "sanjose") clean.replace("san jose", "san josé");

  return (
    allCities.find((c) => c.name.toLowerCase() === clean) ||
    allCities.find((c) => clean.includes(c.slug)) ||
    allCities.find((c) => clean.includes(c.name.toLowerCase())) ||
    null
  );
}
