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

export const AUDIENCE_TYPES = ["business", "reader", "partner", "advertiser"] as const;

export type AudienceType = (typeof AUDIENCE_TYPES)[number];

const INQUIRY_LABELS: Record<InquiryType, { es: string; en: string }> = {
  advertising: { es: "Publicidad", en: "Advertising" },
  launch: { es: "Lanzamiento", en: "Launch" },
  mediaKit: { es: "Media Kit", en: "Media Kit" },
  general: { es: "General", en: "General" },
  promotionalProducts: { es: "Productos promocionales", en: "Promotional products" },
  businessListing: { es: "Página de negocio", en: "Business listing" },
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
