"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendRouteLangToPath, resolveHubCopyLang, resolveRouteLang } from "@/app/clasificados/lib/hubUrl";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryPartnerSection,
  LeonixCategoryShortcutSection,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
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

  const empleosSearchForm = (
    <LeonixCategorySearchCanvas
      lang={lang as V2Lang}
      surface="landing"
      query=""
      city=""
      state=""
      zip=""
      country=""
      onQuery={() => {}}
      onCity={() => {}}
      onState={() => {}}
      onZip={() => {}}
      onCountry={() => {}}
      onSearch={() => {}}
      onOpenFilters={() => {}}
      browseAllHref={resultsHref}
      browseAllLabel={lang === "es" ? "Ver empleos" : "View jobs"}
      searchButtonLabel={lang === "es" ? "Buscar" : "Search"}
      filtersButtonLabel={lang === "es" ? "Filtros" : "Filters"}
      publishHref={publishHref}
      publishLabel={lang === "es" ? "Publicar empleo" : "Post a job"}
    />
  );

  return (
    <LeonixCategoryPageShell surface="landing">
      <LeonixCategoryHeroGateway
        lang={lang as V2Lang}
        surface="landing"
        title={lang === "es" ? "Empleos" : "Jobs"}
        tagline=""
        intro={lang === "es" ? "Encuentra trabajo cerca de ti: presencial, híbrido o remoto." : "Find work near you: in-person, hybrid, or remote."}
        introSecondary=""
        searchSlot={empleosSearchForm}
        eyebrow={lang === "es" ? "EMPLEOS · LEONIX" : "JOBS · LEONIX"}
      />
      <main className="mx-auto max-w-[1280px] space-y-6 overflow-x-hidden px-3.5 pb-14 sm:px-4 sm:space-y-8 lg:px-5">
        <JobCategoryGrid lang={lang} liveInventory={liveInventory} />
        <LatestJobsAndEmployer
          lang={lang}
          jobs={liveInventory ? recentOverride : undefined}
          liveInventory={liveInventory}
        />
        <CategoryVisibilityCta lang={lang} category="empleos" surface="landing" compact />
      </main>
    </LeonixCategoryPageShell>
  );
}
