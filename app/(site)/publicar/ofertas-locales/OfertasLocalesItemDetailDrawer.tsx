"use client";

import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertaLocalItemReviewViewModel } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import {
  buildOfertaLocalClickableItemPreviewContext,
  formatOfertaLocalItemConfidenceDisplay,
  formatOfertaLocalItemPriceDisplay,
  formatOfertaLocalItemReviewStatusDisplay,
  formatOfertaLocalItemValidDateRange,
  formatOfertaLocalItemLocationLabel,
} from "@/app/lib/ofertas-locales/ofertasLocalesClickableItemPreviewHelpers";
import { ofertasLocalesAppCopy } from "./ofertasLocalesApplicationCopy";

const OVERLAY = "fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4";
const DRAWER =
  "max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[#D4C4A8]/70 bg-[#FAF6F0] shadow-xl sm:rounded-2xl";
const FIELD = "rounded-lg border border-[#D4C4A8]/60 bg-white px-3 py-2 text-sm text-[#1E1814]";
const BTN_CLOSE =
  "rounded-lg border border-[#D4C4A8] bg-white px-3 py-2 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40";

type Props = {
  lang: OfertasLocalesAppLang;
  item: OfertaLocalItemReviewViewModel;
  draft?: OfertaLocalDraft | null;
  onClose: () => void;
};

function statusBadgeClass(status: OfertaLocalItemReviewViewModel["reviewStatus"]): string {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-900";
    case "rejected":
      return "bg-red-100 text-red-900";
    case "needs_review":
      return "bg-amber-100 text-amber-900";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value.trim() || value === "—") return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[#1E1814]/55">{label}</p>
      <p className="mt-0.5 text-sm text-[#1E1814]">{value}</p>
    </div>
  );
}

export function OfertasLocalesItemDetailDrawer({ lang, item, draft, onClose }: Props) {
  const c = ofertasLocalesAppCopy(lang);
  const context = buildOfertaLocalClickableItemPreviewContext(item, draft, lang);
  const priceDisplay = formatOfertaLocalItemPriceDisplay(item);
  const statusLabel = formatOfertaLocalItemReviewStatusDisplay(item.reviewStatus, lang);
  const confidenceLabel = formatOfertaLocalItemConfidenceDisplay(item.confidenceLabel, lang);
  const locationLabel = formatOfertaLocalItemLocationLabel(item, lang);
  const validDates = formatOfertaLocalItemValidDateRange(item.validFrom, item.validUntil, lang);
  const tags = item.searchTags.filter(Boolean).join(", ");
  const sourcePage =
    item.sourcePage != null && item.sourcePage > 0
      ? String(item.sourcePage)
      : "";

  return (
    <div
      className={OVERLAY}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ofertas-locales-item-detail-title"
      onClick={onClose}
    >
      <div className={DRAWER} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 border-b border-[#D4C4A8]/60 bg-[#FAF6F0]/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p id="ofertas-locales-item-detail-title" className="text-base font-semibold text-[#1E1814]">
                {c.clickablePreviewDetailTitle}
              </p>
              <p className="mt-1 text-lg font-bold text-[#7A1E2C]">{item.itemName || "—"}</p>
            </div>
            <button type="button" className={BTN_CLOSE} onClick={onClose}>
              {c.clickablePreviewClose}
            </button>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="rounded-xl border border-[#7A1E2C]/25 bg-[#7A1E2C]/5 px-3 py-3 text-sm text-[#1E1814]">
            <p className="font-medium">{c.clickablePreviewPrivateSafety}</p>
            <p className="mt-1 text-xs text-[#1E1814]/75">{c.clickablePreviewApprovedNotPublic}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(item.reviewStatus)}`}>
              {statusLabel}
            </span>
            <span className="rounded-full bg-[#1E1814]/10 px-2.5 py-1 text-xs font-semibold text-[#1E1814]">
              {c.clickablePreviewNotPublicBadge}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label={c.aiReviewPriceText} value={item.priceText?.trim() || "—"} />
            <DetailRow label={c.aiReviewPriceAmount} value={item.priceAmount != null ? String(item.priceAmount) : "—"} />
            <DetailRow label={c.aiReviewUnit} value={item.unit?.trim() || "—"} />
            <DetailRow label={c.aiReviewCategory} value={item.category?.trim() || "—"} />
            <DetailRow label={c.clickablePreviewSubcategory} value={item.subcategory?.trim() || "—"} />
            <DetailRow label={c.clickablePreviewNormalizedName} value={item.normalizedItemName?.trim() || "—"} />
            <DetailRow label={c.aiReviewTags} value={tags || "—"} />
            <DetailRow label={c.clickablePreviewReviewStatus} value={statusLabel} />
            <DetailRow label={c.aiReviewConfidence} value={confidenceLabel} />
            <DetailRow label={c.clickablePreviewBusiness} value={item.businessName?.trim() || "—"} />
            <DetailRow label={c.clickablePreviewLocation} value={locationLabel} />
            <DetailRow label={c.clickablePreviewValidDates} value={validDates} />
          </div>

          <div className={FIELD}>
            <p className="text-xs font-medium uppercase tracking-wide text-[#1E1814]/55">
              {c.aiReviewPriceText} / total
            </p>
            <p className="mt-1 text-base font-semibold text-[#7A1E2C]">{priceDisplay}</p>
          </div>

          <div className="rounded-xl border border-[#D4C4A8]/70 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-[#1E1814]">{c.aiReviewSource}</p>
            <DetailRow label={c.clickablePreviewSourceAsset} value={context.sourceAssetLabel} />
            <DetailRow label={c.clickablePreviewSourcePage} value={sourcePage} />

            {context.sourceAssetAvailable && context.sourceAssetHref ? (
              <a
                href={context.sourceAssetHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex rounded-lg bg-[#7A1E2C] px-3 py-2 text-sm font-semibold text-white hover:bg-[#6a1926]"
              >
                {c.clickablePreviewViewSource}
              </a>
            ) : (
              <p className="mt-2 text-sm text-[#1E1814]/70">{c.clickablePreviewSourceUnavailable}</p>
            )}

            <p className="mt-3 text-xs text-[#1E1814]/55">{context.boundingBoxNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
