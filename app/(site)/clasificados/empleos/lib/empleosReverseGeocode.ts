/**
 * Client-only reverse geocode for “use my location” (opt-in).
 * Uses Nominatim — respect usage policy: single user action, cache results, no bulk calls.
 */

const US_STATE_NAME_TO_CODE: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

export type ReverseGeocodeFill = {
  city: string;
  state: string;
  zip: string;
};

export async function reverseGeocodeLatLng(lat: number, lng: number): Promise<ReverseGeocodeFill | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&format=json&addressdetails=1`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      // Nominatim requires a valid User-Agent identifying the application
      "User-Agent": "LeonixClasificados/1.0 (empleos location opt-in)",
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    address?: Record<string, string>;
  };
  const a = data.address;
  if (!a) return null;

  const city = a.city || a.town || a.village || a.hamlet || a.county || "";
  let state = "";
  const iso = a["ISO3166-2-lvl4"];
  if (typeof iso === "string" && iso.startsWith("US-")) {
    state = iso.slice(3);
  } else if (a.state) {
    const s = a.state;
    state = s.length === 2 ? s.toUpperCase() : US_STATE_NAME_TO_CODE[s] ?? "";
  }
  const rawZip = a.postcode ?? "";
  const zip = rawZip.replace(/\D/g, "").slice(0, 5);

  if (!city && !zip) return null;

  return {
    city: city.trim(),
    state: state.trim(),
    zip,
  };
}
