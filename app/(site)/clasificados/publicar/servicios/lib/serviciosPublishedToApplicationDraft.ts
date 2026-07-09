import type {
  ServiciosBusinessProfile,
  ServiciosCouponWire,
  ServiciosPromoOffer,
  ServiciosWeeklyHourRow,
} from "@/app/servicios/types/serviciosBusinessProfile";
import { sanitizeCustomServiciosAmenityLabels, sanitizeServiciosAmenityOptionIds } from "@/app/servicios/lib/serviciosAmenitiesCatalog";
import { sanitizeCertificationLabels } from "@/app/servicios/lib/serviciosCredentialsCatalog";
import { sanitizeCustomPaymentMethodLabels, sanitizeServiciosPaymentMethodIds } from "@/app/servicios/lib/serviciosPaymentMethodCatalog";
import type {
  ClasificadosServiciosApplicationState,
  ClasificadosServiciosPromoRow,
  ClasificadosServiciosCouponRow,
  DayKey,
  GalleryItem,
  TestimonialRow,
  VideoItem,
} from "./clasificadosServiciosApplicationTypes";
import { normalizeClasificadosServiciosApplicationState } from "./clasificadosServiciosApplicationNormalize";
import { createEmptyClasificadosPromoRow } from "./clasificadosServiciosPromo";
import { createDefaultClasificadosServiciosState } from "./defaultClasificadosServiciosState";

export type ServiciosPublishedListingHydrationSource = {
  id?: string | null;
  slug?: string | null;
  leonix_ad_id?: string | null;
  business_name?: string | null;
  city?: string | null;
  listing_status?: string | null;
  profile_json?: ServiciosBusinessProfile | null;
};

export type ServiciosEditIdentity = {
  id: string | null;
  slug: string;
  leonixAdId: string | null;
  status: string;
};

export type ServiciosPublishedHydrationResult = {
  state: ClasificadosServiciosApplicationState;
  editIdentity: ServiciosEditIdentity;
  newFieldsAvailable: boolean;
  newFieldsMissing: string[];
};

const DAY_BY_LABEL: Record<string, DayKey> = {
  lunes: "mon",
  monday: "mon",
  martes: "tue",
  tuesday: "tue",
  miercoles: "wed",
  miércoles: "wed",
  wednesday: "wed",
  jueves: "thu",
  thursday: "thu",
  viernes: "fri",
  friday: "fri",
  sabado: "sat",
  sábado: "sat",
  saturday: "sat",
  domingo: "sun",
  sunday: "sun",
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function fromUrl(url: unknown): string {
  const t = clean(url);
  return /^https?:\/\//i.test(t) ? t : "";
}

function splitLocationSummary(summary: string, city: string): string {
  const parts = summary
    .split(/[·\n,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const cityKey = city.trim().toLowerCase();
  return parts.filter((part) => part.toLowerCase() !== cityKey).join("\n");
}

function mapWeeklyHours(rows: ServiciosWeeklyHourRow[] | undefined, fallback: ClasificadosServiciosApplicationState["hours"]) {
  if (!Array.isArray(rows) || rows.length === 0) return fallback;
  const next = fallback.map((row) => ({ ...row }));
  for (const row of rows) {
    const day = DAY_BY_LABEL[clean(row.dayLabel).toLowerCase()];
    if (!day) continue;
    const idx = next.findIndex((item) => item.day === day);
    if (idx < 0) continue;
    const line = clean(row.line);
    const closed = /closed|cerrado/i.test(line);
    const match = line.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
    next[idx] = {
      day,
      closed,
      open: match?.[1] ?? next[idx]!.open,
      close: match?.[2] ?? next[idx]!.close,
    };
  }
  return next;
}

function mapPromotions(promotions: ServiciosPromoOffer[] | undefined, fallback: ClasificadosServiciosPromoRow[]): ClasificadosServiciosPromoRow[] {
  const raw = Array.isArray(promotions) ? promotions : [];
  const rows = raw
    .slice(0, 4)
    .map((promo) => {
      const link = clean(promo.href);
      const imageUrl = fromUrl(promo.assetImageUrl);
      const pdfUrl = fromUrl(promo.assetPdfUrl);
      const primaryAsset: ClasificadosServiciosPromoRow["primaryAsset"] = pdfUrl ? "pdf" : imageUrl ? "image" : link ? "link" : "none";
      return {
        ...createEmptyClasificadosPromoRow(),
        title: clean(promo.headline),
        details: clean(promo.footnote),
        link,
        imageUrl,
        pdfUrl,
        primaryAsset,
        qrLater: (promo as { qrIntent?: unknown }).qrIntent === true,
      };
    })
    .filter((row) => row.title || row.details || row.link || row.imageUrl || row.pdfUrl || row.qrLater);
  return rows.length ? rows : fallback;
}

function isRichCouponWire(coupon: ServiciosPromoOffer | ServiciosCouponWire): coupon is ServiciosCouponWire {
  return typeof (coupon as ServiciosCouponWire).title === "string";
}

function mapCoupons(
  coupons: Array<ServiciosPromoOffer | ServiciosCouponWire> | undefined,
  fallback: ClasificadosServiciosCouponRow[],
): ClasificadosServiciosCouponRow[] {
  const raw = Array.isArray(coupons) ? coupons : [];
  const rows = raw.slice(0, 4).map((coupon) => {
    if (isRichCouponWire(coupon)) {
      return {
        title: clean(coupon.title),
        description: clean(coupon.description),
        regularPrice: clean(coupon.regularPrice),
        specialPrice: clean(coupon.specialPrice),
        savings: clean(coupon.savings),
        imageUrl: fromUrl(coupon.imageUrl),
        url: clean(coupon.href),
        couponCode: clean(coupon.couponCode),
        expirationDate: clean(coupon.expirationDate),
        redemptionNote: clean(coupon.redemptionNote),
        ctaLabel: clean(coupon.ctaLabel),
      };
    }
    return {
      title: clean(coupon.headline),
      description: clean(coupon.footnote),
      regularPrice: "",
      specialPrice: "",
      savings: "",
      imageUrl: fromUrl(coupon.assetImageUrl),
      url: clean(coupon.href),
      couponCode: "",
      expirationDate: "",
      redemptionNote: "",
      ctaLabel: "",
    };
  });
  return rows.length ? rows : fallback;
}

function mapGallery(profile: ServiciosBusinessProfile): { gallery: GalleryItem[]; featuredGalleryIds: string[]; videos: VideoItem[] } {
  const gallery = (Array.isArray(profile.gallery) ? profile.gallery : [])
    .map((item, index) => ({
      id: clean(item.id) || `published_gallery_${index}`,
      url: fromUrl(item.url),
      source: "url" as const,
    }))
    .filter((item) => item.url);
  const galleryIds = new Set(gallery.map((item) => item.id));
  const featuredGalleryIds = (Array.isArray(profile.featuredGalleryIds) ? profile.featuredGalleryIds : [])
    .map((id) => clean(id))
    .filter((id) => galleryIds.has(id))
    .slice(0, 4);
  const videos = (Array.isArray(profile.galleryVideos) ? profile.galleryVideos : [])
    .map((item, index) => ({
      id: clean(item.id) || `published_video_${index}`,
      url: fromUrl(item.url),
      source: "url" as const,
      isPrimary: item.isPrimary === true || index === 0,
      muxPlaybackId: clean(item.muxPlaybackId) || undefined,
      muxAssetId: clean(item.muxAssetId) || undefined,
      muxThumbnailUrl: fromUrl(item.posterUrl) || undefined,
      muxSkipReason: clean(item.muxPublishSkipReason) || undefined,
    }))
    .filter((item) => item.url);
  return { gallery, featuredGalleryIds, videos };
}

function mapTestimonials(profile: ServiciosBusinessProfile): TestimonialRow[] {
  return (Array.isArray(profile.reviews) ? profile.reviews : [])
    .map((row, index) => ({
      id: clean(row.id) || `published_review_${index}`,
      authorName: clean(row.authorName),
      quote: clean(row.quote),
    }))
    .filter((row) => row.authorName || row.quote);
}

/** Whether published profile_json already carries paid offers/coupon content. */
function inferCouponsAddOnFromProfile(profile: ServiciosBusinessProfile | null | undefined): boolean {
  if (!profile || typeof profile !== "object") return false;
  const coupons = Array.isArray(profile.coupons) ? profile.coupons : [];
  const hasCoupon = coupons.some((c) => {
    if (!c || typeof c !== "object") return false;
    const row = c as Record<string, unknown>;
    return Boolean(
      clean(row.title) ||
        clean(row.description) ||
        fromUrl(row.imageUrl) ||
        clean(row.couponCode) ||
        clean(row.expirationDate) ||
        clean((row as ServiciosPromoOffer).headline) ||
        fromUrl((row as ServiciosPromoOffer).assetImageUrl),
    );
  });
  const hasFlyer = Boolean(fromUrl(profile.couponFlyer?.imageUrl));
  const hasMore = Boolean(clean(profile.couponMoreOffers?.url));
  return hasCoupon || hasFlyer || hasMore;
}

function mapSelectedServiceIds(profile: ServiciosBusinessProfile | null | undefined): string[] {
  if (!Array.isArray(profile?.services)) return [];
  const ids: string[] = [];
  for (const card of profile.services) {
    const id = clean(card.id);
    const match = /^svc_(.+)$/.exec(id);
    if (match?.[1]) ids.push(match[1]);
  }
  return ids;
}

function mapSelectedBusinessHighlightIds(profile: ServiciosBusinessProfile | null | undefined): string[] {
  const raw = [
    ...(Array.isArray(profile?.businessHighlights) ? profile.businessHighlights : []),
    ...(Array.isArray(profile?.trust) ? profile.trust : []),
  ];
  const ids: string[] = [];
  for (const item of raw) {
    const id = clean(item?.id);
    if (id) ids.push(id);
  }
  return ids;
}

function detectNewFieldsAvailable(profile: ServiciosBusinessProfile): string[] {
  const missing: string[] = [];
  if (!Array.isArray(profile.paymentMethodIds) && !Array.isArray(profile.customPaymentMethods)) {
    missing.push("paymentMethods");
  }
  if (!Array.isArray(profile.amenityOptionIds) && !Array.isArray(profile.customAmenityOptions)) {
    missing.push("amenityOptions");
  }
  if (!profile.credentials || typeof profile.credentials !== "object") {
    missing.push("credentials");
  }
  return missing;
}

export function serviciosPublishedToApplicationDraft(
  source: ServiciosPublishedListingHydrationSource,
): ServiciosPublishedHydrationResult {
  const base = createDefaultClasificadosServiciosState();
  const profile = source.profile_json;
  const slug = clean(source.slug) || clean(profile?.identity?.slug);
  const city = clean(source.city);
  const businessName = clean(source.business_name) || clean(profile?.identity?.businessName);
  const contact = profile?.contact ?? {};
  const hero = profile?.hero ?? {};
  const media = profile ? mapGallery(profile) : { gallery: [], featuredGalleryIds: [], videos: [] };
  const locationSummary = clean(hero.locationSummary);
  const serviceAreaItems = Array.isArray(profile?.serviceAreas?.items) ? profile.serviceAreas.items : [];
  const serviceAreaNotes =
    serviceAreaItems
      .map((item) => clean(item.label))
      .filter((label) => label && label.toLowerCase() !== city.toLowerCase())
      .join("\n") || splitLocationSummary(locationSummary, city);

  const couponsAddOn = inferCouponsAddOnFromProfile(profile);
  const mappedCoupons = profile ? mapCoupons(profile.coupons ?? undefined, base.coupons ?? []) : base.coupons ?? [];
  const couponFlyerUrl = fromUrl(profile?.couponFlyer?.imageUrl);
  const couponMoreOffersUrl = clean(profile?.couponMoreOffers?.url);
  const couponMoreOffersLabel = clean(profile?.couponMoreOffers?.buttonLabel);

  const state = normalizeClasificadosServiciosApplicationState({
    ...base,
    listingProduct: "servicios_profesionales",
    baseMonthlyPrice: 399,
    categoryPlan: "Servicios profesionales — $399/mes",
    couponsAddOn,
    couponsMonthlyPrice: couponsAddOn ? 99 : 0,
    couponFlyer: couponFlyerUrl ? { imageUrl: couponFlyerUrl } : base.couponFlyer,
    couponMoreOffers:
      couponMoreOffersUrl || couponMoreOffersLabel
        ? { url: couponMoreOffersUrl, buttonLabel: couponMoreOffersLabel }
        : base.couponMoreOffers,
    businessTypeId: clean(profile?.opsMeta?.businessTypeId),
    businessName,
    city,
    state: clean(profile?.opsMeta?.discovery?.state) || clean(hero.state) || base.state,
    country: clean(profile?.opsMeta?.discovery?.country) || clean(hero.country) || base.country,
    physicalStreet: clean(contact.physicalStreet),
    physicalSuite: clean(contact.physicalSuite),
    physicalAddressCity: clean(contact.physicalCity),
    physicalRegion: clean(contact.physicalRegion),
    physicalCountry: clean(contact.physicalCountry),
    physicalPostalCode: clean(contact.physicalPostalCode),
    serviceAreaNotes,
    phone: clean(contact.phone),
    phoneOffice: clean(contact.phoneOffice),
    website: clean(contact.websiteUrl),
    whatsapp: clean(contact.socialLinks?.whatsappUrl),
    whatsappBusinessUrl: clean(contact.socialLinks?.whatsappProfileUrl),
    quoteMessagePhone: clean(contact.quoteMessagePhone),
    email: clean(contact.email),
    languageIds: Array.isArray(profile?.opsMeta?.discovery?.languageChipIds) && profile.opsMeta.discovery.languageChipIds.length
      ? profile.opsMeta.discovery.languageChipIds.filter((id): id is string => typeof id === "string")
      : base.languageIds,
    logoUrl: fromUrl(hero.logoUrl),
    coverUrl: fromUrl(hero.coverImageUrl),
    gallery: media.gallery,
    featuredGalleryIds: media.featuredGalleryIds.length ? media.featuredGalleryIds : media.gallery.slice(0, 4).map((item) => item.id),
    videos: media.videos,
    aboutText: clean(profile?.about?.text),
    specialtiesLine: clean(profile?.about?.specialtiesLine),
    selectedServiceIds: mapSelectedServiceIds(profile),
    customServicesOffered: (Array.isArray(profile?.services) ? profile.services : [])
      .map((item) => clean(item.title))
      .filter(Boolean),
    selectedBusinessHighlightIds: mapSelectedBusinessHighlightIds(profile),
    customBusinessHighlights: (Array.isArray(profile?.businessHighlights) ? profile.businessHighlights : [])
      .map((item) => clean(item.label))
      .filter(Boolean),
    leonixVerifiedInterest: profile?.opsMeta?.leonixVerifiedInterest === true,
    enableCall: Boolean(clean(contact.phone) || clean(contact.phoneOffice)),
    enableMessage: contact.messageEnabled === true,
    enableWhatsapp: Boolean(clean(contact.socialLinks?.whatsappUrl) || clean(contact.socialLinks?.whatsappProfileUrl)),
    enableWebsite: Boolean(clean(contact.websiteUrl)),
    enableEmail: Boolean(clean(contact.email)),
    socialInstagram: clean(contact.socialLinks?.instagramUrl),
    socialFacebook: clean(contact.socialLinks?.facebookUrl),
    socialYoutube: clean(contact.socialLinks?.youtubeUrl),
    socialTiktok: clean(contact.socialLinks?.tiktokUrl),
    socialLinkedin: clean(contact.socialLinks?.linkedinUrl),
    socialX: clean(contact.socialLinks?.xUrl),
    socialSnapchat: clean(contact.socialLinks?.snapchatUrl),
    googleReviewsUrl: clean(contact.externalReviewLinks?.googleReviewsUrl),
    yelpReviewsUrl: clean(contact.externalReviewLinks?.yelpReviewsUrl),
    extraLink1Url: clean(contact.extraLinks?.[0]?.url),
    extraLink1Label: clean(contact.extraLinks?.[0]?.label),
    extraLink2Url: clean(contact.extraLinks?.[1]?.url),
    extraLink2Label: clean(contact.extraLinks?.[1]?.label),
    hours: mapWeeklyHours(contact.hours?.weeklyRows, base.hours),
    testimonials: profile ? mapTestimonials(profile) : [],
    promotions: mapPromotions(profile?.promotions ?? (profile?.promo ? [profile.promo] : undefined), base.promotions),
    coupons: mappedCoupons,
    confirmListingAccurate: false,
    confirmPhotosRepresentBusiness: false,
    confirmCommunityRules: false,
    paymentMethodIds: sanitizeServiciosPaymentMethodIds(profile?.paymentMethodIds),
    customPaymentMethods: sanitizeCustomPaymentMethodLabels(profile?.customPaymentMethods),
    amenityOptionIds: sanitizeServiciosAmenityOptionIds(profile?.amenityOptionIds),
    customAmenityOptions: sanitizeCustomServiciosAmenityLabels(profile?.customAmenityOptions),
    hasLicense: profile?.credentials?.hasLicense === true,
    licenseType: clean(profile?.credentials?.licenseType),
    licenseNumber: clean(profile?.credentials?.licenseNumber),
    licenseAuthority: clean(profile?.credentials?.licenseAuthority),
    licenseExpiration: clean(profile?.credentials?.licenseExpiration),
    isInsured: profile?.credentials?.isInsured === true,
    insuranceType: clean(profile?.credentials?.insuranceType),
    certifications: sanitizeCertificationLabels(profile?.credentials?.certifications),
    licenseDocumentUrl: fromUrl(profile?.credentials?.licenseDocumentUrl),
    insuranceDocumentUrl: fromUrl(profile?.credentials?.insuranceDocumentUrl),
  });

  const newFieldsMissing = profile ? detectNewFieldsAvailable(profile) : [];
  return {
    state,
    editIdentity: {
      id: clean(source.id) || null,
      slug,
      leonixAdId: clean(source.leonix_ad_id) || null,
      status: clean(source.listing_status) || "published",
    },
    newFieldsAvailable: newFieldsMissing.length > 0,
    newFieldsMissing,
  };
}
