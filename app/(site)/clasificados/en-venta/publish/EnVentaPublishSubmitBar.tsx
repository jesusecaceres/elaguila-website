"use client";

import { useEffect, useState } from "react";import type { EnVentaFreeApplicationState } from "@/app/clasificados/publicar/en-venta/free/application/schema/enVentaFreeFormState";
import { clearAllClassifiedsDrafts } from "@/app/clasificados/lib/classifiedsDraftStorage";
import {
  clearEnVentaPublishTempState,
  saveEnVentaPreviewDraft,
  saveEnVentaPreviewReturnDraft,
} from "@/app/clasificados/en-venta/preview/enVentaPreviewDraft";
import { getEnVentaSupabaseBrowserEnvIssues } from "@/app/lib/supabase/enVentaClientEnvCheck";
import { collectEnVentaPublishBlockers } from "./enVentaPublishValidation";
import { publishEnVentaFromDraft, type EnVentaGalleryUploadOutcome } from "./enVentaPublishFromDraft";
import { setEnVentaPublishInFlight } from "./enVentaPublishLeaveUnsafe";
import { EnVentaPublishSuccessPanel } from "./EnVentaPublishSuccessPanel";

const COPY = {
  es: {
    publish: "Publicar anuncio",
    publishing: "Publicando…",
    errPrefix: "No se pudo publicar:",
    blockedIntro: "Para habilitar Publicar, completa lo siguiente:",
  },
  en: {
    publish: "Publish listing",
    publishing: "Publishing…",
    errPrefix: "Could not publish:",
    blockedIntro: "To enable Publish, complete the following:",
  },
} as const;

type Props = {
  lang: "es" | "en";
  plan: "free" | "pro";
  state: EnVentaFreeApplicationState;
};

export function EnVentaPublishSubmitBar({ lang, plan, state }: Props) {
  const t = COPY[lang];
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [publishOutcome, setPublishOutcome] = useState<{
    listingId: string;
    gallery: EnVentaGalleryUploadOutcome;
    leonixAdId: string | null;
  } | null>(null);

  const blockers = collectEnVentaPublishBlockers(lang, state);
  const ready = blockers.length === 0;

  useEffect(() => {
    setEnVentaPublishInFlight(busy);
    return () => setEnVentaPublishInFlight(false);
  }, [busy]);

  const onPublish = async () => {
    if (!ready || busy) return;
    setErr(null);
    const envIssues = getEnVentaSupabaseBrowserEnvIssues();
    if (envIssues.length) {
      setErr(
        lang === "es"
          ? `Falta configuración del cliente: ${envIssues.join(" · ")}`
          : `Client configuration missing: ${envIssues.join(" · ")}`
      );
      return;
    }
    setBusy(true);
    try {
      saveEnVentaPreviewDraft(plan, state, lang);
      saveEnVentaPreviewReturnDraft(plan, state);
      const res = await publishEnVentaFromDraft(state, lang, plan);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      clearEnVentaPublishTempState();
      clearAllClassifiedsDrafts();
      setPublishOutcome({ listingId: res.listingId, gallery: res.gallery, leonixAdId: res.leonixAdId });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  if (publishOutcome) {
    return (
      <EnVentaPublishSuccessPanel
        lang={lang}
        plan={plan}
        listingId={publishOutcome.listingId}
        leonixAdId={publishOutcome.leonixAdId}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-[#D8C79A]/70 bg-[#FFF7E7] p-5 shadow-sm">
      {!ready ? (
        <div className="text-sm text-[#5D4A25]/95">
          <p className="font-semibold text-[#3D2C12]/95">{t.blockedIntro}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-snug">
            {blockers.map((line, i) => (
              <li key={`${i}-${line}`}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {err ? (
        <p className="mt-2 text-sm font-medium text-red-800" role="alert" data-testid="ev-publish-error">
          {t.errPrefix} {err}
        </p>
      ) : null}
      <button
        type="button"
        disabled={!ready || busy}
        onClick={() => void onPublish()}
        className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-6 text-sm font-bold text-[#1E1810] shadow-md transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? t.publishing : t.publish}
      </button>
    </div>
  );
}
