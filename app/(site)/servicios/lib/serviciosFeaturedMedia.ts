import type { ServiciosGalleryImage, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";

/** All profile photos in display order (featured first when destacadas were selected). */
export function getAllServiciosGalleryPhotos(profile: ServiciosProfileResolved): ServiciosGalleryImage[] {
  return [...profile.gallery, ...profile.galleryMore];
}

/**
 * Top visual proof row: destacada/featured images first (profile.gallery after splitFeaturedGallery),
 * up to `max`. When no destacadas were chosen, gallery holds all images — first `max` still applies.
 */
export function getFeaturedVisualProofImages(
  profile: ServiciosProfileResolved,
  max = 4,
): ServiciosGalleryImage[] {
  const featured = profile.gallery.slice(0, max);
  if (featured.length > 0) return featured;
  return getAllServiciosGalleryPhotos(profile).slice(0, max);
}
