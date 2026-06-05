import { createEmptyOfertaLocalDraft } from "./createEmptyOfertaLocalDraft";
import type {
  OfertaLocalDraft,
  OfertaLocalDraftAsset,
  OfertaLocalDraftAssetStatus,
  OfertaLocalDraftAssetType,
} from "./ofertasLocalesTypes";

export const OFERTAS_LOCALES_DRAFT_STORAGE_KEY = "leonix:ofertas-locales:draft:v1" as const;

const ASSET_TYPES: ReadonlySet<OfertaLocalDraftAssetType> = new Set([
  "flyer_pdf",
  "flyer_image",
  "coupon_pdf",
  "coupon_image",
  "external_url",
]);

const ASSET_STATUSES: ReadonlySet<OfertaLocalDraftAssetStatus> = new Set([
  "draft",
  "ready",
  "needs_upload",
  "removed",
]);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function sanitizeUrl(raw: unknown): string {
  const t = String(raw ?? "").trim();
  if (!t || t.startsWith("data:")) return "";
  return t.slice(0, 500);
}

function sanitizeAsset(raw: unknown, fallbackSort: number): OfertaLocalDraftAsset | null {
  if (!isPlainObject(raw)) return null;
  const assetType = raw.assetType;
  if (typeof assetType !== "string" || !ASSET_TYPES.has(assetType as OfertaLocalDraftAssetType)) {
    return null;
  }
  const statusRaw = raw.status;
  const status =
    typeof statusRaw === "string" && ASSET_STATUSES.has(statusRaw as OfertaLocalDraftAssetStatus)
      ? (statusRaw as OfertaLocalDraftAssetStatus)
      : "needs_upload";
  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `asset-${fallbackSort}`;
  const pageNumber =
    typeof raw.pageNumber === "number" && Number.isFinite(raw.pageNumber) ? raw.pageNumber : null;

  const sizeBytes =
    typeof raw.sizeBytes === "number" && Number.isFinite(raw.sizeBytes) && raw.sizeBytes >= 0
      ? raw.sizeBytes
      : null;

  return {
    id,
    assetType: assetType as OfertaLocalDraftAssetType,
    title: String(raw.title ?? "").slice(0, 120),
    note: String(raw.note ?? "").slice(0, 500),
    url: sanitizeUrl(raw.url),
    fileName: String(raw.fileName ?? "").slice(0, 160),
    mimeType: String(raw.mimeType ?? "").slice(0, 80),
    storagePath: String(raw.storagePath ?? "").slice(0, 500),
    sizeBytes,
    pageNumber,
    sortOrder: typeof raw.sortOrder === "number" ? raw.sortOrder : fallbackSort,
    status,
  };
}

function sanitizeAssetList(raw: unknown): OfertaLocalDraftAsset[] {
  if (!Array.isArray(raw)) return [];
  const out: OfertaLocalDraftAsset[] = [];
  raw.forEach((item, index) => {
    const asset = sanitizeAsset(item, index);
    if (asset) out.push(asset);
  });
  return out;
}

function mergeDraft(stored: Record<string, unknown>): OfertaLocalDraft {
  const base = createEmptyOfertaLocalDraft();
  return {
    ...base,
    ...stored,
    serviceZipCodes: Array.isArray(stored.serviceZipCodes)
      ? stored.serviceZipCodes.filter((z): z is string => typeof z === "string")
      : base.serviceZipCodes,
    languageTags: Array.isArray(stored.languageTags)
      ? stored.languageTags.filter((t): t is OfertaLocalDraft["languageTags"][number] =>
          t === "es" || t === "en" || t === "bilingual"
        )
      : base.languageTags,
    customMarketType: String(stored.customMarketType ?? "").slice(0, 120),
    wantsAiSearchableSpecials: Boolean(stored.wantsAiSearchableSpecials),
    flyerAssets: sanitizeAssetList(stored.flyerAssets),
    couponAssets: sanitizeAssetList(stored.couponAssets),
  };
}

export function loadOfertaLocalDraftFromStorage(): OfertaLocalDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(OFERTAS_LOCALES_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed)) return null;
    return mergeDraft(parsed);
  } catch {
    return null;
  }
}

export function saveOfertaLocalDraftToStorage(draft: OfertaLocalDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OFERTAS_LOCALES_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Quota or privacy mode — ignore silently.
  }
}

export function clearOfertaLocalDraftStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(OFERTAS_LOCALES_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
