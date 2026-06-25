"use client";

import { useEffect, useMemo, useState } from "react";
import { getOfertaLocalScanEligibleAssets } from "@/app/lib/ofertas-locales/ofertasLocalesAiScanReadiness";
import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OfertasLocalesSourceAdPreviewPanel } from "./OfertasLocalesSourceAdPreviewPanel";
import { OfertasLocalesAiItemReviewPanel } from "./OfertasLocalesAiItemReviewPanel";
import { ofertasLocalesAppCopy } from "./ofertasLocalesApplicationCopy";

type Props = {
  lang: OfertasLocalesAppLang;
  draft: OfertaLocalDraft;
  ofertaLocalId?: string | null;
  lastScanJobId?: string | null;
  reviewMode?: "weekly" | "coupon";
};

export function OfertasLocalesAiScanReviewWorkspace({
  lang,
  draft,
  ofertaLocalId,
  lastScanJobId,
  reviewMode = "weekly",
}: Props) {
  const c = ofertasLocalesAppCopy(lang);
  const eligibleAssets = useMemo(() => getOfertaLocalScanEligibleAssets(draft), [draft]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [mobilePreviewCollapsed, setMobilePreviewCollapsed] = useState(true);

  const selectedAsset = eligibleAssets.find((a) => a.assetId === selectedAssetId);

  useEffect(() => {
    if (selectedAssetId && eligibleAssets.some((a) => a.assetId === selectedAssetId)) return;
    const flyer = eligibleAssets.find((a) => a.assetKind === "flyer");
    setSelectedAssetId(flyer?.assetId ?? eligibleAssets[0]?.assetId ?? null);
  }, [eligibleAssets, selectedAssetId]);

  if (!ofertaLocalId?.trim()) return null;

  return (
    <div className="w-full min-w-0 space-y-5">
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
                  : "Archivo de cupón"}
            </p>
            <p className="mt-0.5 max-w-[280px] truncate font-medium text-[#1E1814]">
              {selectedAsset.fileName || selectedAsset.assetId}
            </p>
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
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,63fr)_minmax(0,37fr)] xl:items-start">
        <div className="min-w-0 xl:sticky xl:top-20 xl:self-start">
          <div className="hidden xl:block">
            <OfertasLocalesSourceAdPreviewPanel
              lang={lang}
              draft={draft}
              selectedAssetId={selectedAssetId}
              eligibleAssets={eligibleAssets}
              deskMode
            />
          </div>
          <div className="xl:hidden">
            <OfertasLocalesSourceAdPreviewPanel
              lang={lang}
              draft={draft}
              selectedAssetId={selectedAssetId}
              eligibleAssets={eligibleAssets}
              collapsible
              collapsed={mobilePreviewCollapsed}
              onCollapsedChange={setMobilePreviewCollapsed}
            />
          </div>
        </div>

        <div className="min-w-0 xl:max-h-[calc(100vh-5.5rem)] xl:overflow-hidden">
          <OfertasLocalesAiItemReviewPanel
            lang={lang}
            ofertaLocalId={ofertaLocalId}
            scanJobId={null}
            reviewMode={reviewMode}
            variant="workspace"
            draft={draft}
            selectedSourceAssetId={selectedAssetId}
            highlightScanJobId={lastScanJobId}
          />
        </div>
      </div>
    </div>
  );
}
