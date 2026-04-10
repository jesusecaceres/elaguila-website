/**
 * First-party Restaurantes preferences (client-only).
 * **Requires** `leonixPersonalizationAllowed()` from `@/app/lib/leonixPublicConsent` before reading/writing.
 *
 * Stores: last discovery context (city, zip, cuisine, sort, service mode) — no precise GPS persistence.
 */

import { leonixPersonalizationAllowed } from "@/app/lib/leonixPublicConsent";

import type { RestaurantesDiscoveryState } from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";

export const RESTAURANTES_SAVED_IDS_KEY = "leonix_restaurantes_saved_ids_v1";
export const RESTAURANTES_PREFS_KEY = "leonix_restaurantes_discovery_prefs_v1";

export type RestaurantesDiscoveryPrefs = {
  lastCity?: string;
  lastZip?: string;
  lastCuisine?: string;
  lastSort?: RestaurantesDiscoveryState["sort"];
  lastSvc?: string;
  updatedAt: string;
};

function safeReadSavedIds(): Set<string> {
  if (typeof window === "undefined" || !leonixPersonalizationAllowed()) return new Set();
  try {
    const raw = window.localStorage.getItem(RESTAURANTES_SAVED_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export function readRestaurantesSavedIds(): Set<string> {
  return safeReadSavedIds();
}

export function writeRestaurantesSavedIds(ids: Set<string>): void {
  if (typeof window === "undefined" || !leonixPersonalizationAllowed()) return;
  try {
    window.localStorage.setItem(RESTAURANTES_SAVED_IDS_KEY, JSON.stringify([...ids]));
  } catch {
    /* quota */
  }
}

export function readRestaurantesDiscoveryPrefs(): RestaurantesDiscoveryPrefs | null {
  if (typeof window === "undefined" || !leonixPersonalizationAllowed()) return null;
  try {
    const raw = window.localStorage.getItem(RESTAURANTES_PREFS_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as Partial<RestaurantesDiscoveryPrefs>;
    if (!j?.updatedAt) return null;
    return {
      lastCity: j.lastCity,
      lastZip: j.lastZip,
      lastCuisine: j.lastCuisine,
      lastSort: j.lastSort,
      lastSvc: j.lastSvc,
      updatedAt: j.updatedAt,
    };
  } catch {
    return null;
  }
}

/** Persist coarse discovery hints after a successful search (no precise location). */
export function rememberRestaurantesDiscoveryFromState(s: RestaurantesDiscoveryState): void {
  if (typeof window === "undefined" || !leonixPersonalizationAllowed()) return;
  const prefs: RestaurantesDiscoveryPrefs = {
    lastCity: s.city || undefined,
    lastZip: s.zip || undefined,
    lastCuisine: s.cuisine || undefined,
    lastSort: s.sort,
    lastSvc: s.svc || undefined,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(RESTAURANTES_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* */
  }
}
