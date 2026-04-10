/**
 * Browser geolocation helpers — **only** call after an explicit user gesture (button tap).
 * Does not run on page load. Does not persist precise coordinates to localStorage by default.
 *
 * **Coarse place:** Demo implementation maps lat/lng to a rough metro label for URL `city=`.
 * Replace with server reverse-geocode or regional catalog when production-ready.
 */

export type CoarsePlaceResult = {
  /** For `city` URL param (`cityCanonical` intent) */
  cityLabel: string;
  /** Human-readable note for UI */
  noteEs: string;
  noteEn: string;
};

/** Rough bounding boxes for Costa Rica demo metros (replace with API-backed resolution). */
function coarseMetroFromLatLng(lat: number, lng: number): CoarsePlaceResult {
  if (lat >= 9.85 && lat <= 9.98 && lng >= -84.25 && lng <= -84.05) {
    return {
      cityLabel: "San José",
      noteEs: "Ubicación aproximada: Gran Área Metropolitana. Refina con ciudad o código postal si necesitas más precisión.",
      noteEn: "Approximate location: greater metro area. Refine with city or ZIP if you need more precision.",
    };
  }
  if (lat >= 9.95 && lat <= 10.05 && lng >= -84.2 && lng <= -84.05) {
    return {
      cityLabel: "Heredia",
      noteEs: "Ubicación aproximada: Heredia. Refina con ciudad o código postal si necesitas más precisión.",
      noteEn: "Approximate location: Heredia. Refine with city or ZIP if needed.",
    };
  }
  return {
    cityLabel: "San José",
    noteEs: "Ubicación aproximada (demo). Refina con ciudad o código postal.",
    noteEn: "Approximate location (demo). Refine with city or ZIP.",
  };
}

export function requestCoarsePlaceFromBrowserGeolocation(): Promise<CoarsePlaceResult> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not available"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          sessionStorage.setItem(
            "leonix_restaurantes_last_geo_session",
            JSON.stringify({ lat: latitude, lng: longitude, at: Date.now() }),
          );
        } catch {
          /* session only, best-effort */
        }
        resolve(coarseMetroFromLatLng(latitude, longitude));
      },
      (err) => reject(err),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 },
    );
  });
}
