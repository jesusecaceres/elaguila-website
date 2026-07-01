"use client";

import { useEffect } from "react";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { BrResultsCopy } from "../bienesRaicesResultsCopy";
import type { BrResultsParsedState } from "../lib/brResultsUrlState";
import { BienesRaicesResultsFilters } from "./BienesRaicesResultsFilters";
import { BR_BTN_PRIMARY, BR_BTN_SECONDARY } from "../../shared/bienesRaicesLeonixPublicUi";

type Props = {
  open: boolean;
  onClose: () => void;
  parsed: BrResultsParsedState;
  copy: BrResultsCopy;
  lang: Lang;
  onPatch: (patch: Record<string, string | null>, preservePage?: boolean) => void;
  onApply?: () => void;
  onClear?: () => void;
};

export function BienesRaicesResultsFilterDrawer({
  open,
  onClose,
  parsed,
  copy,
  lang,
  onPatch,
  onApply,
  onClear,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const clearLabel = lang === "es" ? "Limpiar filtros" : "Clear filters";

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/40"
        aria-label={copy.filterDrawerClose}
        onClick={onClose}
      />
      <div
        className={
          "fixed z-[61] flex flex-col overflow-hidden border border-[#D6C7AD]/90 bg-[#FFFDF7] shadow-[0_-12px_48px_-16px_rgba(42,36,22,0.28)] " +
          "inset-x-0 bottom-0 top-[12vh] rounded-t-2xl max-lg:max-h-[88vh] " +
          "lg:inset-y-0 lg:left-auto lg:right-0 lg:top-0 lg:w-full lg:max-w-[400px] lg:rounded-none lg:rounded-l-2xl"
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="br-filter-drawer-title"
      >
        <div className="flex items-center justify-between border-b border-[#E8DFD0]/80 px-4 py-3">
          <h2 id="br-filter-drawer-title" className="font-serif text-sm font-bold text-[#2A4536]">
            {copy.filterDrawerTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#D6C7AD] px-3 py-1 text-xs font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
          >
            {copy.filterDrawerClose}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <BienesRaicesResultsFilters parsed={parsed} copy={copy} lang={lang} onPatch={onPatch} idPrefix="br-drawer" />
        </div>
        <div className="flex gap-2 border-t border-[#E8DFD0]/80 p-4">
          {onClear ? (
            <button type="button" className={`${BR_BTN_SECONDARY} flex-1`} onClick={onClear}>
              {clearLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={`${BR_BTN_PRIMARY} flex-[1.2]`}
            onClick={() => {
              onApply?.();
              onClose();
            }}
          >
            {copy.filterDrawerApply}
          </button>
        </div>
      </div>
    </>
  );
}
