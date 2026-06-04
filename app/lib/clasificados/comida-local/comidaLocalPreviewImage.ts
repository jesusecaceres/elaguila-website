import type { ComidaLocalImageDraft } from "./comidaLocalTypes";
import { resolveComidaLocalImageUrl } from "./comidaLocalImageValidation";

/**
 * Resolve a safe image src for preview/detail output.
 * Never returns data:, blob:, or placeholder URLs.
 */
export function resolveComidaLocalPreviewImageSrc(
  img: ComidaLocalImageDraft | null | undefined
): string | null {
  return resolveComidaLocalImageUrl(img);
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
