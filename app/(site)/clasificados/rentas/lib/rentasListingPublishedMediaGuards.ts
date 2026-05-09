/**
 * Rentas published listing: filter placeholder images and decide when a video URL
 * may appear in the public gallery VM (never blob/data for anonymous visitors).
 */

export function isRentasPlaceholderImageUrl(u: string): boolean {
  const t = u.trim().toLowerCase();
  if (!t) return true;
  if (t === "/logo.png" || t.endsWith("/logo.png")) return true;
  const brand = String(process.env.NEXT_PUBLIC_LEONIX_BRAND_LOGO_URL ?? "").trim().toLowerCase();
  if (brand && t === brand) return true;
  return false;
}

export function filterRentasPhotoUrlList(urls: readonly string[] | undefined): string[] {
  if (!urls?.length) return [];
  const out: string[] = [];
  for (const raw of urls) {
    const u = String(raw ?? "").trim();
    if (!u || isRentasPlaceholderImageUrl(u)) continue;
    out.push(u);
  }
  return out;
}

/** Only http(s) URLs; excludes blob/data (draft-only) so published tiles do not claim fake video. */
export function rentasPublishedVideoShouldAppearInGallery(videoUrl: string | null | undefined): boolean {
  const u = String(videoUrl ?? "").trim();
  if (!u) return false;
  if (/^blob:/i.test(u) || /^data:/i.test(u)) return false;
  try {
    const p = new URL(u);
    return p.protocol === "http:" || p.protocol === "https:";
  } catch {
    return false;
  }
}
