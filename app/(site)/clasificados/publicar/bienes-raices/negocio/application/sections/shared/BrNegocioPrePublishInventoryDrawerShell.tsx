"use client";

import { useEffect } from "react";
import type { BrNegocioPrePublishInventoryLang } from "../../brNegocioPrePublishInventoryShellCopy";
import { brNegocioPrePublishInventoryShellCopy } from "../../brNegocioPrePublishInventoryShellCopy";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: BrNegocioPrePublishInventoryLang;
};

/** BR-INV-B shell only — no save, no publish, no Supabase. */
export function BrNegocioPrePublishInventoryDrawerShell({ open, onClose, lang }: Props) {
  const copy = brNegocioPrePublishInventoryShellCopy(lang);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="br-pre-publish-inventory-drawer-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1E1810]/45 backdrop-blur-[2px]"
        aria-label={copy.close}
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-none flex-col bg-[#FAF7F2] shadow-2xl lg:ml-auto lg:h-full lg:w-[min(100%,480px)] lg:max-w-[480px]">
        <div className="flex shrink-0 items-center justify-between border-b border-[#E8DFD0] px-4 py-3 sm:px-5">
          <h2 id="br-pre-publish-inventory-drawer-title" className="font-serif text-lg font-semibold text-[#1E1810] sm:text-xl">
            {copy.drawerTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] touch-manipulation rounded-full px-3 py-1.5 text-sm font-semibold text-[#5C5346] hover:bg-[#FDFBF7] sm:min-h-0"
          >
            {copy.close}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <p className="text-sm leading-relaxed text-[#2C2416]">{copy.drawerExplain}</p>
          <div className="mt-4 rounded-xl border border-dashed border-[#C9B46A]/55 bg-[#FFF9EE]/80 px-4 py-5 text-center">
            <p className="text-sm font-semibold text-[#6E5418]">{copy.comingNext}</p>
          </div>
        </div>

        <div className="shrink-0 space-y-2 border-t border-[#E8DFD0] bg-[#FAF7F2] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
          <button
            type="button"
            disabled
            aria-disabled="true"
            title={copy.saveDisabledHint}
            className="w-full cursor-not-allowed rounded-2xl border border-[#E8DFD0] bg-[#F3EDE3] py-3.5 text-sm font-bold text-[#9A9288] opacity-80"
          >
            {copy.saveProperty}
          </button>
          <p className="text-center text-xs text-[#7A7164]">{copy.saveDisabledHint}</p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border border-[#C9B46A]/50 bg-white py-3 text-sm font-semibold text-[#6E5418] hover:bg-[#FFFCF7]"
          >
            {copy.close}
          </button>
        </div>
      </div>
    </div>
  );
}
