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
