import type { ComidaLocalImageDraft } from "./comidaLocalTypes";

/**
 * Resolve a safe image src for preview/detail output.
 * Never returns data: URLs or fake placeholders.
 */
export function resolveComidaLocalPreviewImageSrc(
  img: ComidaLocalImageDraft | null | undefined
): string | null {
  if (!img) return null;
  const u = String(img.previewUrl ?? "").trim();
  if (!u) return null;
  if (u.startsWith("data:") || u.includes("base64")) return null;
  if (u.startsWith("blob:")) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return null;
}

export function draftHasPreviewImageMetadata(draft: {
  mainPhoto: ComidaLocalImageDraft | null;
  logoImage: ComidaLocalImageDraft | null;
  galleryImages: ComidaLocalImageDraft[];
}): boolean {
  if (resolveComidaLocalPreviewImageSrc(draft.mainPhoto)) return true;
  if (resolveComidaLocalPreviewImageSrc(draft.logoImage)) return true;
  return draft.galleryImages.some((g) => Boolean(resolveComidaLocalPreviewImageSrc(g)));
}
