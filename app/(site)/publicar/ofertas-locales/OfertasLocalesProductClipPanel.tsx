"use client";

import { useMemo, useState } from "react";
import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertaLocalItemReviewViewModel } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertaLocalScanEligibleAsset } from "@/app/lib/ofertas-locales/ofertasLocalesAiScanReadiness";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import {
  formatShowingPage,
  getOfertaLocalActiveScanCopy,
} from "@/app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime";
import {
  OfertasClipReviewViewer,
  type ClipReviewViewerItem,
} from "./OfertasClipReviewViewer";

type Props = {
  lang: OfertasLocalesAppLang;
  draft: OfertaLocalDraft;
  focusedItem: OfertaLocalItemReviewViewModel | null;
  selectedAssetId: string | null;
  eligibleAssets: OfertaLocalScanEligibleAsset[];
  scanActiveForAsset?: boolean;
  itemsOnPage?: ClipReviewViewerItem[];
  currentPage?: number | null;
  selectedItemId?: string | null;
  highlightFlyer?: boolean;
  onSelectItem?: (itemId: string) => void;
  onPageChange?: (page: number) => void;
  onShowOnFlyer?: () => void;
  mobileViewerCollapsed?: boolean;
  onMobileViewerCollapsedChange?: (collapsed: boolean) => void;
};

function isPdfAsset(asset: OfertaLocalScanEligibleAsset | undefined): boolean {
  if (!asset) return false;
  const name = (asset.fileName || asset.assetUrl || "").toLowerCase();
  return name.endsWith(".pdf") || asset.mimeType === "application/pdf";
}

function isImageAsset(asset: OfertaLocalScanEligibleAsset | undefined): boolean {
  if (!asset) return false;
  return asset.mimeType.startsWith("image/");
}

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

function toViewerItems(items: ClipReviewViewerItem[] | undefined): ClipReviewViewerItem[] {
  return items ?? [];
}

type ClipInspectorProps = {
  lang: OfertasLocalesAppLang;
  draft: OfertaLocalDraft;
  focusedItem: OfertaLocalItemReviewViewModel | null;
  viewerPage: number;
  onShowOnFlyer: () => void;
};

export function OfertasLocalesClipInspectorSection({
  lang,
  draft,
  focusedItem,
  viewerPage,
  onShowOnFlyer,
}: ClipInspectorProps) {
  const scanCopy = getOfertaLocalActiveScanCopy(lang);
  const cropUrl = focusedItem?.sourceCropUrl?.trim();
  const hasBbox = Boolean(focusedItem?.sourceBbox);

  return (
    <div className="overflow-hidden rounded-xl border border-[#D4C4A8]/70 bg-white shadow-sm">
      <div className="border-b border-[#D4C4A8]/50 bg-[#FFFCF7] px-4 py-3">
        <p className="text-sm font-semibold text-[#7A1E2C]">
          {lang === "en" ? "Clip Inspector" : "Inspector de recorte"}
        </p>
        <p className="mt-0.5 text-[10px] text-[#1E1814]/55">
          {lang === "en"
            ? "Verify the AI product clip or source location before approving."
            : "Verifica el recorte AI o la ubicación en el volante antes de aprobar."}
        </p>
      </div>
      <div className="space-y-3 p-3">
        {focusedItem ? (
          <div className="rounded-lg border border-[#D4C4A8]/50 bg-[#FDF8F0]/80 px-3 py-2 text-xs text-[#1E1814]/75">
            <p className="font-semibold text-[#1E1814]">{focusedItem.itemName}</p>
            <p className="mt-1 text-[10px] text-[#1E1814]/55">
              {sourceRoleLabel(focusedItem, draft, lang)}
              {focusedItem.sourceFileName ? ` · ${focusedItem.sourceFileName}` : ""}
              {focusedItem.sourcePage != null
                ? ` · ${lang === "en" ? "Page" : "Página"} ${focusedItem.sourcePage}`
                : ""}
            </p>
          </div>
        ) : (
          <p className="text-xs text-[#1E1814]/60">
            {lang === "en"
              ? "Select a product from the review queue to inspect its clip."
              : "Selecciona un producto de la cola de revisión para inspeccionar su recorte."}
          </p>
        )}

        {cropUrl ? (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
              {lang === "en" ? "Product clip ready" : "Recorte de producto listo"}
            </p>
            <div className="overflow-auto rounded-lg border border-[#D4C4A8]/60 bg-[#FDF8F0]/50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cropUrl}
                alt={focusedItem?.itemName ?? scanCopy.cropAdClipPage}
                className="mx-auto max-h-48 w-auto max-w-full rounded-lg border border-[#D4C4A8]/60 object-contain"
              />
            </div>
            {hasBbox ? (
              <button
                type="button"
                className="min-h-11 w-full rounded-lg border border-[#7A1E2C]/30 bg-white px-3 py-2 text-xs font-semibold text-[#7A1E2C] hover:border-[#7A1E2C]/50"
                onClick={onShowOnFlyer}
              >
                {lang === "en" ? "View source on flyer" : "Ver fuente en el volante"}
              </button>
            ) : null}
          </div>
        ) : hasBbox ? (
          <div className="space-y-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-xs text-amber-950/90">
            <p>
              {lang === "en"
                ? `AI found this item on Page ${focusedItem?.sourcePage ?? viewerPage}.`
                : `AI encontró este producto en la Página ${focusedItem?.sourcePage ?? viewerPage}.`}
            </p>
            <button
              type="button"
              className="min-h-11 w-full rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6a1926]"
              onClick={onShowOnFlyer}
            >
              {lang === "en" ? "Show on flyer" : "Mostrar en el volante"}
            </button>
          </div>
        ) : focusedItem ? (
          <p className="rounded-lg border border-[#D4C4A8]/70 bg-[#FDF8F0]/90 px-3 py-2.5 text-xs text-[#1E1814]/70">
            {lang === "en"
              ? "No product clip or flyer location is available yet."
              : "Todavía no hay recorte de producto ni ubicación en el volante."}
            {focusedItem.sourcePage != null
              ? ` ${formatShowingPage(scanCopy.showingPage, focusedItem.sourcePage)}`
              : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function OfertasLocalesProductClipPanel({
  lang,
  draft,
  focusedItem,
  selectedAssetId,
  eligibleAssets,
  itemsOnPage,
  currentPage,
  selectedItemId,
  highlightFlyer = false,
  onSelectItem,
  onPageChange,
  onShowOnFlyer,
  mobileViewerCollapsed = true,
  onMobileViewerCollapsedChange,
}: Props) {
  const [desktopHighlight, setDesktopHighlight] = useState(false);

  const selectedAsset = eligibleAssets.find((a) => a.assetId === selectedAssetId);
  const fileUrl = selectedAsset?.assetUrl ?? null;
  const isPdf = isPdfAsset(selectedAsset);
  const isImage = isImageAsset(selectedAsset);

  const viewerItems = useMemo(() => toViewerItems(itemsOnPage), [itemsOnPage]);
  const viewerPage = currentPage ?? focusedItem?.sourcePage ?? 1;
  const highlightOverlay = highlightFlyer || desktopHighlight;

  const handleShowOnFlyer = () => {
    setDesktopHighlight(true);
    onShowOnFlyer?.();
    onMobileViewerCollapsedChange?.(false);
  };

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col gap-3">
      <div className="hidden xl:block">
        <OfertasLocalesClipInspectorSection
          lang={lang}
          draft={draft}
          focusedItem={focusedItem}
          viewerPage={viewerPage}
          onShowOnFlyer={handleShowOnFlyer}
        />
      </div>

      <div className="hidden xl:block">
        <OfertasClipReviewViewer
          lang={lang}
          fileUrl={fileUrl}
          isPdf={isPdf}
          isImage={isImage}
          currentPage={viewerPage}
          itemsOnPage={viewerItems}
          selectedItemId={selectedItemId ?? focusedItem?.id ?? null}
          highlightOverlay={highlightOverlay}
          onSelectItem={(itemId) => onSelectItem?.(itemId)}
          onPageChange={onPageChange}
        />
      </div>

      <div className="xl:hidden">
        <OfertasClipReviewViewer
          lang={lang}
          fileUrl={fileUrl}
          isPdf={isPdf}
          isImage={isImage}
          currentPage={viewerPage}
          itemsOnPage={viewerItems}
          selectedItemId={selectedItemId ?? focusedItem?.id ?? null}
          highlightOverlay={highlightOverlay}
          onSelectItem={(itemId) => onSelectItem?.(itemId)}
          onPageChange={onPageChange}
          collapsible
          collapsed={mobileViewerCollapsed}
          onCollapsedChange={onMobileViewerCollapsedChange}
        />
      </div>
    </div>
  );
}
