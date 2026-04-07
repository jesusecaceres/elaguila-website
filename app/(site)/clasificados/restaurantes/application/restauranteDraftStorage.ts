import { createEmptyRestauranteDraft, mergeRestauranteDraft } from "./createEmptyRestauranteDraft";
import type { RestauranteListingDraft } from "./restauranteDraftTypes";

/**
 * Session-scoped key: survives edit ↔ preview, in-tab refresh, and "Volver a editar" while the tab/session lasts.
 * Clears when the browsing session ends (tab closed). Not long-lived across days/weeks.
 */
export const RESTAURANTES_DRAFT_STORAGE_KEY = "restaurantes-draft";

/** Legacy localStorage key (pre session-retention phase) — read once then removed. */
const LEGACY_LOCAL_KEY = RESTAURANTES_DRAFT_STORAGE_KEY;

type Wrapped = { v: 1; draft: RestauranteListingDraft };

function wrap(d: RestauranteListingDraft): Wrapped {
  return { v: 1, draft: d };
}

function removeLegacyLocalDraft(): void {
  try {
    window.localStorage.removeItem(LEGACY_LOCAL_KEY);
  } catch {
    /* ignore */
  }
}

export function loadRestauranteDraftFromStorage(): RestauranteListingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const sessionRaw = window.sessionStorage.getItem(RESTAURANTES_DRAFT_STORAGE_KEY);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw) as unknown;
      removeLegacyLocalDraft();
      return mergeRestauranteDraft(parsed);
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_LOCAL_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw) as unknown;
      const merged = mergeRestauranteDraft(parsed);
      removeLegacyLocalDraft();
      try {
        window.sessionStorage.setItem(RESTAURANTES_DRAFT_STORAGE_KEY, JSON.stringify(wrap(merged)));
      } catch {
        /* quota / private mode */
      }
      return merged;
    }

    return null;
  } catch {
    return null;
  }
}

export function saveRestauranteDraftToStorage(draft: RestauranteListingDraft): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.sessionStorage.setItem(RESTAURANTES_DRAFT_STORAGE_KEY, JSON.stringify(wrap(draft)));
    removeLegacyLocalDraft();
    return true;
  } catch {
    /* quota / private mode */
    return false;
  }
}

export function clearRestauranteDraftStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(RESTAURANTES_DRAFT_STORAGE_KEY);
    removeLegacyLocalDraft();
  } catch {
    /* ignore */
  }
}

export function resetRestauranteDraftInStorage(): RestauranteListingDraft {
  const next = createEmptyRestauranteDraft();
  saveRestauranteDraftToStorage(next);
  return next;
}
