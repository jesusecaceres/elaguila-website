"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { FeaturedJobsLandingSection } from "./components/landing/FeaturedJobsLandingSection";
import { HeroAndSearch } from "./components/landing/HeroAndSearch";
import { JobCategoryGrid } from "./components/landing/JobCategoryGrid";
import { JobFairLandingBanner } from "./components/landing/JobFairLandingBanner";
import { LatestJobsAndEmployer } from "./components/landing/LatestJobsAndEmployer";
import { QuickSearchTiles } from "./components/landing/QuickSearchTiles";
import { RefineSearchBand } from "./components/landing/RefineSearchBand";
import { TrustSignalsRow } from "./components/landing/TrustSignalsRow";

export function EmpleosLandingPage() {
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAF7F2] text-[#2A2826]">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_-10%,rgba(232,165,75,0.2),transparent_55%),radial-gradient(ellipse_at_90%_0%,rgba(91,111,130,0.07),transparent_45%)]"
          aria-hidden
        />
        <main className="relative mx-auto w-full max-w-[min(100rem,calc(100%-1rem))] px-4 pb-24 pt-[calc(6.5rem+env(safe-area-inset-top,0px))] sm:px-6 sm:pt-[calc(7.25rem+env(safe-area-inset-top,0px))] lg:px-10">
          <div className="flex flex-col gap-14 sm:gap-16 md:gap-[4.25rem] lg:gap-24">
            <HeroAndSearch lang={lang} />
            <QuickSearchTiles lang={lang} />
            <FeaturedJobsLandingSection lang={lang} />
            <RefineSearchBand lang={lang} />
            <JobCategoryGrid lang={lang} />
            <LatestJobsAndEmployer lang={lang} />
            <JobFairLandingBanner lang={lang} />
            <TrustSignalsRow lang={lang} />
          </div>
        </main>
      </div>
    </div>
  );
}
