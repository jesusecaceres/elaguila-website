import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { normalizeLoadedListing } from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";
import { stripDraftMuxFields } from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftGuards";
import { idbClearDraftVideo, idbGetDraftVideoDataUrl, idbPutDraftVideoDataUrl } from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftVideoIdb";
import {
  clearDraftListingImageAndLogoIdb,
  inlineDraftListingAssetsFromIdb,
  offloadDraftListingAssetsToIdb,
} from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftIdbRefs";
import { buildAutosPrivadoDraftLocalStorageKey } from "./autosPrivadoDraftNamespace";

export type AutosPrivadoDraftV1 = {
  v: 1;
  vehicleTitleOverride: boolean;
  listing: AutoDealerListing;
};

export function isAutosPrivadoDraftV1(x: unknown): x is AutosPrivadoDraftV1 {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return o.v === 1 && typeof o.vehicleTitleOverride === "boolean" && typeof o.listing === "object" && o.listing !== null;
}

export function loadAutosPrivadoDraft(namespace: string): AutosPrivadoDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(buildAutosPrivadoDraftLocalStorageKey(namespace));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isAutosPrivadoDraftV1(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Full draft load: same IndexedDB rehydration as Negocios so file-sourced images survive localStorage quota limits.
 */
export async function loadAutosPrivadoDraftResolved(namespace: string): Promise<AutosPrivadoDraftV1 | null> {
  const sync = loadAutosPrivadoDraft(namespace);
  if (!sync) return null;
  let listing = stripDraftMuxFields(normalizeLoadedListing({ ...sync.listing, autosLane: "privado" }));
  listing = await inlineDraftListingAssetsFromIdb(namespace, listing);
  listing = stripDraftMuxFields(normalizeLoadedListing(listing));
  if (listing.videoSourceType === "file") {
    const inline = listing.videoFileDataUrl?.trim();
    if (!inline) {
      const fromIdb = await idbGetDraftVideoDataUrl(namespace);
      if (fromIdb) {
        listing = { ...listing, videoFileDataUrl: fromIdb };
      }
    }
  }
  return { ...sync, listing: stripDraftMuxFields(normalizeLoadedListing({ ...listing, autosLane: "privado" })) };
}

/**
 * Persists draft: offloads large data URLs to IndexedDB (shared KV store + key scheme with Negocios, namespaced by draft id).
 */
export async function saveAutosPrivadoDraftResolved(namespace: string, draft: AutosPrivadoDraftV1): Promise<void> {
  if (typeof window === "undefined") return;
  let listing = stripDraftMuxFields(normalizeLoadedListing({ ...draft.listing, autosLane: "privado" }));
  listing = await offloadDraftListingAssetsToIdb(namespace, listing);
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

  const payload: AutosPrivadoDraftV1 = {
    ...draft,
    listing: stripDraftMuxFields(normalizeLoadedListing({ ...toStore, autosLane: "privado" })),
  };

  try {
    window.localStorage.setItem(buildAutosPrivadoDraftLocalStorageKey(namespace), JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export async function clearAutosPrivadoDraft(namespace: string): Promise<void> {
  if (typeof window === "undefined") return;
  const sync = loadAutosPrivadoDraft(namespace);
  try {
    window.localStorage.removeItem(buildAutosPrivadoDraftLocalStorageKey(namespace));
  } catch {
    /* ignore */
  }
  await clearDraftListingImageAndLogoIdb(namespace, sync?.listing ?? null);
  await idbClearDraftVideo(namespace);
}
