/**
 * Platform types and guards for magazine visual asset registry.
 * No Supabase client, no provider calls, no fake storage paths.
 */

export const MAGAZINE_VISUAL_ACTIVE_LOCALES = [
  "es",
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
] as const;

export const MAGAZINE_VISUAL_HELD_LOCALES = ["ar", "fa"] as const;

export type MagazineVisualLocale = (typeof MAGAZINE_VISUAL_ACTIVE_LOCALES)[number];
export type MagazineVisualHeldLocale = (typeof MAGAZINE_VISUAL_HELD_LOCALES)[number];

export type MagazineVisualAssetKind =
  | "source_pdf"
  | "translated_pdf"
  | "page_image"
  | "cover_image"
  | "ad_page_asset"
  | "companion_html";

export type MagazineVisualAssetStatus =
  | "planned"
  | "provider_pending"
  | "translated_local"
  | "uploaded_private"
  | "qa_pending"
  | "approved"
  | "rejected"
  | "public"
  | "archived";

export type MagazineVisualAssetQaStatus =
  | "not_started"
  | "pending"
  | "approved"
  | "rejected"
  | "needs_fix";

export type MagazineVisualAssetProvider =
  | "source_original"
  | "deepl"
  | "google"
  | "human_production"
  | "unknown";

export type MagazineVisualAssetRecord = {
  id: string;
  issueId: string;
  year?: number | null;
  month?: string | null;
  sourceLocale: string;
  targetLocale: MagazineVisualLocale;
  assetKind: MagazineVisualAssetKind;
  sourcePdfHash: string;
  sourcePageHash?: string | null;
  adAssetHash?: string | null;
  sourceVersion?: string | null;
  provider?: MagazineVisualAssetProvider | string | null;
  providerJobId?: string | null;
  providerStatus?: string | null;
  storageBucket?: string | null;
  storagePath?: string | null;
  publicUrl?: string | null;
  status: MagazineVisualAssetStatus;
  qaStatus: MagazineVisualAssetQaStatus;
  qaApproved: boolean;
  publiclyAvailable: boolean;
  fallbackReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  approvalNotes?: string | null;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  pageCount?: number | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type MagazineVisualAssetAvailabilityState =
  | "spanish_original"
  | "held_inactive"
  | "unavailable"
  | "not_approved"
  | "available";

export type MagazineVisualAssetAvailability = {
  issueId: string;
  targetLocale: MagazineVisualLocale | MagazineVisualHeldLocale | null;
  assetKind: MagazineVisualAssetKind | null;
  state: MagazineVisualAssetAvailabilityState;
  canServe: boolean;
  fallbackReason: string | null;
  record: MagazineVisualAssetRecord | null;
};

export const JUNE_2026_ISSUE_ID = "2026-june";
export const JUNE_2026_SOURCE_PDF_HASH =
  "8fa5ec5a9faa1c0cb689451b79477f60b2fc2e644048a9176bcc68d8be112986";

const ACTIVE_LOCALE_SET = new Set<string>(MAGAZINE_VISUAL_ACTIVE_LOCALES);
const HELD_LOCALE_SET = new Set<string>(MAGAZINE_VISUAL_HELD_LOCALES);

export function normalizeMagazineVisualLocale(
  input: string | null | undefined,
): MagazineVisualLocale | null {
  if (!input) return null;
  const normalized = input.trim().toLowerCase();
  if (ACTIVE_LOCALE_SET.has(normalized)) {
    return normalized as MagazineVisualLocale;
  }
  return null;
}

export function isActiveMagazineVisualLocale(locale: string | null | undefined): boolean {
  return normalizeMagazineVisualLocale(locale) !== null;
}

export function isHeldMagazineVisualLocale(locale: string | null | undefined): boolean {
  if (!locale) return false;
  return HELD_LOCALE_SET.has(locale.trim().toLowerCase());
}

export function canServeMagazineVisualAsset(
  record: MagazineVisualAssetRecord | null | undefined,
): boolean {
  if (!record) return false;
  if (!record.qaApproved) return false;
  if (record.qaStatus !== "approved") return false;
  if (!record.publiclyAvailable) return false;
  return Boolean(record.storagePath?.trim() || record.publicUrl?.trim());
}

export function getMagazineVisualFallbackReason(
  recordOrLocale: MagazineVisualAssetRecord | string | null | undefined,
  targetLocaleInput?: string | null | undefined,
): string | null {
  if (typeof recordOrLocale === "object" && recordOrLocale !== null) {
    if (recordOrLocale.fallbackReason?.trim()) {
      return recordOrLocale.fallbackReason.trim();
    }
    if (recordOrLocale.qaStatus === "rejected") {
      return "This translated visual edition was rejected during QA and is not available.";
    }
    if (recordOrLocale.qaStatus === "needs_fix") {
      return "This translated visual edition needs fixes before it can be served.";
    }
    if (!recordOrLocale.qaApproved || recordOrLocale.qaStatus !== "approved") {
      return "A translated visual edition exists but has not passed QA approval yet.";
    }
    if (!recordOrLocale.publiclyAvailable) {
      return "This translated visual edition is approved but not yet published for public serving.";
    }
    return "Translated visual asset is not yet available for public serving.";
  }

  const locale =
    typeof recordOrLocale === "string"
      ? recordOrLocale
      : (targetLocaleInput ?? null);

  if (isHeldMagazineVisualLocale(locale)) {
    return "This language is held inactive for magazine visual editions.";
  }

  const normalized = normalizeMagazineVisualLocale(locale);
  if (normalized === "es") {
    return null;
  }

  if (normalized) {
    return "The original visual magazine is in Spanish. A fully translated PDF requires a real produced asset, storage upload, registry approval, and QA sign-off.";
  }

  return "Unsupported magazine visual language. Showing Spanish original.";
}

export function buildMagazineVisualAssetStoragePath(input: {
  issueId: string;
  targetLocale: MagazineVisualLocale;
  assetKind: MagazineVisualAssetKind;
  sourcePdfHash: string;
  fileName: string;
}): string {
  const hashPrefix = input.sourcePdfHash.slice(0, 12);
  const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${input.issueId}/${input.targetLocale}/${input.assetKind}/${hashPrefix}/${safeFileName}`;
}

export function describeMagazineVisualAssetState(
  recordOrNull: MagazineVisualAssetRecord | null | undefined,
  targetLocaleInput: string | null | undefined,
  issueId: string = JUNE_2026_ISSUE_ID,
  assetKind: MagazineVisualAssetKind = "translated_pdf",
): MagazineVisualAssetAvailability {
  if (isHeldMagazineVisualLocale(targetLocaleInput)) {
    const held = targetLocaleInput!.trim().toLowerCase() as MagazineVisualHeldLocale;
    return {
      issueId,
      targetLocale: held,
      assetKind,
      state: "held_inactive",
      canServe: false,
      fallbackReason: getMagazineVisualFallbackReason(held),
      record: null,
    };
  }

  const targetLocale = normalizeMagazineVisualLocale(targetLocaleInput);

  if (!targetLocale) {
    return {
      issueId,
      targetLocale: null,
      assetKind,
      state: "unavailable",
      canServe: false,
      fallbackReason: getMagazineVisualFallbackReason(null, targetLocaleInput),
      record: null,
    };
  }

  if (targetLocale === "es") {
    return {
      issueId,
      targetLocale,
      assetKind: "source_pdf",
      state: "spanish_original",
      canServe: true,
      fallbackReason: null,
      record: null,
    };
  }

  if (canServeMagazineVisualAsset(recordOrNull)) {
    return {
      issueId,
      targetLocale,
      assetKind: recordOrNull!.assetKind,
      state: "available",
      canServe: true,
      fallbackReason: null,
      record: recordOrNull!,
    };
  }

  if (recordOrNull) {
    return {
      issueId,
      targetLocale,
      assetKind: recordOrNull.assetKind,
      state: "not_approved",
      canServe: false,
      fallbackReason: getMagazineVisualFallbackReason(recordOrNull),
      record: recordOrNull,
    };
  }

  return {
    issueId,
    targetLocale,
    assetKind,
    state: "unavailable",
    canServe: false,
    fallbackReason: getMagazineVisualFallbackReason(targetLocale),
    record: null,
  };
}

/** Map a Supabase row (snake_case) to MagazineVisualAssetRecord. */
export function mapMagazineVisualAssetRow(row: Record<string, unknown>): MagazineVisualAssetRecord {
  return {
    id: String(row.id),
    issueId: String(row.issue_id),
    year: typeof row.year === "number" ? row.year : null,
    month: typeof row.month === "string" ? row.month : null,
    sourceLocale: String(row.source_locale ?? "es"),
    targetLocale: String(row.target_locale) as MagazineVisualLocale,
    assetKind: String(row.asset_kind) as MagazineVisualAssetKind,
    sourcePdfHash: String(row.source_pdf_hash),
    sourcePageHash: typeof row.source_page_hash === "string" ? row.source_page_hash : null,
    adAssetHash: typeof row.ad_asset_hash === "string" ? row.ad_asset_hash : null,
    sourceVersion: typeof row.source_version === "string" ? row.source_version : null,
    provider: typeof row.provider === "string" ? row.provider : null,
    providerJobId: typeof row.provider_job_id === "string" ? row.provider_job_id : null,
    providerStatus: typeof row.provider_status === "string" ? row.provider_status : null,
    storageBucket: typeof row.storage_bucket === "string" ? row.storage_bucket : null,
    storagePath: typeof row.storage_path === "string" ? row.storage_path : null,
    publicUrl: typeof row.public_url === "string" ? row.public_url : null,
    status: String(row.status) as MagazineVisualAssetStatus,
    qaStatus: String(row.qa_status) as MagazineVisualAssetQaStatus,
    qaApproved: row.qa_approved === true,
    publiclyAvailable: row.publicly_available === true,
    fallbackReason: typeof row.fallback_reason === "string" ? row.fallback_reason : null,
    reviewedBy: typeof row.reviewed_by === "string" ? row.reviewed_by : null,
    reviewedAt: typeof row.reviewed_at === "string" ? row.reviewed_at : null,
    approvalNotes: typeof row.approval_notes === "string" ? row.approval_notes : null,
    fileSizeBytes: typeof row.file_size_bytes === "number" ? row.file_size_bytes : null,
    mimeType: typeof row.mime_type === "string" ? row.mime_type : null,
    pageCount: typeof row.page_count === "number" ? row.page_count : null,
    notes: typeof row.notes === "string" ? row.notes : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}
