"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { submitListingReportAction } from "@/app/admin/actions";

export function LeonixInlineListingReport({ listingId, lang }: { listingId: string; lang: "es" | "en" }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const t =
    lang === "es"
      ? {
          btn: "Reportar anuncio",
          title: "Reportar anuncio",
          ph: "Motivo del reporte (obligatorio)",
          cancel: "Cancelar",
          send: "Enviar",
          sending: "Enviando…",
          needReason: "Escribe el motivo del reporte.",
          err: "No se pudo enviar el reporte. Intenta de nuevo.",
          thanks: "Gracias. Hemos recibido tu reporte.",
        }
      : {
          btn: "Report listing",
          title: "Report listing",
          ph: "Reason for report (required)",
          cancel: "Cancel",
          send: "Submit",
          sending: "Sending…",
          needReason: "Please enter a reason for the report.",
          err: "Could not submit report. Please try again.",
          thanks: "Thank you. We have received your report.",
        };

  const submit = async () => {
    const r = reason.trim();
    if (!r) {
      alert(t.needReason);
      return;
    }
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await submitListingReportAction(listingId, r, user?.id ?? null);
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setReason("");
        setDone(false);
      }, 1400);
    } catch {
      alert(t.err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 border-t border-black/10 pt-4">
      {!open ? (
        <button
          type="button"
          data-testid="ev-listing-report-open"
          onClick={() => {
            setOpen(true);
            setDone(false);
            setReason("");
          }}
          className="text-xs font-semibold text-red-800/90 underline decoration-red-800/30 underline-offset-2 hover:text-red-950"
        >
          {t.btn}
        </button>
      ) : (
        <div className="rounded-xl border border-red-200/80 bg-red-50/50 p-3">
          <div className="text-xs font-bold text-red-950">{t.title}</div>
          {done ? (
            <p className="mt-2 text-xs text-red-900/90">{t.thanks}</p>
          ) : (
            <>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t.ph}
                rows={3}
                disabled={busy}
                className="mt-2 w-full rounded-lg border border-red-200/80 bg-white px-2 py-1.5 text-xs text-[#111111]"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void submit()}
                  className="rounded-lg bg-red-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-900 disabled:opacity-50"
                >
                  {busy ? t.sending : t.send}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50"
                >
                  {t.cancel}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
