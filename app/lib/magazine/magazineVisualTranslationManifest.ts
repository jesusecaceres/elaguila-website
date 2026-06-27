import type { SupportedLang } from "@/app/lib/language";

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

/**
 * Static proof only. Do not import into live UI until MAGAZINE-ASSET-CACHE1
 * defines storage, QA, and serving rules for real translated visual assets.
 */
export const MAGAZINE_VISUAL_TRANSLATION_PROOF_MANIFEST = [
  {
    issueId: "2026-june",
    sourceLocale: "es",
    targetLocale: "es",
    sourcePdfHash: "TODO_SHA256_SOURCE_PDF_2026_JUNE",
    sourceVersion: "2026-june-spanish-original-v1",
    provider: "source_original",
    assetKind: "source_pdf",
    assetPath: "/magazine/2026/june/leonix_media_june.pdf",
    status: "source_ready",
    qaApproved: false,
    notes:
      "Spanish original visual PDF only. This is not a translated visual asset and does not imply translation QA.",
    createdAt: "2026-06-27",
    updatedAt: "2026-06-27",
  },
  {
    issueId: "2026-june",
    sourceLocale: "es",
    targetLocale: "en",
    sourcePdfHash: "TODO_SHA256_SOURCE_PDF_2026_JUNE",
    sourceVersion: "2026-june-spanish-original-v1",
    provider: "human_production",
    assetKind: "translated_pdf",
    assetPath: null,
    status: "unavailable",
    qaApproved: false,
    notes:
      "English translated visual PDF is intentionally unavailable until a real produced file exists and QA approves it.",
    createdAt: "2026-06-27",
    updatedAt: "2026-06-27",
  },
  {
    issueId: "2026-june",
    sourceLocale: "es",
    targetLocale: "en",
    pageHash: "TODO_SHA256_SOURCE_PAGE_OR_RENDER_2026_JUNE_PAGE_1",
    sourceVersion: "2026-june-spanish-original-v1",
    provider: "human_production",
    assetKind: "translated_page_image",
    assetPath: null,
    status: "planned",
    qaApproved: false,
    notes:
      "Page-level translated images require future production and QA before they can be served.",
    createdAt: "2026-06-27",
    updatedAt: "2026-06-27",
  },
  {
    issueId: "2026-june",
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
    createdAt: "2026-06-27",
    updatedAt: "2026-06-27",
  },
  {
    issueId: "2026-june",
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
    createdAt: "2026-06-27",
    updatedAt: "2026-06-27",
  },
] as const satisfies readonly MagazineVisualAssetManifest[];
