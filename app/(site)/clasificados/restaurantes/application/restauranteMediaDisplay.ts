/** True if string is usable as a gallery/general image src (data URL or remote). */
export function isRestauranteDisplayableImageRef(s: string | undefined | null): boolean {
  if (typeof s !== "string") return false;
  const t = s.trim();
  if (!t) return false;
  if (/^data:image\//i.test(t)) return true;
  if (/^https?:\/\//i.test(t)) return true;
  return false;
}

/** True if value looks like an accepted local video data URL. */
export function isRestauranteLocalVideoDataUrl(s: string | undefined | null): boolean {
  if (typeof s !== "string") return false;
  const t = s.trim();
  return t.startsWith("data:video") || /^data:video\//i.test(t);
}
