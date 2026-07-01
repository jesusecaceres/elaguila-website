import { normalizeLang, type SupportedLang } from "@/app/lib/language";
import {
  describeMagazineVisualAssetState,
  JUNE_2026_ISSUE_ID,
} from "@/app/lib/magazine/magazineVisualAssetsPlatform";

export type MagazineVisualAssetStatus = "available" | "planned" | "missing";

export type MagazineVisualAssetEntry = {
  status: MagazineVisualAssetStatus;
  pdfUrl?: string;
  coverUrl?: string;
  flipbookUrl?: string;
  notes?: string;
};

export type MagazineIssueVisualRegistry = {
  issueId: string;
  /** Canonical Spanish original visual assets. */
  spanishOriginal: Required<Pick<MagazineVisualAssetEntry, "pdfUrl" | "coverUrl" | "flipbookUrl">> & {
    status: "available";
  };
  /** Per requested language — never duplicate Spanish URL as a translated edition. */
  byLanguage: Partial<Record<SupportedLang | string, MagazineVisualAssetEntry>>;
};

const JUNE_2026_VISUAL: MagazineIssueVisualRegistry = {
  issueId: "2026-june",
  spanishOriginal: {
    status: "available",
    pdfUrl: "/magazine/2026/june/leonix_media_june.pdf",
    coverUrl: "/magazine/2026/june/cover.png",
    flipbookUrl: "https://flip.leonixmedia.com/books/qnda/",
  },
  byLanguage: {
    es: { status: "available" },
    en: { status: "planned", notes: "English visual PDF/flipbook not published yet." },
    vi: { status: "planned", notes: "Vietnamese visual PDF/flipbook not published yet." },
    pt: { status: "planned" },
    tl: { status: "planned" },
    km: { status: "planned" },
    zh: { status: "planned" },
    ja: { status: "planned" },
    ko: { status: "planned" },
    hi: { status: "planned" },
    hy: { status: "planned" },
    ru: { status: "planned" },
    pa: { status: "planned" },
  },
};

const REGISTRY: Record<string, MagazineIssueVisualRegistry> = {
  "2026-june": JUNE_2026_VISUAL,
};

export type MagazineVisualAssetResult = {
  issueId: string;
  requestedLang: SupportedLang;
  /** Language of the visual asset actually served (always es until separate assets exist). */
  visualLang: "es";
  isTranslatedVisualAvailable: boolean;
  pdfUrl: string;
  coverUrl: string;
  flipbookUrl: string;
  /** True when requested lang is not es and we serve Spanish originals. */
  isSpanishVisualFallback: boolean;
  fallbackReason: string | null;
  entryStatus: MagazineVisualAssetStatus;
};

export function getMagazineVisualAsset(
  issueId: string,
  requestedLangInput: string | null | undefined,
): MagazineVisualAssetResult {
  const requestedLang = normalizeLang(requestedLangInput);
  const issue = REGISTRY[issueId] ?? JUNE_2026_VISUAL;
  const entry = issue.byLanguage[requestedLang];
  const spanish = issue.spanishOriginal;

  const platformState = describeMagazineVisualAssetState(
    null,
    requestedLang,
    issueId === MAGAZINE_ISSUE_IDS.june2026 ? JUNE_2026_ISSUE_ID : issueId,
    "translated_pdf",
  );

  const isSpanishVisualFallback = requestedLang !== "es";
  const hasDedicatedVisual = platformState.canServe && platformState.state === "available";
  const fallbackReason = platformState.fallbackReason;

  return {
    issueId: issue.issueId,
    requestedLang,
    visualLang: "es",
    isTranslatedVisualAvailable: hasDedicatedVisual,
    pdfUrl: spanish.pdfUrl,
    coverUrl: spanish.coverUrl,
    flipbookUrl: spanish.flipbookUrl,
    isSpanishVisualFallback: isSpanishVisualFallback && !hasDedicatedVisual,
    fallbackReason,
    entryStatus: entry?.status ?? (requestedLang === "es" ? "available" : "planned"),
  };
}

/** @deprecated Use getMagazineVisualAsset — alias for issueContent imports. */
export const MAGAZINE_ISSUE_IDS = {
  june2026: "2026-june",
} as const;
