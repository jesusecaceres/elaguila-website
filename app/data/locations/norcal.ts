// app/data/locations/norcal.ts
// ZIP A: Shared California city + ZIP anchor dataset (expand anytime).
// This file is intentionally lightweight and safe for client usage.

export const DEFAULT_CITY = "San José";
export const DEFAULT_RADIUS_MI = 25;

export type CityRecord = {
  city: string;
  county?: string;
  region?: string;
  lat: number;
  lng: number;
  aliases?: string[];
};

// Core coverage: Bay Area + Monterey Bay + Sacramento + Central Valley + key anchors southward.
// Expand weekly without refactors.
export const CA_CITIES: CityRecord[] = [
  { city: "San José", county: "Santa Clara", region: "Bay Area", lat: 37.3382, lng: -121.8863, aliases: ["San Jose", "SJ"] },
  { city: "Santa Clara", county: "Santa Clara", region: "Bay Area", lat: 37.3541, lng: -121.9552, aliases: ["SantaClara"] },
  { city: "Milpitas", county: "Santa Clara", region: "Bay Area", lat: 37.4323, lng: -121.8996 },
  { city: "Campbell", county: "Santa Clara", region: "Bay Area", lat: 37.2872, lng: -121.9490 },
  { city: "Sunnyvale", county: "Santa Clara", region: "Bay Area", lat: 37.3688, lng: -122.0363 },
  { city: "Cupertino", county: "Santa Clara", region: "Bay Area", lat: 37.3229, lng: -122.0322 },
  { city: "Mountain View", county: "Santa Clara", region: "Bay Area", lat: 37.3861, lng: -122.0839 },
  { city: "Palo Alto", county: "Santa Clara", region: "Bay Area", lat: 37.4419, lng: -122.1430 },
  { city: "Redwood City", county: "San Mateo", region: "Bay Area", lat: 37.4852, lng: -122.2364 },
  { city: "San Mateo", county: "San Mateo", region: "Bay Area", lat: 37.5630, lng: -122.3255 },
  { city: "Daly City", county: "San Mateo", region: "Bay Area", lat: 37.6879, lng: -122.4702 },
  { city: "San Francisco", county: "San Francisco", region: "Bay Area", lat: 37.7749, lng: -122.4194, aliases: ["SF", "San Fran"] },
  { city: "South San Francisco", county: "San Mateo", region: "Bay Area", lat: 37.6547, lng: -122.4077, aliases: ["South SF"] },
  { city: "Oakland", county: "Alameda", region: "Bay Area", lat: 37.8044, lng: -122.2711 },
  { city: "Berkeley", county: "Alameda", region: "Bay Area", lat: 37.8715, lng: -122.2730 },
  { city: "Fremont", county: "Alameda", region: "Bay Area", lat: 37.5485, lng: -121.9886 },
  { city: "Hayward", county: "Alameda", region: "Bay Area", lat: 37.6688, lng: -122.0808 },
  { city: "San Leandro", county: "Alameda", region: "Bay Area", lat: 37.7249, lng: -122.1561 },
  { city: "Richmond", county: "Contra Costa", region: "Bay Area", lat: 37.9358, lng: -122.3477 },
  { city: "Concord", county: "Contra Costa", region: "Bay Area", lat: 37.9779, lng: -122.0311 },
  { city: "Walnut Creek", county: "Contra Costa", region: "Bay Area", lat: 37.9101, lng: -122.0652 },
  { city: "San Rafael", county: "Marin", region: "Bay Area", lat: 37.9735, lng: -122.5311 },
  { city: "Novato", county: "Marin", region: "Bay Area", lat: 38.1074, lng: -122.5697 },
  { city: "Santa Rosa", county: "Sonoma", region: "North Bay", lat: 38.4405, lng: -122.7144 },
  { city: "Napa", county: "Napa", region: "North Bay", lat: 38.2975, lng: -122.2869 },
  { city: "Vallejo", county: "Solano", region: "North Bay", lat: 38.1041, lng: -122.2566 },
  { city: "Fairfield", county: "Solano", region: "North Bay", lat: 38.2494, lng: -122.0390 },
  { city: "Vacaville", county: "Solano", region: "North Bay", lat: 38.3566, lng: -121.9877 },

  { city: "Santa Cruz", county: "Santa Cruz", region: "Monterey Bay", lat: 36.9741, lng: -122.0308 },
  { city: "Watsonville", county: "Santa Cruz", region: "Monterey Bay", lat: 36.9102, lng: -121.7569 },
  { city: "Monterey", county: "Monterey", region: "Monterey Bay", lat: 36.6002, lng: -121.8947 },
  { city: "Salinas", county: "Monterey", region: "Monterey Bay", lat: 36.6777, lng: -121.6555 },

  { city: "Sacramento", county: "Sacramento", region: "Sacramento", lat: 38.5816, lng: -121.4944 },
  { city: "Elk Grove", county: "Sacramento", region: "Sacramento", lat: 38.4088, lng: -121.3716 },
  { city: "Davis", county: "Yolo", region: "Sacramento", lat: 38.5449, lng: -121.7405 },
  { city: "Woodland", county: "Yolo", region: "Sacramento", lat: 38.6785, lng: -121.7733 },

  { city: "Stockton", county: "San Joaquin", region: "Central Valley", lat: 37.9577, lng: -121.2908 },
  { city: "Tracy", county: "San Joaquin", region: "Central Valley", lat: 37.7397, lng: -121.4252 },
  { city: "Manteca", county: "San Joaquin", region: "Central Valley", lat: 37.7974, lng: -121.2161 },

  { city: "Modesto", county: "Stanislaus", region: "Central Valley", lat: 37.6391, lng: -120.9969 },
  { city: "Turlock", county: "Stanislaus", region: "Central Valley", lat: 37.4947, lng: -120.8466 },
  { city: "Merced", county: "Merced", region: "Central Valley", lat: 37.3022, lng: -120.4820 },

  { city: "Fresno", county: "Fresno", region: "Central Valley", lat: 36.7378, lng: -119.7871 },
  { city: "Visalia", county: "Tulare", region: "Central Valley", lat: 36.3302, lng: -119.2921 },
  { city: "Bakersfield", county: "Kern", region: "Central Valley", lat: 35.3733, lng: -119.0187 },
];

// Alias map: normalized -> canonical city
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const CITY_ALIASES: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const c of CA_CITIES) {
    map[normalize(c.city)] = c.city;
    for (const a of c.aliases || []) map[normalize(a)] = c.city;
  }
  // Friendly extras
  map["san jose"] = "San José";
  map["sanjose"] = "San José";
  map["sj"] = "San José";
  map["sf"] = "San Francisco";
  map["south sf"] = "South San Francisco";
  return map;
})();

// Minimal ZIP geo starter (expand freely)
export const ZIP_GEO: Record<string, { lat: number; lng: number; city: string }> = {
  // San José
  "95112": { lat: 37.3443, lng: -121.8890, city: "San José" },
  "95110": { lat: 37.3487, lng: -121.9160, city: "San José" },
  "95111": { lat: 37.2833, lng: -121.8330, city: "San José" },
  "95116": { lat: 37.3513, lng: -121.8520, city: "San José" },

  // Santa Clara / Milpitas
  "95050": { lat: 37.3515, lng: -121.9521, city: "Santa Clara" },
  "95051": { lat: 37.3480, lng: -121.9841, city: "Santa Clara" },
  "95035": { lat: 37.4323, lng: -121.8996, city: "Milpitas" },

  // Sunnyvale / Cupertino / Mountain View / Palo Alto
  "94086": { lat: 37.3719, lng: -122.0260, city: "Sunnyvale" },
  "95014": { lat: 37.3229, lng: -122.0322, city: "Cupertino" },
  "94040": { lat: 37.3861, lng: -122.0839, city: "Mountain View" },
  "94301": { lat: 37.4419, lng: -122.1430, city: "Palo Alto" },

  // Modesto / Stockton / Sacramento
  "95350": { lat: 37.6676, lng: -121.0000, city: "Modesto" },
  "95202": { lat: 37.9577, lng: -121.2908, city: "Stockton" },
  "95814": { lat: 38.5816, lng: -121.4944, city: "Sacramento" },

  // San Francisco / Oakland
  "94103": { lat: 37.7726, lng: -122.4099, city: "San Francisco" },
  "94607": { lat: 37.8044, lng: -122.2711, city: "Oakland" },
};
