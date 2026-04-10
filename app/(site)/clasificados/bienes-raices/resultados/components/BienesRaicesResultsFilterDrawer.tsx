"use client";

import { useEffect } from "react";
import type { BrResultsCopy } from "../bienesRaicesResultsCopy";
import type { BrResultsParsedState } from "../lib/brResultsUrlState";
import { BienesRaicesResultsFilters } from "./BienesRaicesResultsFilters";

type Props = {
  open: boolean;
  onClose: () => void;
  parsed: BrResultsParsedState;
  copy: BrResultsCopy;
  onPatch: (patch: Record<string, string | null>, preservePage?: boolean) => void;
};

export function BienesRaicesResultsFilterDrawer({ open, onClose, parsed, copy, onPatch }: Props) {
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
    <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-labelledby="br-filter-drawer-title">
      <button
        type="button"
        className="absolute inset-0 bg-[#1E1810]/40 backdrop-blur-[2px]"
        aria-label={copy.filterDrawerClose}
        onClick={onClose}
      />
      <div className="relative ml-auto flex h-full w-[min(100%,420px)] flex-col bg-[#FAF7F2] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E8DFD0] px-4 py-3">
          <h2 id="br-filter-drawer-title" className="font-serif text-lg font-semibold text-[#1E1810]">
            {copy.filterDrawerTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-[#5C5346] hover:bg-[#FDFBF7]"
          >
            {copy.filterDrawerClose}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <BienesRaicesResultsFilters parsed={parsed} copy={copy} onPatch={onPatch} idPrefix="br-drawer" />
        </div>
        <div className="border-t border-[#E8DFD0] p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-[#2A2620] py-3 text-sm font-bold text-[#FAF7F2] shadow-md hover:bg-[#1E1810]"
          >
            {copy.filterDrawerApply}
          </button>
        </div>
      </div>
    </div>
  );
}
