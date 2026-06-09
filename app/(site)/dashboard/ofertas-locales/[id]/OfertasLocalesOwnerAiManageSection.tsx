"use client";

import { useCallback, useMemo, useState } from "react";

import { submitOfertaLocalAiScan } from "@/app/lib/ofertas-locales/ofertasLocalesAiScanSubmit";
import type { OfertaLocalPublishedAssetMetadata } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { OfertasLocalesAiItemReviewPanel } from "@/app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel";

type Lang = "es" | "en";

type Props = {
  lang: Lang;
  offerId: string;
  wantsAiSearchableSpecials: boolean;
  flyerAssets: OfertaLocalPublishedAssetMetadata[];
  couponAssets: OfertaLocalPublishedAssetMetadata[];
  offerStatus: string;
};

function firstScannableAsset(
  flyerAssets: OfertaLocalPublishedAssetMetadata[],
  couponAssets: OfertaLocalPublishedAssetMetadata[]
): { assetId: string; assetKind: "flyer" | "coupon"; assetUrl: string; mimeType: string } | null {
  for (const asset of flyerAssets) {
    const url = asset.url?.trim();
    if (!url?.startsWith("https://")) continue;
    return {
      assetId: asset.id,
      assetKind: "flyer",
      assetUrl: url,
      mimeType: asset.mimeType?.trim() || "application/pdf",
    };
  }
  for (const asset of couponAssets) {
    const url = asset.url?.trim();
    if (!url?.startsWith("https://")) continue;
    return {
      assetId: asset.id,
      assetKind: "coupon",
      assetUrl: url,
      mimeType: asset.mimeType?.trim() || "application/pdf",
    };
  }
  return null;
}

export function OfertasLocalesOwnerAiManageSection({
  lang,
  offerId,
  wantsAiSearchableSpecials,
  flyerAssets,
  couponAssets,
  offerStatus,
}: Props) {
  const [scanJobId, setScanJobId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const scannable = useMemo(
    () => firstScannableAsset(flyerAssets, couponAssets),
    [flyerAssets, couponAssets]
  );

  const canScan =
    wantsAiSearchableSpecials &&
    scannable &&
    offerStatus !== "rejected" &&
    offerStatus !== "archived";

  const handleScan = useCallback(async () => {
    if (!canScan || !scannable) return;
    setScanning(true);
    setScanMessage(null);
    const result = await submitOfertaLocalAiScan({
      ofertaLocalId: offerId,
      assetId: scannable.assetId,
      assetKind: scannable.assetKind,
      assetUrl: scannable.assetUrl,
      storagePath: "",
      mimeType: scannable.mimeType,
    });
    setScanning(false);
    if (!result.ok) {
      setScanMessage(result.detail ?? result.message ?? result.error ?? "Scan failed");
      return;
    }
    if (result.scanJobId) setScanJobId(result.scanJobId);
    setScanMessage(result.message ?? (lang === "es" ? "Escaneo completado." : "Scan completed."));
  }, [canScan, scannable, offerId, lang]);

  if (!wantsAiSearchableSpecials) return null;

  const t =
    lang === "es"
      ? {
          title: "Revisión de artículos AI",
          scan: "Escanear volante/cupón",
          scanning: "Escaneando…",
          scanHint: "Los artículos extraídos requieren aprobación antes de ser públicos.",
        }
      : {
          title: "AI item review",
          scan: "Scan flyer/coupon",
          scanning: "Scanning…",
          scanHint: "Extracted items require approval before they become public.",
        };

  return (
    <section className="mb-8 space-y-4">
      <div>
        <h2 className="text-xs font-bold uppercase text-[#7A7164]">{t.title}</h2>
        <p className="mt-1 text-xs text-[#7A7164]">{t.scanHint}</p>
      </div>
      {canScan ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={scanning}
            onClick={() => void handleScan()}
            className="rounded-xl bg-[#7A1E2C] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {scanning ? t.scanning : t.scan}
          </button>
          {scanMessage ? <p className="text-xs text-[#5C5346]">{scanMessage}</p> : null}
        </div>
      ) : null}
      <OfertasLocalesAiItemReviewPanel lang={lang} ofertaLocalId={offerId} scanJobId={scanJobId} />
    </section>
  );
}
