import type { ServiciosGalleryImage, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";

/** All profile photos in display order (featured first when destacadas were selected). */
export function getAllServiciosGalleryPhotos(profile: ServiciosProfileResolved): ServiciosGalleryImage[] {
  return [...profile.gallery, ...profile.galleryMore];
}

/**
 * True when the advertiser explicitly selected Destacada images (featured split applied).
 */
export function hasSelectedDestacadaImages(profile: ServiciosProfileResolved): boolean {
  return profile.galleryMore.length > 0;
}

/** Destacada images only — empty when no explicit selection (no fallback to first gallery photos). */
export function getFeaturedVisualProofImages(
  profile: ServiciosProfileResolved,
  max = 4,
): ServiciosGalleryImage[] {
  if (!hasSelectedDestacadaImages(profile)) return [];
  return profile.gallery.slice(0, max);
}
