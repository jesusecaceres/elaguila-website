import type {
  ClasificadosServiciosApplicationState,
  DayHoursRow,
  DayKey,
  GalleryItem,
  TestimonialRow,
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

/**
 * Merge unknown localStorage JSON into a complete application state (forward-compatible).
 */
export function normalizeClasificadosServiciosApplicationState(raw: unknown): ClasificadosServiciosApplicationState {
  const d = createDefaultClasificadosServiciosState();
  if (!raw || typeof raw !== "object") return d;
  const o = raw as Record<string, unknown>;

  const str = (k: string, fallback: string) => (typeof o[k] === "string" ? (o[k] as string) : fallback);
  const bool = (k: string, fallback: boolean) => (typeof o[k] === "boolean" ? (o[k] as boolean) : fallback);

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
    aboutText: str("aboutText", d.aboutText),
    specialtiesLine: str("specialtiesLine", d.specialtiesLine),
    selectedServiceIds,
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
  };
}
