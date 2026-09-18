import type { AutoDealerListing, MediaImageEntry } from "../types/autoDealerListing";

export function newMediaImageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function sortMediaByOrder(images: MediaImageEntry[]): MediaImageEntry[] {
  return [...images].sort((a, b) => {
    const da = Number.isFinite(a.sortOrder) ? a.sortOrder : 0;
    const db = Number.isFinite(b.sortOrder) ? b.sortOrder : 0;
    if (da !== db) return da - db;
    return a.id.localeCompare(b.id);
  });
}

/** Ensures exactly one primary cover; if none, first item in current order becomes cover. */
export function ensureOnePrimaryMedia(images: MediaImageEntry[]): MediaImageEntry[] {
  if (images.length === 0) return [];
  const sorted = sortMediaByOrder(images);
  const primaries = sorted.filter((x) => x.isPrimary);
  if (primaries.length === 0) {
    return sorted.map((x, i) => ({ ...x, isPrimary: i === 0, sortOrder: i }));
  }
  if (primaries.length === 1) {
    return sorted.map((x, i) => ({ ...x, sortOrder: i }));
  }
  let seen = false;
  return sorted.map((x, i) => {
    if (!x.isPrimary) return { ...x, sortOrder: i };
    if (!seen) {
      seen = true;
      return { ...x, sortOrder: i };
    }
    return { ...x, isPrimary: false, sortOrder: i };
  });
}

function reindexMediaImages(images: MediaImageEntry[]): MediaImageEntry[] {
  return sortMediaByOrder(images).map((x, i) => ({ ...x, sortOrder: i }));
}

/** Canonical media order: sort by sortOrder, single primary, contiguous sortOrder indices. */
export function normalizeMediaImagesOrder(images: MediaImageEntry[] | undefined): MediaImageEntry[] {
  if (!images?.length) return [];
  return reindexMediaImages(ensureOnePrimaryMedia(images));
}

/** Ordered URLs for gallery: user sortOrder (cover flag does not reshuffle gallery order). */
export function deriveHeroImageUrls(listing: AutoDealerListing): string[] {
  const rows = listing.mediaImages;
  if (rows?.length) {
    return normalizeMediaImagesOrder(rows)
      .map((x) => x.url)
      .filter(Boolean);
  }
  return listing.heroImages ?? [];
}

/**
 * Deterministic cover/thumbnail: the owner's chosen `isPrimary` image — never merely "whichever
 * sorts first" in gallery order. Gallery order itself (deriveHeroImageUrls) is untouched; this is
 * only for single-image surfaces (results cards, browse tiles) that must agree with the full
 * gallery/Preview on which photo is the cover, per the Autos Dealer lifecycle closeout (Gate 1/3/6).
 */
export function derivePrimaryImageUrl(listing: AutoDealerListing): string {
  const rows = listing.mediaImages;
  if (rows?.length) {
    const normalized = normalizeMediaImagesOrder(rows);
    const primary = normalized.find((x) => x.isPrimary) ?? normalized[0];
    return primary?.url ?? "";
  }
  return listing.heroImages?.[0] ?? "";
}

/** Legacy `heroImages` only → structured rows. */
export function migrateHeroImagesToMediaImages(heroImages: string[]): MediaImageEntry[] {
  return heroImages.map((url, i) => ({
    id: newMediaImageId(),
    url,
    sourceType: url.startsWith("data:") ? "file" : "url",
    isPrimary: i === 0,
    sortOrder: i,
  }));
}
