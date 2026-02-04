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
  // Optional: only used for better search matching/suggestions
  aliases?: string[];
};

// Core coverage: Bay Area + Monterey Bay + Sacramento + Central Valley + key anchors southward.
// Expand weekly without refactors.
export const CA_CITIES: CityRecord[] = [
  {
    city: "San José",
    county: "Santa Clara",
    region: "Bay Area",
    lat: 37.3382,
    lng: -121.8863,
    aliases: ["San Jose", "SJ"],
  },
  {
    city: "Santa Clara",
    county: "Santa Clara",
    region: "Bay Area",
    lat: 37.3541,
    lng: -121.9552,
    aliases: ["Santa Clara, CA"],
  },
  {
    city: "Milpitas",
    county: "Santa Clara",
    region: "Bay Area",
    lat: 37.4323,
    lng: -121.8996,
    aliases: [],
  },
  {
    city: "Sunnyvale",
    county: "Santa Clara",
    region: "Bay Area",
    lat: 37.3688,
    lng: -122.0363,
    aliases: [],
  },
  {
    city: "Mountain View",
    county: "Santa Clara",
    region: "Bay Area",
    lat: 37.3861,
    lng: -122.0839,
    aliases: ["Mt View", "MTV"],
  },
  {
    city: "Palo Alto",
    county: "Santa Clara",
    region: "Bay Area",
    lat: 37.4419,
    lng: -122.143,
    aliases: [],
  },
  {
    city: "Cupertino",
    county: "Santa Clara",
    region: "Bay Area",
    lat: 37.3229,
    lng: -122.0322,
    aliases: [],
  },
  {
    city: "Los Gatos",
    county: "Santa Clara",
    region: "Bay Area",
    lat: 37.2358,
    lng: -121.9624,
    aliases: [],
  },
  {
    city: "Campbell",
    county: "Santa Clara",
    region: "Bay Area",
    lat: 37.2872,
    lng: -121.949,
    aliases: [],
  },
  {
    city: "Morgan Hill",
    county: "Santa Clara",
    region: "Bay Area",
    lat: 37.1305,
    lng: -121.6544,
    aliases: [],
  },
  {
    city: "Gilroy",
    county: "Santa Clara",
    region: "Bay Area",
    lat: 37.0058,
    lng: -121.5683,
    aliases: [],
  },

  // Peninsula
  {
    city: "San Mateo",
    county: "San Mateo",
    region: "Bay Area",
    lat: 37.563,
    lng: -122.3255,
    aliases: [],
  },
  {
    city: "Redwood City",
    county: "San Mateo",
    region: "Bay Area",
    lat: 37.4852,
    lng: -122.2364,
    aliases: ["Redwood"],
  },
  {
    city: "South San Francisco",
    county: "San Mateo",
    region: "Bay Area",
    lat: 37.6547,
    lng: -122.4077,
    aliases: ["South SF", "SSF"],
  },

  // SF / East Bay
  {
    city: "San Francisco",
    county: "San Francisco",
    region: "Bay Area",
    lat: 37.7749,
    lng: -122.4194,
    aliases: ["SF", "San Fran"],
  },
  {
    city: "Oakland",
    county: "Alameda",
    region: "Bay Area",
    lat: 37.8044,
    lng: -122.2711,
    aliases: [],
  },
  {
    city: "Berkeley",
    county: "Alameda",
    region: "Bay Area",
    lat: 37.8715,
    lng: -122.273,
    aliases: [],
  },
  {
    city: "Hayward",
    county: "Alameda",
    region: "Bay Area",
    lat: 37.6688,
    lng: -122.0808,
    aliases: [],
  },
  {
    city: "Fremont",
    county: "Alameda",
    region: "Bay Area",
    lat: 37.5483,
    lng: -121.9886,
    aliases: [],
  },

  // North Bay
  {
    city: "San Rafael",
    county: "Marin",
    region: "Bay Area",
    lat: 37.9735,
    lng: -122.5311,
    aliases: [],
  },
  {
    city: "Santa Rosa",
    county: "Sonoma",
    region: "Bay Area",
    lat: 38.4404,
    lng: -122.7141,
    aliases: [],
  },

  // Monterey Bay
  {
    city: "Salinas",
    county: "Monterey",
    region: "Monterey Bay",
    lat: 36.6777,
    lng: -121.6555,
    aliases: [],
  },
  {
    city: "Monterey",
    county: "Monterey",
    region: "Monterey Bay",
    lat: 36.6002,
    lng: -121.8947,
    aliases: [],
  },
  {
    city: "Santa Cruz",
    county: "Santa Cruz",
    region: "Monterey Bay",
    lat: 36.9741,
    lng: -122.0308,
    aliases: [],
  },

  // Central Valley / Sacramento anchors
  {
    city: "Sacramento",
    county: "Sacramento",
    region: "Central Valley",
    lat: 38.5816,
    lng: -121.4944,
    aliases: [],
  },
  {
    city: "Stockton",
    county: "San Joaquin",
    region: "Central Valley",
    lat: 37.9577,
    lng: -121.2908,
    aliases: [],
  },
  {
    city: "Modesto",
    county: "Stanislaus",
    region: "Central Valley",
    lat: 37.6391,
    lng: -120.9969,
    aliases: [],
  },
];

// Convenience: common input variations → canonical city names
// NOTE: This is separate from CityRecord.aliases. We use BOTH:
// - CITY_ALIASES for fast canonical mapping
// - CityRecord.aliases for suggestions/search matching
export const CITY_ALIASES: Record<string, string> = (() => {
  const map: Record<string, string> = {};

  // Always normalize keys to lowercase/no accents in code that uses this map
  map["san jose"] = "San José";
  map["sanjose"] = "San José";
  map["sj"] = "San José";
  map["sf"] = "San Francisco";
  map["san fran"] = "San Francisco";
  map["south sf"] = "South San Francisco";
  map["ssf"] = "South San Francisco";

  return map;
})();

// Minimal ZIP geo starter (expand freely)
// LOCKED: ZIP_GEO is lat/lng ONLY. Do not depend on ZIP → city name in code.
export const ZIP_GEO: Record<string, { lat: number; lng: number }> = {
  // San José
  "95112": { lat: 37.3443, lng: -121.889 },
  "95110": { lat: 37.3487, lng: -121.916 },
  "95111": { lat: 37.2833, lng: -121.828 },
  "95116": { lat: 37.3496, lng: -121.8509 },
  "95117": { lat: 37.3129, lng: -121.9615 },
  "95118": { lat: 37.2557, lng: -121.8892 },
  "95121": { lat: 37.307, lng: -121.8119 },

  // Santa Clara / Milpitas
  "95050": { lat: 37.3516, lng: -121.9521 },
  "95051": { lat: 37.3489, lng: -121.9841 },
  "95035": { lat: 37.4323, lng: -121.8996 },

  // Sunnyvale / Cupertino / Mountain View / Palo Alto
  "94086": { lat: 37.3719, lng: -122.026 },
  "95014": { lat: 37.3229, lng: -122.0322 },
  "94040": { lat: 37.3861, lng: -122.0839 },
  "94301": { lat: 37.4419, lng: -122.143 },

  // Modesto / Stockton / Sacramento
  "95350": { lat: 37.6676, lng: -121.0 },
  "95202": { lat: 37.9577, lng: -121.2908 },
  "95814": { lat: 38.5816, lng: -121.4944 },

  // San Francisco / Oakland
  "94103": { lat: 37.7726, lng: -122.4099 },
  "94607": { lat: 37.8044, lng: -122.2711 },
};
