import { normalizeLang, type SupportedLang } from "@/app/lib/language";
import {
  getMagazineReaderCopy,
  type MagazineReaderLangBundle,
} from "@/app/lib/magazine/magazineReaderCopy";
import type { ReaderCtaKey, ReaderSection } from "@/app/lib/magazine/magazineReaderCopy/types";
import {
  MAGAZINE_KIT_PDF_EN,
  MAGAZINE_KIT_PDF_ES,
  primaryMediaKitPdfHref,
  showDualMediaKitPdfButtons,
} from "@/app/lib/magazine/qrBridge";
import { magazineReadContactHref } from "@/app/lib/leonix/mediaKitRoutes";

export type MagazineLang = SupportedLang;

export type { ReaderCtaKey, ReaderSection };

export function resolveMagazineLang(raw: string | null | undefined): MagazineLang {
  return normalizeLang(raw);
}

/** Hub preview shows this many reader sections before linking to full reader. */
export const READER_PREVIEW_SECTION_COUNT = 4;

export const JUNE_2026 = {
  year: "2026",
  monthKey: "june",
  coverImage: "/magazine/2026/june/cover.png",
  pdfUrl: "/magazine/2026/june/leonix_media_june.pdf",
  flipbookUrl: "https://flip.leonixmedia.com/books/qnda/",
} as const;

export function getJune2026Title(lang: MagazineLang): string {
  return getMagazineReaderCopy(lang).issueMeta.title;
}

export function getJune2026MonthLabel(lang: MagazineLang): string {
  return getMagazineReaderCopy(lang).issueMeta.monthLabel;
}

export type MagazineUiCopy = MagazineReaderLangBundle["ui"];

export function getMagazineUi(lang: MagazineLang): MagazineUiCopy {
  return getMagazineReaderCopy(lang).ui;
}

export function getReaderSections(lang: MagazineLang): ReaderSection[] {
  return getMagazineReaderCopy(lang).sections;
}

export function readerCtaHref(key: ReaderCtaKey, lang: MagazineLang): string {
  switch (key) {
    case "advertise":
      return magazineReadContactHref(lang);
    case "newsletter":
      return `/newsletter?source=magazine-reader&lang=${lang}`;
    case "contact":
      return magazineReadContactHref(lang);
    case "clasificados":
      return `/clasificados?lang=${lang}`;
    case "mediaKit":
      return primaryMediaKitPdfHref(lang);
    case "comingSoon":
      return `/coming-soon-v2?lang=${lang}`;
  }
}

export function mediaKitHref(lang: MagazineLang): string {
  return primaryMediaKitPdfHref(lang);
}

export { MAGAZINE_KIT_PDF_EN, MAGAZINE_KIT_PDF_ES, showDualMediaKitPdfButtons };

export function comingSoonHref(lang: MagazineLang): string {
  return `/coming-soon-v2?lang=${lang}`;
}
