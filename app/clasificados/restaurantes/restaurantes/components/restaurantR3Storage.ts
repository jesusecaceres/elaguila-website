"use client";

export type RestaurantReview = {
  id: string;
  rating: number; // 1-5
  note: string;
  createdAt: string; // ISO
};

const REVIEWS_KEY_PREFIX = "leonix_restaurant_reviews_v1:";
const ALERTS_KEY = "leonix_restaurant_alerts_v1";

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
      note: (review.note || "").slice(0, 600),
      createdAt: new Date().toISOString(),
    },
    ...current,
  ].slice(0, 50); // cap to keep it light

  window.localStorage.setItem(key, JSON.stringify(next));
}

export function getReviewStats(restaurantId: string): { avg: number; count: number } {
  const items = getReviews(restaurantId);
  const count = items.length;
  if (!count) return { avg: 0, count: 0 };
  const sum = items.reduce((a, r) => a + (Number(r.rating) || 0), 0);
  const avg = Math.round((sum / count) * 10) / 10;
  return { avg, count };
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
