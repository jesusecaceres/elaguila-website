"use client";

export type RestaurantReview = {
  id: string;
  rating: number; // 1-5
  recommend?: boolean; // would you recommend to families?
  note: string;
  createdAt: string; // ISO
};

const REVIEWS_KEY_PREFIX = "leonix_restaurant_reviews_v1:";
const ALERTS_KEY = "leonix_restaurant_alerts_v1";

const FAVORITES_KEY = "leonix_restaurant_favorites_v1";
const RECENT_CITIES_KEY = "leonix_restaurant_recent_cities_v1";
const GEO_KEY = "leonix_restaurant_geo_v1";

type GeoState = { lat: number; lng: number; updatedAt: string };

function getSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const raw = window.localStorage.getItem(FAVORITES_KEY);
  const items = safeParse<string[]>(raw, []);
  return new Set(Array.isArray(items) ? items.filter(Boolean) : []);
}

export function isFavoriteRestaurant(restaurantId: string): boolean {
  return getSet().has(restaurantId);
}

export function toggleFavoriteRestaurant(restaurantId: string): boolean {
  if (typeof window === "undefined") return false;
  const set = getSet();
  if (set.has(restaurantId)) set.delete(restaurantId);
  else set.add(restaurantId);

  const arr = Array.from(set).slice(0, 500);
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(arr));
  return set.has(restaurantId);
}

export function getFavoriteRestaurantIds(): string[] {
  return Array.from(getSet());
}

export function getRecentCities(): string[] {
  if (typeof window === "undefined") return [];
  const items = safeParse<string[]>(window.localStorage.getItem(RECENT_CITIES_KEY), []);
  return Array.isArray(items) ? items.filter(Boolean).slice(0, 10) : [];
}

export function pushRecentCity(city: string) {
  if (typeof window === "undefined") return;
  const v = (city || "").trim();
  if (!v) return;
  const current = getRecentCities();
  const next = [v, ...current.filter((c) => c.toLowerCase() !== v.toLowerCase())].slice(0, 10);
  window.localStorage.setItem(RECENT_CITIES_KEY, JSON.stringify(next));
}

export function getGeoState(): GeoState | null {
  if (typeof window === "undefined") return null;
  const v = safeParse<GeoState | null>(window.localStorage.getItem(GEO_KEY), null);
  if (!v || typeof v.lat !== "number" || typeof v.lng !== "number") return null;
  return v;
}

export function saveGeoState(lat: number, lng: number) {
  if (typeof window === "undefined") return;
  const next: GeoState = { lat, lng, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(GEO_KEY, JSON.stringify(next));
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getReviews(restaurantId: string): RestaurantReview[] {
  if (typeof window === "undefined") return [];
  const key = `${REVIEWS_KEY_PREFIX}${restaurantId}`;
  const items = safeParse<RestaurantReview[]>(window.localStorage.getItem(key), []);
  return Array.isArray(items) ? items : [];
}

export function addReview(restaurantId: string, review: Omit<RestaurantReview, "id" | "createdAt">) {
  if (typeof window === "undefined") return;

  const key = `${REVIEWS_KEY_PREFIX}${restaurantId}`;
  const current = getReviews(restaurantId);

  const next = [
    {
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      rating: Math.max(1, Math.min(5, Math.round(review.rating))),
      recommend: typeof review.recommend === "boolean" ? review.recommend : (Number(review.rating) >= 4),
      note: (review.note || "").slice(0, 600),
      createdAt: new Date().toISOString(),
    },
    ...current,
  ].slice(0, 50); // cap to keep it light

  window.localStorage.setItem(key, JSON.stringify(next));
}

export function getReviewStats(restaurantId: string): { avg: number; count: number; recommendPct: number } {
  const items = getReviews(restaurantId);
  const count = items.length;

  // No reviews yet
  if (!count) return { avg: 0, count: 0, recommendPct: 0 };

  const sum = items.reduce((a, r) => a + (Number(r.rating) || 0), 0);
  const avg = Math.round((sum / count) * 10) / 10;

  // "Recommend %" is only meaningful once we have enough signal.
  const recommendItems = items.filter((r) => typeof r.recommend === "boolean");
  const denom = recommendItems.length;
  const yes = recommendItems.filter((r) => r.recommend === true).length;
  const recommendPct = denom >= 3 ? Math.round((yes / denom) * 100) : 0;

  return { avg, count, recommendPct };
}

export type RestaurantAlertPrefs = {
  cuisine?: string;
  radiusMi: 10 | 25 | 40 | 50;
  frequency: "weekly" | "biweekly" | "monthly";
  enabled: boolean;
  createdAt: string;
};

export function getAlertPrefs(): RestaurantAlertPrefs {
  if (typeof window === "undefined") {
    return { radiusMi: 25, frequency: "weekly", enabled: false, createdAt: new Date(0).toISOString() };
  }
  const prefs = safeParse<RestaurantAlertPrefs>(
    window.localStorage.getItem(ALERTS_KEY),
    { radiusMi: 25, frequency: "weekly", enabled: false, createdAt: new Date(0).toISOString() }
  );

  return {
    cuisine: prefs.cuisine || "",
    radiusMi: (prefs.radiusMi as any) || 25,
    frequency: (prefs.frequency as any) || "weekly",
    enabled: Boolean(prefs.enabled),
    createdAt: prefs.createdAt || new Date(0).toISOString(),
  };
}

export function saveAlertPrefs(prefs: Omit<RestaurantAlertPrefs, "createdAt">) {
  if (typeof window === "undefined") return;
  const next: RestaurantAlertPrefs = { ...prefs, createdAt: new Date().toISOString() };
  window.localStorage.setItem(ALERTS_KEY, JSON.stringify(next));
}
