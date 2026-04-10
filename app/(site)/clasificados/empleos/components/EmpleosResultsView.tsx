"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import {
  sampleCategorySelectOptions,
  sampleCompanyTypeOptions,
  sampleExperienceOptions,
  sampleJobTypeSelectOptions,
  sampleModalityOptions,
  sampleSalaryBandOptions,
} from "../data/empleosLandingSampleData";
import { EMPLEOS_JOB_CATALOG } from "../data/empleosSampleCatalog";
import {
  EMPLEOS_SAMPLE_NOW_MS,
  empleosParamsFromSearchParams,
  filterEmpleosJobs,
  parseEmpleosResultsQuery,
  sortEmpleosJobs,
} from "../lib/empleosResultsQuery";
import { buildEmpleosResultadosUrl, type EmpleosResultadosParams } from "../shared/utils/empleosListaUrl";
import { EmpleosJobResultCard } from "./EmpleosJobResultCard";

const COPY = {
  es: {
    hub: "Clasificados",
    landing: "Empleos",
    resultsTitle: "Resultados de empleos",
    countLabel: "vacantes",
    search: "Buscar",
    clear: "Limpiar filtros",
    sortLabel: "Ordenar",
    sortRelevance: "Relevancia",
    sortDate: "Más recientes",
    sortSalary: "Salario mayor",
    activeFilters: "Filtros activos",
    emptyTitle: "No hay vacantes con estos filtros",
    emptyHint: "Prueba quitar filtros o amplía la ciudad o palabra clave.",
    mobileFilters: "Filtros y opciones",
    featuredBlock: "Destacados y promocionados",
    allBlock: "Todas las vacantes",
  },
  en: {
    hub: "Classifieds",
    landing: "Jobs",
    resultsTitle: "Job results",
    countLabel: "openings",
    search: "Search",
    clear: "Clear filters",
    sortLabel: "Sort",
    sortRelevance: "Relevance",
    sortDate: "Newest",
    sortSalary: "Highest salary",
    activeFilters: "Active filters",
    emptyTitle: "No jobs match these filters",
    emptyHint: "Try removing filters or broadening your keyword or city.",
    mobileFilters: "Filters & options",
    featuredBlock: "Featured & promoted",
    allBlock: "All openings",
  },
} as const;

const CHIP_KEYS: (keyof EmpleosResultadosParams)[] = [
  "q",
  "city",
  "category",
  "jobType",
  "modality",
  "salaryMin",
  "salaryMax",
  "experience",
  "companyType",
  "featured",
  "recent",
  "quickApply",
];

function chipLabel(lang: Lang, key: string, val: string): string {
  if (key === "featured" && val === "1") return lang === "es" ? "Solo destacados" : "Featured only";
  if (key === "recent" && val === "1") return lang === "es" ? "Publicados recientes" : "Recently posted";
  if (key === "quickApply" && val === "1") return lang === "es" ? "Aplicación rápida" : "Quick apply";
  if (key === "category") {
    const o = sampleCategorySelectOptions.find((x) => x.value === val);
    return o?.label ?? val;
  }
  if (key === "jobType") {
    const o = sampleJobTypeSelectOptions.find((x) => x.value === val);
    return o?.label ?? val;
  }
  if (key === "modality") {
    const o = sampleModalityOptions.find((x) => x.value === val);
    return o?.label ?? val;
  }
  if (key === "experience") {
    const o = sampleExperienceOptions.find((x) => x.value === val);
    return o?.label ?? val;
  }
  if (key === "companyType") {
    const o = sampleCompanyTypeOptions.find((x) => x.value === val);
    return o?.label ?? val;
  }
  if (key === "salaryMin" || key === "salaryMax") {
    const band = sampleSalaryBandOptions.find((b) => b.min === val || b.max === val);
    return band?.label ?? val;
  }
  if (key === "q") return `${lang === "es" ? "Palabra" : "Keyword"}: ${val}`;
  if (key === "city") return `${lang === "es" ? "Ubicación" : "Location"}: ${val}`;
  return `${key}: ${val}`;
}

export function EmpleosResultsView() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);
  const t = COPY[lang];

  const parsed = useMemo(() => parseEmpleosResultsQuery(sp ?? new URLSearchParams()), [sp]);

  const filtered = useMemo(() => {
    const f = filterEmpleosJobs(EMPLEOS_JOB_CATALOG, parsed, EMPLEOS_SAMPLE_NOW_MS);
    return sortEmpleosJobs(f, parsed.sort);
  }, [parsed]);

  const featuredRows = useMemo(
    () => filtered.filter((j) => j.listingTier === "featured" || j.listingTier === "promoted"),
    [filtered],
  );
  const standardRows = useMemo(() => filtered.filter((j) => j.listingTier === "standard"), [filtered]);

  const [q, setQ] = useState(parsed.q);
  const [city, setCity] = useState(parsed.city);
  const [category, setCategory] = useState(parsed.category);
  const [jobType, setJobType] = useState(parsed.jobType);
  const [modality, setModality] = useState(parsed.modality);
  const [salaryBand, setSalaryBand] = useState(() => {
    const smin = parsed.salaryMin;
    const smax = parsed.salaryMax;
    const hit = sampleSalaryBandOptions.find((b) => b.min === smin && (b.max === smax || (!b.max && !smax)));
    return hit?.value ?? "";
  });
  const [experience, setExperience] = useState(parsed.experience);
  const [companyType, setCompanyType] = useState(parsed.companyType);
  const [recent, setRecent] = useState(parsed.recentOnly);
  const [quickApply, setQuickApply] = useState(parsed.quickApplyOnly);
  const [featured, setFeatured] = useState(parsed.featuredOnly);

  useEffect(() => {
    setQ(parsed.q);
    setCity(parsed.city);
    setCategory(parsed.category);
    setJobType(parsed.jobType);
    setModality(parsed.modality);
    setExperience(parsed.experience);
    setCompanyType(parsed.companyType);
    setRecent(parsed.recentOnly);
    setQuickApply(parsed.quickApplyOnly);
    setFeatured(parsed.featuredOnly);
    const smin = parsed.salaryMin;
    const smax = parsed.salaryMax;
    const hit = sampleSalaryBandOptions.find((b) => b.min === smin && (b.max === smax || (!b.max && !smax)));
    setSalaryBand(hit?.value ?? "");
  }, [parsed]);

  const pushParams = (extra: EmpleosResultadosParams) => {
    router.push(buildEmpleosResultadosUrl(lang, extra));
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const band = sampleSalaryBandOptions.find((b) => b.value === salaryBand);
    const next: EmpleosResultadosParams = {
      q: q.trim() || undefined,
      city: city.trim() || undefined,
      category: category || undefined,
      jobType: jobType || undefined,
      modality: modality || undefined,
      salaryMin: band?.min || undefined,
      salaryMax: band?.max || undefined,
      experience: experience || undefined,
      companyType: companyType || undefined,
      recent: recent ? "1" : undefined,
      quickApply: quickApply ? "1" : undefined,
      featured: featured ? "1" : undefined,
      sort: parsed.sort,
    };
    pushParams(next);
  };

  const onSortChange = (sort: string) => {
    const base = empleosParamsFromSearchParams(sp ?? new URLSearchParams());
    pushParams({ ...base, sort: sort || undefined });
  };

  const hubHref = appendLangToPath("/clasificados", lang);
  const landingHref = appendLangToPath("/clasificados/empleos", lang);
  const publishHref = appendLangToPath("/clasificados/publicar/empleos", lang);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; href: string }[] = [];
    if (!sp) return chips;
    CHIP_KEYS.forEach((key) => {
      const val = sp.get(key as string);
      if (!val) return;
      const href = buildEmpleosResultadosUrl(lang, empleosParamsFromSearchParams(sp, key as string));
      chips.push({ key: key as string, label: chipLabel(lang, key as string, val), href });
    });
    return chips;
  }, [sp, lang]);

  const showFeaturedBlock = featuredRows.length > 0 && !parsed.featuredOnly;
  const listMain = parsed.featuredOnly ? filtered : showFeaturedBlock ? standardRows : filtered;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAF7F2] pb-20 text-[#2A2826]">
      <header className="border-b border-[#E8DFD0] bg-[#FFFBF7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <nav className="text-xs font-semibold text-[#4A4744] sm:text-sm" aria-label="Breadcrumb">
            <Link href={hubHref} className="hover:text-[#2A2826] hover:underline">
              {t.hub}
            </Link>
            <span className="mx-1.5 text-[#9A948C]">&gt;</span>
            <Link href={landingHref} className="hover:text-[#2A2826] hover:underline">
              {t.landing}
            </Link>
            <span className="mx-1.5 text-[#9A948C]">&gt;</span>
            <span className="text-[#2A2826]">{t.resultsTitle}</span>
          </nav>
          <Link
            href={publishHref}
            className="rounded-full bg-gradient-to-r from-[#E8A54B] to-[#D9A23A] px-4 py-2 text-xs font-bold text-[#2A2826] shadow-sm transition hover:brightness-105 sm:text-sm"
          >
            {lang === "es" ? "Publicar vacante" : "Post a job"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.resultsTitle}</h1>
          <p className="text-sm font-medium text-[#5B6F82]">
            {filtered.length} {t.countLabel}
          </p>
        </div>

        <form
          onSubmit={submitSearch}
          className="mt-6 rounded-[1.25rem] border border-[#E8DFD0] bg-white p-4 shadow-[0_12px_36px_rgba(42,40,38,0.07)] sm:p-6"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <label className="md:col-span-2">
              <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Palabra clave" : "Keyword"}</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-[#E5DCCD] bg-[#FFFBF7] px-3 text-sm outline-none focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Ciudad" : "City"}</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-[#E5DCCD] bg-[#FFFBF7] px-3 text-sm outline-none focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Categoría" : "Category"}</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-[#E5DCCD] bg-[#FFFBF7] px-3 text-sm outline-none focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
              >
                {sampleCategorySelectOptions.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Tipo de empleo" : "Job type"}</span>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-[#E5DCCD] bg-[#FFFBF7] px-3 text-sm outline-none focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
              >
                {sampleJobTypeSelectOptions.map((o) => (
                  <option key={o.value || "any"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Modalidad" : "Modality"}</span>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-[#E5DCCD] bg-[#FFFBF7] px-3 text-sm outline-none focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
              >
                {sampleModalityOptions.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Salario (rango)" : "Salary band"}</span>
              <select
                value={salaryBand}
                onChange={(e) => setSalaryBand(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-[#E5DCCD] bg-[#FFFBF7] px-3 text-sm outline-none focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
              >
                {sampleSalaryBandOptions.map((o) => (
                  <option key={o.value || "any"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Experiencia" : "Experience"}</span>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-[#E5DCCD] bg-[#FFFBF7] px-3 text-sm outline-none focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
              >
                {sampleExperienceOptions.map((o) => (
                  <option key={o.value || "any"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Tipo de empresa" : "Company type"}</span>
              <select
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-[#E5DCCD] bg-[#FFFBF7] px-3 text-sm outline-none focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
              >
                {sampleCompanyTypeOptions.map((o) => (
                  <option key={o.value || "any"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <details className="mt-4 rounded-xl border border-[#F0E8DC] bg-[#FFFBF7] p-3 lg:hidden">
            <summary className="cursor-pointer text-sm font-semibold text-[#2A2826]">{t.mobileFilters}</summary>
            <div className="mt-3 flex flex-col gap-3 border-t border-[#F0E8DC] pt-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 rounded" />
                {lang === "es" ? "Solo destacados" : "Featured only"}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={recent} onChange={(e) => setRecent(e.target.checked)} className="h-4 w-4 rounded" />
                {lang === "es" ? "Publicados recientemente (7 días)" : "Posted in last 7 days"}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={quickApply} onChange={(e) => setQuickApply(e.target.checked)} className="h-4 w-4 rounded" />
                {lang === "es" ? "Aplicación rápida" : "Quick apply"}
              </label>
            </div>
          </details>

          <div className="mt-4 hidden flex-wrap gap-4 lg:flex">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 rounded" />
              {lang === "es" ? "Solo destacados" : "Featured only"}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={recent} onChange={(e) => setRecent(e.target.checked)} className="h-4 w-4 rounded" />
              {lang === "es" ? "Publicados recientemente (7 días)" : "Posted in last 7 days"}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={quickApply} onChange={(e) => setQuickApply(e.target.checked)} className="h-4 w-4 rounded" />
              {lang === "es" ? "Aplicación rápida" : "Quick apply"}
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              className="inline-flex min-h-11 min-w-[10rem] items-center justify-center rounded-xl bg-gradient-to-r from-[#E8A54B] via-[#D9A23A] to-[#C9942E] px-6 text-sm font-bold text-[#2A2826] shadow-md transition hover:brightness-105"
            >
              {t.search}
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-[#4A4744]">
                <span>{t.sortLabel}</span>
                <select
                  value={parsed.sort}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="min-h-10 rounded-lg border border-[#E5DCCD] bg-white px-2 text-sm"
                >
                  <option value="relevance">{t.sortRelevance}</option>
                  <option value="date_desc">{t.sortDate}</option>
                  <option value="salary_desc">{t.sortSalary}</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => router.push(buildEmpleosResultadosUrl(lang, { sort: parsed.sort }))}
                className="text-sm font-semibold text-[#4F6B82] underline-offset-2 hover:underline"
              >
                {t.clear}
              </button>
            </div>
          </div>
        </form>

        {activeChips.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5B6F82]">{t.activeFilters}</p>
            <div className="flex flex-wrap gap-2">
              {activeChips.map((c) => (
                <Link
                  key={c.key}
                  href={c.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-medium text-[#2A2826] transition hover:border-[#D9A23A]/50"
                >
                  {c.label}
                  <span className="text-[#9A948C]" aria-hidden>
                    ×
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-[#E8DFD0] bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-lg font-bold text-[#2A2826]">{t.emptyTitle}</p>
            <p className="mt-2 text-sm text-[#5C564E]">{t.emptyHint}</p>
            <button
              type="button"
              onClick={() => router.push(buildEmpleosResultadosUrl(lang, { sort: parsed.sort }))}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#2F3438] px-5 text-sm font-bold text-[#FFFBF5]"
            >
              {t.clear}
            </button>
          </div>
        ) : (
          <>
            {showFeaturedBlock ? (
              <section className="mt-10" aria-labelledby="empleos-res-featured">
                <h2 id="empleos-res-featured" className="text-lg font-bold text-[#2A2826]">
                  {t.featuredBlock}
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {featuredRows.map((job) => (
                    <EmpleosJobResultCard key={job.id} job={job} lang={lang} variant="grid" />
                  ))}
                </div>
              </section>
            ) : null}

            {listMain.length > 0 ? (
              <section className="mt-10" aria-labelledby="empleos-res-all">
                <h2 id="empleos-res-all" className="text-lg font-bold text-[#2A2826]">
                  {parsed.featuredOnly ? t.featuredBlock : t.allBlock}
                </h2>
                <div className="mt-4 flex flex-col gap-4">
                  {listMain.map((job) => (
                    <EmpleosJobResultCard key={job.id} job={job} lang={lang} variant="list" />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
