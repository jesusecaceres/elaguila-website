import type { ServiciosBusinessProfile, ServiciosReview } from "../types/serviciosBusinessProfile";

export function nonEmpty(s: string | undefined | null): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

export function hasItems<T>(arr: T[] | undefined | null): arr is T[] {
  return Array.isArray(arr) && arr.length > 0;
}

export function showAboutSection(p: ServiciosBusinessProfile): boolean {
  return nonEmpty(p.aboutText) || nonEmpty(p.aboutSpecialtiesLine);
}

export function showGallerySection(p: ServiciosBusinessProfile): boolean {
  return hasItems(p.gallery);
}

export function showTrustSection(p: ServiciosBusinessProfile): boolean {
  return hasItems(p.trustItems);
}

export function showServiceAreasSection(p: ServiciosBusinessProfile): boolean {
  return hasItems(p.serviceAreas) || nonEmpty(p.serviceAreaMapImageUrl);
}

/** Main column list: show when there are areas and no map (map + list live in the sidebar). */
export function showMainServiceAreasSection(p: ServiciosBusinessProfile): boolean {
  return hasItems(p.serviceAreas) && !nonEmpty(p.serviceAreaMapImageUrl);
}

/** Sticky sidebar map module: decorative map and/or compact list when a map image exists. */
export function showSidebarServiceAreasMap(p: ServiciosBusinessProfile): boolean {
  return nonEmpty(p.serviceAreaMapImageUrl);
}

export function showPromoSection(p: ServiciosBusinessProfile): boolean {
  return Boolean(p.promo && nonEmpty(p.promo.headline));
}

export function meaningfulReviews(reviews: ServiciosReview[] | undefined): ServiciosReview[] {
  if (!hasItems(reviews)) return [];
  return reviews.filter((r) => nonEmpty(r.quote) && nonEmpty(r.authorName));
}

export function showReviewsSection(p: ServiciosBusinessProfile): boolean {
  return meaningfulReviews(p.reviews).length > 0;
}
