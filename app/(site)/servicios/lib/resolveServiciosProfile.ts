import type {
  ServiciosBusinessProfile,
  ServiciosGalleryImage,
  ServiciosProfileResolved,
  ServiciosLang,
  ServiciosPromoOffer,
} from "../types/serviciosBusinessProfile";
import {
  filterBusinessHighlights,
  filterGallery,
  filterGalleryVideos,
  filterAmenityOptionIds,
  filterCustomAmenityOptions,
  filterHeroBadges,
  filterQuickFacts,
  filterServiceAreas,
  filterServices,
  filterTrustItems,
  filterCustomPaymentMethods,
  filterPaymentMethodIds,
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
  resolveServiciosCredentials,
} from "./serviciosProfileSanitize";
import { resolveServiciosWhatsAppHref } from "./serviciosWhatsAppHref";

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
  const phoneOfficeDisplay = sanitizePhoneDisplay(contactIn.phoneOffice);
  const phoneOfficeTelHref = sanitizeTelHref(contactIn.phoneOffice);
  const quoteMsgRaw = trimText(contactIn.quoteMessagePhone);
  const quoteMessagePhone =
    quoteMsgRaw && quoteMsgRaw.replace(/\D/g, "").length >= 8 ? quoteMsgRaw : undefined;
  const emailRaw = trimText(contactIn.email);
  const emailMailtoHref =
    emailRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? `mailto:${emailRaw}` : undefined;
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
    const wa = resolveServiciosWhatsAppHref({
      whatsappRaw: rawSocial.whatsappUrl,
      websiteUrl: contactIn.websiteUrl,
    });
    if (wa) out.whatsapp = wa;
    const xUrl = safeExternalWebsiteHref(rawSocial.xUrl);
    if (xUrl) out.x = xUrl;
    const snap = safeExternalWebsiteHref(rawSocial.snapchatUrl);
    if (snap) out.snapchat = snap;
    if (Object.keys(out).length > 0) socialLinks = out;
  }

  const rawReviews = contactIn.externalReviewLinks;
  let externalReviewLinks: ServiciosProfileResolved["contact"]["externalReviewLinks"];
  if (rawReviews && typeof rawReviews === "object") {
    const rev: NonNullable<typeof externalReviewLinks> = {};
    const google = safeExternalWebsiteHref(rawReviews.googleReviewsUrl);
    if (google) rev.google = google;
    const yelp = safeExternalWebsiteHref(rawReviews.yelpReviewsUrl);
    if (yelp) rev.yelp = yelp;
    if (Object.keys(rev).length > 0) externalReviewLinks = rev;
  }

  const extraLinks: ServiciosProfileResolved["contact"]["extraLinks"] = [];
  for (const row of contactIn.extraLinks ?? []) {
    if (!row || typeof row !== "object") continue;
    const href = safeExternalWebsiteHref(typeof row.url === "string" ? row.url : "");
    if (!href) continue;
    const label =
      trimText(typeof row.label === "string" ? row.label : "") ||
      (lang === "en" ? "Additional link" : "Enlace adicional");
    extraLinks.push({ label: label.slice(0, 48), url: href });
    if (extraLinks.length >= 2) break;
  }

  const areasBlock = input.serviceAreas;
  const mapImageUrl = normalizeMapImageUrl(areasBlock?.mapImageUrl);
  const areaItems = filterServiceAreas(areasBlock?.items);

  const credentials = resolveServiciosCredentials(input.credentials);

  const promotions = resolveWirePromotions(input, lang);

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
      phoneOfficeDisplay: phoneOfficeDisplay ?? undefined,
      phoneOfficeTelHref: phoneOfficeTelHref ?? undefined,
      quoteMessagePhone,
      email: emailRaw || undefined,
      emailMailtoHref: emailMailtoHref ?? undefined,
      websiteHref: websiteHref ?? undefined,
      websiteLabel: websiteLabel || undefined,
      messageEnabled: contactIn.messageEnabled === true,
      hours: normalizeHours(contactIn.hours),
      primaryCtaLabel: trimText(contactIn.primaryCtaLabel) || undefined,
      secondaryCtaLabels: filterSecondaryCtaLabels(contactIn.secondaryCtaLabels),
      isFeatured: contactIn.isFeatured === true,
      featuredLabel: trimText(contactIn.featuredLabel) || undefined,
      socialLinks,
      externalReviewLinks,
      extraLinks: extraLinks.length > 0 ? extraLinks : undefined,
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
    highlights: filterBusinessHighlights(input.businessHighlights),
    reviews,
    serviceAreas: {
      items: areaItems,
      mapImageUrl: mapImageUrl,
    },
    paymentMethodIds: filterPaymentMethodIds(input.paymentMethodIds),
    customPaymentMethods: filterCustomPaymentMethods(input.customPaymentMethods),
    amenityOptionIds: filterAmenityOptionIds(input.amenityOptionIds),
    customAmenityOptions: filterCustomAmenityOptions(input.customAmenityOptions),
    promotions,
    ...(credentials ? { credentials } : {}),
  };
}

function resolveWirePromotions(
  input: ServiciosBusinessProfile,
  lang: ServiciosLang,
): ServiciosProfileResolved["promotions"] {
  const raw: ServiciosPromoOffer[] = [];
  if (Array.isArray(input.promotions) && input.promotions.length > 0) {
    for (const p of input.promotions.slice(0, 4)) {
      if (p && typeof p === "object" && typeof p.id === "string") raw.push(p);
    }
  } else if (input.promo && typeof input.promo === "object") {
    raw.push(input.promo);
  }
  const out: ServiciosProfileResolved["promotions"] = [];
  for (const offer of raw) {
    const row = resolveOnePromoWire(offer, lang);
    if (row) out.push(row);
  }
  return out;
}

function resolveOnePromoWire(
  promoIn: ServiciosPromoOffer,
  lang: ServiciosLang,
): ServiciosProfileResolved["promotions"][number] | null {
  const footnote = trimText(promoIn.footnote) || undefined;
  const headlineRaw = trimText(promoIn.headline);
  const hrefSafe = safePromoHref(promoIn.href) ?? undefined;
  const assetImageHrefSafe = safePromoAssetHref(promoIn.assetImageUrl) ?? undefined;
  const assetPdfHrefSafe = safePromoAssetHref(promoIn.assetPdfUrl) ?? undefined;
  const hasWire =
    headlineRaw ||
    footnote ||
    hrefSafe ||
    assetImageHrefSafe ||
    assetPdfHrefSafe;
  if (!hasWire) return null;
  const headline = headlineRaw || (lang === "en" ? "Special offer" : "Oferta especial");
  const id = trimText(promoIn.id) || "promo";
  const row: ServiciosProfileResolved["promotions"][number] = {
    id,
    headline,
  };
  if (footnote) row.footnote = footnote;
  if (hrefSafe) row.hrefSafe = hrefSafe;
  if (assetImageHrefSafe) row.assetImageHrefSafe = assetImageHrefSafe;
  if (assetPdfHrefSafe) row.assetPdfHrefSafe = assetPdfHrefSafe;
  return row;
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
