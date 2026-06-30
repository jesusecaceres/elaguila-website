"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertaLocalItemReviewViewModel } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertaLocalScanEligibleAsset } from "@/app/lib/ofertas-locales/ofertasLocalesAiScanReadiness";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import {
  formatShowingPage,
  getOfertaLocalActiveScanCopy,
  withPdfPageHash,
} from "@/app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime";
import { OfertasLocalesSourceAdPreviewPanel } from "./OfertasLocalesSourceAdPreviewPanel";

type Props = {
  lang: OfertasLocalesAppLang;
  draft: OfertaLocalDraft;
  focusedItem: OfertaLocalItemReviewViewModel | null;
  selectedAssetId: string | null;
  eligibleAssets: OfertaLocalScanEligibleAsset[];
  scanActiveForAsset?: boolean;
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

function isPdfAsset(asset: OfertaLocalScanEligibleAsset | undefined): boolean {
  if (!asset) return false;
  const name = (asset.fileName || asset.assetUrl || "").toLowerCase();
  return name.endsWith(".pdf") || asset.mimeType === "application/pdf";
}

function isImageAsset(asset: OfertaLocalScanEligibleAsset | undefined): boolean {
  if (!asset) return false;
  return asset.mimeType.startsWith("image/");
}

function bboxOverlayStyle(item: OfertaLocalItemReviewViewModel | null): CSSProperties | null {
  const box = item?.sourceBbox;
  if (!box) return null;
  const xMin = Math.max(0, Math.min(1, box.xMin));
  const xMax = Math.max(0, Math.min(1, box.xMax));
  const yMin = Math.max(0, Math.min(1, box.yMin));
  const yMax = Math.max(0, Math.min(1, box.yMax));
  const left = Math.min(xMin, xMax) * 100;
  const top = Math.min(yMin, yMax) * 100;
  const width = Math.abs(xMax - xMin) * 100;
  const height = Math.abs(yMax - yMin) * 100;
  if (width <= 0 || height <= 0) return null;
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
  };
}

export function OfertasLocalesProductClipPanel({
  lang,
  draft,
  focusedItem,
  selectedAssetId,
  eligibleAssets,
}: Props) {
  const scanCopy = getOfertaLocalActiveScanCopy(lang);
  const cropUrl = focusedItem?.sourceCropUrl?.trim();
  const hasBbox = Boolean(focusedItem?.sourceBbox);
  const cropPending = hasBbox && !cropUrl;
  const cropFinalNone = !cropUrl && Boolean(focusedItem);
  const showPdfFallback = cropFinalNone;

  const selectedAsset = eligibleAssets.find((a) => a.assetId === selectedAssetId);
  const overlayStyle = bboxOverlayStyle(focusedItem);
  const fallbackPdfUrl = useMemo(() => {
    if (!selectedAsset?.assetUrl) return null;
    if (!isPdfAsset(selectedAsset)) return null;
    return withPdfPageHash(selectedAsset.assetUrl, focusedItem?.sourcePage ?? null);
  }, [selectedAsset, focusedItem?.sourcePage]);

  if (cropUrl) {
    return (
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#D4C4A8]/70 bg-white shadow-sm">
        <div className="shrink-0 border-b border-[#D4C4A8]/50 px-4 py-3">
          <p className="text-sm font-semibold text-[#7A1E2C]">
            {scanCopy.cropAdClipPage} {focusedItem?.sourcePage ?? "—"}
          </p>
          {focusedItem ? (
            <p className="mt-1 text-xs text-[#1E1814]/65">
              {sourceRoleLabel(focusedItem, draft, lang)}
              {focusedItem.sourceFileName ? ` · ${focusedItem.sourceFileName}` : ""}
            </p>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-[#FDF8F0]/50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cropUrl}
            alt={focusedItem?.itemName ?? scanCopy.cropAdClipPage}
            className="mx-auto max-h-[min(58vh,620px)] w-auto max-w-full rounded-lg border border-[#D4C4A8]/60 object-contain shadow-sm lg:max-h-[min(72vh,900px)]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {focusedItem ? (
        <p
          className={`rounded-lg border px-3 py-2 text-xs ${
            cropPending
              ? "border-amber-200/80 bg-amber-50/80 text-amber-950/85"
              : "border-[#D4C4A8]/70 bg-[#FDF8F0]/90 text-[#1E1814]/75"
          }`}
        >
          {cropPending ? scanCopy.cropPending : scanCopy.cropNone}
          {focusedItem.sourcePage != null && showPdfFallback
            ? ` ${formatShowingPage(scanCopy.showingPage, focusedItem.sourcePage)}`
            : null}
          {!cropUrl && hasBbox && isImageAsset(selectedAsset)
            ? ` ${
                lang === "en"
                  ? "AI suggested location is highlighted below."
                  : "La ubicación sugerida por AI está resaltada abajo."
              }`
            : null}
        </p>
      ) : null}

      {showPdfFallback && isImageAsset(selectedAsset) && selectedAsset?.assetUrl ? (
        <div className="overflow-hidden rounded-xl border border-[#D4C4A8]/70 bg-white shadow-sm">
          <div className="border-b border-[#D4C4A8]/50 px-4 py-2">
            <p className="text-xs font-semibold text-[#7A1E2C]">
              {hasBbox
                ? lang === "en"
                  ? "AI suggested location — product clip not available yet"
                  : "Ubicación sugerida por AI — recorte no disponible todavía"
                : lang === "en"
                  ? "Full-page reference"
                  : "Referencia de página completa"}
            </p>
          </div>
          <div className="overflow-auto bg-[#FDF8F0]/40 p-3">
            <div className="relative mx-auto w-fit max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedAsset.assetUrl}
                alt={focusedItem?.itemName ?? selectedAsset.fileName}
                className="max-h-[min(58vh,620px)] max-w-full rounded-lg object-contain lg:max-h-[min(72vh,900px)]"
              />
              {overlayStyle ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute rounded-md border-2 border-[#7A1E2C] bg-[#7A1E2C]/15 shadow-[0_0_0_2px_rgba(255,255,255,0.8)]"
                  style={overlayStyle}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : showPdfFallback && fallbackPdfUrl ? (
        <div className="overflow-hidden rounded-xl border border-[#D4C4A8]/70 bg-white shadow-sm">
          <div className="border-b border-[#D4C4A8]/50 px-4 py-2">
            <p className="text-xs font-semibold text-[#7A1E2C]">
              {focusedItem?.sourcePage
                ? formatShowingPage(scanCopy.showingPage, focusedItem.sourcePage)
                : lang === "en"
                  ? "Full page view"
                  : "Vista de página completa"}
            </p>
          </div>
          <iframe
            title={selectedAsset?.fileName || "PDF preview"}
            src={fallbackPdfUrl}
            className="h-[min(58vh,620px)] w-full bg-[#FDF8F0]/40 lg:h-[min(72vh,900px)]"
          />
        </div>
      ) : (
        <OfertasLocalesSourceAdPreviewPanel
          lang={lang}
          draft={draft}
          selectedAssetId={selectedAssetId}
          eligibleAssets={eligibleAssets}
          deskMode
        />
      )}
    </div>
  );
}
