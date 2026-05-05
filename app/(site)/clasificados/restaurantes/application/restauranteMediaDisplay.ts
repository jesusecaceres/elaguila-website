/** True if string is usable as a gallery/general image src (data URL or remote). */
export function isRestauranteDisplayableImageRef(s: string | undefined | null): boolean {
  if (typeof s !== "string") return false;
  const t = s.trim();
  if (!t) return false;
  if (/^data:image\//i.test(t)) return true;
  if (/^https?:\/\//i.test(t)) return true;
  return false;
}

/** First displayable image in venue buckets (comida / interior / exterior), in that order. */
export function firstRestauranteBucketImageRef(d: {
  foodImages?: string[] | undefined;
  interiorImages?: string[] | undefined;
  exteriorImages?: string[] | undefined;
}): string | undefined {
  for (const arr of [d.foodImages, d.interiorImages, d.exteriorImages]) {
    const hit = (arr ?? []).find((u) => isRestauranteDisplayableImageRef(u));
    if (hit) return hit.trim();
  }
  return undefined;
}

/** True if value looks like an accepted local video data URL. */
export function isRestauranteLocalVideoDataUrl(s: string | undefined | null): boolean {
  if (typeof s !== "string") return false;
  const t = s.trim();
  return t.startsWith("data:video") || /^data:video\//i.test(t);
}
