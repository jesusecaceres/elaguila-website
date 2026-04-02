import type { AutoDealerListing } from "../types/autoDealerListing";
import { normalizeLoadedListing } from "./autoDealerDraftDefaults";
import { idbClearDraftVideo, idbGetDraftVideoDataUrl, idbPutDraftVideoDataUrl } from "./autosNegociosDraftVideoIdb";

/** Matches product spec; single key for publicar + preview. */
export const AUTOS_NEGOCIOS_DRAFT_KEY = "autos-negocios-draft";

export type AutosNegociosDraftV1 = {
  v: 1;
  /** When true, auto title from Y/M/M/T is disabled. */
  vehicleTitleOverride: boolean;
  listing: AutoDealerListing;
};

export function isAutosNegociosDraftV1(x: unknown): x is AutosNegociosDraftV1 {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return o.v === 1 && typeof o.vehicleTitleOverride === "boolean" && typeof o.listing === "object" && o.listing !== null;
}

/** Synchronous parse of localStorage JSON only (large video may live in IndexedDB). */
export function loadAutosNegociosDraft(): AutosNegociosDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTOS_NEGOCIOS_DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isAutosNegociosDraftV1(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Full draft load: merges local video file preview from IndexedDB when it was
 * stripped from JSON to avoid localStorage quota failures.
 */
export async function loadAutosNegociosDraftResolved(): Promise<AutosNegociosDraftV1 | null> {
  const sync = loadAutosNegociosDraft();
  if (!sync) return null;
  let listing = normalizeLoadedListing(sync.listing);
  if (listing.videoSourceType === "file") {
    const inline = listing.videoFileDataUrl?.trim();
    if (!inline) {
      const fromIdb = await idbGetDraftVideoDataUrl();
      if (fromIdb) {
        listing = { ...listing, videoFileDataUrl: fromIdb };
      }
    }
  }
  return { ...sync, listing: normalizeLoadedListing(listing) };
}

/**
 * Persists draft: stores large `videoFileDataUrl` in IndexedDB so the JSON blob
 * stays small and dealer + photos are not lost to silent save failures.
 */
export async function saveAutosNegociosDraftResolved(draft: AutosNegociosDraftV1): Promise<void> {
  if (typeof window === "undefined") return;
  let listing = normalizeLoadedListing(draft.listing);
  let toStore = listing;

  if (listing.videoSourceType === "file") {
    const raw = listing.videoFileDataUrl?.trim() ?? "";
    if (raw) {
      await idbPutDraftVideoDataUrl(raw);
      toStore = { ...listing, videoFileDataUrl: undefined };
    } else {
      await idbClearDraftVideo();
    }
  } else {
    await idbClearDraftVideo();
  }

  const payload: AutosNegociosDraftV1 = {
    ...draft,
    listing: normalizeLoadedListing(toStore),
  };

  try {
    window.localStorage.setItem(AUTOS_NEGOCIOS_DRAFT_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function clearAutosNegociosDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTOS_NEGOCIOS_DRAFT_KEY);
  } catch {
    /* ignore */
  }
  void idbClearDraftVideo();
}
