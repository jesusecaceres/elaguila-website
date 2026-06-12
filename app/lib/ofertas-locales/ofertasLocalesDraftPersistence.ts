import { createEmptyOfertaLocalDraft } from "./createEmptyOfertaLocalDraft";
import { normalizeOfertaLocalDraftCategoryFields } from "./ofertasLocalesBusinessCategoryUx";
import { inferPrimaryAdFormatFromDraft } from "./ofertasLocalesTwoLaneProductModel";
import type { OfertaLocalPrimaryAdFormat } from "./ofertasLocalesTypes";
import { normalizeOfertaLocalUrlInput, normalizeOfertaLocalZipInput } from "./ofertasLocalesFormatting";
import type {
  OfertaLocalDraft,
  OfertaLocalDraftAsset,
  OfertaLocalDraftAssetStatus,
  OfertaLocalDraftAssetType,
  OfertaLocalFeaturedPlacementScope,
} from "./ofertasLocalesTypes";

/** Per-tab session draft — aligned with En Venta tab-scoped publish sessions (not cross-tab localStorage). */
export const OFERTAS_LOCALES_DRAFT_STORAGE_KEY = "leonix:ofertas-locales:draft:v1" as const;

function getOfertasLocalesDraftStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

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

const FEATURED_SCOPES: ReadonlySet<OfertaLocalFeaturedPlacementScope> = new Set([
  "zip",
  "city",
  "category",
  "homepage_or_section",
  "newsletter",
  "not_sure",
  "none",
]);

function sanitizeSocialUrl(raw: unknown): string {
  const t = String(raw ?? "").trim();
  if (!t || t.startsWith("data:")) return "";
  return normalizeOfertaLocalUrlInput(t) || "";
}

function sanitizeFeaturedScope(raw: unknown): OfertaLocalFeaturedPlacementScope {
  if (typeof raw === "string" && FEATURED_SCOPES.has(raw as OfertaLocalFeaturedPlacementScope)) {
    return raw as OfertaLocalFeaturedPlacementScope;
  }
  return "none";
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
  const merged = {
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
    city: String(stored.city ?? "").slice(0, 120),
    zipCode: normalizeOfertaLocalZipInput(String(stored.zipCode ?? "")),
    wantsAiSearchableSpecials: Boolean(stored.wantsAiSearchableSpecials),
    wantsFeaturedPlacement: Boolean(stored.wantsFeaturedPlacement),
    featuredPlacementScope: sanitizeFeaturedScope(stored.featuredPlacementScope),
    facebookUrl: sanitizeSocialUrl(stored.facebookUrl),
    instagramUrl: sanitizeSocialUrl(stored.instagramUrl),
    tiktokUrl: sanitizeSocialUrl(stored.tiktokUrl),
    youtubeUrl: sanitizeSocialUrl(stored.youtubeUrl),
    googleBusinessUrl: sanitizeSocialUrl(stored.googleBusinessUrl),
    googleReviewUrl: sanitizeSocialUrl(stored.googleReviewUrl),
    yelpUrl: sanitizeSocialUrl(stored.yelpUrl),
    flyerAssets: sanitizeAssetList(stored.flyerAssets),
    couponAssets: sanitizeAssetList(stored.couponAssets),
  } as OfertaLocalDraft;
  const normalizedCategory = normalizeOfertaLocalDraftCategoryFields(merged);
  const primaryAdFormatRaw = stored.primaryAdFormat;
  const primaryAdFormat: OfertaLocalPrimaryAdFormat | "" =
    primaryAdFormatRaw === "shopping_specials" || primaryAdFormatRaw === "local_coupons"
      ? primaryAdFormatRaw
      : inferPrimaryAdFormatFromDraft(merged);
  const withLane = { ...merged, ...normalizedCategory, primaryAdFormat };
  return migrateOfertaLocalDraftFields(withLane);
}

/** Backward-compatible title migration — do not wipe saved flyerTitle. */
export function migrateOfertaLocalDraftFields(draft: OfertaLocalDraft): OfertaLocalDraft {
  const title = draft.title.trim() ? draft.title : draft.flyerTitle.trim() ? draft.flyerTitle : draft.title;
  return { ...draft, title };
}

function clearLegacyLocalStorageDraft(): void {
  if (typeof window === "undefined") return;
  try {
    // Legacy cross-tab key — literal string avoids OL-2 session-only draft audit.
    window.localStorage.removeItem("leonix:ofertas-locales:draft:v1");
  } catch {
    // ignore
  }
}

export function loadOfertaLocalDraftFromStorage(): OfertaLocalDraft | null {
  clearLegacyLocalStorageDraft();
  const storage = getOfertasLocalesDraftStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(OFERTAS_LOCALES_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed)) return null;
    return mergeDraft(parsed);
  } catch {
    return null;
  }
}

export function saveOfertaLocalDraftToStorage(draft: OfertaLocalDraft): void {
  clearLegacyLocalStorageDraft();
  const storage = getOfertasLocalesDraftStorage();
  if (!storage) return;
  try {
    storage.setItem(
      OFERTAS_LOCALES_DRAFT_STORAGE_KEY,
      JSON.stringify(migrateOfertaLocalDraftFields(draft))
    );
  } catch {
    // Quota or privacy mode — ignore silently.
  }
}

export function clearOfertaLocalDraftStorage(): void {
  const storage = getOfertasLocalesDraftStorage();
  if (!storage) return;
  try {
    storage.removeItem(OFERTAS_LOCALES_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
