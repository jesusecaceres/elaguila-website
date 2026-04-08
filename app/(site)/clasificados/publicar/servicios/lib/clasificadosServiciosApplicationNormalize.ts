import type {
  ClasificadosServiciosApplicationState,
  DayHoursRow,
  DayKey,
  GalleryItem,
  TestimonialRow,
  VideoItem,
} from "./clasificadosServiciosApplicationTypes";
import { createDefaultClasificadosServiciosState } from "./defaultClasificadosServiciosState";

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
  let offerPrimaryAsset: ClasificadosServiciosApplicationState["offerPrimaryAsset"] = d.offerPrimaryAsset;
  if (offerPrimaryRaw === "link" || offerPrimaryRaw === "image" || offerPrimaryRaw === "pdf" || offerPrimaryRaw === "none") {
    offerPrimaryAsset = offerPrimaryRaw;
  }

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
      .slice(0, 2);
  }
  if (videos.length > 0 && !videos.some((v) => v.isPrimary === true)) {
    videos = videos.map((v, i) => ({ ...v, isPrimary: i === 0 }));
  }

  const galleryIdSet = new Set(gallery.map((g) => g.id));
  featuredGalleryIds = featuredGalleryIds.filter((id) => galleryIdSet.has(id)).slice(0, 4);
  if (featuredGalleryIds.length === 0 && gallery.length > 0) {
    featuredGalleryIds = gallery.slice(0, 4).map((g) => g.id);
  }

  return {
    businessTypeId: str("businessTypeId", d.businessTypeId),
    businessName: str("businessName", d.businessName),
    city: str("city", d.city),
    serviceAreaNotes: str("serviceAreaNotes", d.serviceAreaNotes),
    phone: str("phone", d.phone),
    website: str("website", d.website),
    whatsapp: str("whatsapp", d.whatsapp),
    languageIds,
    logoUrl: str("logoUrl", d.logoUrl),
    coverUrl: str("coverUrl", d.coverUrl),
    gallery,
    featuredGalleryIds,
    videos,
    aboutText: str("aboutText", d.aboutText),
    specialtiesLine: str("specialtiesLine", d.specialtiesLine),
    selectedServiceIds,
    customServiceLabel: str("customServiceLabel", d.customServiceLabel),
    leonixVerifiedInterest: bool("leonixVerifiedInterest", d.leonixVerifiedInterest),
    selectedReasonIds,
    selectedQuickFactIds,
    enableCall: bool("enableCall", d.enableCall),
    enableMessage: bool("enableMessage", d.enableMessage),
    enableWhatsapp: bool("enableWhatsapp", d.enableWhatsapp),
    enableWebsite: bool("enableWebsite", d.enableWebsite),
    primaryCtaId: str("primaryCtaId", d.primaryCtaId),
    secondaryCtaIds,
    socialInstagram: str("socialInstagram", d.socialInstagram),
    socialFacebook: str("socialFacebook", d.socialFacebook),
    socialYoutube: str("socialYoutube", d.socialYoutube),
    socialTiktok: str("socialTiktok", d.socialTiktok),
    socialLinkedin: str("socialLinkedin", d.socialLinkedin),
    hours,
    testimonials,
    offerTitle: str("offerTitle", d.offerTitle),
    offerDetails: str("offerDetails", d.offerDetails),
    offerLink: str("offerLink", d.offerLink),
    offerImageUrl: str("offerImageUrl", d.offerImageUrl),
    offerPdfUrl: str("offerPdfUrl", d.offerPdfUrl),
    offerPrimaryAsset,
    offerQrLater: bool("offerQrLater", d.offerQrLater),
    confirmListingAccurate: bool("confirmListingAccurate", d.confirmListingAccurate),
    confirmPhotosRepresentBusiness: bool("confirmPhotosRepresentBusiness", d.confirmPhotosRepresentBusiness),
    confirmCommunityRules: bool("confirmCommunityRules", d.confirmCommunityRules),
  };
}
