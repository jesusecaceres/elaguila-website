import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { normalizeLoadedListing } from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";
import { stripDraftMuxFields } from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftGuards";
import { idbClearDraftVideo, idbGetDraftVideoDataUrl, idbPutDraftVideoDataUrl } from "@/app/clasificados/autos/negocios/lib/autosNegociosDraftVideoIdb";
import {
  clearDraftListingImageAndLogoIdb,
  inlineDraftListingAssetsFromIdb,
  mediaIdFromRef,
  offloadDraftListingAssetsToIdb,
  AUTOS_DRAFT_LOGO_REF,
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

/** Normalize listing from storage without throwing; strips risky arrays on failure. */
export function safeNormalizePrivadoListing(raw: unknown): AutoDealerListing {
  const emptyPrivado = (): AutoDealerListing => normalizeLoadedListing({ autosLane: "privado" });
  try {
    if (!raw || typeof raw !== "object") {
      return emptyPrivado();
    }
    const asPartial = { ...(raw as Record<string, unknown>), autosLane: "privado" as const } as Partial<AutoDealerListing>;
    try {
      return normalizeLoadedListing(asPartial);
    } catch {
      try {
        return normalizeLoadedListing({
          ...asPartial,
          mediaImages: [],
          heroImages: [],
          dealerHours: [],
          relatedDealerListings: [],
          badges: [],
          features: [],
          autosLane: "privado",
        });
      } catch {
        return emptyPrivado();
      }
    }
  } catch {
    return emptyPrivado();
  }
}

function coerceLooseAutosPrivadoDraftV1(parsed: unknown): AutosPrivadoDraftV1 | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  if (o.v !== 1) return null;
  if (!o.listing || typeof o.listing !== "object") return null;
  const vehicleTitleOverride = o.vehicleTitleOverride === true;
  return {
    v: 1,
    vehicleTitleOverride,
    listing: safeNormalizePrivadoListing(o.listing),
  };
}

/** Removes IDB placeholder refs when blobs are missing or unreadable (preview-safe). */
export function stripUnresolvedIdbRefsFromListing(listing: AutoDealerListing): AutoDealerListing {
  const mediaImages = (listing.mediaImages ?? []).filter((m) => {
    if (!m || typeof m.url !== "string") return false;
    return mediaIdFromRef(m.url) === null;
  });
  let dealerLogo = listing.dealerLogo;
  if (dealerLogo === AUTOS_DRAFT_LOGO_REF) {
    dealerLogo = undefined;
  }
  return { ...listing, mediaImages, dealerLogo };
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

export function loadAutosPrivadoDraft(namespace: string): AutosPrivadoDraftV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(buildAutosPrivadoDraftLocalStorageKey(namespace));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isAutosPrivadoDraftV1(parsed)) {
      return {
        v: 1,
        vehicleTitleOverride: parsed.vehicleTitleOverride,
        listing: safeNormalizePrivadoListing(parsed.listing),
      };
    }
    return coerceLooseAutosPrivadoDraftV1(parsed);
  } catch {
    return null;
  }
}

/**
 * Full draft load: same IndexedDB rehydration as Negocios so file-sourced images survive localStorage quota limits.
 * Never throws: IDB/localStorage edge cases drop only broken media and return a usable listing when possible.
 */
export async function loadAutosPrivadoDraftResolved(namespace: string): Promise<AutosPrivadoDraftV1 | null> {
  try {
    const sync = loadAutosPrivadoDraft(namespace);
    if (!sync) return null;

    const baseListing = stripDraftMuxFields(safeNormalizePrivadoListing({ ...sync.listing, autosLane: "privado" }));

    let listing = baseListing;
    try {
      listing = await inlineDraftListingAssetsFromIdb(namespace, listing);
    } catch {
      listing = stripUnresolvedIdbRefsFromListing(stripDraftMuxFields(safeNormalizePrivadoListing({ ...sync.listing, autosLane: "privado" })));
    }

    listing = stripDraftMuxFields(safeNormalizePrivadoListing(listing));

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

    listing = stripDraftMuxFields(safeNormalizePrivadoListing({ ...listing, autosLane: "privado" }));

    return { ...sync, listing };
  } catch {
    return null;
  }
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
