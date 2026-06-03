"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { CategoryStandardLandingPage } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPage";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";

import { FeaturedJobsLandingSection } from "./components/landing/FeaturedJobsLandingSection";
import { HeroAndSearch } from "./components/landing/HeroAndSearch";
import { JobCategoryGrid } from "./components/landing/JobCategoryGrid";
import { JobFairLandingBanner } from "./components/landing/JobFairLandingBanner";
import { LatestJobsAndEmployer } from "./components/landing/LatestJobsAndEmployer";
import { QuickSearchTiles } from "./components/landing/QuickSearchTiles";
import { RefineSearchBand } from "./components/landing/RefineSearchBand";
import { TrustSignalsRow } from "./components/landing/TrustSignalsRow";

import type { SampleFeaturedJob, SampleRecentJob } from "./data/empleosLandingSampleData";

export type EmpleosLandingPageProps = {
  liveInventory?: boolean;
  featuredJobsOverride?: SampleFeaturedJob[];
  recentJobsByLang?: { es: SampleRecentJob[]; en: SampleRecentJob[] };
};

export function EmpleosLandingPage({
  liveInventory = false,
  featuredJobsOverride,
  recentJobsByLang,
}: EmpleosLandingPageProps) {
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);
  const recentOverride = recentJobsByLang?.[lang];

  return (
    <>
      <CategoryStandardLandingPage
        category="empleos"
        lang={lang}
        searchAction={buildCategoryResultsUrl("empleos", lang)}
        searchSlot={<HeroAndSearch lang={lang} />}
      />
      <div className="mx-auto w-full max-w-6xl space-y-14 px-4 pb-24 sm:space-y-16 sm:px-6 lg:px-8 md:space-y-20">
        <QuickSearchTiles lang={lang} />
        <FeaturedJobsLandingSection
          lang={lang}
          jobs={liveInventory ? featuredJobsOverride : undefined}
          liveInventory={liveInventory}
        />
        <RefineSearchBand lang={lang} />
        <JobCategoryGrid lang={lang} liveInventory={liveInventory} />
        <LatestJobsAndEmployer
          lang={lang}
          jobs={liveInventory ? recentOverride : undefined}
          liveInventory={liveInventory}
        />
        <JobFairLandingBanner lang={lang} />
        <TrustSignalsRow lang={lang} />
      </div>
    </>
  );
}
