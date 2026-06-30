"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  trackEnVentaReportSubmitGlobal,
  type EnVentaGlobalAnalyticsContext,
} from "@/app/lib/clasificados/en-venta/analytics/enVentaGlobalAnalytics";
import { trackBrReportSubmitGlobal } from "@/app/lib/clasificados/bienes-raices/brGlobalAnalytics";
import {
  EN_VENTA_REPORT_DISCLAIMER,
  EN_VENTA_REPORT_REASONS,
  type EnVentaReportReasonCode,
} from "../moderation/enVentaPolicyCopy";

type Lang = "es" | "en";

const COPY = {
  es: {
    btn: "Reportar anuncio",
    title: "Reportar anuncio",
    details: "Detalles adicionales (opcional)",
    cancel: "Cancelar",
    send: "Enviar reporte",
    sending: "Enviando…",
    pickReason: "Elige un motivo.",
    err: "No se pudo enviar el reporte. Intenta de nuevo.",
    thanks: "Gracias. Revisaremos este anuncio para mantener la comunidad segura.",
    close: "Cerrar",
  },
  en: {
    btn: "Report listing",
    title: "Report listing",
    details: "Additional details (optional)",
    cancel: "Cancel",
    send: "Submit report",
    sending: "Sending…",
    pickReason: "Choose a reason.",
    err: "Could not submit the report. Please try again.",
    thanks: "Thank you. We'll review this listing to keep the community safe.",
    close: "Close",
  },
} as const;

export function EnVentaListingReportDrawer({
  listingId,
  lang,
  analyticsCtx,
  analyticsCategory = "en-venta",
}: {
  listingId: string;
  lang: Lang;
  analyticsCtx?: EnVentaGlobalAnalyticsContext;
  /** When `bienes-raices`, records BR global analytics on successful submit. */
  analyticsCategory?: "en-venta" | "bienes-raices";
}) {
  const t = COPY[lang];
  const disclaimer = EN_VENTA_REPORT_DISCLAIMER[lang];
  const [open, setOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState<EnVentaReportReasonCode | "">("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reset = useCallback(() => {
    setReasonCode("");
    setDetails("");
    setErr(null);
    setDone(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  const submit = async () => {
    if (!reasonCode) {
      setErr(t.pickReason);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/clasificados/en-venta/report", {
        method: "POST",
        headers,
        body: JSON.stringify({ listingId, reasonCode, details, lang }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setErr(json.error ?? t.err);
        return;
      }
      if (analyticsCtx?.listingUuid.trim()) {
        if (analyticsCategory === "bienes-raices") {
          trackBrReportSubmitGlobal({
            listingUuid: analyticsCtx.listingUuid,
            leonixAdId: analyticsCtx.leonixAdId,
          });
        } else {
          trackEnVentaReportSubmitGlobal(analyticsCtx);
        }
      }
      setDone(true);
    } catch {
      setErr(t.err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="enventa-listing-report" className="mt-4 scroll-mt-28 border-t border-black/10 pt-4">
      {!open ? (
        <button
          type="button"
          data-testid="ev-listing-report-open"
          onClick={() => {
            reset();
            setOpen(true);
          }}
          className="text-xs font-semibold text-red-800/90 underline decoration-red-800/30 underline-offset-2 hover:text-red-950"
        >
          {t.btn}
        </button>
      ) : (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ev-report-drawer-title"
        >
          <div className="max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-red-200/80 bg-[#FFFCF7] p-4 shadow-xl sm:p-5">
            <h2 id="ev-report-drawer-title" className="text-base font-bold text-[#1E1810]">
              {t.title}
            </h2>
            <p className="mt-2 text-[11px] leading-relaxed text-[#5C5346]/90">{disclaimer}</p>

            {done ? (
              <p className="mt-4 text-sm font-medium text-[#2d5016]" role="status">
                {t.thanks}
              </p>
            ) : (
              <>
                <fieldset className="mt-4 space-y-2">
                  <legend className="sr-only">{t.title}</legend>
                  {EN_VENTA_REPORT_REASONS.map((r) => (
                    <label
                      key={r.code}
                      className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#E8DFD0]/90 bg-white px-3 py-2 text-sm text-[#1E1810] hover:bg-[#FAF7F2]"
                    >
                      <input
                        type="radio"
                        name="ev-report-reason"
                        className="mt-0.5 shrink-0"
                        checked={reasonCode === r.code}
                        disabled={busy}
                        onChange={() => setReasonCode(r.code)}
                      />
                      <span>{r.label[lang]}</span>
                    </label>
                  ))}
                </fieldset>
                <label className="mt-3 block text-xs font-semibold text-[#5C5346]">
                  {t.details}
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={3}
                    disabled={busy}
                    className="mt-1 w-full rounded-lg border border-[#DCCAA0] bg-white px-2 py-1.5 text-sm text-[#1E1810]"
                  />
                </label>
                {err ? (
                  <p className="mt-2 text-xs font-medium text-red-800" role="alert">
                    {err}
                  </p>
                ) : null}
              </>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {done ? (
                <button
                  type="button"
                  className="rounded-lg bg-[#2A2620] px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                >
                  {t.close}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void submit()}
                    className="rounded-lg bg-red-800 px-4 py-2 text-sm font-bold text-white hover:bg-red-900 disabled:opacity-50"
                  >
                    {busy ? t.sending : t.send}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
                  >
                    {t.cancel}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
