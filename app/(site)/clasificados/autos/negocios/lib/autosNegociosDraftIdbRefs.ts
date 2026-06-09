import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import type { AutoDealerListing, MediaImageEntry } from "../types/autoDealerListing";
import {
  idbClearDealerLogo,
  idbClearFinanceImage,
  idbDeleteDraftImage,
  idbGetDealerLogoDataUrl,
  idbGetFinanceImageDataUrl,
  idbGetDraftImageDataUrl,
  idbPutDealerLogoDataUrl,
  idbPutFinanceImageDataUrl,
  idbPutDraftImageDataUrl,
} from "./autosNegociosDraftImageIdb";

export const AUTOS_DRAFT_MEDIA_REF_PREFIX = "__AUTOS_IDB_MEDIA__:";
export const AUTOS_DRAFT_LOGO_REF = "__AUTOS_IDB_LOGO__";
export const AUTOS_DRAFT_FINANCE_IMAGE_REF = "__AUTOS_IDB_FINANCE_IMAGE__";

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
  let financeContactImageUrl = listing.financeContactImageUrl;
  if (financeContactImageUrl === AUTOS_DRAFT_FINANCE_IMAGE_REF) {
    financeContactImageUrl = undefined;
  }
  return { ...listing, mediaImages, dealerLogo, financeContactImageUrl };
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
  let financeContactImageUrl = listing.financeContactImageUrl;
  if (typeof financeContactImageUrl === "string" && financeContactImageUrl.startsWith("data:")) {
    await idbPutFinanceImageDataUrl(namespace, financeContactImageUrl);
    financeContactImageUrl = AUTOS_DRAFT_FINANCE_IMAGE_REF;
  } else if (financeContactImageUrl === AUTOS_DRAFT_FINANCE_IMAGE_REF) {
    /* already offloaded */
  }
  return { ...listing, mediaImages: nextImages, dealerLogo, financeContactImageUrl };
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
  let financeContactImageUrl = listing.financeContactImageUrl;
  if (financeContactImageUrl === AUTOS_DRAFT_FINANCE_IMAGE_REF) {
    try {
      const blob = await idbGetFinanceImageDataUrl(namespace);
      financeContactImageUrl = blob ?? undefined;
    } catch {
      financeContactImageUrl = undefined;
    }
  }
  return { ...listing, mediaImages: nextImages, dealerLogo, financeContactImageUrl };
}

export async function clearDraftListingImageAndLogoIdb(namespace: string, listing: AutoDealerListing | undefined | null): Promise<void> {
  if (!listing) return;
  for (const m of listing.mediaImages ?? []) {
    await idbDeleteDraftImage(namespace, m.id);
  }
  await idbClearDealerLogo(namespace);
  await idbClearFinanceImage(namespace);
}

async function offloadMediaImagesToIdb(namespace: string, images: MediaImageEntry[] | undefined): Promise<MediaImageEntry[] | undefined> {
  if (!images?.length) return images;
  const nextImages: MediaImageEntry[] = [];
  for (const m of images) {
    if (m.sourceType === "file" && m.url.startsWith("data:")) {
      await idbPutDraftImageDataUrl(namespace, m.id, m.url);
      nextImages.push({ ...m, url: mediaRefFromId(m.id) });
    } else {
      nextImages.push(m);
    }
  }
  return nextImages;
}

async function inlineMediaImagesFromIdb(namespace: string, images: MediaImageEntry[] | undefined): Promise<MediaImageEntry[] | undefined> {
  if (!images?.length) return images;
  const nextImages: MediaImageEntry[] = [];
  for (const m of images) {
    if (!isMediaImageRow(m)) continue;
    const row = coerceMediaImageRow(m);
    const refId = mediaIdFromRef(row.url);
    if (refId) {
      try {
        const blob = await idbGetDraftImageDataUrl(namespace, refId);
        if (blob) nextImages.push({ ...row, url: blob });
      } catch {
        /* drop stale ref */
      }
    } else {
      nextImages.push(row);
    }
  }
  return nextImages.length ? nextImages : undefined;
}

/** Offload child inventory vehicle file photos to IndexedDB (same keys as main gallery). */
export async function offloadInventoryVehicleMediaToIdb(
  namespace: string,
  vehicle: AutosAdditionalInventoryVehicleDraft,
): Promise<AutosAdditionalInventoryVehicleDraft> {
  const mediaImages = await offloadMediaImagesToIdb(namespace, vehicle.mediaImages);
  return mediaImages ? { ...vehicle, mediaImages } : vehicle;
}

export async function inlineInventoryVehicleMediaFromIdb(
  namespace: string,
  vehicle: AutosAdditionalInventoryVehicleDraft,
): Promise<AutosAdditionalInventoryVehicleDraft> {
  const mediaImages = await inlineMediaImagesFromIdb(namespace, vehicle.mediaImages);
  return mediaImages ? { ...vehicle, mediaImages } : vehicle;
}

export async function offloadAdditionalInventoryVehiclesToIdb(
  namespace: string,
  vehicles: AutosAdditionalInventoryVehicleDraft[] | undefined,
): Promise<AutosAdditionalInventoryVehicleDraft[] | undefined> {
  if (!vehicles?.length) return vehicles;
  const next: AutosAdditionalInventoryVehicleDraft[] = [];
  for (const v of vehicles) {
    next.push(await offloadInventoryVehicleMediaToIdb(namespace, v));
  }
  return next;
}

export async function inlineAdditionalInventoryVehiclesFromIdb(
  namespace: string,
  vehicles: AutosAdditionalInventoryVehicleDraft[] | undefined,
): Promise<AutosAdditionalInventoryVehicleDraft[] | undefined> {
  if (!vehicles?.length) return vehicles;
  const next: AutosAdditionalInventoryVehicleDraft[] = [];
  for (const v of vehicles) {
    next.push(await inlineInventoryVehicleMediaFromIdb(namespace, v));
  }
  return next;
}

export async function clearAdditionalInventoryVehiclesIdb(
  namespace: string,
  vehicles: AutosAdditionalInventoryVehicleDraft[] | undefined | null,
): Promise<void> {
  if (!vehicles?.length) return;
  for (const v of vehicles) {
    for (const m of v.mediaImages ?? []) {
      await idbDeleteDraftImage(namespace, m.id);
    }
  }
}
