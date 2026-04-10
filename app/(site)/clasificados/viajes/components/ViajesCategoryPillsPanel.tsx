"use client";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { ViajesUi } from "../data/viajesUiCopy";
import { ViajesCategoryCarousel } from "./ViajesCategoryCarousel";

export function ViajesCategoryPillsPanel({ lang, ui }: { lang: Lang; ui: ViajesUi }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-[color:var(--lx-nav-border)]/80 bg-[#fffdfb]/85 p-2.5 sm:rounded-xl sm:p-3.5">
      <p className="mb-2 max-w-full break-words text-center text-[8px] font-semibold uppercase leading-snug tracking-[0.12em] text-[color:var(--lx-muted)] sm:mb-2.5 sm:text-left sm:text-[9px]">
        {ui.searchShortcutsLabel}
      </p>
      <ViajesCategoryCarousel lang={lang} ui={ui} />
    </div>
  );
}
