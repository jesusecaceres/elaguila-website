"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getOfertaLocalScanEligibleAssets } from "@/app/lib/ofertas-locales/ofertasLocalesAiScanReadiness";
import {
  fetchOfertaLocalReviewItems,
  patchOfertaLocalReviewItem,
} from "@/app/lib/ofertas-locales/ofertasLocalesItemReviewClient";
import type {
  OfertaLocalDraft,
  OfertaLocalItemReviewStatus,
  OfertaLocalItemReviewViewModel,
  OfertaLocalScanJobSummary,
} from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
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

  useEffect(() => {
    if (selectedAssetId && eligibleAssets.some((a) => a.assetId === selectedAssetId)) return;
    const flyer = eligibleAssets.find((a) => a.assetKind === "flyer");
    setSelectedAssetId(flyer?.assetId ?? eligibleAssets[0]?.assetId ?? null);
  }, [eligibleAssets, selectedAssetId]);

  if (!ofertaLocalId?.trim()) return null;

  return (
    <div className="space-y-4 rounded-xl border border-[#7A1E2C]/20 bg-[#FDF8F0] p-4">
      <div>
        <p className="text-sm font-semibold text-[#7A1E2C]">{c.aiReviewWorkspaceTitle}</p>
        <p className="mt-1 text-xs text-[#1E1814]/70">{c.aiReviewBeforePublish}</p>
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
                  ? "Coupon file"
                  : "Archivo de cupón";
            return (
              <button
                key={asset.assetId}
                type="button"
                onClick={() => setSelectedAssetId(asset.assetId)}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
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

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0 lg:sticky lg:top-4">
          <div className="hidden lg:block">
            <OfertasLocalesSourceAdPreviewPanel
              lang={lang}
              draft={draft}
              selectedAssetId={selectedAssetId}
              eligibleAssets={eligibleAssets}
            />
          </div>
          <div className="lg:hidden">
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

        <div className="min-w-0">
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
