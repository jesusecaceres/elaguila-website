"use client";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { ViajesUi } from "../data/viajesUiCopy";
import { ViajesCategoryCarousel } from "./ViajesCategoryCarousel";

/** Trip-type shortcuts — visually subordinate to the main search module (Phase 2). */
export function ViajesCategoryPillsPanel({ lang, ui }: { lang: Lang; ui: ViajesUi }) {
  return (
    <div className="rounded-xl border border-dashed border-[color:var(--lx-gold-border)]/80 bg-[#fffdfb]/85 p-3 shadow-sm sm:rounded-2xl sm:p-4">
      <p className="mb-2.5 text-center text-[9px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)] sm:mb-3 sm:text-left sm:text-[10px]">
        {ui.searchShortcutsLabel}
      </p>
      <ViajesCategoryCarousel lang={lang} ui={ui} />
    </div>
  );
}
