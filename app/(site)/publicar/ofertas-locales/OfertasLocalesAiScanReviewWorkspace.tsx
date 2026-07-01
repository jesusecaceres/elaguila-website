"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getOfertaLocalScanEligibleAssets } from "@/app/lib/ofertas-locales/ofertasLocalesAiScanReadiness";
import type { OfertaLocalDraft, OfertaLocalItemReviewViewModel } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import type { OfertaLocalSourceFileRole } from "@/app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime";
import { OfertasLocalesProductClipPanel, OfertasLocalesClipInspectorSection } from "./OfertasLocalesProductClipPanel";
import {
  OfertasLocalesAiItemReviewPanel,
  type OfertaLocalAiReviewGateState,
  type OfertaLocalReviewViewerBridge,
} from "./OfertasLocalesAiItemReviewPanel";
import { ofertasLocalesAppCopy } from "./ofertasLocalesApplicationCopy";

type Props = {
  lang: OfertasLocalesAppLang;
  draft: OfertaLocalDraft;
  ofertaLocalId?: string | null;
  lastScanJobId?: string | null;
  scanPollingActive?: boolean;
  scanRefreshToken?: number;
  reviewMode?: "weekly" | "coupon";
  onReviewGateChange?: (state: OfertaLocalAiReviewGateState) => void;
};

type ReviewScope = {
  scanActiveForAsset: boolean;
  scanningAssetId: string | null;
  selectedAssetRole: OfertaLocalSourceFileRole | null;
  activeScanJobId: string | null;
};

export function OfertasLocalesAiScanReviewWorkspace({
  lang,
  draft,
  ofertaLocalId,
  lastScanJobId,
  scanPollingActive = false,
  scanRefreshToken = 0,
  reviewMode = "weekly",
  onReviewGateChange,
}: Props) {
  const c = ofertasLocalesAppCopy(lang);
  const eligibleAssets = useMemo(() => getOfertaLocalScanEligibleAssets(draft), [draft]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [focusedItem, setFocusedItem] = useState<OfertaLocalItemReviewViewModel | null>(null);
  const [viewerBridge, setViewerBridge] = useState<OfertaLocalReviewViewerBridge | null>(null);
  const [mobileViewerCollapsed, setMobileViewerCollapsed] = useState(true);
  const [reviewScope, setReviewScope] = useState<ReviewScope>({
    scanActiveForAsset: false,
    scanningAssetId: null,
    selectedAssetRole: null,
    activeScanJobId: null,
  });
  const [assetTabStatus, setAssetTabStatus] = useState<Record<string, string>>({});

  const selectedAsset = eligibleAssets.find((a) => a.assetId === selectedAssetId);

  useEffect(() => {
    if (selectedAssetId && eligibleAssets.some((a) => a.assetId === selectedAssetId)) return;
    const flyer = eligibleAssets.find((a) => a.assetKind === "flyer");
    setSelectedAssetId(flyer?.assetId ?? eligibleAssets[0]?.assetId ?? null);
  }, [eligibleAssets, selectedAssetId]);

  const handleFocusedItemChange = useCallback(
    (item: OfertaLocalItemReviewViewModel | null) => {
      setFocusedItem(item);
    },
    []
  );

  const handleScopeChange = useCallback((scope: ReviewScope) => {
    setReviewScope(scope);
  }, []);

  const handleAssetStatuses = useCallback((statuses: Record<string, string>) => {
    setAssetTabStatus(statuses);
  }, []);

  const handleViewerBridge = useCallback((bridge: OfertaLocalReviewViewerBridge) => {
    setViewerBridge(bridge);
  }, []);

  if (!ofertaLocalId?.trim()) return null;

  return (
    <div className="w-full min-w-0 space-y-5 overflow-x-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-[#7A1E2C] sm:text-lg">{c.aiReviewWorkspaceTitle}</p>
          <p className="mt-1 text-sm text-[#1E1814]/70">{c.aiReviewBeforePublish}</p>
        </div>
        {selectedAsset ? (
          <div className="rounded-xl border border-[#D4C4A8]/70 bg-white px-3 py-2 text-right text-xs text-[#1E1814]/70">
            <p className="font-semibold uppercase tracking-wide text-[#7A1E2C]">
              {selectedAsset.assetKind === "flyer"
                ? lang === "en"
                  ? "Main flyer"
                  : "Volante principal"
                : lang === "en"
                  ? "Coupon file"
                  : "Cupón / adicional"}
            </p>
            <p className="mt-0.5 max-w-[280px] truncate font-medium text-[#1E1814]">
              {selectedAsset.fileName || selectedAsset.assetId}
            </p>
            {assetTabStatus[selectedAsset.assetId] ? (
              <p className="mt-1 text-[10px] font-medium text-[#7A1E2C]/85">
                {assetTabStatus[selectedAsset.assetId]}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {eligibleAssets.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          <p className="w-full text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/55">
            {c.aiReviewSelectSourceFile}
          </p>
          {eligibleAssets.map((asset) => {
            const active = selectedAssetId === asset.assetId;
            const label =
              asset.assetKind === "flyer"
                ? lang === "en"
                  ? "Main flyer"
                  : "Volante principal"
                : lang === "en"
                  ? "Coupon / additional"
                  : "Cupón / adicional";
            const tabStatus = assetTabStatus[asset.assetId];
            return (
              <button
                key={asset.assetId}
                type="button"
                onClick={() => setSelectedAssetId(asset.assetId)}
                className={`max-w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                  active
                    ? "border-[#7A1E2C] bg-[#7A1E2C]/10 font-semibold text-[#7A1E2C]"
                    : "border-[#D4C4A8] bg-white text-[#1E1814]/75 hover:border-[#7A1E2C]/30"
                }`}
              >
                <span className="block font-semibold">{label}</span>
                <span className="mt-0.5 block truncate text-[10px] opacity-80">
                  {asset.fileName || asset.assetId}
                </span>
                {tabStatus ? (
                  <span className="mt-1 block text-[10px] font-medium text-[#7A1E2C]/80">{tabStatus}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,54fr)_minmax(0,46fr)] xl:items-start">
        <div className="order-2 min-w-0 xl:order-1 xl:sticky xl:top-20 xl:max-h-[calc(100vh-5.5rem)] xl:self-start">
          <OfertasLocalesProductClipPanel
            lang={lang}
            draft={draft}
            focusedItem={focusedItem}
            selectedAssetId={selectedAssetId}
            eligibleAssets={eligibleAssets}
            scanActiveForAsset={reviewScope.scanActiveForAsset}
            itemsOnPage={viewerBridge?.itemsOnPage}
            currentPage={viewerBridge?.currentPage ?? focusedItem?.sourcePage ?? 1}
            selectedItemId={viewerBridge?.selectedItemId ?? focusedItem?.id ?? null}
            highlightFlyer={viewerBridge?.highlightFlyer ?? false}
            onSelectItem={(itemId) => viewerBridge?.selectItem(itemId)}
            onPageChange={(page) => viewerBridge?.onPageChange(page)}
            onShowOnFlyer={() => viewerBridge?.onShowOnFlyer()}
            mobileViewerCollapsed={mobileViewerCollapsed}
            onMobileViewerCollapsedChange={setMobileViewerCollapsed}
          />
        </div>

        <div className="order-1 min-w-0 xl:order-2 xl:max-h-[calc(100vh-5.5rem)] xl:overflow-hidden">
          <OfertasLocalesAiItemReviewPanel
            lang={lang}
            ofertaLocalId={ofertaLocalId}
            scanJobId={null}
            reviewMode={reviewMode}
            variant="workspace"
            draft={draft}
            selectedSourceAssetId={selectedAssetId}
            highlightScanJobId={lastScanJobId}
            scanPollingActive={scanPollingActive}
            scanRefreshToken={scanRefreshToken}
            onFocusedItemChange={handleFocusedItemChange}
            onReviewGateChange={onReviewGateChange}
            onScopeChange={handleScopeChange}
            onAssetTabStatuses={handleAssetStatuses}
            onViewerBridge={handleViewerBridge}
            clipInspectorSlot={
              <OfertasLocalesClipInspectorSection
                lang={lang}
                draft={draft}
                focusedItem={focusedItem}
                viewerPage={viewerBridge?.currentPage ?? focusedItem?.sourcePage ?? 1}
                onShowOnFlyer={() => {
                  viewerBridge?.onShowOnFlyer();
                  setMobileViewerCollapsed(false);
                }}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
