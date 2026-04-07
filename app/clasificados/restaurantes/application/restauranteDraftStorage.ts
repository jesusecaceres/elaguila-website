import { createEmptyRestauranteDraft, mergeRestauranteDraft } from "./createEmptyRestauranteDraft";
import type { RestauranteListingDraft } from "./restauranteDraftTypes";

/** User-requested storage key for Restaurantes local draft */
export const RESTAURANTES_DRAFT_STORAGE_KEY = "restaurantes-draft";

type Wrapped = { v: 1; draft: RestauranteListingDraft };

function wrap(d: RestauranteListingDraft): Wrapped {
  return { v: 1, draft: d };
}

export function loadRestauranteDraftFromStorage(): RestauranteListingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RESTAURANTES_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return mergeRestauranteDraft(parsed);
  } catch {
    return null;
  }
}

export function saveRestauranteDraftToStorage(draft: RestauranteListingDraft): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(RESTAURANTES_DRAFT_STORAGE_KEY, JSON.stringify(wrap(draft)));
    return true;
  } catch {
    /* quota / private mode */
    return false;
  }
}

export function clearRestauranteDraftStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RESTAURANTES_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function resetRestauranteDraftInStorage(): RestauranteListingDraft {
  const next = createEmptyRestauranteDraft();
  saveRestauranteDraftToStorage(next);
  return next;
}
