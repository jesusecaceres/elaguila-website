import type { AutoDealerListing, MediaImageEntry } from "../types/autoDealerListing";
import {
  idbClearDealerLogo,
  idbDeleteDraftImage,
  idbGetDealerLogoDataUrl,
  idbGetDraftImageDataUrl,
  idbPutDealerLogoDataUrl,
  idbPutDraftImageDataUrl,
} from "./autosNegociosDraftImageIdb";

export const AUTOS_DRAFT_MEDIA_REF_PREFIX = "__AUTOS_IDB_MEDIA__:";
export const AUTOS_DRAFT_LOGO_REF = "__AUTOS_IDB_LOGO__";

export function mediaRefFromId(id: string): string {
  return `${AUTOS_DRAFT_MEDIA_REF_PREFIX}${id}`;
}

export function mediaIdFromRef(url: string): string | null {
  if (!url.startsWith(AUTOS_DRAFT_MEDIA_REF_PREFIX)) return null;
  const id = url.slice(AUTOS_DRAFT_MEDIA_REF_PREFIX.length);
  return id.length > 0 ? id : null;
}

/** Drops gallery rows and logo that still point at IndexedDB placeholders (missing rehydration). */
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

export async function offloadDraftListingAssetsToIdb(namespace: string, listing: AutoDealerListing): Promise<AutoDealerListing> {
  const rows = listing.mediaImages ?? [];
  const nextImages = [];
  for (const m of rows) {
    if (m.sourceType === "file" && m.url.startsWith("data:")) {
      await idbPutDraftImageDataUrl(namespace, m.id, m.url);
      nextImages.push({ ...m, url: mediaRefFromId(m.id) });
    } else {
      nextImages.push(m);
    }
  }
  let dealerLogo = listing.dealerLogo;
  if (typeof dealerLogo === "string" && dealerLogo.startsWith("data:")) {
    await idbPutDealerLogoDataUrl(namespace, dealerLogo);
    dealerLogo = AUTOS_DRAFT_LOGO_REF;
  } else if (dealerLogo === AUTOS_DRAFT_LOGO_REF) {
    /* already offloaded */
  }
  return { ...listing, mediaImages: nextImages, dealerLogo };
}

function isMediaImageRow(m: unknown): m is MediaImageEntry {
  if (!m || typeof m !== "object") return false;
  const o = m as Record<string, unknown>;
  return typeof o.id === "string" && o.id.length > 0 && typeof o.url === "string";
}

function coerceMediaImageRow(m: MediaImageEntry): MediaImageEntry {
  const sourceType: MediaImageEntry["sourceType"] = m.sourceType === "file" ? "file" : "url";
  const sortOrder = typeof m.sortOrder === "number" && Number.isFinite(m.sortOrder) ? m.sortOrder : 0;
  return {
    id: m.id,
    url: m.url,
    sourceType,
    isPrimary: Boolean(m.isPrimary),
    sortOrder,
  };
}

/**
 * Rehydrates gallery + logo from IndexedDB. Per-asset and DB errors are swallowed so one bad/stale
 * blob cannot fail the whole draft load (Privado preview + Negocios editor).
 */
export async function inlineDraftListingAssetsFromIdb(namespace: string, listing: AutoDealerListing): Promise<AutoDealerListing> {
  const rows = listing.mediaImages ?? [];
  const nextImages: MediaImageEntry[] = [];
  for (const m of rows) {
    if (!isMediaImageRow(m)) continue;
    const row = coerceMediaImageRow(m);
    const refId = mediaIdFromRef(row.url);
    if (refId) {
      try {
        const blob = await idbGetDraftImageDataUrl(namespace, refId);
        if (blob) nextImages.push({ ...row, url: blob });
      } catch {
        /* drop stale / unreadable IDB ref */
      }
    } else {
      nextImages.push(row);
    }
  }
  let dealerLogo = listing.dealerLogo;
  if (dealerLogo === AUTOS_DRAFT_LOGO_REF) {
    try {
      const blob = await idbGetDealerLogoDataUrl(namespace);
      dealerLogo = blob ?? undefined;
    } catch {
      dealerLogo = undefined;
    }
  }
  return { ...listing, mediaImages: nextImages, dealerLogo };
}

export async function clearDraftListingImageAndLogoIdb(namespace: string, listing: AutoDealerListing | undefined | null): Promise<void> {
  if (!listing) return;
  for (const m of listing.mediaImages ?? []) {
    await idbDeleteDraftImage(namespace, m.id);
  }
  await idbClearDealerLogo(namespace);
}
