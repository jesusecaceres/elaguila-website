import type { SupportedLang } from "@/app/lib/language";
import { MEDIA_KIT_PAGE_EN } from "./en";
import { MEDIA_KIT_PAGE_ES } from "./es";
import { MEDIA_KIT_PAGE_VI } from "./vi";
import { MEDIA_KIT_PAGE_PT } from "./pt";
import { MEDIA_KIT_PAGE_TL } from "./tl";
import { MEDIA_KIT_PAGE_KM } from "./km";
import { MEDIA_KIT_PAGE_ZH } from "./zh";
import { MEDIA_KIT_PAGE_JA } from "./ja";
import { MEDIA_KIT_PAGE_KO } from "./ko";
import { MEDIA_KIT_PAGE_HI } from "./hi";
import { MEDIA_KIT_PAGE_HY } from "./hy";
import { MEDIA_KIT_PAGE_RU } from "./ru";
import { MEDIA_KIT_PAGE_PA } from "./pa";
import type { MediaKitPageCopy } from "./types";

export const MEDIA_KIT_PAGE_REGISTRY: Partial<Record<SupportedLang, MediaKitPageCopy>> = {
  es: MEDIA_KIT_PAGE_ES,
  en: MEDIA_KIT_PAGE_EN,
  vi: MEDIA_KIT_PAGE_VI,
  pt: MEDIA_KIT_PAGE_PT,
  tl: MEDIA_KIT_PAGE_TL,
  km: MEDIA_KIT_PAGE_KM,
  zh: MEDIA_KIT_PAGE_ZH,
  ja: MEDIA_KIT_PAGE_JA,
  ko: MEDIA_KIT_PAGE_KO,
  hi: MEDIA_KIT_PAGE_HI,
  hy: MEDIA_KIT_PAGE_HY,
  ru: MEDIA_KIT_PAGE_RU,
  pa: MEDIA_KIT_PAGE_PA,
};

/** Live Media Kit page copy — native for all active non-RTL languages. */
export function getMediaKitPageCopy(lang: SupportedLang): MediaKitPageCopy {
  return MEDIA_KIT_PAGE_REGISTRY[lang] ?? MEDIA_KIT_PAGE_EN;
}

export type { MediaKitPageCopy } from "./types";
