import { createEmptyRestauranteDraft, mergeRestauranteDraft } from "./createEmptyRestauranteDraft";
import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import {
  clearRestauranteDraftMediaNamespace,
  inlineRestauranteDraftMedia,
  offloadRestauranteDraftMedia,
} from "./restauranteDraftMedia";

/**
 * Session-scoped key: survives edit ↔ preview, in-tab refresh, and "Volver a editar" while the tab/session lasts.
 * Heavy `data:` media is stored in IndexedDB; JSON in sessionStorage holds refs + form fields.
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

function draftMediaNamespace(d: RestauranteListingDraft): string {
  return `rt-${d.draftListingId}`;
}

/** Sync read: compact JSON (may contain `__LX_RT_IDB__` refs or legacy inline data URLs). */
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

/** Full rehydration for editor/preview (merges JSON + IndexedDB blobs). */
export async function loadRestauranteDraftFromStorageResolved(): Promise<RestauranteListingDraft | null> {
  const sync = loadRestauranteDraftFromStorage();
  if (!sync) return null;
  try {
    return await inlineRestauranteDraftMedia(draftMediaNamespace(sync), sync);
  } catch {
    return sync;
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

/** Offload large `data:` payloads to IndexedDB, then persist JSON. */
export async function saveRestauranteDraftToStorageResolved(draft: RestauranteListingDraft): Promise<boolean> {
  const ns = draftMediaNamespace(draft);
  const stripped = await offloadRestauranteDraftMedia(ns, draft);
  return saveRestauranteDraftToStorage(stripped);
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

/** Remove session JSON and all IndexedDB blobs for the current draft id. */
export async function clearRestauranteDraftStorageAndIdb(): Promise<void> {
  const cur = loadRestauranteDraftFromStorage();
  clearRestauranteDraftStorage();
  if (cur?.draftListingId) {
    await clearRestauranteDraftMediaNamespace(draftMediaNamespace(cur));
  }
}

export async function resetRestauranteDraftInStorage(): Promise<RestauranteListingDraft> {
  const before = loadRestauranteDraftFromStorage();
  const next = createEmptyRestauranteDraft();
  clearRestauranteDraftStorage();
  if (before?.draftListingId) {
    await clearRestauranteDraftMediaNamespace(draftMediaNamespace(before));
  }
  saveRestauranteDraftToStorage(next);
  return next;
}
