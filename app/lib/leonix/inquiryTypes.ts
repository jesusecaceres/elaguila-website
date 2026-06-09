import type { SupportedLang } from "@/app/lib/language";
import { getInquiryTypeLabel } from "@/app/lib/leonix/publicFormCopy";

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

export function inquiryTypeLabel(type: InquiryType, lang: SupportedLang): string {
  return getInquiryTypeLabel(lang, type);
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
