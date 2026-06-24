import type { SupportedLang } from "@/app/lib/language";

export type ReaderCtaKey =
  | "advertise"
  | "newsletter"
  | "contact"
  | "clasificados"
  | "mediaKit"
  | "comingSoon";

export type ReaderSection = {
  id: string;
  title: string;
  body: string;
  bullets?: string[];
  ctaKey?: ReaderCtaKey;
  ctaLabel?: string;
};

export type MagazineUiCopy = {
  languageEyebrow: string;
  originalMagazineLabel: string;
  languageChooserHint: string;
  readerPreviewBadge: string;
  readerPreviewIntro: string;
  futureFlipbookNote: string;
  originalEditionNote: string;
  originalEditionTitle: string;
  viewFlipbookSpanish: string;
  downloadPdf: string;
  viewMediaKit: string;
  openFullReader: string;
  backToMagazine: string;
  backToComingSoon: string;
  readPageTitle: string;
  readPageSubtitle: string;
  issuePageTitle: string;
  issuePageIntro: string;
  issuePageReaderCta: string;
  issuePageHubCta: string;
  closeFlipbook: string;
  langLabels: { es: string; en: string; vi: string };
  printSourceBadge: string;
  printSourceTitle: string;
  printSourceIntro: string;
  printSourceStepScan: string;
  printSourceStepLanguage: string;
  printSourceStepHighlights: string;
  printSourceStepOriginal: string;
  printSourceMobileNote: string;
  printQrCaption: string;
  openLanguageReader: string;
  mediaKitPdfEsLabel: string;
  mediaKitPdfEnLabel: string;
};

export type MagazineIssueMetaCopy = {
  title: string;
  monthLabel: string;
};

export type MagazineReaderLangBundle = {
  issueMeta: MagazineIssueMetaCopy;
  ui: MagazineUiCopy;
  sections: ReaderSection[];
};

export type MagazineReaderCopyRegistry = Record<SupportedLang, MagazineReaderLangBundle>;
