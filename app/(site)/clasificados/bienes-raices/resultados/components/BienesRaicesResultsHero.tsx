"use client";

import type { BrResultsCopy } from "../bienesRaicesResultsCopy";
import { brLuxuryBodyMutedClass, brLuxuryHeroPanelClass, brLuxuryOverlineClass, brLuxurySerifHeadingClass } from "../../shared/brResultsTheme";

const PANEL = `${brLuxuryHeroPanelClass} p-6 shadow-[0_28px_80px_-36px_rgba(42,36,22,0.32)] sm:p-9`;

export function BienesRaicesResultsHero({ copy }: { copy: BrResultsCopy }) {
  return (
    <div className={PANEL}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="h-px min-w-[2rem] flex-1 max-w-[4rem] bg-gradient-to-r from-[#C5A059] to-transparent sm:min-w-[3rem]" aria-hidden />
        <p className={brLuxuryOverlineClass}>Leonix · Marketplace</p>
      </div>
      <h1 className={`mt-5 ${brLuxurySerifHeadingClass} text-[clamp(1.85rem,4.5vw,2.75rem)] leading-[1.12] sm:leading-tight`}>
        {copy.heroTitle}
      </h1>
      <p className={`mt-4 max-w-3xl ${brLuxuryBodyMutedClass} sm:text-base`}>{copy.heroSubtitle}</p>
    </div>
  );
}
