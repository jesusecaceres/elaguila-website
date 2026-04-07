export type SavedListingId = string;

const KEY = "leonix_saved_listings_v1";

function safeParseIds(raw: string | null): SavedListingId[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
    return [];
  } catch {
    return [];
  }
}

export function getSavedListingIds(): SavedListingId[] {
  if (typeof window === "undefined") return [];
  return safeParseIds(window.localStorage.getItem(KEY));
}

function setSavedListingIds(ids: SavedListingId[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  // Notify same-tab listeners
  window.dispatchEvent(new Event("leonix_saved_change"));
}

export function isListingSaved(id: SavedListingId): boolean {
  const ids = getSavedListingIds();
  return ids.includes(id);
}

/** Toggle saved state; returns next saved state (true if saved after toggle). */
export function toggleListingSaved(id: SavedListingId): boolean {
  const ids = getSavedListingIds();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  setSavedListingIds(next);
  return next.includes(id);
}

/** Subscribe to changes (same-tab custom event + cross-tab storage event). */
export function onSavedListingsChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onCustom = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("leonix_saved_change", onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("leonix_saved_change", onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
