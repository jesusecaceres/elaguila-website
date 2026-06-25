"use client";

import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertaLocalItemReviewViewModel } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertaLocalScanEligibleAsset } from "@/app/lib/ofertas-locales/ofertasLocalesAiScanReadiness";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OfertasLocalesSourceAdPreviewPanel } from "./OfertasLocalesSourceAdPreviewPanel";
import { ofertasLocalesAppCopy } from "./ofertasLocalesApplicationCopy";

type Props = {
  lang: OfertasLocalesAppLang;
  draft: OfertaLocalDraft;
  focusedItem: OfertaLocalItemReviewViewModel | null;
  selectedAssetId: string | null;
  eligibleAssets: OfertaLocalScanEligibleAsset[];
};

function sourceRoleLabel(
  item: OfertaLocalItemReviewViewModel,
  draft: OfertaLocalDraft,
  lang: OfertasLocalesAppLang
): string {
  if (!item.sourceAssetId) return "";
  const inFlyer = draft.flyerAssets.some((a) => a.id === item.sourceAssetId);
  if (inFlyer) return lang === "en" ? "Main flyer" : "Volante principal";
  const inCoupon = draft.couponAssets.some((a) => a.id === item.sourceAssetId);
  if (inCoupon) return lang === "en" ? "Coupon / additional" : "Cupón / adicional";
  return item.sourceFileName || "";
}

export function OfertasLocalesProductClipPanel({
  lang,
  draft,
  focusedItem,
  selectedAssetId,
  eligibleAssets,
}: Props) {
  const c = ofertasLocalesAppCopy(lang);
  const cropUrl = focusedItem?.sourceCropUrl?.trim();

  if (cropUrl) {
    return (
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#D4C4A8]/70 bg-white shadow-sm">
        <div className="shrink-0 border-b border-[#D4C4A8]/50 px-4 py-3">
          <p className="text-sm font-semibold text-[#7A1E2C]">{c.aiReviewAdClipTitle}</p>
          {focusedItem ? (
            <p className="mt-1 text-xs text-[#1E1814]/65">
              {c.aiReviewSourcePage} {focusedItem.sourcePage ?? "—"} ·{" "}
              {sourceRoleLabel(focusedItem, draft, lang)}
              {focusedItem.sourceFileName ? ` · ${focusedItem.sourceFileName}` : ""}
            </p>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-[#FDF8F0]/50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cropUrl}
            alt={focusedItem?.itemName ?? c.aiReviewAdClipTitle}
            className="mx-auto max-h-[min(72vh,900px)] w-auto max-w-full rounded-lg border border-[#D4C4A8]/60 object-contain shadow-sm"
          />
        </div>
        <div className="shrink-0 border-t border-[#D4C4A8]/40 px-3 py-2">
          <p className="text-[10px] text-[#1E1814]/50">{c.aiReviewViewFullPageHint}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {focusedItem ? (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950/85">
          {c.aiReviewNoClipAvailable}
          {focusedItem.sourcePage != null ? ` · ${c.aiReviewSourcePage} ${focusedItem.sourcePage}` : ""}
        </p>
      ) : null}
      <OfertasLocalesSourceAdPreviewPanel
        lang={lang}
        draft={draft}
        selectedAssetId={selectedAssetId}
        eligibleAssets={eligibleAssets}
        deskMode
      />
    </div>
  );
}
