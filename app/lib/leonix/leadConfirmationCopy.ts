import type { InquiryType } from "./inquiryTypes";
import type { PublicFormLang } from "./publicFormCopy";
import {
  getLeadSuccessMessage as getLeadSuccessFromCopy,
  getNewsletterSuccessMessage as getNewsletterSuccessFromCopy,
  getPublicLeadErrorMessage as getPublicErrorFromCopy,
} from "./publicFormCopy";

/** @deprecated Use PublicFormLang from publicFormCopy */
export type LeadFormLang = PublicFormLang;

export function getLeadSuccessMessage(inquiryType: InquiryType, lang: PublicFormLang): string {
  return getLeadSuccessFromCopy(lang, inquiryType);
}

export function getNewsletterSuccessMessage(lang: PublicFormLang): string {
  return getNewsletterSuccessFromCopy(lang);
}

export function getPublicLeadErrorMessage(lang: PublicFormLang): string {
  return getPublicErrorFromCopy(lang);
}

/** Strip internal email/DB warnings from API responses before showing to visitors. */
export function sanitizePublicLeadWarning(warning: string | undefined, saved: boolean): string | undefined {
  if (!warning) return undefined;
  if (saved) return undefined;
  const lower = warning.toLowerCase();
  if (
    lower.includes("resend") ||
    lower.includes("email notification") ||
    lower.includes("notificación por correo") ||
    lower.includes("not configured") ||
    lower.includes("no está configurada")
  ) {
    return undefined;
  }
  return warning;
}
