import type { SupportedLang } from "@/app/lib/language";
import { MAGAZINE_HUB_EN, MAGAZINE_HUB_ES } from "./esEn";
import type { MagazineHubPageCopy } from "./types";

/**
 * Revista hub copy: Spanish primary, English at full parity. Every other route language reads the English
 * copy (the site's launch fallback); the dedicated reader routes keep their own per-language copy in
 * `magazineReaderCopy`. Adding a language later is a data-only change to this registry.
 */
export const MAGAZINE_HUB_REGISTRY: Partial<Record<SupportedLang, MagazineHubPageCopy>> = {
  es: MAGAZINE_HUB_ES,
  en: MAGAZINE_HUB_EN,
};

export function getMagazineHubPageCopy(lang: SupportedLang): MagazineHubPageCopy {
  return MAGAZINE_HUB_REGISTRY[lang] ?? MAGAZINE_HUB_EN;
}

export type { MagazineHubPageCopy } from "./types";
