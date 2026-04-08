import type { AutoDealerListing } from "../types/autoDealerListing";
import { normalizeLoadedListing } from "./autoDealerDraftDefaults";
import {
  AUTOS_NEGOCIOS_DRAFT_STORAGE_PREFIX,
  buildAutosNegociosDraftLocalStorageKey,
  LEGACY_AUTOS_NEGOCIOS_DRAFT_KEY,
} from "./autosNegociosDraftNamespace";
import { stripDraftMuxFields } from "./autosNegociosDraftGuards";
import { idbClearDraftVideo, idbGetDraftVideoDataUrl, idbPutDraftVideoDataUrl } from "./autosNegociosDraftVideoIdb";
import {
  clearDraftListingImageAndLogoIdb,
  inlineDraftListingAssetsFromIdb,
  offloadDraftListingAssetsToIdb,
  stripUnresolvedIdbRefsFromListing,
} from "./autosNegociosDraftIdbRefs";
import { safeNormalizeAutosDraftListing } from "@/app/clasificados/autos/shared/lib/safeNormalizeAutosDraftListing";

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

function coerceLooseAutosNegociosDraftV1(parsed: unknown): AutosNegociosDraftV1 | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  if (o.v !== 1) return null;
  if (!o.listing || typeof o.listing !== "object") return null;
  const vehicleTitleOverride = o.vehicleTitleOverride === true;
  return {
    v: 1,
    vehicleTitleOverride,
    listing: safeNormalizeAutosDraftListing(o.listing, "negocios"),
  };
}

function stripBrokenFileVideo(listing: AutoDealerListing): AutoDealerListing {
  if (listing.videoSourceType !== "file") return listing;
  if (listing.videoFileDataUrl?.trim()) return listing;
  return {
    ...listing,
    videoSourceType: null,
    videoFileDataUrl: undefined,
    videoFileName: undefined,
    videoUploadStatus: null,
  };
}

/** Synchronous parse of localStorage JSON only (large video may live in IndexedDB). */
export function loadAutosNegociosDraft(namespace: string): AutosNegociosDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const storageKey = buildAutosNegociosDraftLocalStorageKey(namespace);
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isAutosNegociosDraftV1(parsed)) {
      return {
        v: 1,
        vehicleTitleOverride: parsed.vehicleTitleOverride,
        listing: safeNormalizeAutosDraftListing(parsed.listing, "negocios"),
      };
    }
    return coerceLooseAutosNegociosDraftV1(parsed);
  } catch {
    return null;
  }
}

/**
 * Full draft load: merges local video + image/logo blobs from IndexedDB when stripped from JSON.
 * Never throws; drops broken assets and returns null only when nothing usable remains.
 */
export async function loadAutosNegociosDraftResolved(namespace: string): Promise<AutosNegociosDraftV1 | null> {
  try {
    const sync = loadAutosNegociosDraft(namespace);
    if (!sync) return null;

    const baseListing = stripDraftMuxFields(safeNormalizeAutosDraftListing(sync.listing, "negocios"));

    let listing = baseListing;
    try {
      listing = await inlineDraftListingAssetsFromIdb(namespace, listing);
    } catch {
      listing = stripUnresolvedIdbRefsFromListing(
        stripDraftMuxFields(safeNormalizeAutosDraftListing(sync.listing, "negocios")),
      );
    }

    listing = stripDraftMuxFields(safeNormalizeAutosDraftListing(listing, "negocios"));

    if (listing.videoSourceType === "file") {
      const inline = listing.videoFileDataUrl?.trim();
      if (!inline) {
        try {
          const fromIdb = await idbGetDraftVideoDataUrl(namespace);
          if (fromIdb) {
            listing = { ...listing, videoFileDataUrl: fromIdb };
          } else {
            listing = stripBrokenFileVideo(listing);
          }
        } catch {
          listing = stripBrokenFileVideo(listing);
        }
      }
    }

    listing = stripDraftMuxFields(safeNormalizeAutosDraftListing(listing, "negocios"));

    return { ...sync, listing };
  } catch {
    return null;
  }
}

/**
 * Persists draft: offloads large data URLs to IndexedDB so localStorage quota does not drop the draft.
 * Mux: attach `muxAssetId` / `muxPlaybackId` only after publish/checkout is wired — loads strip these for safe preview.
 */
export async function saveAutosNegociosDraftResolved(namespace: string, draft: AutosNegociosDraftV1): Promise<void> {
  if (typeof window === "undefined") return;
  let listing = stripDraftMuxFields(normalizeLoadedListing(draft.listing));
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

export async function clearAutosNegociosDraft(namespace: string): Promise<void> {
  if (typeof window === "undefined") return;
  const sync = loadAutosNegociosDraft(namespace);
  const storageKey = buildAutosNegociosDraftLocalStorageKey(namespace);
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    /* ignore */
  }
  await clearDraftListingImageAndLogoIdb(namespace, sync?.listing ?? null);
  await idbClearDraftVideo(namespace);
}
