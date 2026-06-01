import { parseLeonixImageUrlsFromDescription } from "@/app/clasificados/lib/leonixListingGalleryMarker";
import { extractYoutubeId } from "./enVentaVideoEmbed";

function isDisplayableImageUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (t.startsWith("data:image/")) return true;
  if (t.startsWith("blob:")) return true;
  return /^https?:\/\//i.test(t);
}

/** Normalize `listings.images` jsonb (strings, objects, or JSON string). */
export function parseImageUrlsFromListingsJsonb(images: unknown): string[] {
  if (images == null) return [];
  if (typeof images === "string") {
    const t = images.trim();
    if (!t) return [];
    if (t.startsWith("[") || t.startsWith("{")) {
      try {
        return parseImageUrlsFromListingsJsonb(JSON.parse(t));
      } catch {
        return isDisplayableImageUrl(t) ? [t] : [];
      }
    }
    return isDisplayableImageUrl(t) ? [t] : [];
  }
  if (!Array.isArray(images)) return [];
  return images
    .map((item) => {
      if (typeof item === "string" && item.trim()) return item.trim();
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        const url = (o.url ?? o.src ?? o.path ?? o.publicUrl) as string | undefined;
        if (typeof url === "string" && url.trim()) return url.trim();
      }
      return null;
    })
    .filter((u): u is string => u != null && isDisplayableImageUrl(u));
}

/** Human-readable publish appendix: `— Fotos —` / `— Photos —` URL lines. */
export function parseLeonixPhotoAppendixUrls(description: unknown): string[] {
  const d = typeof description === "string" ? description : "";
  const idx = d.search(/\n{2,}—\s*(?:Fotos|Photos)\s*—\n/i);
  if (idx === -1) return [];
  const tail = d.slice(idx);
  const markerIdx = tail.indexOf("[LEONIX_IMAGES]");
  const block = markerIdx === -1 ? tail : tail.slice(0, markerIdx);
  const out: string[] = [];
  for (const line of block.split(/\r?\n/)) {
    const t = line.trim();
    if (isDisplayableImageUrl(t)) out.push(t);
  }
  return out;
}

function parseImagesFromListingJson(listingJson: unknown): string[] {
  if (listingJson == null) return [];
  let parsed: unknown = listingJson;
  if (typeof listingJson === "string") {
    try {
      parsed = JSON.parse(listingJson);
    } catch {
      return [];
    }
  }
  if (!parsed || typeof parsed !== "object") return [];
  const o = parsed as Record<string, unknown>;
  for (const key of ["images", "photos", "gallery", "media"]) {
    const urls = parseImageUrlsFromListingsJsonb(o[key]);
    if (urls.length) return urls;
  }
  return [];
}

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of urls) {
    const t = u.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/**
 * Canonical Varios listing image URLs from a Supabase `listings` row.
 * Merges jsonb column, listing_json, LEONIX marker, and legacy photo appendix.
 */
export function resolveEnVentaListingImageUrls(row: Record<string, unknown>): string[] {
  const rawDesc = String(row.description ?? "");
  return dedupeUrls([
    ...parseImageUrlsFromListingsJsonb(row.images),
    ...parseImagesFromListingJson(row.listing_json),
    ...parseLeonixImageUrlsFromDescription(rawDesc),
    ...parseLeonixPhotoAppendixUrls(rawDesc),
  ]);
}

export function resolveEnVentaVideoThumbnailUrl(args: {
  muxPlaybackId?: string | null;
  muxThumbnailUrl?: string | null;
  videoUrl?: string | null;
}): string | null {
  const muxThumb = String(args.muxThumbnailUrl ?? "").trim();
  if (muxThumb && isDisplayableImageUrl(muxThumb)) return muxThumb;

  const mux = String(args.muxPlaybackId ?? "").trim();
  if (mux) return `https://image.mux.com/${mux}/thumbnail.jpg?time=0`;

  const url = String(args.videoUrl ?? "").trim();
  const yt = extractYoutubeId(url);
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;

  return null;
}

/**
 * Results/detail hero priority:
 * 1. first uploaded image (primary-first when caller passes ordered urls)
 * 2. video thumbnail when no images
 */
export function resolveEnVentaHeroImageUrl(
  imageUrls: string[],
  opts?: {
    muxPlaybackId?: string | null;
    muxThumbnailUrl?: string | null;
    videoUrl?: string | null;
  }
): string | null {
  const first = imageUrls.find((u) => isDisplayableImageUrl(u));
  if (first) return first.trim();
  if (!opts) return null;
  return resolveEnVentaVideoThumbnailUrl(opts);
}
