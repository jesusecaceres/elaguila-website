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
        <main className="relative mx-auto max-w-6xl px-4 pb-20 pt-24 sm:pt-28">
          <div className="flex flex-col gap-14 sm:gap-16 lg:gap-20">
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
