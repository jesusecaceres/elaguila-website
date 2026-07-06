import type {
  ClasificadosServiciosApplicationState,
  ClasificadosServiciosPromoRow,
  ClasificadosServiciosCouponRow,
  DayKey,
  GalleryItem,
  TestimonialRow,
  VideoItem,
} from "./clasificadosServiciosApplicationTypes";
import { createEmptyClasificadosPromoRow } from "./clasificadosServiciosPromo";
import { createDefaultClasificadosServiciosState } from "./defaultClasificadosServiciosState";
import { isBusinessHighlightPresetId } from "./businessHighlightPresets";
import { normalizeServiceOfferedDedupeKey } from "./serviciosCustomServicesOffered";
import {
  CUSTOM_CHIP_MAX_LENGTH,
  MAX_CUSTOM_SERVICES_OFFERED,
  enforceServiciosSelectionCaps,
} from "./serviciosSelectionCaps";
import { BUSINESS_HIGHLIGHT_LABEL_MAX } from "./serviciosHighlightCaps";
import { isJunkServiciosQuickFactLabel, syncServiciosContactEnables } from "./serviciosContactVisibility";
import { SERVICIOS_APPLICATION_STEP_COUNT, migrateServiciosApplicationStepIndex } from "./serviciosApplicationStepLabels";
import { SERVICIOS_MAX_VIDEO_URLS } from "./clasificadosServiciosApplicationTypes";
import { CUSTOM_PAYMENT_LABEL_MAX } from "@/app/servicios/lib/serviciosPaymentMethodCatalog";
import { CUSTOM_SERVICIOS_AMENITY_LABEL_MAX } from "@/app/servicios/lib/serviciosAmenitiesCatalog";

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function isDayKey(v: unknown): v is DayKey {
  return typeof v === "string" && DAY_KEYS.includes(v as DayKey);
}

function isGalleryItem(v: unknown): v is GalleryItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.url === "string" && (o.source === "file" || o.source === "url");
}

function isTestimonial(v: unknown): v is TestimonialRow {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.authorName === "string" && typeof o.quote === "string";
}

function isVideoItem(v: unknown): v is VideoItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.url === "string" && (o.source === "file" || o.source === "url");
}

/**
 * Merge unknown localStorage JSON into a complete application state (forward-compatible).
 */
export function normalizeClasificadosServiciosApplicationState(raw: unknown): ClasificadosServiciosApplicationState {
  const d = createDefaultClasificadosServiciosState();
  if (!raw || typeof raw !== "object") return d;
  const o = raw as Record<string, unknown>;

  const str = (k: string, fallback: string) => (typeof o[k] === "string" ? (o[k] as string) : fallback);
  const bool = (k: string, fallback: boolean) => (typeof o[k] === "boolean" ? (o[k] as boolean) : fallback);

  const offerPrimaryRaw = o.offerPrimaryAsset;
  let legacyOfferPrimary: ClasificadosServiciosPromoRow["primaryAsset"] = "none";
  if (offerPrimaryRaw === "link" || offerPrimaryRaw === "image" || offerPrimaryRaw === "pdf" || offerPrimaryRaw === "none") {
    legacyOfferPrimary = offerPrimaryRaw;
  }

  const parsePromoPrimary = (v: unknown): ClasificadosServiciosPromoRow["primaryAsset"] => {
    if (v === "link" || v === "image" || v === "pdf" || v === "none") return v;
    return "none";
  };

  let promotions: ClasificadosServiciosPromoRow[] = [...d.promotions];
  if (Array.isArray(o.promotions)) {
    const parsed: ClasificadosServiciosPromoRow[] = [];
    for (const item of o.promotions) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      parsed.push({
        title: typeof r.title === "string" ? r.title : "",
        details: typeof r.details === "string" ? r.details : "",
        link: typeof r.link === "string" ? r.link : "",
        imageUrl: typeof r.imageUrl === "string" ? r.imageUrl : "",
        pdfUrl: typeof r.pdfUrl === "string" ? r.pdfUrl : "",
        pdfFileName: typeof r.pdfFileName === "string" ? r.pdfFileName : "",
        pdfFileSizeBytes: typeof r.pdfFileSizeBytes === "number" && r.pdfFileSizeBytes >= 0 ? r.pdfFileSizeBytes : 0,
        primaryAsset: parsePromoPrimary(r.primaryAsset),
        qrLater: r.qrLater === true,
      });
    }
    if (parsed.length > 0) promotions = parsed;
  } else if (
    (typeof o.offerTitle === "string" && o.offerTitle.trim()) ||
    (typeof o.offerDetails === "string" && o.offerDetails.trim()) ||
    (typeof o.offerLink === "string" && o.offerLink.trim()) ||
    (typeof o.offerImageUrl === "string" && o.offerImageUrl.trim()) ||
    (typeof o.offerPdfUrl === "string" && o.offerPdfUrl.trim()) ||
    o.offerQrLater === true
  ) {
    promotions = [
      {
        title: str("offerTitle", ""),
        details: str("offerDetails", ""),
        link: str("offerLink", ""),
        imageUrl: str("offerImageUrl", ""),
        pdfUrl: str("offerPdfUrl", ""),
        pdfFileName: "",
        pdfFileSizeBytes: 0,
        primaryAsset: legacyOfferPrimary,
        qrLater: bool("offerQrLater", false),
      },
    ];
  }
  if (promotions.length === 0) promotions = [createEmptyClasificadosPromoRow()];

  // Normalize coupons
  const couponsAddOn = bool("couponsAddOn", d.couponsAddOn);
  let coupons: ClasificadosServiciosCouponRow[] = d.coupons ?? [];
  if (Array.isArray(o.coupons)) {
    const parsed: ClasificadosServiciosCouponRow[] = [];
    for (const r of o.coupons) {
      if (!r || typeof r !== "object") continue;
      const row = r as Record<string, unknown>;
      parsed.push({
        title: typeof row.title === "string" ? row.title.slice(0, 120) : "",
        description: typeof row.description === "string" ? row.description.slice(0, 800) : "",
        regularPrice: typeof row.regularPrice === "string" ? row.regularPrice.slice(0, 50) : "",
        specialPrice: typeof row.specialPrice === "string" ? row.specialPrice.slice(0, 50) : "",
        savings: typeof row.savings === "string" ? row.savings.slice(0, 50) : "",
        imageUrl: typeof row.imageUrl === "string" ? row.imageUrl : "",
        url: typeof row.url === "string" ? row.url.slice(0, 500) : "",
        couponCode: typeof row.couponCode === "string" ? row.couponCode.slice(0, 50) : "",
        expirationDate: typeof row.expirationDate === "string" ? row.expirationDate : "",
        redemptionNote: typeof row.redemptionNote === "string" ? row.redemptionNote.slice(0, 300) : "",
        ctaLabel: typeof row.ctaLabel === "string" ? row.ctaLabel.slice(0, 50) : "",
      });
    }
    if (parsed.length > 0) coupons = parsed;
  }
  if (!couponsAddOn) coupons = [];

  let couponFlyer = d.couponFlyer ?? { imageUrl: "" };
  if (o.couponFlyer && typeof o.couponFlyer === "object") {
    const cf = o.couponFlyer as Record<string, unknown>;
    couponFlyer = {
      imageUrl: typeof cf.imageUrl === "string" ? cf.imageUrl : "",
    };
  }

  let couponMoreOffers = d.couponMoreOffers ?? { url: "", buttonLabel: "" };
  if (o.couponMoreOffers && typeof o.couponMoreOffers === "object") {
    const cm = o.couponMoreOffers as Record<string, unknown>;
    couponMoreOffers = {
      url: typeof cm.url === "string" ? cm.url.slice(0, 500) : "",
      buttonLabel: typeof cm.buttonLabel === "string" ? cm.buttonLabel.slice(0, 80) : "",
    };
  }

  const couponsMonthlyPrice =
    typeof o.couponsMonthlyPrice === "number" && Number.isFinite(o.couponsMonthlyPrice)
      ? Math.max(0, Math.floor(o.couponsMonthlyPrice))
      : d.couponsMonthlyPrice;

  let hours = d.hours;
  if (Array.isArray(o.hours) && o.hours.length === 7) {
    hours = o.hours.map((row, i) => {
      const base = d.hours[i]!;
      if (!row || typeof row !== "object") return base;
      const r = row as Record<string, unknown>;
      return {
        day: isDayKey(r.day) ? r.day : base.day,
        closed: r.closed === true,
        open: typeof r.open === "string" ? r.open : base.open,
        close: typeof r.close === "string" ? r.close : base.close,
      };
    });
  }

  let gallery: GalleryItem[] = d.gallery;
  if (Array.isArray(o.gallery)) {
    gallery = o.gallery.filter(isGalleryItem);
  }

  let testimonials: TestimonialRow[] = d.testimonials;
  if (Array.isArray(o.testimonials)) {
    testimonials = o.testimonials.filter(isTestimonial);
  }

  let languageIds = d.languageIds;
  if (Array.isArray(o.languageIds)) {
    languageIds = o.languageIds.filter((x): x is string => typeof x === "string");
    if (languageIds.length === 0) languageIds = ["lang_es"];
  }
  if (languageIds.includes("lang_bi")) {
    languageIds = languageIds.filter((x) => x !== "lang_bi");
    if (!languageIds.includes("lang_es")) languageIds.push("lang_es");
    if (!languageIds.includes("lang_en")) languageIds.push("lang_en");
  }

  let selectedServiceIds = d.selectedServiceIds;
  if (Array.isArray(o.selectedServiceIds)) {
    selectedServiceIds = o.selectedServiceIds.filter((x): x is string => typeof x === "string");
  }
  let selectedReasonIds = d.selectedReasonIds;
  if (Array.isArray(o.selectedReasonIds)) {
    selectedReasonIds = o.selectedReasonIds.filter((x): x is string => typeof x === "string");
  }
  let selectedQuickFactIds = d.selectedQuickFactIds;
  if (Array.isArray(o.selectedQuickFactIds)) {
    selectedQuickFactIds = o.selectedQuickFactIds.filter((x): x is string => typeof x === "string");
  }
  let selectedBusinessHighlightIds = d.selectedBusinessHighlightIds;
  if (Array.isArray(o.selectedBusinessHighlightIds)) {
    selectedBusinessHighlightIds = o.selectedBusinessHighlightIds.filter(
      (x): x is string => typeof x === "string" && isBusinessHighlightPresetId(x),
    );
  }
  let customBusinessHighlights = d.customBusinessHighlights;
  if (Array.isArray(o.customBusinessHighlights)) {
    customBusinessHighlights = o.customBusinessHighlights.filter((x): x is string => typeof x === "string");
  }
  let secondaryCtaIds = d.secondaryCtaIds;
  if (Array.isArray(o.secondaryCtaIds)) {
    secondaryCtaIds = o.secondaryCtaIds.filter((x): x is string => typeof x === "string");
  }

  let featuredGalleryIds = d.featuredGalleryIds;
  if (Array.isArray(o.featuredGalleryIds)) {
    featuredGalleryIds = o.featuredGalleryIds.filter((x): x is string => typeof x === "string").slice(0, 4);
  }

  let videos: VideoItem[] = d.videos;
  if (Array.isArray(o.videos)) {
    videos = o.videos
      .filter(isVideoItem)
      .map((v) => {
        const row = v as VideoItem;
        return { ...row, isPrimary: row.isPrimary === true };
      })
      .slice(0, SERVICIOS_MAX_VIDEO_URLS);
  }
  if (videos.length > 0 && !videos.some((v) => v.isPrimary === true)) {
    videos = videos.map((v, i) => ({ ...v, isPrimary: i === 0 }));
  }
  videos = videos.filter((v) => v.url.trim().length > 0);

  const galleryIdSet = new Set(gallery.map((g) => g.id));
  featuredGalleryIds = featuredGalleryIds.filter((id) => galleryIdSet.has(id)).slice(0, 4);
  if (featuredGalleryIds.length === 0 && gallery.length > 0) {
    featuredGalleryIds = gallery.slice(0, 4).map((g) => g.id);
  }

  const maxStep = Math.max(0, SERVICIOS_APPLICATION_STEP_COUNT - 1);
  let applicationStepIndex = d.applicationStepIndex;
  if (typeof o.applicationStepIndex === "number" && Number.isFinite(o.applicationStepIndex)) {
    applicationStepIndex = migrateServiciosApplicationStepIndex(Math.floor(o.applicationStepIndex));
    applicationStepIndex = Math.max(0, Math.min(maxStep, applicationStepIndex));
  }

  const customServiceLabel = str("customServiceLabel", d.customServiceLabel);
  const legacyIncluded =
    typeof o.customServiceIncluded === "boolean"
      ? (o.customServiceIncluded as boolean)
      : customServiceLabel.trim().length > 0;

  const customServiceDescription = str("customServiceDescription", d.customServiceDescription ?? "");

  const customServicesOffered: string[] = [];
  const customSeen = new Set<string>();
  const pushCustom = (raw: string) => {
    const t = raw.trim().slice(0, CUSTOM_CHIP_MAX_LENGTH);
    if (!t) return;
    const k = normalizeServiceOfferedDedupeKey(t);
    if (customSeen.has(k)) return;
    if (customServicesOffered.length >= MAX_CUSTOM_SERVICES_OFFERED) return;
    customSeen.add(k);
    customServicesOffered.push(t);
  };
  if (Array.isArray(o.customServicesOffered)) {
    for (const x of o.customServicesOffered) {
      if (typeof x === "string") pushCustom(x);
    }
  }
  const legacyLabel = customServiceLabel.trim().slice(0, CUSTOM_CHIP_MAX_LENGTH);
  let customServiceLabelOut = customServiceLabel;
  if (legacyIncluded && legacyLabel) {
    const beforeLen = customServicesOffered.length;
    pushCustom(legacyLabel);
    if (customServicesOffered.length > beforeLen) {
      customServiceLabelOut = "";
    }
  }

  let paymentMethodIds = d.paymentMethodIds;
  if (Array.isArray(o.paymentMethodIds)) {
    paymentMethodIds = o.paymentMethodIds.filter((x): x is string => typeof x === "string");
  }
  let customPaymentMethods = d.customPaymentMethods;
  if (Array.isArray(o.customPaymentMethods)) {
    customPaymentMethods = o.customPaymentMethods.filter((x): x is string => typeof x === "string");
  }
  let amenityOptionIds = d.amenityOptionIds;
  if (Array.isArray(o.amenityOptionIds)) {
    amenityOptionIds = o.amenityOptionIds.filter((x): x is string => typeof x === "string");
  }
  let customAmenityOptions = d.customAmenityOptions;
  if (Array.isArray(o.customAmenityOptions)) {
    customAmenityOptions = o.customAmenityOptions.filter((x): x is string => typeof x === "string");
  }

  let certifications = d.certifications;
  if (Array.isArray(o.certifications)) {
    certifications = o.certifications.filter((x): x is string => typeof x === "string");
  }

  let customQuickFactLabel = str("customQuickFactLabel", d.customQuickFactLabel);
  let customQuickFactIncluded = bool("customQuickFactIncluded", d.customQuickFactIncluded);
  if (isJunkServiciosQuickFactLabel(customQuickFactLabel)) {
    customQuickFactLabel = "";
    customQuickFactIncluded = false;
  }

  const baseBeforeCaps = {
    applicationStepIndex,
    businessTypeId: str("businessTypeId", d.businessTypeId),
    businessName: str("businessName", d.businessName),
    city: str("city", d.city),
    state: str("state", d.state),
    country: str("country", d.country),
    physicalStreet: str("physicalStreet", d.physicalStreet),
    physicalSuite: str("physicalSuite", d.physicalSuite),
    physicalAddressCity: str("physicalAddressCity", d.physicalAddressCity),
    physicalRegion: str("physicalRegion", d.physicalRegion),
    physicalCountry: str("physicalCountry", d.physicalCountry),
    physicalPostalCode: str("physicalPostalCode", d.physicalPostalCode),
    serviceAreaNotes: str("serviceAreaNotes", d.serviceAreaNotes),
    phone: str("phone", d.phone),
    phoneOffice: str("phoneOffice", d.phoneOffice),
    website: str("website", d.website),
    whatsapp: str("whatsapp", d.whatsapp),
    whatsappBusinessUrl: str("whatsappBusinessUrl", d.whatsappBusinessUrl),
    quoteMessagePhone: str("quoteMessagePhone", d.quoteMessagePhone ?? ""),
    email: str("email", d.email),
    languageIds,
    languageOtherLines: (() => {
      let lines = str("languageOtherLines", d.languageOtherLines);
      const legacy = o.languageOtherNote;
      if (!lines.trim() && typeof legacy === "string" && legacy.trim()) {
        lines = legacy;
      }
      return lines;
    })(),
    logoUrl: str("logoUrl", d.logoUrl),
    coverUrl: str("coverUrl", d.coverUrl),
    gallery,
    featuredGalleryIds,
    videos,
    aboutText: str("aboutText", d.aboutText),
    specialtiesLine: str("specialtiesLine", d.specialtiesLine),
    selectedServiceIds,
    customServicesOffered,
    customServiceLabel: customServiceLabelOut,
    customServiceIncluded: false,
    customServiceDescription,
    leonixVerifiedInterest: bool("leonixVerifiedInterest", d.leonixVerifiedInterest),
    selectedReasonIds,
    customReasonLabel: str("customReasonLabel", d.customReasonLabel),
    customReasonIncluded: bool("customReasonIncluded", d.customReasonIncluded),
    selectedQuickFactIds,
    customQuickFactLabel,
    customQuickFactIncluded,
    selectedBusinessHighlightIds,
    customBusinessHighlights,
    customBusinessHighlightLabel: str("customBusinessHighlightLabel", d.customBusinessHighlightLabel).slice(
      0,
      BUSINESS_HIGHLIGHT_LABEL_MAX,
    ),
    enableCall: bool("enableCall", d.enableCall),
    enableMessage: bool("enableMessage", d.enableMessage),
    enableWhatsapp: bool("enableWhatsapp", d.enableWhatsapp),
    enableWebsite: bool("enableWebsite", d.enableWebsite),
    enableEmail: bool("enableEmail", d.enableEmail),
    primaryCtaId: str("primaryCtaId", d.primaryCtaId),
    secondaryCtaIds,
    socialInstagram: str("socialInstagram", d.socialInstagram),
    socialFacebook: str("socialFacebook", d.socialFacebook),
    socialYoutube: str("socialYoutube", d.socialYoutube),
    socialTiktok: str("socialTiktok", d.socialTiktok),
    socialLinkedin: str("socialLinkedin", d.socialLinkedin),
    socialX: str("socialX", d.socialX),
    socialSnapchat: str("socialSnapchat", d.socialSnapchat),
    googleReviewsUrl: str("googleReviewsUrl", d.googleReviewsUrl),
    yelpReviewsUrl: str("yelpReviewsUrl", d.yelpReviewsUrl),
    extraLink1Url: str("extraLink1Url", d.extraLink1Url),
    extraLink1Label: str("extraLink1Label", d.extraLink1Label).slice(0, 48),
    extraLink2Url: str("extraLink2Url", d.extraLink2Url),
    extraLink2Label: str("extraLink2Label", d.extraLink2Label).slice(0, 48),
    hours,
    testimonials,
    promotions,
    coupons,
    couponsAddOn,
    couponsMonthlyPrice,
    couponFlyer,
    couponMoreOffers,
    confirmListingAccurate: bool("confirmListingAccurate", d.confirmListingAccurate),
    confirmPhotosRepresentBusiness: bool("confirmPhotosRepresentBusiness", d.confirmPhotosRepresentBusiness),
    confirmCommunityRules: bool("confirmCommunityRules", d.confirmCommunityRules),
    paymentMethodIds,
    customPaymentMethods,
    customPaymentMethodLabel: str("customPaymentMethodLabel", d.customPaymentMethodLabel).slice(
      0,
      CUSTOM_PAYMENT_LABEL_MAX,
    ),
    amenityOptionIds,
    customAmenityOptions,
    pendingCustomAmenityOption: str("pendingCustomAmenityOption", d.pendingCustomAmenityOption).slice(
      0,
      CUSTOM_SERVICIOS_AMENITY_LABEL_MAX,
    ),
    hasLicense: bool("hasLicense", d.hasLicense),
    isInsured: bool("isInsured", d.isInsured),
    licenseType: str("licenseType", d.licenseType),
    licenseNumber: str("licenseNumber", d.licenseNumber),
    licenseAuthority: str("licenseAuthority", d.licenseAuthority),
    licenseExpiration: str("licenseExpiration", d.licenseExpiration),
    insuranceType: str("insuranceType", d.insuranceType),
    licenseDocumentUrl: str("licenseDocumentUrl", d.licenseDocumentUrl),
    insuranceDocumentUrl: str("insuranceDocumentUrl", d.insuranceDocumentUrl),
    certifications,
    pendingCertification: str("pendingCertification", d.pendingCertification),
  } as ClasificadosServiciosApplicationState;

  return enforceServiciosSelectionCaps({
    ...baseBeforeCaps,
    ...syncServiciosContactEnables(baseBeforeCaps),
  });
}
