import type { SupportedLang } from "@/app/lib/language";

export type MagazineVisualLanguageCode = SupportedLang;

export type MagazineVisualQaStatus =
  | "not_started"
  | "source_ready"
  | "translated_pending_qa"
  | "qa_approved"
  | "rejected"
  | "unavailable";

export type MagazineVisualProvider =
  | "source_original"
  | "deepl_document"
  | "google_document"
  | "human_production"
  | "manual_design"
  | "unknown";

export type MagazineVisualPageAsset = {
  pageNumber: number;
  pageHash?: string;
  standardImageUrl?: string;
  highResImageUrl?: string;
  fallbackReason?: string;
  qaStatus: MagazineVisualQaStatus;
  qaApproved: boolean;
  approvedBy?: string;
  approvalNotes?: string;
};

export type MagazineVisualTrack = {
  language: MagazineVisualLanguageCode;
  provider: MagazineVisualProvider;
  sourcePdfHash?: string;
  pdfUrl?: string;
  pageImages: readonly MagazineVisualPageAsset[];
  readableCompanionAvailable: boolean;
  printQrBridgeUrl: string;
  qaStatus: MagazineVisualQaStatus;
  qaApproved: boolean;
  fallbackReason?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  approvedBy?: string;
  approvalNotes?: string;
};

export type MagazineOriginalSpanishTrack = {
  language: "es";
  provider: "source_original";
  sourcePdfHash?: string;
  pdfUrl: string;
  coverImageUrl?: string;
  flipbookUrl?: string;
  pageImages: readonly MagazineVisualPageAsset[];
  readableCompanionAvailable: boolean;
  printQrBridgeUrl: string;
  qaStatus: "source_ready";
  qaApproved: false;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

export type MagazineReusableAdAsset = {
  adAssetHash: string;
  advertiserName: string;
  stableAd: boolean;
  sourceLocale: "es";
  usedInIssues: readonly string[];
  translationsByLanguage: Partial<
    Record<
      MagazineVisualLanguageCode,
      {
        provider: MagazineVisualProvider;
        assetPath?: string;
        qaStatus: MagazineVisualQaStatus;
        qaApproved: boolean;
        approvedBy?: string;
        approvalNotes?: string;
        updatedAt: string;
      }
    >
  >;
};

export type MagazineChangedEditorialPage = {
  pageNumber: number;
  pageHash: string;
  reason: "new_article" | "updated_article" | "recipe" | "community_page" | "layout_change" | "other";
  affectedLanguages: readonly MagazineVisualLanguageCode[];
  qaStatus: MagazineVisualQaStatus;
  notes?: string;
};

export type MagazineVisualIssueManifest = {
  issueId: string;
  year: string;
  month: string;
  status: "proof" | "draft" | "qa" | "published" | "archived";
  pageCount: number;
  originalSpanishVisual: MagazineOriginalSpanishTrack;
  translatedVisualTracks: Partial<Record<MagazineVisualLanguageCode, MagazineVisualTrack>>;
  reusableAdAssets: readonly MagazineReusableAdAsset[];
  changedEditorialPages: readonly MagazineChangedEditorialPage[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  approvedBy?: string;
  approvalNotes?: string;
};
