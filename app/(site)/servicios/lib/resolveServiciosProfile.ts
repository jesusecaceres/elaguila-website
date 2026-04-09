import type {
  ServiciosBusinessProfile,
  ServiciosGalleryImage,
  ServiciosProfileResolved,
  ServiciosLang,
} from "../types/serviciosBusinessProfile";
import {
  filterGallery,
  filterGalleryVideos,
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
  safePromoAssetHref,
  safePromoHref,
  sanitizePhoneDisplay,
  sanitizeTelHref,
  trimText,
  formatPhysicalAddressDisplay,
  buildGoogleMapsSearchHrefFromPhysical,
} from "./serviciosProfileSanitize";

/**
 * Turn canonical wire data into a presentation-safe model (filtered lists, safe URLs, fallbacks).
 * `lang` controls injected Leonix verification copy when `identity.leonixVerified` is set by ops.
 */
export function resolveServiciosProfile(input: ServiciosBusinessProfile, lang: ServiciosLang = "es"): ServiciosProfileResolved {
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

  const physicalAddressDisplay = formatPhysicalAddressDisplay({
    physicalStreet: contactIn.physicalStreet,
    physicalSuite: contactIn.physicalSuite,
    physicalCity: contactIn.physicalCity,
    physicalRegion: contactIn.physicalRegion,
    physicalPostalCode: contactIn.physicalPostalCode,
  });
  const mapsSearchHref = physicalAddressDisplay
    ? buildGoogleMapsSearchHrefFromPhysical({
        physicalStreet: contactIn.physicalStreet,
        physicalSuite: contactIn.physicalSuite,
        physicalCity: contactIn.physicalCity,
        physicalRegion: contactIn.physicalRegion,
        physicalPostalCode: contactIn.physicalPostalCode,
      })
    : undefined;

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
    const assetImageHrefSafe = safePromoAssetHref(promoIn.assetImageUrl) ?? undefined;
    const assetPdfHrefSafe = safePromoAssetHref(promoIn.assetPdfUrl) ?? undefined;
    promo = {
      id: trimText(promoIn.id) || "promo",
      headline: trimText(promoIn.headline),
      footnote: trimText(promoIn.footnote) || undefined,
      hrefSafe,
    };
    if (assetImageHrefSafe) promo.assetImageHrefSafe = assetImageHrefSafe;
    if (assetPdfHrefSafe) promo.assetPdfHrefSafe = assetPdfHrefSafe;
  }

  /** Testimonials: quote + author only (no self-serve per-quote stars) */
  const reviews = meaningfulReviews(input.reviews).map((r) => ({
    id: r.id,
    authorName: trimText(r.authorName),
    quote: trimText(r.quote),
    avatarUrl: r.avatarUrl ? safeExternalWebsiteHref(r.avatarUrl) ?? undefined : undefined,
  }));

  const allGallery = filterGallery(input.gallery);
  const { gallery, galleryMore } = splitFeaturedGallery(allGallery, input.featuredGalleryIds);
  const galleryVideos = filterGalleryVideos(input.galleryVideos);

  const withoutAdvertiserVerified = filterHeroBadges(heroIn.badges).filter((b) => b.kind !== "verified");
  const heroBadges =
    input.identity?.leonixVerified === true
      ? [
          {
            kind: "verified" as const,
            label: lang === "en" ? "Leonix Verified" : "Leonix Verificado",
          },
          ...withoutAdvertiserVerified,
        ]
      : withoutAdvertiserVerified;

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
      badges: heroBadges,
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
      secondaryCtaLabels: filterSecondaryCtaLabels(contactIn.secondaryCtaLabels),
      isFeatured: contactIn.isFeatured === true,
      featuredLabel: trimText(contactIn.featuredLabel) || undefined,
      socialLinks,
      physicalAddressDisplay: physicalAddressDisplay || undefined,
      mapsSearchHref: mapsSearchHref || undefined,
    },
    quickFacts: filterQuickFacts(input.quickFacts),
    about: sanitizeAbout(input.about),
    services: filterServices(input.services),
    gallery,
    galleryMore,
    galleryVideos,
    trust: filterTrustItems(input.trust),
    reviews,
    serviceAreas: {
      items: areaItems,
      mapImageUrl: mapImageUrl,
    },
    promo,
  };
}

const MAX_SECONDARY_CTA_LABELS = 6;

function filterSecondaryCtaLabels(raw: string[] | undefined): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out = raw.map((s) => trimText(s)).filter((x) => x.length > 0).slice(0, MAX_SECONDARY_CTA_LABELS);
  return out.length ? out : undefined;
}

function splitFeaturedGallery(
  all: ServiciosGalleryImage[],
  featuredIds: string[] | undefined,
): { gallery: ServiciosGalleryImage[]; galleryMore: ServiciosGalleryImage[] } {
  const ids = (featuredIds ?? []).map((id) => trimText(id)).filter(Boolean).slice(0, 4);
  if (ids.length === 0) {
    return { gallery: all, galleryMore: [] };
  }
  const byId = new Map(all.map((g) => [g.id, g]));
  const featured: ServiciosGalleryImage[] = [];
  for (const id of ids) {
    const g = byId.get(id);
    if (g) featured.push(g);
  }
  if (featured.length === 0) {
    return { gallery: all, galleryMore: [] };
  }
  const featuredSet = new Set(featured.map((g) => g.id));
  return {
    gallery: featured,
    galleryMore: all.filter((g) => !featuredSet.has(g.id)),
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
