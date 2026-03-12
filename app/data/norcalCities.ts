/**
 * NorCal cities dataset for city autocomplete (listing city, distance calculator).
 * Subset of Northern California cities with lat/lng for distance calculation.
 */

export type NorCalCity = {
  name: string;
  lat: number;
  lng: number;
};

export const NORCAL_CITIES: NorCalCity[] = [
  { name: "Sacramento", lat: 38.5816, lng: -121.4944 },
  { name: "Elk Grove", lat: 38.4088, lng: -121.3716 },
  { name: "Stockton", lat: 37.9577, lng: -121.2908 },
  { name: "Lodi", lat: 38.1302, lng: -121.2722 },
  { name: "Modesto", lat: 37.6391, lng: -120.9969 },
  { name: "Tracy", lat: 37.7397, lng: -121.4252 },
  { name: "Manteca", lat: 37.7974, lng: -121.2161 },
  { name: "Galt", lat: 38.2546, lng: -121.2999 },
  { name: "Folsom", lat: 38.6780, lng: -121.1761 },
  { name: "Roseville", lat: 38.7521, lng: -121.2880 },
  { name: "Rocklin", lat: 38.7907, lng: -121.2358 },
  { name: "Davis", lat: 38.5449, lng: -121.7405 },
  { name: "Woodland", lat: 38.6785, lng: -121.7733 },
  { name: "Vacaville", lat: 38.3566, lng: -121.9877 },
  { name: "Fairfield", lat: 38.2494, lng: -122.0398 },
  { name: "Antioch", lat: 38.0049, lng: -121.8058 },
  { name: "Brentwood", lat: 37.9319, lng: -121.6960 },
  { name: "Concord", lat: 37.9780, lng: -122.0311 },
  { name: "San Jose", lat: 37.3382, lng: -121.8863 },
  { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
  { name: "Salinas", lat: 36.6777, lng: -121.6555 },
];

/** City names only for autocomplete suggestions */
export const NORCAL_CITY_NAMES = NORCAL_CITIES.map((c) => c.name);
