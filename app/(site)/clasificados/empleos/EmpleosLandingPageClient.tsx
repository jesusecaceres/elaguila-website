"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendRouteLangToPath, resolveHubCopyLang, resolveRouteLang } from "@/app/clasificados/lib/hubUrl";
import { CategoryStandardLandingPage } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPage";
import { CategoryVisibilityCta } from "@/app/(site)/clasificados/components/categoryStandard/CategoryVisibilityCta";
import {
  buildCategoryResultsUrl,
  categoryPublishPath,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";

import { HeroAndSearch } from "./components/landing/HeroAndSearch";
import { JobCategoryGrid } from "./components/landing/JobCategoryGrid";
import { LatestJobsAndEmployer } from "./components/landing/LatestJobsAndEmployer";

import type { SampleFeaturedJob, SampleRecentJob } from "./data/empleosLandingSampleData";

export type EmpleosLandingPageProps = {
  liveInventory?: boolean;
  featuredJobsOverride?: SampleFeaturedJob[];
  recentJobsByLang?: { es: SampleRecentJob[]; en: SampleRecentJob[] };
};

export function EmpleosLandingPage({
  liveInventory = false,
  featuredJobsOverride: _featuredJobsOverride,
  recentJobsByLang,
}: EmpleosLandingPageProps) {
  const sp = useSearchParams();
  const routeLang = useMemo(() => resolveRouteLang(sp?.get("lang")), [sp]);
  const lang = useMemo<Lang>(() => resolveHubCopyLang(sp?.get("lang")), [sp]);
  const recentOverride = recentJobsByLang?.[lang];
  const resultsHref = useMemo(
    () => buildCategoryResultsUrl("empleos", routeLang as Lang),
    [routeLang],
  );
  const publishHref = useMemo(
    () => appendRouteLangToPath(categoryPublishPath("empleos"), routeLang),
    [routeLang],
  );

  return (
    <>
      <CategoryStandardLandingPage
        category="empleos"
        lang={lang}
        publishHref={publishHref}
        browseHref={resultsHref}
        searchAction={resultsHref}
        searchSlot={<HeroAndSearch lang={lang} />}
        suppressVisibilityCta
      />
      <div className="mx-auto w-full max-w-[1080px] space-y-8 px-3.5 pb-24 sm:space-y-10 sm:px-4 lg:px-5">
        <JobCategoryGrid lang={lang} liveInventory={liveInventory} />
        <LatestJobsAndEmployer
          lang={lang}
          jobs={liveInventory ? recentOverride : undefined}
          liveInventory={liveInventory}
        />
        <CategoryVisibilityCta lang={lang} category="empleos" surface="landing" compact />
      </div>
    </>
  );
}
