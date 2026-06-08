"use client";

import { useCallback, useMemo, useState } from "react";
import {
  getOfertaLocalAiScanReadiness,
  type OfertaLocalAiScanReadinessStatus,
} from "@/app/lib/ofertas-locales/ofertasLocalesAiScanReadiness";
import { submitOfertaLocalAiScan } from "@/app/lib/ofertas-locales/ofertasLocalesAiScanSubmit";
import type { OfertaLocalDraft } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { ofertasLocalesAppCopy } from "./ofertasLocalesApplicationCopy";

const CARD = "rounded-xl border border-[#D4C4A8]/70 bg-[#FDF8F0] px-4 py-3";
const BTN_PRIMARY =
  "rounded-xl bg-[#7A1E2C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6a1926] disabled:cursor-not-allowed disabled:opacity-45";

function statusLabel(status: OfertaLocalAiScanReadinessStatus, lang: OfertasLocalesAppLang): string {
  const es: Record<OfertaLocalAiScanReadinessStatus, string> = {
    not_ready: "No listo",
    ready: "Listo para escanear",
    processing: "Procesando…",
    needs_review: "Necesita revisión",
    failed: "Falló",
  };
  const en: Record<OfertaLocalAiScanReadinessStatus, string> = {
    not_ready: "Not ready",
    ready: "Ready to scan",
    processing: "Processing…",
    needs_review: "Needs review",
    failed: "Failed",
  };
  return (lang === "en" ? en : es)[status];
}

type Props = {
  draft: OfertaLocalDraft;
  lang: OfertasLocalesAppLang;
  ofertaLocalId?: string | null;
  onScanComplete?: (scanJobId: string) => void;
};

export function OfertasLocalesAiScanPanel({ draft, lang, ofertaLocalId, onScanComplete }: Props) {
  const c = ofertasLocalesAppCopy(lang);
  const [serverConfigurationMissing, setServerConfigurationMissing] = useState(false);
  const [scanStatus, setScanStatus] = useState<OfertaLocalAiScanReadinessStatus>("not_ready");
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const readiness = useMemo(
    () =>
      getOfertaLocalAiScanReadiness(draft, {
        ofertaLocalId,
        lang,
        serverConfigurationMissing,
      }),
    [draft, ofertaLocalId, lang, serverConfigurationMissing]
  );

  const displayStatus: OfertaLocalAiScanReadinessStatus = scanning
    ? "processing"
    : scanStatus !== "not_ready"
      ? scanStatus
      : readiness.status;

  const handleScan = useCallback(async () => {
    if (!readiness.ready || readiness.eligibleAssets.length === 0 || !ofertaLocalId) return;
    const asset = readiness.eligibleAssets[0];
    setScanning(true);
    setScanMessage(null);
    setScanStatus("processing");

    const result = await submitOfertaLocalAiScan({
      ofertaLocalId,
      assetId: asset.assetId,
      assetKind: asset.assetKind,
      assetUrl: asset.assetUrl,
      storagePath: asset.storagePath,
      mimeType: asset.mimeType,
    });

    setScanning(false);

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

    setScanStatus(result.status === "needs_review" ? "needs_review" : "ready");
    setScanMessage(result.message ?? c.aiScanSuccess);
    if (result.scanJobId) onScanComplete?.(result.scanJobId);
  }, [readiness, ofertaLocalId, c, onScanComplete]);

  if (!draft.wantsAiSearchableSpecials) return null;

  return (
    <div className={`${CARD} space-y-3`}>
      <div>
        <p className="text-sm font-semibold text-[#7A1E2C]">{c.aiScanPanelTitle}</p>
        <p className="mt-1 text-xs text-[#1E1814]/70">{c.aiScanReviewBeforePublish}</p>
      </div>

      <p className="text-xs font-medium text-[#1E1814]">
        {lang === "en" ? "Status" : "Estado"}: {statusLabel(displayStatus, lang)}
      </p>

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

      <button
        type="button"
        className={BTN_PRIMARY}
        disabled={!readiness.ready || scanning}
        onClick={() => void handleScan()}
      >
        {scanning ? c.aiScanProcessing : c.aiScanButton}
      </button>
    </div>
  );
}
