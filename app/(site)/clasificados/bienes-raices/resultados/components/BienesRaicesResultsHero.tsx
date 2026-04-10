"use client";

import type { BrResultsCopy } from "../bienesRaicesResultsCopy";

const PANEL =
  "rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FDFBF7] via-[#FFFCF7] to-[#F5EFE6]/95 p-6 shadow-[0_20px_60px_-28px_rgba(42,36,22,0.35)] sm:p-8";

export function BienesRaicesResultsHero({ copy }: { copy: BrResultsCopy }) {
  return (
    <div className={PANEL}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="h-px min-w-[2rem] flex-1 max-w-[4rem] bg-gradient-to-r from-[#C9B46A] to-transparent sm:min-w-[3rem]" aria-hidden />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A6F3A]">Leonix Clasificados</p>
      </div>
      <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#1E1810] sm:text-[2.35rem] sm:leading-tight">
        {copy.heroTitle}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5C5346]/92 sm:text-base">{copy.heroSubtitle}</p>
    </div>
  );
}
