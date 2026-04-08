import type { ClasificadosServiciosApplicationState, DayHoursRow, DayKey } from "./clasificadosServiciosApplicationTypes";

const DAY_ORDER: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function defaultHours(): DayHoursRow[] {
  return DAY_ORDER.map((day) => {
    if (day === "sun") {
      return { day, closed: true, open: "10:00", close: "14:00" };
    }
    if (day === "sat") {
      return { day, closed: false, open: "10:00", close: "14:00" };
    }
    return { day, closed: false, open: "09:00", close: "18:00" };
  });
}

function hoursDifferFromTemplate(rows: DayHoursRow[]): boolean {
  const tmpl = defaultHours();
  if (rows.length !== tmpl.length) return true;
  return rows.some((row, i) => {
    const t = tmpl[i];
    if (!t || row.day !== t.day) return true;
    return row.closed !== t.closed || row.open !== t.open || row.close !== t.close;
  });
}

export function createDefaultClasificadosServiciosState(): ClasificadosServiciosApplicationState {
  return {
    businessTypeId: "",
    businessName: "",
    city: "",
    serviceAreaNotes: "",
    phone: "",
    website: "",
    whatsapp: "",
    languageIds: ["lang_es"],
    logoUrl: "",
    coverUrl: "",
    gallery: [],
    featuredGalleryIds: [],
    videos: [],
    aboutText: "",
    specialtiesLine: "",
    selectedServiceIds: [],
    customServiceLabel: "",
    leonixVerifiedInterest: false,
    selectedReasonIds: [],
    selectedQuickFactIds: [],
    enableCall: true,
    enableMessage: true,
    enableWhatsapp: true,
    enableWebsite: true,
    primaryCtaId: "",
    secondaryCtaIds: [],
    socialInstagram: "",
    socialFacebook: "",
    socialYoutube: "",
    socialTiktok: "",
    socialLinkedin: "",
    hours: defaultHours(),
    testimonials: [],
    offerTitle: "",
    offerDetails: "",
    offerLink: "",
    offerImageUrl: "",
    offerPdfUrl: "",
    offerPrimaryAsset: "none",
    offerQrLater: false,
  };
}

export const WEEK_DAY_LABELS: Record<DayKey, { es: string; en: string }> = {
  mon: { es: "Lunes", en: "Monday" },
  tue: { es: "Martes", en: "Tuesday" },
  wed: { es: "Miércoles", en: "Wednesday" },
  thu: { es: "Jueves", en: "Thursday" },
  fri: { es: "Viernes", en: "Friday" },
  sat: { es: "Sábado", en: "Saturday" },
  sun: { es: "Domingo", en: "Sunday" },
};

/** True when the draft differs from a fresh empty form (leave-guard + abandon flows). */
export function clasificadosServiciosApplicationHasProgress(s: ClasificadosServiciosApplicationState): boolean {
  if (s.businessTypeId.trim()) return true;
  if (s.businessName.trim()) return true;
  if (s.city.trim()) return true;
  if (s.serviceAreaNotes.trim()) return true;
  if (s.phone.trim() || s.website.trim() || s.whatsapp.trim()) return true;
  if (s.logoUrl.trim() || s.coverUrl.trim()) return true;
  if (s.gallery.length > 0 || s.videos.length > 0) return true;
  if (s.aboutText.trim() || s.specialtiesLine.trim()) return true;
  if (s.selectedServiceIds.length > 0 || s.customServiceLabel.trim()) return true;
  if (s.selectedReasonIds.length > 0 || s.selectedQuickFactIds.length > 0) return true;
  if (s.primaryCtaId.trim() || s.secondaryCtaIds.length > 0) return true;
  if (s.leonixVerifiedInterest) return true;
  if (
    s.socialInstagram.trim() ||
    s.socialFacebook.trim() ||
    s.socialYoutube.trim() ||
    s.socialTiktok.trim() ||
    s.socialLinkedin.trim()
  ) {
    return true;
  }
  if (s.testimonials.length > 0) return true;
  if (s.offerTitle.trim() || s.offerDetails.trim() || s.offerLink.trim() || s.offerImageUrl.trim() || s.offerPdfUrl.trim()) {
    return true;
  }
  if (s.offerQrLater) return true;
  if (s.languageIds.length !== 1 || s.languageIds[0] !== "lang_es") return true;
  if (hoursDifferFromTemplate(s.hours)) return true;
  return false;
}
