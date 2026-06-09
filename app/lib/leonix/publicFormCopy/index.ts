import type { SupportedLang } from "@/app/lib/language";
import type { InquiryType } from "@/app/lib/leonix/inquiryTypes";
import type { PublicFormLang, PublicLocaleCopy } from "./types";
import { EN_LOCALE, ES_LOCALE } from "./locales/esEn";
import {
  HI_LOCALE,
  HY_LOCALE,
  JA_LOCALE,
  KM_LOCALE,
  KO_LOCALE,
  PA_LOCALE,
  PT_LOCALE,
  RU_LOCALE,
  TL_LOCALE,
  VI_LOCALE,
  ZH_LOCALE,
} from "./locales/community";

export const PUBLIC_LOCALE_COPY: Record<SupportedLang, PublicLocaleCopy> = {
  es: ES_LOCALE,
  en: EN_LOCALE,
  vi: VI_LOCALE,
  pt: PT_LOCALE,
  tl: TL_LOCALE,
  km: KM_LOCALE,
  zh: ZH_LOCALE,
  ja: JA_LOCALE,
  ko: KO_LOCALE,
  hi: HI_LOCALE,
  hy: HY_LOCALE,
  ru: RU_LOCALE,
  pa: PA_LOCALE,
};

export function getPublicLocaleCopy(lang: PublicFormLang): PublicLocaleCopy {
  return PUBLIC_LOCALE_COPY[lang];
}

export function getInquiryTypeLabel(lang: PublicFormLang, type: InquiryType): string {
  return PUBLIC_LOCALE_COPY[lang].inquiryLabels[type];
}

export function getLeadSuccessMessage(lang: PublicFormLang, inquiryType: InquiryType): string {
  return PUBLIC_LOCALE_COPY[lang].leads.leadSuccess[inquiryType];
}

export function getNewsletterSuccessMessage(lang: PublicFormLang): string {
  return PUBLIC_LOCALE_COPY[lang].leads.newsletterSuccess;
}

export function getPublicLeadErrorMessage(lang: PublicFormLang): string {
  return PUBLIC_LOCALE_COPY[lang].leads.publicError;
}

export type { PublicFormLang, PublicLocaleCopy };
