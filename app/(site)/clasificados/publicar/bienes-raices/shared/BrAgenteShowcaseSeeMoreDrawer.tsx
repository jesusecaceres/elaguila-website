"use client";

import { useEffect } from "react";
import { brAgenteApplicationPricingCopy, type BrAgentePricingLang } from "./brAgenteApplicationPricingCopy";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: BrAgentePricingLang;
};

/** Agent Showcase + Inventory Pack detail drawer (start page + application checkpoint). */
export function BrAgenteShowcaseSeeMoreDrawer({ open, onClose, lang }: Props) {
  const copy = brAgenteApplicationPricingCopy(lang);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label={copy.cancel} onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-[#E8DFD0] bg-[#FFFCF7] p-5 shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-[#1E1810]">{copy.drawerTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-[#E8DFD0] px-3 py-1.5 text-sm font-semibold text-[#5C5346] hover:bg-white"
          >
            {copy.cancel}
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#6E5418]">{copy.drawerBaseTitle}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#5C5346]">
              {lang === "es" ? "Incluye" : "Includes"}
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#5C5346]/90">
              {copy.drawerBaseIncludes.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#6E5418]">{copy.drawerPackTitle}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#5C5346]">
              {lang === "es" ? "Agrega" : "Adds"}
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#5C5346]/90">
              {copy.drawerPackIncludes.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-[#7A7164]">{copy.drawerPaymentNote}</p>
        </div>
      </div>
    </div>
  );
}
