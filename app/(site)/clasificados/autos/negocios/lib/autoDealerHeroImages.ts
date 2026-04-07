import type { AutoDealerListing, MediaImageEntry } from "../types/autoDealerListing";

export function newMediaImageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Ordered URLs for gallery: primary first, then by sortOrder. */
export function deriveHeroImageUrls(listing: AutoDealerListing): string[] {
  const rows = listing.mediaImages;
  if (rows?.length) {
    const sorted = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
    const primary = sorted.filter((x) => x.isPrimary);
    const rest = sorted.filter((x) => !x.isPrimary);
    const ordered = primary.length ? [...primary, ...rest] : sorted;
    return ordered.map((x) => x.url).filter(Boolean);
  }
  return listing.heroImages ?? [];
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
