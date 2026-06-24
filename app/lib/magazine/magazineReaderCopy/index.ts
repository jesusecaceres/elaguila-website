import type { SupportedLang } from "@/app/lib/language";
import { MAGAZINE_READER_EN } from "./en";
import { MAGAZINE_READER_ES } from "./es";
import { MAGAZINE_READER_VI } from "./vi";
import { COMMUNITY_READER_COPY } from "./community";
import type { MagazineReaderLangBundle } from "./types";

export const MAGAZINE_READER_REGISTRY: Record<SupportedLang, MagazineReaderLangBundle> = {
  es: MAGAZINE_READER_ES,
  en: MAGAZINE_READER_EN,
  vi: MAGAZINE_READER_VI,
  pt: COMMUNITY_READER_COPY.pt,
  tl: COMMUNITY_READER_COPY.tl,
  km: COMMUNITY_READER_COPY.km,
  zh: COMMUNITY_READER_COPY.zh,
  ja: COMMUNITY_READER_COPY.ja,
  ko: COMMUNITY_READER_COPY.ko,
  hi: COMMUNITY_READER_COPY.hi,
  hy: COMMUNITY_READER_COPY.hy,
  ru: COMMUNITY_READER_COPY.ru,
  pa: COMMUNITY_READER_COPY.pa,
};

export function getMagazineReaderCopy(lang: SupportedLang): MagazineReaderLangBundle {
  return MAGAZINE_READER_REGISTRY[lang];
}

export { MAGAZINE_READER_ES, MAGAZINE_READER_EN, MAGAZINE_READER_VI, COMMUNITY_READER_COPY };
export type { MagazineReaderLangBundle, MagazineUiCopy, ReaderSection, ReaderCtaKey } from "./types";
