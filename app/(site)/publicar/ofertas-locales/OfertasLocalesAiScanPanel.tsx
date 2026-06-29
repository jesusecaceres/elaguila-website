"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ensureOfertaLocalRecordForAiScan } from "@/app/lib/ofertas-locales/ofertasLocalesAiScanPersistClient";
import {
  getOfertaLocalAiScanReadiness,
  type OfertaLocalAiScanReadinessStatus,
  type OfertaLocalScanEligibleAsset,
} from "@/app/lib/ofertas-locales/ofertasLocalesAiScanReadiness";
import { submitOfertaLocalAiScan } from "@/app/lib/ofertas-locales/ofertasLocalesAiScanSubmit";
import {
  formatScanElapsed,
  getOfertaLocalScanPhaseMessage,
} from "@/app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime";
import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { ofertasLocalesAppCopy } from "./ofertasLocalesApplicationCopy";

const CARD = "rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] px-4 py-3";
const BTN_PRIMARY =
  "min-h-11 rounded-xl bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926] disabled:cursor-not-allowed disabled:opacity-45";
const BTN_SECONDARY =
  "min-h-11 rounded-xl border border-[#D4C4A8] bg-white px-4 py-2.5 text-sm font-medium text-[#1E1814] hover:border-[#7A1E2C]/40 disabled:cursor-not-allowed disabled:opacity-45";

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
  onScanStarted?: (asset: OfertaLocalScanEligibleAsset) => void;
  onScanComplete?: (scanJobId: string) => void;
  onScanFinished?: (result: { ok: boolean; scanJobId?: string }) => void;
  onOfertaLocalIdChange?: (id: string) => void;
};

export function OfertasLocalesAiScanPanel({
  draft,
  lang,
  ofertaLocalId,
  signedIn = true,
  onScanStarted,
  onScanComplete,
  onScanFinished,
  onOfertaLocalIdChange,
}: Props) {
  const c = ofertasLocalesAppCopy(lang);
  const [serverConfigurationMissing, setServerConfigurationMissing] = useState(false);
  const [scanStatus, setScanStatus] = useState<OfertaLocalAiScanReadinessStatus>("not_ready");
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState<"idle" | "prep" | "scan">("idle");
  const [scanningAssetId, setScanningAssetId] = useState<string | null>(null);
  const [lastCompletedMessage, setLastCompletedMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const scanStartedAtRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (scanning || readiness.eligibleAssets.length > 0) return;
    setScanningAssetId(null);
    setScanStatus("not_ready");
    setScanMessage(null);
    setLastCompletedMessage(null);
  }, [readiness.eligibleAssets.length, scanning]);

  useEffect(() => {
    if (!scanning) {
      scanStartedAtRef.current = null;
      setElapsedSeconds(0);
      return;
    }
    if (!scanStartedAtRef.current) scanStartedAtRef.current = Date.now();
    const id = window.setInterval(() => {
      const started = scanStartedAtRef.current ?? Date.now();
      setElapsedSeconds(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [scanning]);

  const phaseCopy = useMemo(() => {
    if (!scanning) return null;
    return getOfertaLocalScanPhaseMessage(elapsedSeconds * 1000, lang);
  }, [scanning, elapsedSeconds, lang]);

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

  const scanningAsset = sortedAssets.find((asset) => asset.assetId === scanningAssetId) ?? null;
  const scanningAssetLabel = scanningAsset
    ? `${assetKindLabel(scanningAsset.assetKind, lang)} — ${
        scanningAsset.fileName || scanningAsset.assetId
      }`
    : "";

  const handleScanAsset = useCallback(
    async (asset: OfertaLocalScanEligibleAsset) => {
      if (!readiness.ready || scanning) return;

      setScanningAssetId(asset.assetId);
      setScanPhase("prep");
      setScanMessage(null);
      setLastCompletedMessage(null);
      setServerConfigurationMissing(false);
      setScanStatus("processing");
      scanStartedAtRef.current = Date.now();
      onScanStarted?.(asset);

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
          onScanFinished?.({ ok: false });
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
          onScanFinished?.({ ok: false });
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
        onScanFinished?.({ ok: false });
        return;
      }

      if (!result.ok) {
        setScanStatus("failed");
        setScanMessage(result.message ?? result.detail ?? c.aiScanFailed);
        onScanFinished?.({ ok: false, scanJobId: result.scanJobId });
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
      if (result.scanJobId) {
        onScanComplete?.(result.scanJobId);
        onScanFinished?.({ ok: true, scanJobId: result.scanJobId });
      } else {
        onScanFinished?.({ ok: true });
      }
    },
    [
      readiness.ready,
      scanning,
      ofertaLocalId,
      draft,
      c,
      lang,
      onScanComplete,
      onScanFinished,
      onScanStarted,
      onOfertaLocalIdChange,
      prepLabel,
    ]
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

      {!scanning && sortedAssets.length === 0 ? (
        <p className="rounded-lg border border-[#D4C4A8]/60 bg-white px-3 py-2 text-xs text-[#1E1814]/75">
          {lang === "en"
            ? "Upload a PDF, JPG, or PNG flyer to activate AI scanning."
            : "Sube un volante PDF, JPG o PNG para activar el escaneo AI."}
        </p>
      ) : null}

      {scanning && phaseCopy ? (
        <div className="rounded-lg border border-[#7A1E2C]/20 bg-white px-3 py-2 text-xs text-[#1E1814]/80">
          <p className="font-semibold text-[#7A1E2C]">
            {scanningAssetLabel
              ? `${lang === "en" ? "Scanning" : "Escaneando"} ${scanningAssetLabel}`
              : phaseCopy.message}
          </p>
          {scanningAssetLabel ? <p className="mt-1 text-[#1E1814]/65">{phaseCopy.message}</p> : null}
          <p className="mt-1 text-[#1E1814]/55">
            {c.aiScanElapsed}: {formatScanElapsed(elapsedSeconds, lang)}
          </p>
          <p className="mt-1 text-[#1E1814]/65">
            {lang === "en"
              ? "Scanning may take a few minutes. Results will appear automatically."
              : "El escaneo puede tardar unos minutos. Los resultados aparecerán automáticamente."}
          </p>
          {phaseCopy.longWait ? (
            <p className="mt-1 text-[#1E1814]/65">{c.aiReviewScanInProgress}</p>
          ) : null}
        </div>
      ) : null}

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
                  className="flex flex-col gap-3 rounded-lg border border-[#D4C4A8]/60 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="break-words text-xs font-medium text-[#1E1814]">{fileLabel}</p>
                    <p className="break-words text-[10px] text-[#1E1814]/55">
                      {assetKindLabel(asset.assetKind, lang)} — {fileLabel}
                    </p>
                    <p className="text-[10px] font-medium text-emerald-800">
                      {lang === "en" ? "Ready for AI scan" : "Listo para escaneo AI"} ·{" "}
                      {asset.mimeType.split("/").pop()?.toUpperCase()}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`${BTN_SECONDARY} w-full sm:w-auto`}
                    disabled={!readiness.ready || scanning}
                    onClick={() => void handleScanAsset(asset)}
                  >
                    {isThisScanning
                      ? scanPhase === "prep"
                        ? prepLabel
                        : phaseCopy?.message ?? c.aiScanProcessing
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

      {scanMessage && !scanning ? (
        <p className="rounded-lg border border-[#D4C4A8]/60 bg-white px-3 py-2 text-xs text-[#1E1814]/75">
          {scanMessage}
        </p>
      ) : null}

      {sortedAssets.length === 1 ? (
        <button
          type="button"
          className={`${BTN_PRIMARY} w-full sm:w-auto`}
          disabled={!readiness.ready || scanning}
          onClick={() => void handleScanAsset(sortedAssets[0])}
        >
          {scanning
            ? scanPhase === "prep"
              ? prepLabel
              : phaseCopy?.message ?? c.aiScanProcessing
            : c.aiScanButton}
        </button>
      ) : null}
    </div>
  );
}
