import { normalizeLang, type SupportedLang } from "@/app/lib/language";

export type MagazineVisualAssetStatus =
  | "planned"
  | "source_ready"
  | "translated_pending_qa"
  | "qa_approved"
  | "rejected"
  | "unavailable";

export type MagazineVisualAssetKind =
  | "source_pdf"
  | "translated_pdf"
  | "source_flipbook"
  | "translated_flipbook"
  | "rendered_page_image"
  | "translated_page_image"
  | "advertiser_ad_asset"
  | "companion_html";

export type MagazineVisualTranslationProvider =
  | "source_original"
  | "human_production"
  | "google_translate"
  | "deepl"
  | "unknown";

export type MagazineVisualAssetManifest = {
  issueId: string;
  sourceLocale: "es";
  targetLocale: SupportedLang;
  sourcePdfHash?: string;
  pageHash?: string;
  adAssetHash?: string;
  sourceVersion: string;
  provider: MagazineVisualTranslationProvider;
  assetKind: MagazineVisualAssetKind;
  assetPath: string | null;
  status: MagazineVisualAssetStatus;
  qaApproved: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

const JUNE_2026_ISSUE_ID = "2026-june";
const JUNE_2026_SOURCE_VERSION = "2026-june-spanish-original-v1";
const JUNE_2026_SOURCE_PDF_PATH = "/magazine/2026/june/leonix_media_june.pdf";
const JUNE_2026_SOURCE_FLIPBOOK_URL = "https://flip.leonixmedia.com/books/qnda/";
const JUNE_2026_SOURCE_PDF_HASH = "TODO_SHA256_SOURCE_PDF_2026_JUNE";
const MANIFEST_CREATED_AT = "2026-06-27";

const FUTURE_VISUAL_TRANSLATION_LOCALES = [
  "en",
  "vi",
  "pt",
  "tl",
  "km",
  "zh",
  "ja",
  "ko",
  "hi",
  "hy",
  "ru",
  "pa",
] as const satisfies readonly SupportedLang[];

const FUTURE_VISUAL_TRANSLATION_PLACEHOLDERS: readonly MagazineVisualAssetManifest[] =
  FUTURE_VISUAL_TRANSLATION_LOCALES.flatMap<MagazineVisualAssetManifest>((targetLocale) => [
    {
      issueId: JUNE_2026_ISSUE_ID,
      sourceLocale: "es",
      targetLocale,
      sourcePdfHash: JUNE_2026_SOURCE_PDF_HASH,
      sourceVersion: JUNE_2026_SOURCE_VERSION,
      provider: "human_production",
      assetKind: "translated_pdf",
      assetPath: null,
      status: "unavailable",
      qaApproved: false,
      notes:
        "Translated visual PDF is unavailable until a real produced file exists and QA approves it.",
      createdAt: MANIFEST_CREATED_AT,
      updatedAt: MANIFEST_CREATED_AT,
    },
    {
      issueId: JUNE_2026_ISSUE_ID,
      sourceLocale: "es",
      targetLocale,
      sourceVersion: JUNE_2026_SOURCE_VERSION,
      provider: "human_production",
      assetKind: "translated_flipbook",
      assetPath: null,
      status: "unavailable",
      qaApproved: false,
      notes:
        "Translated FlipHTML5 visual edition is unavailable until a real produced flipbook exists and QA approves it.",
      createdAt: MANIFEST_CREATED_AT,
      updatedAt: MANIFEST_CREATED_AT,
    },
  ]);

/**
 * Static registry layer only. Do not import into live UI until a later gate
 * intentionally wires serving rules for real translated visual assets.
 */
export const MAGAZINE_VISUAL_TRANSLATION_MANIFEST = [
  {
    issueId: JUNE_2026_ISSUE_ID,
    sourceLocale: "es",
    targetLocale: "es",
    sourcePdfHash: JUNE_2026_SOURCE_PDF_HASH,
    sourceVersion: JUNE_2026_SOURCE_VERSION,
    provider: "source_original",
    assetKind: "source_pdf",
    assetPath: JUNE_2026_SOURCE_PDF_PATH,
    status: "source_ready",
    qaApproved: false,
    notes:
      "Spanish original visual PDF only. This is not a translated visual asset and does not imply translation QA.",
    createdAt: MANIFEST_CREATED_AT,
    updatedAt: MANIFEST_CREATED_AT,
  },
  {
    issueId: JUNE_2026_ISSUE_ID,
    sourceLocale: "es",
    targetLocale: "es",
    sourceVersion: JUNE_2026_SOURCE_VERSION,
    provider: "source_original",
    assetKind: "source_flipbook",
    assetPath: JUNE_2026_SOURCE_FLIPBOOK_URL,
    status: "source_ready",
    qaApproved: false,
    notes:
      "Spanish original FlipHTML5 visual edition only. This is not a translated flipbook.",
    createdAt: MANIFEST_CREATED_AT,
    updatedAt: MANIFEST_CREATED_AT,
  },
  ...FUTURE_VISUAL_TRANSLATION_PLACEHOLDERS,
  {
    issueId: JUNE_2026_ISSUE_ID,
    sourceLocale: "es",
    targetLocale: "en",
    pageHash: "TODO_SHA256_SOURCE_PAGE_OR_RENDER_2026_JUNE_PAGE_1",
    sourceVersion: JUNE_2026_SOURCE_VERSION,
    provider: "human_production",
    assetKind: "translated_page_image",
    assetPath: null,
    status: "planned",
    qaApproved: false,
    notes:
      "Page-level translated images require future production and QA before they can be served.",
    createdAt: MANIFEST_CREATED_AT,
    updatedAt: MANIFEST_CREATED_AT,
  },
  {
    issueId: JUNE_2026_ISSUE_ID,
    sourceLocale: "es",
    targetLocale: "en",
    adAssetHash: "TODO_SHA256_STABLE_AD_ASSET",
    sourceVersion: "advertiser-asset-version-pending",
    provider: "human_production",
    assetKind: "advertiser_ad_asset",
    assetPath: null,
    status: "planned",
    qaApproved: false,
    notes:
      "Reusable advertiser ad asset placeholder. Reuse only after the source ad hash matches and a translated asset is approved.",
    createdAt: MANIFEST_CREATED_AT,
    updatedAt: MANIFEST_CREATED_AT,
  },
  {
    issueId: JUNE_2026_ISSUE_ID,
    sourceLocale: "es",
    targetLocale: "en",
    sourceVersion: "2026-june-companion-html-v1",
    provider: "unknown",
    assetKind: "companion_html",
    assetPath: "/magazine/2026/june/companion?lang=en",
    status: "source_ready",
    qaApproved: false,
    notes:
      "HTML companion proof path. Text memory should prefer existing translation_records before any new translation cache table.",
    createdAt: MANIFEST_CREATED_AT,
    updatedAt: MANIFEST_CREATED_AT,
  },
] as const satisfies readonly MagazineVisualAssetManifest[];

/** @deprecated Use MAGAZINE_VISUAL_TRANSLATION_MANIFEST. */
export const MAGAZINE_VISUAL_TRANSLATION_PROOF_MANIFEST = MAGAZINE_VISUAL_TRANSLATION_MANIFEST;

function normalizeManifestLocale(targetLocale: string | null | undefined): SupportedLang {
  return normalizeLang(targetLocale);
}

function findMagazineVisualAsset(
  issueId: string,
  targetLocale: string | null | undefined,
  assetKind: MagazineVisualAssetKind,
): MagazineVisualAssetManifest | null {
  const normalizedLocale = normalizeManifestLocale(targetLocale);
  const assets: readonly MagazineVisualAssetManifest[] = MAGAZINE_VISUAL_TRANSLATION_MANIFEST;
  return (
    assets.find(
      (asset) =>
        asset.issueId === issueId &&
        asset.targetLocale === normalizedLocale &&
        asset.assetKind === assetKind,
    ) ?? null
  );
}

export function getMagazineVisualAssetStatus(
  issueId: string,
  targetLocale: string | null | undefined,
  assetKind: MagazineVisualAssetKind,
): MagazineVisualAssetStatus {
  return findMagazineVisualAsset(issueId, targetLocale, assetKind)?.status ?? "unavailable";
}

export function hasQaApprovedMagazineVisualAsset(
  issueId: string,
  targetLocale: string | null | undefined,
  assetKind: MagazineVisualAssetKind,
): boolean {
  const asset = findMagazineVisualAsset(issueId, targetLocale, assetKind);
  return Boolean(asset?.status === "qa_approved" && asset.qaApproved === true && asset.assetPath);
}

export function getAvailableMagazineVisualAsset(
  issueId: string,
  targetLocale: string | null | undefined,
  assetKind: MagazineVisualAssetKind,
): MagazineVisualAssetManifest | null {
  const normalizedLocale = normalizeManifestLocale(targetLocale);
  const asset = findMagazineVisualAsset(issueId, normalizedLocale, assetKind);
  if (!asset?.assetPath) return null;

  if (hasQaApprovedMagazineVisualAsset(issueId, normalizedLocale, assetKind)) {
    return asset;
  }

  const isSpanishSourceAsset =
    normalizedLocale === "es" &&
    asset.sourceLocale === "es" &&
    asset.provider === "source_original" &&
    asset.status === "source_ready" &&
    (asset.assetKind === "source_pdf" || asset.assetKind === "source_flipbook");

  return isSpanishSourceAsset ? asset : null;
}

export function listMagazineVisualAssetsForIssue(
  issueId: string,
): readonly MagazineVisualAssetManifest[] {
  const assets: readonly MagazineVisualAssetManifest[] = MAGAZINE_VISUAL_TRANSLATION_MANIFEST;
  return assets.filter((asset) => asset.issueId === issueId);
}

export function listMagazineVisualAssetsForLocale(
  issueId: string,
  targetLocale: string | null | undefined,
): readonly MagazineVisualAssetManifest[] {
  const normalizedLocale = normalizeManifestLocale(targetLocale);
  return listMagazineVisualAssetsForIssue(issueId).filter(
    (asset) => asset.targetLocale === normalizedLocale,
  );
}
