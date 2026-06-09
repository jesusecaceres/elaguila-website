import type { SupportedLang } from "@/app/lib/language";
import { MEDIA_KIT_PAGE_EN } from "./en";
import { MEDIA_KIT_PAGE_ES } from "./es";
import type { MediaKitPageCopy } from "./types";

const MEDIA_KIT_PAGE_REGISTRY: Partial<Record<SupportedLang, MediaKitPageCopy>> = {
  es: MEDIA_KIT_PAGE_ES,
  en: MEDIA_KIT_PAGE_EN,
};

/**
 * Live Media Kit page copy.
 * ES/EN are native; other active languages fall back to EN until MEDIAKIT-LANG1.
 */
export function getMediaKitPageCopy(lang: SupportedLang): MediaKitPageCopy {
  return MEDIA_KIT_PAGE_REGISTRY[lang] ?? MEDIA_KIT_PAGE_EN;
}

export type { MediaKitPageCopy } from "./types";
