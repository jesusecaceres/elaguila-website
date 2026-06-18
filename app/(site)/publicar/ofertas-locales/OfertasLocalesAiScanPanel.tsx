"use client";

import { useCallback, useMemo, useState } from "react";
import { ensureOfertaLocalRecordForAiScan } from "@/app/lib/ofertas-locales/ofertasLocalesAiScanPersistClient";
import {
  getOfertaLocalAiScanReadiness,
  type OfertaLocalAiScanReadinessStatus,
  type OfertaLocalScanEligibleAsset,
} from "@/app/lib/ofertas-locales/ofertasLocalesAiScanReadiness";
import { submitOfertaLocalAiScan } from "@/app/lib/ofertas-locales/ofertasLocalesAiScanSubmit";
import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { ofertasLocalesAppCopy } from "./ofertasLocalesApplicationCopy";

const CARD = "rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] px-4 py-3";
const BTN_PRIMARY =
  "rounded-xl bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926] disabled:cursor-not-allowed disabled:opacity-45";
const BTN_SECONDARY =
  "rounded-lg border border-[#D4C4A8] bg-white px-3 py-2 text-xs font-medium text-[#1E1814] hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-45";

function statusLabel(status: OfertaLocalAiScanReadinessStatus, lang: OfertasLocalesAppLang): string {
  const es: Record<OfertaLocalAiScanReadinessStatus, string> = {
    not_ready: "No listo",
    ready: "Listo para escanear",
    processing: "Escaneando archivo...",
    needs_review: "Revisión necesaria",
    failed: "No se pudo escanear",
  };
  const en: Record<OfertaLocalAiScanReadinessStatus, string> = {
    not_ready: "Not ready",
    ready: "Ready to scan",
    processing: "Scanning file...",
    needs_review: "Review needed",
    failed: "Could not scan",
  };
  return (lang === "en" ? en : es)[status];
}

function assetKindLabel(kind: "flyer" | "coupon", lang: OfertasLocalesAppLang): string {
  if (kind === "flyer") return lang === "en" ? "Main flyer" : "Volante principal";
  return lang === "en" ? "Coupon file" : "Archivo de cupón";
}

type Props = {
  draft: OfertaLocalDraft;
  lang: OfertasLocalesAppLang;
  ofertaLocalId?: string | null;
  signedIn?: boolean;
  onScanComplete?: (scanJobId: string) => void;
  onOfertaLocalIdChange?: (id: string) => void;
};

export function OfertasLocalesAiScanPanel({
  draft,
  lang,
  ofertaLocalId,
  signedIn = true,
  onScanComplete,
  onOfertaLocalIdChange,
}: Props) {
  const c = ofertasLocalesAppCopy(lang);
  const [serverConfigurationMissing, setServerConfigurationMissing] = useState(false);
  const [scanStatus, setScanStatus] = useState<OfertaLocalAiScanReadinessStatus>("not_ready");
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState<"idle" | "prep" | "scan">("idle");
  const [scanningAssetId, setScanningAssetId] = useState<string | null>(null);
  const [lastCompletedMessage, setLastCompletedMessage] = useState<string | null>(null);

  const readiness = useMemo(
    () =>
      getOfertaLocalAiScanReadiness(draft, {
        ofertaLocalId,
        lang,
        serverConfigurationMissing,
        signedIn,
      }),
    [draft, ofertaLocalId, lang, serverConfigurationMissing, signedIn]
  );

  const scanning = scanPhase !== "idle";

  const prepLabel = lang === "en" ? "Preparing scan..." : "Preparando escaneo...";

  const displayStatus: OfertaLocalAiScanReadinessStatus = scanning
    ? "processing"
    : scanStatus !== "not_ready"
      ? scanStatus
      : readiness.status;

  const sortedAssets = useMemo(() => {
    const flyers = readiness.eligibleAssets.filter((a) => a.assetKind === "flyer");
    const coupons = readiness.eligibleAssets.filter((a) => a.assetKind === "coupon");
    return [...flyers, ...coupons];
  }, [readiness.eligibleAssets]);

  const handleScanAsset = useCallback(
    async (asset: OfertaLocalScanEligibleAsset) => {
      if (!readiness.ready || scanning) return;

      setScanningAssetId(asset.assetId);
      setScanPhase("prep");
      setScanMessage(null);
      setLastCompletedMessage(null);
      setServerConfigurationMissing(false);
      setScanStatus("processing");

      let recordId = ofertaLocalId?.trim() || null;
      if (!recordId) {
        setScanMessage(prepLabel);
        const persist = await ensureOfertaLocalRecordForAiScan(draft, null);
        if (!persist.ok) {
          setScanningAssetId(null);
          setScanPhase("idle");
          setScanStatus("failed");
          const issueText = persist.issues?.map((i) => i.message).join(" ") ?? persist.detail;
          setScanMessage(
            [issueText, persist.code ? `(${persist.code})` : null].filter(Boolean).join(" ") ||
              c.aiScanFailed
          );
          return;
        }
        recordId = persist.id;
        onOfertaLocalIdChange?.(recordId);
      } else {
        setScanMessage(prepLabel);
        const persist = await ensureOfertaLocalRecordForAiScan(draft, recordId);
        if (!persist.ok) {
          setScanningAssetId(null);
          setScanPhase("idle");
          setScanStatus("failed");
          setScanMessage(
            [persist.detail ?? persist.error, persist.code ? `(${persist.code})` : null]
              .filter(Boolean)
              .join(" ") || c.aiScanFailed
          );
          return;
        }
      }

      setScanPhase("scan");
      setScanMessage(c.aiScanProcessing);

      const result = await submitOfertaLocalAiScan({
        ofertaLocalId: recordId,
        assetId: asset.assetId,
        assetKind: asset.assetKind,
        assetUrl: asset.assetUrl,
        storagePath: asset.storagePath,
        mimeType: asset.mimeType,
      });

      setScanningAssetId(null);
      setScanPhase("idle");

      if (result.configurationMissing) {
        setServerConfigurationMissing(true);
        setScanStatus("not_ready");
        setScanMessage(result.message ?? result.detail ?? c.aiScanConfigMissing);
        return;
      }

      if (!result.ok) {
        setScanStatus("failed");
        setScanMessage(result.message ?? result.detail ?? c.aiScanFailed);
        return;
      }

      const completedMsg = c.aiScanCompleted;
      setScanStatus("needs_review");
      setLastCompletedMessage(completedMsg);
      setScanMessage(
        result.itemsExtractedCount != null && result.itemsExtractedCount > 0
          ? `${completedMsg} ${lang === "en" ? "Review the suggestions below." : "Revisa las sugerencias abajo."}`
          : result.message ?? completedMsg
      );
      if (result.scanJobId) onScanComplete?.(result.scanJobId);
    },
    [readiness.ready, scanning, ofertaLocalId, draft, c, lang, onScanComplete, onOfertaLocalIdChange, prepLabel]
  );

  if (!draft.wantsAiSearchableSpecials) return null;

  return (
    <div className={`${CARD} space-y-3`}>
      <div>
        <p className="text-sm font-semibold text-[#7A1E2C]">{c.aiScanPanelTitle}</p>
        <p className="mt-1 text-xs text-[#1E1814]/70">{c.aiScanReviewBeforePublish}</p>
        <p className="mt-1 text-xs text-[#1E1814]/60">{c.aiScanHelperWait}</p>
      </div>

      <p className="text-xs font-medium text-[#1E1814]">
        {lang === "en" ? "Status" : "Estado"}: {statusLabel(displayStatus, lang)}
        {displayStatus === "needs_review" && lastCompletedMessage ? (
          <span className="ml-1 font-normal text-[#1E1814]/65">({lastCompletedMessage})</span>
        ) : null}
      </p>

      {sortedAssets.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#1E1814]/55">
            {lang === "en" ? "Scan-ready files" : "Archivos listos para escanear"}
          </p>
          <ul className="space-y-2">
            {sortedAssets.map((asset) => {
              const isThisScanning = scanningAssetId === asset.assetId;
              const fileLabel = asset.fileName || assetKindLabel(asset.assetKind, lang);
              return (
                <li
                  key={asset.assetId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#D4C4A8]/60 bg-white px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-[#1E1814]">{fileLabel}</p>
                    <p className="text-[10px] text-[#1E1814]/55">
                      {assetKindLabel(asset.assetKind, lang)} · {asset.mimeType.split("/").pop()?.toUpperCase()}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={BTN_SECONDARY}
                    disabled={!readiness.ready || scanning}
                    onClick={() => void handleScanAsset(asset)}
                  >
                    {isThisScanning
                      ? scanPhase === "prep"
                        ? prepLabel
                        : c.aiScanProcessing
                      : c.aiScanButton}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <ul className="list-inside list-disc space-y-1 text-xs text-[#1E1814]/70">
        {readiness.missingPrerequisites.map((item) => (
          <li key={item}>{item}</li>
        ))}
        {readiness.infoNotes.map((item) => (
          <li key={item} className="list-none text-[#1E1814]/55">
            · {item}
          </li>
        ))}
      </ul>

      {scanMessage ? (
        <p className="rounded-lg border border-[#D4C4A8]/60 bg-white px-3 py-2 text-xs text-[#1E1814]/75">
          {scanMessage}
        </p>
      ) : null}

      {sortedAssets.length === 1 ? (
        <button
          type="button"
          className={BTN_PRIMARY}
          disabled={!readiness.ready || scanning}
          onClick={() => void handleScanAsset(sortedAssets[0])}
        >
          {scanning ? (scanPhase === "prep" ? prepLabel : c.aiScanProcessing) : c.aiScanButton}
        </button>
      ) : null}
    </div>
  );
}
