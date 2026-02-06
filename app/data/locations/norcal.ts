// app/data/locations/norcal.ts
// Phase 1 (LOCKED): California counties + cities list for the Clasificados Lista engine.
// Source of truth for coordinates: U.S. Census Bureau Gazetteer (Places) (CA + nearby edge cities as needed).
//
// IMPORTANT:
// - CITY_ALIASES maps user input -> canonical city name.
// - ZIP_GEO is lat/lng ONLY (do NOT assume ZIP -> city name).
// - CA_CITIES is the canonical list for city suggestions + nearby chips generation.

export type LatLng = { lat: number; lng: number };

export type CityRecord = {
  city: string;
  county: string;
  lat: number;
  lng: number;
};

export type ZipGeoRecord = LatLng;

// Defaults (safe + predictable)
export const DEFAULT_CITY = "San José";
export const DEFAULT_RADIUS_MI = 25;

// Normalize helpers live in page.tsx; keep this file data-only.
export const CITY_ALIASES: Record<string, string> = {
  // common variations
  "san jose": "San José",
  sanjose: "San José",
  sj: "San José",
  "san josé": "San José",
  "san jose ca": "San José",
  "san josé ca": "San José",

  // accents / formatting
  "los gatos": "Los Gatos",
  losgatos: "Los Gatos",
  "mountain view": "Mountain View",
  mountainview: "Mountain View",

  // south/east bay common shorthand
  "santa clara": "Santa Clara",
  santaclara: "Santa Clara",
  "milpitas": "Milpitas",
  "campbell": "Campbell",
  "sunnyvale": "Sunnyvale",
  "cupertino": "Cupertino",
  "saratoga": "Saratoga",
  "los altos": "Los Altos",
  "palo alto": "Palo Alto",
  paloalto: "Palo Alto",

  // add more aliases as you see real user behavior
};

// Canonical CA city list (for suggestions + nearby chips)
export const CA_CITIES: CityRecord[] = [
  // Santa Clara County (core)
  { city: "San José", county: "Santa Clara", lat: 37.338207, lng: -121.88633 },
  { city: "Santa Clara", county: "Santa Clara", lat: 37.354108, lng: -121.955236 },
  { city: "Sunnyvale", county: "Santa Clara", lat: 37.36883, lng: -122.03635 },
  { city: "Cupertino", county: "Santa Clara", lat: 37.322997, lng: -122.032182 },
  { city: "Campbell", county: "Santa Clara", lat: 37.287166, lng: -121.949956 },
  { city: "Milpitas", county: "Santa Clara", lat: 37.432334, lng: -121.899574 },
  { city: "Los Gatos", county: "Santa Clara", lat: 37.235808, lng: -121.962375 },
  { city: "Monte Sereno", county: "Santa Clara", lat: 37.236944, lng: -121.9925 },
  { city: "Saratoga", county: "Santa Clara", lat: 37.263832, lng: -122.023015 },
  { city: "Mountain View", county: "Santa Clara", lat: 37.386052, lng: -122.083851 },
  { city: "Los Altos", county: "Santa Clara", lat: 37.385218, lng: -122.11413 },
  { city: "Palo Alto", county: "Santa Clara", lat: 37.441883, lng: -122.143019 },

  // Alameda County (edge)
  { city: "Fremont", county: "Alameda", lat: 37.54827, lng: -121.988571 },
  { city: "Newark", county: "Alameda", lat: 37.529659, lng: -122.040238 },
  { city: "Union City", county: "Alameda", lat: 37.593391, lng: -122.043829 },
  { city: "Hayward", county: "Alameda", lat: 37.668821, lng: -122.080796 },

  // San Mateo County (edge)
  { city: "Redwood City", county: "San Mateo", lat: 37.485215, lng: -122.236355 },
  { city: "San Mateo", county: "San Mateo", lat: 37.562991, lng: -122.325525 },
  { city: "Daly City", county: "San Mateo", lat: 37.687925, lng: -122.470207 },

  // Contra Costa County (edge)
  { city: "Walnut Creek", county: "Contra Costa", lat: 37.910078, lng: -122.065181 },
  { city: "Concord", county: "Contra Costa", lat: 37.977978, lng: -122.031074 },

  // Add more as you expand coverage
];

// ZIP -> lat/lng ONLY (no assumptions about city names)
export const ZIP_GEO: Record<string, ZipGeoRecord> = {
  // Core San José / Santa Clara area (examples; extend as you grow)
  "95110": { lat: 37.3483, lng: -121.9147 },
  "95111": { lat: 37.2842, lng: -121.8247 },
  "95112": { lat: 37.3447, lng: -121.8846 },
  "95113": { lat: 37.3357, lng: -121.8907 },
  "95116": { lat: 37.3503, lng: -121.8504 },
  "95117": { lat: 37.3122, lng: -121.9627 },
  "95118": { lat: 37.2562, lng: -121.8894 },
  "95119": { lat: 37.2282, lng: -121.7887 },
  "95120": { lat: 37.1992, lng: -121.8354 },
  "95121": { lat: 37.302, lng: -121.8096 },
  "95122": { lat: 37.3297, lng: -121.8336 },
  "95123": { lat: 37.2459, lng: -121.8331 },
  "95124": { lat: 37.2558, lng: -121.9225 },
  "95125": { lat: 37.2943, lng: -121.8924 },
  "95126": { lat: 37.3259, lng: -121.9168 },
  "95127": { lat: 37.371, lng: -121.7922 },
  "95128": { lat: 37.3174, lng: -121.9356 },
  "95129": { lat: 37.3055, lng: -122.0024 },
  "95130": { lat: 37.2864, lng: -121.9767 },
  "95131": { lat: 37.3883, lng: -121.889 },
  "95132": { lat: 37.4184, lng: -121.8529 },
  "95133": { lat: 37.3715, lng: -121.8602 },
  "95134": { lat: 37.4313, lng: -121.9447 },
  "95135": { lat: 37.3008, lng: -121.7592 },
  "95136": { lat: 37.2702, lng: -121.849 },
  "95138": { lat: 37.2477, lng: -121.7452 },
  "95139": { lat: 37.2264, lng: -121.7664 },
  "95140": { lat: 37.3321, lng: -121.889 },

  // Santa Clara
  "95050": { lat: 37.3513, lng: -121.9528 },
  "95051": { lat: 37.3491, lng: -121.9842 },
  "95054": { lat: 37.3926, lng: -121.9516 },

  // Sunnyvale
  "94085": { lat: 37.3897, lng: -122.017 },
  "94086": { lat: 37.3714, lng: -122.0231 },
  "94087": { lat: 37.3529, lng: -122.036 },
  "94089": { lat: 37.4068, lng: -122.0081 },

  // Cupertino
  "95014": { lat: 37.3161, lng: -122.0462 },

  // Mountain View
  "94040": { lat: 37.3861, lng: -122.0839 },
  "94041": { lat: 37.3893, lng: -122.0819 },
  "94043": { lat: 37.4192, lng: -122.0574 },
};
