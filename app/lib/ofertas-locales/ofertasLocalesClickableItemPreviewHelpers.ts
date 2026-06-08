/**
 * Ofertas Locales clickable item preview — pure helpers (Stack C).
 */

import type { OfertaLocalDraft, OfertaLocalDraftAsset } from "./ofertasLocalesTypes";
import type {
  OfertaLocalClickableItemPreviewCard,
  OfertaLocalClickableItemPreviewContext,
  OfertaLocalItemReviewViewModel,
} from "./ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "./useOfertasLocalesAppLang";

export function formatOfertaLocalItemPriceDisplay(item: Pick<
  OfertaLocalItemReviewViewModel,
  "priceText" | "priceAmount" | "unit"
>): string {
  const text = item.priceText?.trim();
  if (text) return text;
  if (item.priceAmount != null && Number.isFinite(item.priceAmount)) {
    const base = `$${item.priceAmount.toFixed(2).replace(/\.00$/, "")}`;
    return item.unit?.trim() ? `${base} / ${item.unit.trim()}` : base;
  }
  return "—";
}

export function formatOfertaLocalItemConfidenceDisplay(
  label: OfertaLocalItemReviewViewModel["confidenceLabel"],
  lang: OfertasLocalesAppLang
): string {
  const es = { high: "Alta", medium: "Media", low: "Baja", unknown: "N/D" };
  const en = { high: "High", medium: "Medium", low: "Low", unknown: "N/A" };
  return (lang === "en" ? en : es)[label];
}

export function formatOfertaLocalItemReviewStatusDisplay(
  status: OfertaLocalItemReviewViewModel["reviewStatus"],
  lang: OfertasLocalesAppLang
): string {
  const es = {
    pending: "Pendiente",
    needs_review: "Necesita revisión",
    approved: "Aprobado",
    rejected: "Rechazado",
  };
  const en = {
    pending: "Pending",
    needs_review: "Needs review",
    approved: "Approved",
    rejected: "Rejected",
  };
  return (lang === "en" ? en : es)[status];
}

function findDraftAsset(draft: OfertaLocalDraft, sourceAssetId: string): OfertaLocalDraftAsset | null {
  if (!sourceAssetId.trim()) return null;
  const all = [...draft.flyerAssets, ...draft.couponAssets];
  return all.find((a) => a.id === sourceAssetId && a.status !== "removed") ?? null;
}

export function getSafeOfertaLocalSourceAssetHref(url: string | null | undefined): string | null {
  const t = String(url ?? "").trim();
  if (!t.startsWith("https://")) return null;
  try {
    const parsed = new URL(t);
    if (parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function resolveOfertaLocalSourceAssetLabel(
  item: Pick<OfertaLocalItemReviewViewModel, "sourceAssetId" | "sourceAssetUrl">,
  draft?: OfertaLocalDraft | null
): string {
  const asset = draft ? findDraftAsset(draft, item.sourceAssetId) : null;
  if (asset?.fileName?.trim()) return asset.fileName.trim();
  if (asset?.title?.trim()) return asset.title.trim();
  if (item.sourceAssetId.trim()) return item.sourceAssetId.trim();
  return "";
}

export function hasReliableBoundingBoxFields(
  item: Pick<OfertaLocalItemReviewViewModel, "sourceCropUrl">
): boolean {
  const crop = item.sourceCropUrl?.trim() ?? "";
  if (!crop) return false;
  return false;
}

export function getOfertaLocalClickablePreviewBoundingBoxNote(lang: OfertasLocalesAppLang): string {
  return lang === "en"
    ? "Full flyer/coupon context only; highlight overlay pending future extraction coordinates."
    : "Solo contexto del volante/cupón completo; resaltado pendiente de coordenadas futuras.";
}

export function buildOfertaLocalClickableItemPreviewContext(
  item: OfertaLocalItemReviewViewModel,
  draft: OfertaLocalDraft | null | undefined,
  lang: OfertasLocalesAppLang
): OfertaLocalClickableItemPreviewContext {
  const href = getSafeOfertaLocalSourceAssetHref(item.sourceAssetUrl);
  const label = resolveOfertaLocalSourceAssetLabel(item, draft);
  return {
    sourceAssetLabel: label || (lang === "en" ? "Source file" : "Archivo fuente"),
    sourceAssetHref: href,
    sourceAssetAvailable: Boolean(href),
    highlightSupportDetected: false,
    boundingBoxNote: getOfertaLocalClickablePreviewBoundingBoxNote(lang),
  };
}

export function mapToOfertaLocalClickablePreviewCard(
  item: OfertaLocalItemReviewViewModel
): OfertaLocalClickableItemPreviewCard {
  const categoryLabel =
    item.category?.trim() ||
    item.searchTags.slice(0, 2).join(", ") ||
    item.subcategory?.trim() ||
    "";

  return {
    id: item.id,
    itemName: item.itemName,
    priceDisplay: formatOfertaLocalItemPriceDisplay(item),
    categoryLabel,
    reviewStatus: item.reviewStatus,
    confidenceLabel: item.confidenceLabel,
    sourcePage: item.sourcePage,
    notPublic: true,
  };
}

export function formatOfertaLocalItemValidDateRange(
  validFrom: string | null,
  validUntil: string | null,
  lang: OfertasLocalesAppLang
): string {
  const from = validFrom?.trim() ?? "";
  const until = validUntil?.trim() ?? "";
  if (!from && !until) {
    return lang === "en" ? "Dates not set" : "Fechas no definidas";
  }
  if (from && until) return `${from} – ${until}`;
  return from || until;
}

export function formatOfertaLocalItemLocationLabel(
  item: Pick<OfertaLocalItemReviewViewModel, "businessCity" | "businessZipCode" | "businessState">,
  lang: OfertasLocalesAppLang
): string {
  const parts = [item.businessCity?.trim(), item.businessState?.trim(), item.businessZipCode?.trim()].filter(
    Boolean
  );
  if (parts.length === 0) {
    return lang === "en" ? "Location not set" : "Ubicación no definida";
  }
  return parts.join(", ");
}
