"use client";

import { useEffect, useState } from "react";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  autosInventoryBoostCheckoutSoonMessage,
  autosInventoryBoostNoPaymentNote,
  autosInventoryBoostPanelIntro,
  autosInventoryBoostPanelTitle,
  autosInventoryBoostPrepareCta,
  autosInventoryBoostPricingBullets,
  writeAutosInventoryBoostReturnContext,
  type AutosInventoryBoostReturnContext,
} from "@/app/lib/clasificados/autos/autosInventoryBoostPipeline";

export type AutosInventoryBoostEditorContext = Omit<AutosInventoryBoostReturnContext, "savedAt" | "status">;

type Props = {
  open: boolean;
  onClose: () => void;
  lang: AutosNegociosLang;
  flushDraft?: () => Promise<void>;
  editorContext: AutosInventoryBoostEditorContext;
};

export function AutosNegociosInventoryBoostPanel({ open, onClose, lang, flushDraft, editorContext }: Props) {
  const [prepared, setPrepared] = useState(false);
  const [busy, setBusy] = useState(false);
  const bullets = autosInventoryBoostPricingBullets(lang);

  useEffect(() => {
    if (!open) return;
    setPrepared(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handlePrepare = async () => {
    setBusy(true);
    try {
      if (flushDraft) await flushDraft();
      writeAutosInventoryBoostReturnContext({
        ...editorContext,
        savedAt: new Date().toISOString(),
        status: "prepared",
      });
      setPrepared(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center lg:items-center lg:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="autos-inventory-boost-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1E1810]/45 backdrop-blur-[2px]"
        aria-label={lang === "es" ? "Cerrar" : "Close"}
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(92dvh,640px)] w-full flex-col rounded-t-[24px] border border-[#E8DFD0] bg-[#FAF7F2] shadow-2xl lg:max-w-lg lg:rounded-[24px]">
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#D4C4A8] lg:hidden" aria-hidden />
        <div className="flex shrink-0 items-center justify-between border-b border-[#E8DFD0] px-4 py-3 sm:px-5">
          <h2 id="autos-inventory-boost-title" className="font-serif text-lg font-semibold text-[#1E1810]">
            {autosInventoryBoostPanelTitle(lang)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-[#5C5346] hover:bg-[#FDFBF7]"
          >
            {lang === "es" ? "Cerrar" : "Close"}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <p className="text-sm leading-relaxed text-[#2C2416]">{autosInventoryBoostPanelIntro(lang)}</p>
          <ul className="mt-4 space-y-2.5">
            {bullets.map((line) => (
              <li key={line} className="flex gap-2 text-sm text-[#2C2416]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9B46A]" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs font-medium text-[#6E5418]">{autosInventoryBoostNoPaymentNote(lang)}</p>
          {prepared ? (
            <p className="mt-4 rounded-xl border border-emerald-200/90 bg-emerald-50/95 px-4 py-3 text-sm font-medium text-emerald-950">
              {autosInventoryBoostCheckoutSoonMessage(lang)}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 border-t border-[#E8DFD0] bg-[#FAF7F2] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
          {!prepared ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handlePrepare()}
              className="w-full rounded-2xl bg-[#2A2620] py-3.5 text-sm font-bold text-[#FAF7F2] shadow-md hover:bg-[#1E1810] disabled:opacity-60"
            >
              {busy ? (lang === "es" ? "Guardando…" : "Saving…") : autosInventoryBoostPrepareCta(lang)}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl border border-[#C9B46A]/50 bg-white py-3.5 text-sm font-bold text-[#6E5418]"
            >
              {lang === "es" ? "Continuar" : "Continue"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
