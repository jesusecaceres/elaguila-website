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

export async function inlineDraftListingAssetsFromIdb(namespace: string, listing: AutoDealerListing): Promise<AutoDealerListing> {
  const rows = listing.mediaImages ?? [];
  const nextImages: MediaImageEntry[] = [];
  for (const m of rows) {
    const refId = mediaIdFromRef(m.url);
    if (refId) {
      const blob = await idbGetDraftImageDataUrl(namespace, refId);
      nextImages.push(blob ? { ...m, url: blob } : m);
    } else {
      nextImages.push(m);
    }
  }
  let dealerLogo = listing.dealerLogo;
  if (dealerLogo === AUTOS_DRAFT_LOGO_REF) {
    const blob = await idbGetDealerLogoDataUrl(namespace);
    dealerLogo = blob ?? undefined;
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
