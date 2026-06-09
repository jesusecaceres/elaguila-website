export const INQUIRY_TYPES = [
  "advertising",
  "launch",
  "mediaKit",
  "general",
  "promotionalProducts",
  "businessListing",
  "partnership",
] as const;

export type InquiryType = (typeof INQUIRY_TYPES)[number];

export const PREFERRED_CONTACT_METHODS = ["email", "phone", "either"] as const;

export type PreferredContactMethod = (typeof PREFERRED_CONTACT_METHODS)[number];

export const AUDIENCE_TYPES = ["business", "reader", "partner", "advertiser", "community"] as const;

export type AudienceType = (typeof AUDIENCE_TYPES)[number];

const INQUIRY_LABELS: Record<InquiryType, { es: string; en: string }> = {
  advertising: { es: "Publicidad / anunciar mi negocio", en: "Advertising / promote my business" },
  launch: { es: "Lanzamiento / recibir noticias", en: "Launch / receive updates" },
  mediaKit: { es: "Media Kit / paquetes de publicidad", en: "Media Kit / advertising packages" },
  general: { es: "Pregunta general", en: "General question" },
  promotionalProducts: { es: "Productos promocionales / impresión", en: "Promotional products / print quote" },
  businessListing: { es: "Página de negocio / presencia digital", en: "Business page / digital presence" },
  partnership: { es: "Alianza / partnership", en: "Partnership" },
};

export function inquiryTypeLabel(type: InquiryType, lang: "es" | "en"): string {
  return INQUIRY_LABELS[type][lang];
}

/** Map legacy URL/topic values to canonical inquiry types. */
export function parseInquiryType(raw: unknown, fallback: InquiryType = "general"): InquiryType {
  const v = String(raw ?? "").trim();
  if ((INQUIRY_TYPES as readonly string[]).includes(v)) return v as InquiryType;
  if (v === "advertise" || v === "advertise_business") return "advertising";
  if (v === "classifieds") return "businessListing";
  if (v === "promo_print") return "promotionalProducts";
  if (v === "magazine") return "general";
  if (v === "account_support" || v === "general_question") return "general";
  if (v === "media_kit") return "mediaKit";
  return fallback;
}

export function parsePreferredContactMethod(raw: unknown): PreferredContactMethod {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "phone" || v === "either") return v;
  return "email";
}

export function parseAudienceType(raw: unknown): AudienceType | "" {
  const v = String(raw ?? "").trim().toLowerCase();
  if ((AUDIENCE_TYPES as readonly string[]).includes(v)) return v as AudienceType;
  return "";
}
