"use client";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import type { ViajesUi } from "../data/viajesUiCopy";
import { ViajesCategoryCarousel } from "./ViajesCategoryCarousel";

export function ViajesCategoryPillsPanel({ lang, ui }: { lang: Lang; ui: ViajesUi }) {
  return (
    <div className="rounded-2xl border border-[color:var(--lx-gold-border)] bg-[#fffaf3]/95 p-4 shadow-[0_16px_40px_-24px_rgba(30,24,16,0.25)] backdrop-blur-[2px] sm:rounded-3xl sm:p-5">
      <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--lx-muted)] sm:mb-4 sm:text-left">{ui.exploreByTripType}</p>
      <ViajesCategoryCarousel lang={lang} ui={ui} />
    </div>
  );
}
