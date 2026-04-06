import type { ServiciosBusinessProfile, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import {
  filterGallery,
  filterHeroBadges,
  filterQuickFacts,
  filterServiceAreas,
  filterServices,
  filterTrustItems,
  humanizeSlug,
  meaningfulReviews,
  normalizeHours,
  normalizeMapImageUrl,
  normalizeRating,
  normalizeReviewCount,
  safeExternalWebsiteHref,
  safePromoHref,
  sanitizePhoneDisplay,
  sanitizeTelHref,
  trimText,
} from "./serviciosProfileSanitize";

/**
 * Turn canonical wire data into a presentation-safe model (filtered lists, safe URLs, fallbacks).
 */
export function resolveServiciosProfile(input: ServiciosBusinessProfile): ServiciosProfileResolved {
  const slug = trimText(input.identity?.slug) || "profile";
  const businessName =
    trimText(input.identity?.businessName) || humanizeSlug(slug);

  const heroIn = input.hero ?? {};
  const rating = normalizeRating(heroIn.rating);
  const reviewCount = normalizeReviewCount(heroIn.reviewCount);
  const contactIn = input.contact ?? {};

  const phoneDisplay = sanitizePhoneDisplay(contactIn.phone);
  const phoneTelHref = sanitizeTelHref(contactIn.phone);
  const websiteHref = safeExternalWebsiteHref(contactIn.websiteUrl);
  const websiteLabel = trimText(contactIn.websiteLabel);

  const rawSocial = contactIn.socialLinks;
  let socialLinks: ServiciosProfileResolved["contact"]["socialLinks"];
  if (rawSocial && typeof rawSocial === "object") {
    const out: NonNullable<typeof socialLinks> = {};
    const ig = safeExternalWebsiteHref(rawSocial.instagramUrl);
    if (ig) out.instagram = ig;
    const fb = safeExternalWebsiteHref(rawSocial.facebookUrl);
    if (fb) out.facebook = fb;
    const yt = safeExternalWebsiteHref(rawSocial.youtubeUrl);
    if (yt) out.youtube = yt;
    const tk = safeExternalWebsiteHref(rawSocial.tiktokUrl);
    if (tk) out.tiktok = tk;
    const li = safeExternalWebsiteHref(rawSocial.linkedinUrl);
    if (li) out.linkedin = li;
    const wa = safeExternalWebsiteHref(rawSocial.whatsappUrl);
    if (wa) out.whatsapp = wa;
    if (Object.keys(out).length > 0) socialLinks = out;
  }

  const areasBlock = input.serviceAreas;
  const mapImageUrl = normalizeMapImageUrl(areasBlock?.mapImageUrl);
  const areaItems = filterServiceAreas(areasBlock?.items);

  const promoIn = input.promo;
  let promo: ServiciosProfileResolved["promo"];
  if (promoIn && trimText(promoIn.headline)) {
    const hrefSafe = safePromoHref(promoIn.href) ?? undefined;
    promo = {
      id: trimText(promoIn.id) || "promo",
      headline: trimText(promoIn.headline),
      footnote: trimText(promoIn.footnote) || undefined,
      hrefSafe,
    };
  }

  const reviews = meaningfulReviews(input.reviews).map((r) => ({
    ...r,
    authorName: trimText(r.authorName),
    quote: trimText(r.quote),
    rating: normalizeRating(r.rating),
    avatarUrl: r.avatarUrl ? safeExternalWebsiteHref(r.avatarUrl) ?? undefined : undefined,
  }));

  return {
    identity: { slug, businessName },
    hero: {
      categoryLine: trimText(heroIn.categoryLine) || undefined,
      logoUrl: trimText(heroIn.logoUrl) || undefined,
      logoAlt: trimText(heroIn.logoAlt) || undefined,
      coverImageUrl: trimText(heroIn.coverImageUrl) || undefined,
      coverImageAlt: trimText(heroIn.coverImageAlt) || undefined,
      rating,
      reviewCount: reviewCount !== undefined && reviewCount > 0 ? reviewCount : undefined,
      badges: filterHeroBadges(heroIn.badges),
      locationSummary: trimText(heroIn.locationSummary) || undefined,
    },
    contact: {
      phoneDisplay: phoneDisplay ?? undefined,
      phoneTelHref: phoneTelHref ?? undefined,
      websiteHref: websiteHref ?? undefined,
      websiteLabel: websiteLabel || undefined,
      messageEnabled: contactIn.messageEnabled === true,
      hours: normalizeHours(contactIn.hours),
      primaryCtaLabel: trimText(contactIn.primaryCtaLabel) || undefined,
      isFeatured: contactIn.isFeatured === true,
      featuredLabel: trimText(contactIn.featuredLabel) || undefined,
      socialLinks,
    },
    quickFacts: filterQuickFacts(input.quickFacts),
    about: sanitizeAbout(input.about),
    services: filterServices(input.services),
    gallery: filterGallery(input.gallery),
    trust: filterTrustItems(input.trust),
    reviews,
    serviceAreas: {
      items: areaItems,
      mapImageUrl: mapImageUrl,
    },
    promo,
  };
}

function sanitizeAbout(
  about: ServiciosBusinessProfile["about"]
): ServiciosProfileResolved["about"] {
  if (!about) return undefined;
  const text = trimText(about.text) || undefined;
  const specialtiesLine = trimText(about.specialtiesLine) || undefined;
  if (!text && !specialtiesLine) return undefined;
  return { text, specialtiesLine };
}
