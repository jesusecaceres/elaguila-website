"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import {
  EMPLEOS_FEATURED_JOBS,
  EMPLEOS_JOB_FAIR_PROMO,
  EMPLEOS_LATEST_JOBS,
} from "../data/empleosResultsSampleData";
import { EmpleosSearchBar } from "./EmpleosSearchBar";
import { EmpleosSectionTitle } from "./EmpleosSectionTitle";
import { FeaturedJobCard } from "./FeaturedJobCard";
import { JobFairPromoCard } from "./JobFairPromoCard";
import { JobListRow } from "./JobListRow";

const COPY = {
  es: {
    breadcrumbHub: "Clasificados",
    breadcrumbCat: "Empleos",
    publicar: "Publicar Anuncio",
    pageTitle: "Empleos",
    keywordPh: "Palabra clave",
    locationPh: "Ciudad o Estado",
    filters: "Filtros",
    buscar: "Buscar",
    featured: "Trabajos Destacados",
    latest: "Últimos Empleos",
    jobFair: "Feria de Empleo",
  },
  en: {
    breadcrumbHub: "Classifieds",
    breadcrumbCat: "Jobs",
    publicar: "Post listing",
    pageTitle: "Jobs",
    keywordPh: "Keyword",
    locationPh: "City or state",
    filters: "Filters",
    buscar: "Search",
    featured: "Featured jobs",
    latest: "Latest jobs",
    jobFair: "Job fair",
  },
} as const;

export function EmpleosResultsPage() {
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);
  const initialKeyword = useMemo(() => sp?.get("q") ?? "", [sp]);
  const t = COPY[lang];

  const hubHref = appendLangToPath("/clasificados", lang);
  const empleosLandingHref = appendLangToPath("/clasificados/empleos", lang);
  const publicarHref = appendLangToPath("/clasificados/publicar", lang);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#ECEAE7] pb-20 text-[color:var(--lx-text)]">
      <Navbar />

      <header className="bg-[#C41E3A] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-5 sm:py-3 lg:px-6">
          <nav className="text-xs font-medium sm:text-sm" aria-label="Breadcrumb">
            <Link href={hubHref} className="hover:underline">
              {t.breadcrumbHub}
            </Link>
            <span className="mx-1.5 opacity-80">&gt;</span>
            <Link href={empleosLandingHref} className="hover:underline">
              {t.breadcrumbCat}
            </Link>
          </nav>
          <Link
            href={publicarHref}
            className="shrink-0 text-xs font-semibold hover:underline sm:text-sm"
          >
            {t.publicar}
            <span className="ml-0.5" aria-hidden>
              &gt;
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8 lg:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-[color:var(--lx-text)] sm:text-4xl">
          {t.pageTitle}
        </h1>

        <div className="mt-6">
          <EmpleosSearchBar
            keywordPlaceholder={t.keywordPh}
            locationPlaceholder={t.locationPh}
            filtersLabel={t.filters}
            searchLabel={t.buscar}
            initialKeyword={initialKeyword}
          />
        </div>

        <section className="mt-10" aria-labelledby="empleos-destacados-heading">
          <EmpleosSectionTitle id="empleos-destacados-heading">{t.featured}</EmpleosSectionTitle>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {EMPLEOS_FEATURED_JOBS.map((job) => (
              <FeaturedJobCard key={job.id} job={job} />
            ))}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="empleos-ultimos-heading">
          <EmpleosSectionTitle id="empleos-ultimos-heading">{t.latest}</EmpleosSectionTitle>
          <div className="mt-4 rounded-lg border border-black/[0.06] bg-white px-4 shadow-[0_4px_24px_rgba(30,24,16,0.06)] sm:px-6">
            {EMPLEOS_LATEST_JOBS.map((job) => (
              <JobListRow key={job.id} job={job} />
            ))}
          </div>
        </section>

        <section className="mt-12" aria-labelledby="empleos-feria-heading">
          <EmpleosSectionTitle id="empleos-feria-heading">{t.jobFair}</EmpleosSectionTitle>
          <div className="mt-6">
            <JobFairPromoCard promo={EMPLEOS_JOB_FAIR_PROMO} />
          </div>
        </section>
      </main>
    </div>
  );
}
