import type { ServiciosBusinessProfile, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import { meaningfulReviews } from "./serviciosProfileSanitize";
import { nonEmpty } from "./serviciosProfilePrimitives";

/** Raw wire profile — section guards before sanitization */
export function hasHeroIdentity(p: ServiciosBusinessProfile): boolean {
  return nonEmpty(p.identity?.businessName) || nonEmpty(p.identity?.slug);
}

export function hasQuickFacts(p: ServiciosBusinessProfile): boolean {
  return filterFactsLength(p.quickFacts) > 0;
}

function filterFactsLength(facts: ServiciosBusinessProfile["quickFacts"]): number {
  if (!Array.isArray(facts)) return 0;
  return facts.filter((f) => f && nonEmpty(f.label)).length;
}

export function hasAboutSection(p: ServiciosBusinessProfile): boolean {
  return nonEmpty(p.about?.text) || nonEmpty(p.about?.specialtiesLine);
}

export function hasServicesSection(p: ServiciosBusinessProfile): boolean {
  return Array.isArray(p.services) && p.services.some((s) => s && nonEmpty(s.title) && nonEmpty(s.imageUrl));
}

export function hasGallerySection(p: ServiciosBusinessProfile): boolean {
  return Array.isArray(p.gallery) && p.gallery.some((g) => g && nonEmpty(g.url));
}

export function hasTrustSection(p: ServiciosBusinessProfile): boolean {
  return Array.isArray(p.trust) && p.trust.some((t) => t && nonEmpty(t.label));
}

export function hasReviewsSection(p: ServiciosBusinessProfile): boolean {
  return meaningfulReviews(p.reviews).length > 0;
}

export function hasServiceAreasSection(p: ServiciosBusinessProfile): boolean {
  const items = p.serviceAreas?.items;
  const map = p.serviceAreas?.mapImageUrl;
  return (Array.isArray(items) && items.some((a) => a && nonEmpty(a.label))) || nonEmpty(map);
}

/** Main column list: areas without relying on map image */
export function hasMainColumnServiceAreas(p: ServiciosBusinessProfile): boolean {
  const items = p.serviceAreas?.items;
  return Array.isArray(items) && items.some((a) => a && nonEmpty(a.label)) && !nonEmpty(p.serviceAreas?.mapImageUrl);
}

export function hasSidebarServiceAreasMap(p: ServiciosBusinessProfile): boolean {
  return nonEmpty(p.serviceAreas?.mapImageUrl);
}

export function hasOfferSection(p: ServiciosBusinessProfile): boolean {
  return Boolean(p.promo && nonEmpty(p.promo.headline));
}

/** Resolved profile — guards on sanitized output */
export function hasHeroIdentityResolved(p: ServiciosProfileResolved): boolean {
  return nonEmpty(p.identity.businessName) || nonEmpty(p.identity.slug);
}

export function hasQuickFactsResolved(p: ServiciosProfileResolved): boolean {
  return p.quickFacts.length > 0;
}

export function hasAboutSectionResolved(p: ServiciosProfileResolved): boolean {
  return nonEmpty(p.about?.text) || nonEmpty(p.about?.specialtiesLine);
}

export function hasServicesSectionResolved(p: ServiciosProfileResolved): boolean {
  return p.services.length > 0;
}

export function hasGallerySectionResolved(p: ServiciosProfileResolved): boolean {
  return p.gallery.length > 0;
}

export function hasTrustSectionResolved(p: ServiciosProfileResolved): boolean {
  return p.trust.length > 0;
}

export function hasReviewsSectionResolved(p: ServiciosProfileResolved): boolean {
  return meaningfulReviews(p.reviews).length > 0;
}

export function hasServiceAreasSectionResolved(p: ServiciosProfileResolved): boolean {
  return p.serviceAreas.items.length > 0 || nonEmpty(p.serviceAreas.mapImageUrl);
}

export function hasMainColumnServiceAreasResolved(p: ServiciosProfileResolved): boolean {
  return p.serviceAreas.items.length > 0 && !nonEmpty(p.serviceAreas.mapImageUrl);
}

export function hasSidebarServiceAreasMapResolved(p: ServiciosProfileResolved): boolean {
  return nonEmpty(p.serviceAreas.mapImageUrl);
}

export function hasOfferSectionResolved(p: ServiciosProfileResolved): boolean {
  return Boolean(p.promo && nonEmpty(p.promo.headline));
}
