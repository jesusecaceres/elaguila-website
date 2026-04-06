import type { AutoDealerListing } from "../types/autoDealerListing";
import { normalizeLoadedListing } from "./autoDealerDraftDefaults";
import {
  AUTOS_NEGOCIOS_DRAFT_STORAGE_PREFIX,
  buildAutosNegociosDraftLocalStorageKey,
  LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY,
} from "./autosNegociosDraftNamespace";
import { stripDraftMuxFields } from "./autosNegociosDraftGuards";
import { idbClearDraftVideo, idbGetDraftVideoDataUrl, idbPutDraftVideoDataUrl } from "./autosNegociosDraftVideoIdb";

/** @deprecated Use `LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY` or `storageEventAffectsAutosNegociosDraft`. */
export const AUTOS_NEGOCIOS_DRAFT_KEY = LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY;

export { AUTOS_NEGOCIOS_DRAFT_STORAGE_PREFIX, LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY } from "./autosNegociosDraftNamespace";
export { storageEventAffectsAutosNegociosDraft } from "./autosNegociosDraftNamespace";

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
export function loadAutosNegociosDraft(namespace: string): AutosNegociosDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const storageKey = buildAutosNegociosDraftLocalStorageKey(namespace);
    const raw = window.localStorage.getItem(storageKey);
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
export async function loadAutosNegociosDraftResolved(namespace: string): Promise<AutosNegociosDraftV1 | null> {
  const sync = loadAutosNegociosDraft(namespace);
  if (!sync) return null;
  let listing = stripDraftMuxFields(normalizeLoadedListing(sync.listing));
  if (listing.videoSourceType === "file") {
    const inline = listing.videoFileDataUrl?.trim();
    if (!inline) {
      const fromIdb = await idbGetDraftVideoDataUrl(namespace);
      if (fromIdb) {
        listing = { ...listing, videoFileDataUrl: fromIdb };
      }
    }
  }
  return { ...sync, listing: stripDraftMuxFields(normalizeLoadedListing(listing)) };
}

/**
 * Persists draft: stores large `videoFileDataUrl` in IndexedDB so the JSON blob
 * stays small and dealer + photos are not lost to silent save failures.
 */
export async function saveAutosNegociosDraftResolved(namespace: string, draft: AutosNegociosDraftV1): Promise<void> {
  if (typeof window === "undefined") return;
  let listing = stripDraftMuxFields(normalizeLoadedListing(draft.listing));
  let toStore = listing;

  if (listing.videoSourceType === "file") {
    const raw = listing.videoFileDataUrl?.trim() ?? "";
    if (raw) {
      await idbPutDraftVideoDataUrl(namespace, raw);
      toStore = { ...listing, videoFileDataUrl: undefined };
    } else {
      await idbClearDraftVideo(namespace);
    }
  } else {
    await idbClearDraftVideo(namespace);
  }

  const payload: AutosNegociosDraftV1 = {
    ...draft,
    listing: stripDraftMuxFields(normalizeLoadedListing(toStore)),
  };

  const storageKey = buildAutosNegociosDraftLocalStorageKey(namespace);
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function clearAutosNegociosDraft(namespace: string): void {
  if (typeof window === "undefined") return;
  const storageKey = buildAutosNegociosDraftLocalStorageKey(namespace);
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    /* ignore */
  }
  void idbClearDraftVideo(namespace);
}
