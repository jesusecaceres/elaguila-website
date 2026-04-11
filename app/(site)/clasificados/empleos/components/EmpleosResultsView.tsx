"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";
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
  sampleUsStateSelectOptions,
} from "../data/empleosLandingSampleData";
import { EMPLEOS_JOB_CATALOG } from "../data/empleosSampleCatalog";
import { saveEmpleosFilterPrefs } from "../lib/empleosFunctionalStorage";
import {
  EMPLEOS_SAMPLE_NOW_MS,
  empleosParamsFromSearchParams,
  filterEmpleosJobs,
  normalizeZip5,
  parseEmpleosResultsQuery,
  sortEmpleosJobs,
} from "../lib/empleosResultsQuery";
import { buildEmpleosResultadosUrl, type EmpleosResultadosParams } from "../shared/utils/empleosListaUrl";
import {
  EMPLEOS_CTA_PRIMARY,
  EMPLEOS_CTA_SECONDARY,
  EMPLEOS_FIELD,
  EMPLEOS_LINK_MUTED,
  EMPLEOS_RESULTS_FILTER_PANEL,
  EMPLEOS_RESULTS_GROUP,
} from "../lib/empleosPremiumUi";
import { EmpleosFunctionalPrefsNotice } from "./EmpleosFunctionalPrefsNotice";
import { EmpleosJobResultCard } from "./EmpleosJobResultCard";
import { EmpleosUseLocationButton } from "./EmpleosUseLocationButton";

const COPY = {
  es: {
    hub: "Clasificados",
    landing: "Empleos",
    resultsTitle: "Resultados de empleos",
    resultsSubtitle: "Ajusta filtros para acercarte a la vacante ideal.",
    search: "Buscar",
    clear: "Limpiar filtros",
    sortLabel: "Ordenar lista por",
    sortRelevance: "Relevancia",
    sortDate: "Más recientes",
    sortSalary: "Salario mayor",
    sortHint: "Se aplica a los resultados ya filtrados.",
    activeFilters: "Filtros activos",
    emptyTitle: "No encontramos vacantes con esta combinación",
    emptyHint: "Amplía ciudad o palabra clave, o restablece filtros para volver a explorar.",
    emptyExplore: "Volver a Empleos",
    featuredBlock: "Destacados y promocionados",
    allBlock: "Todas las vacantes",
    formAria: "Filtros de búsqueda de empleos",
    rememberPrefs: "Recordar ciudad y estado en este dispositivo",
    filtersToggle: "Más filtros y señales de confianza",
    clearAll: "Restablecer todo",
    locationGroup: "Ubicación",
    roleGroup: "Puesto y categoría",
    conditionsGroup: "Condiciones",
    featuredIntro: "Mayor visibilidad dentro de tu búsqueda — el listado completo sigue debajo.",
    listIntro: "Coincidencias con tus filtros; cambia el orden sin perder criterios.",
    radiusStaged: "Búsqueda por distancia (km): preparada para cuando el backend exponga coordenadas; no filtra aún en esta demo.",
    emptyRecoveryTitle: "Recupera resultados rápido",
    recoverDropQ: "Quitar palabra clave",
    recoverDropZip: "Quitar código postal",
    recoverDropCity: "Quitar ciudad",
    recoverBroaderCA: "Ampliar a todo California",
    recoverRecent: "Últimos 7 días (todos los filtros)",
    exploreMore: "Explora también",
    lowResultsHint: "Pocas coincidencias — abre una categoría cercana:",
  },
  en: {
    hub: "Classifieds",
    landing: "Jobs",
    resultsTitle: "Job results",
    resultsSubtitle: "Refine filters to get closer to the right role.",
    search: "Search",
    clear: "Clear filters",
    sortLabel: "Sort list by",
    sortRelevance: "Relevance",
    sortDate: "Newest",
    sortSalary: "Highest salary",
    sortHint: "Applies to your filtered results.",
    activeFilters: "Active filters",
    emptyTitle: "No openings match this combination",
    emptyHint: "Broaden your city or keyword, or reset filters to explore again.",
    emptyExplore: "Back to Jobs home",
    featuredBlock: "Featured & promoted",
    allBlock: "All openings",
    formAria: "Job search filters",
    rememberPrefs: "Remember city and state on this device",
    filtersToggle: "More filters & trust signals",
    clearAll: "Reset all",
    locationGroup: "Location",
    roleGroup: "Role & category",
    conditionsGroup: "Conditions",
    featuredIntro: "Higher visibility within your search — the full list still follows.",
    listIntro: "Matches for your filters; change sort without losing criteria.",
    radiusStaged: "Distance search (km): wired for future geo indexing; not applied in this demo.",
    emptyRecoveryTitle: "Get results back quickly",
    recoverDropQ: "Remove keyword",
    recoverDropZip: "Remove ZIP",
    recoverDropCity: "Remove city",
    recoverBroaderCA: "Broaden to all of California",
    recoverRecent: "Last 7 days (keep other filters)",
    exploreMore: "Explore more",
    lowResultsHint: "Few matches — try a nearby category:",
  },
} as const;

const CHIP_KEYS: (keyof EmpleosResultadosParams)[] = [
  "q",
  "city",
  "state",
  "zip",
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
  "verified",
  "premium",
  "radiusKm",
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
  if (key === "city") return `${lang === "es" ? "Ciudad" : "City"}: ${val}`;
  if (key === "state") {
    const o = sampleUsStateSelectOptions.find((x) => x.value === val);
    return lang === "es" ? `Estado: ${o?.labelEs ?? val}` : `State: ${o?.labelEn ?? val}`;
  }
  if (key === "zip") return lang === "es" ? `CP: ${val}` : `ZIP: ${val}`;
  if (key === "verified" && val === "1") return lang === "es" ? "Solo verificados" : "Verified only";
  if (key === "premium" && val === "1") return lang === "es" ? "Negocio premium" : "Premium business";
  if (key === "radiusKm")
    return lang === "es" ? `Radio: ${val} km (sin filtrar aún)` : `Radius: ${val} km (not filtering yet)`;
  return `${key}: ${val}`;
}

function countLine(lang: Lang, n: number): string {
  if (lang === "es") {
    return n === 1 ? "Se encontró 1 vacante" : `Se encontraron ${n} vacantes`;
  }
  return n === 1 ? "1 opening found" : `${n} openings found`;
}

function EmpleosFilterToggles({
  lang,
  featured,
  recent,
  quickApply,
  verifiedBox,
  premiumBox,
  setFeatured,
  setRecent,
  setQuickApply,
  setVerifiedBox,
  setPremiumBox,
}: {
  lang: Lang;
  featured: boolean;
  recent: boolean;
  quickApply: boolean;
  verifiedBox: boolean;
  premiumBox: boolean;
  setFeatured: (v: boolean) => void;
  setRecent: (v: boolean) => void;
  setQuickApply: (v: boolean) => void;
  setVerifiedBox: (v: boolean) => void;
  setPremiumBox: (v: boolean) => void;
}) {
  const cb = "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-transparent px-1 py-1 text-sm font-medium text-[#2A2826] hover:border-[#E8DFD0]/80";
  return (
    <>
      <label className={cb}>
        <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 rounded" />
        {lang === "es" ? "Solo destacados / promocionados" : "Featured / promoted only"}
      </label>
      <label className={cb}>
        <input type="checkbox" checked={recent} onChange={(e) => setRecent(e.target.checked)} className="h-4 w-4 rounded" />
        {lang === "es" ? "Últimos 7 días" : "Last 7 days"}
      </label>
      <label className={cb}>
        <input type="checkbox" checked={quickApply} onChange={(e) => setQuickApply(e.target.checked)} className="h-4 w-4 rounded" />
        {lang === "es" ? "Aplicación rápida" : "Quick apply"}
      </label>
      <label className={cb}>
        <input type="checkbox" checked={verifiedBox} onChange={(e) => setVerifiedBox(e.target.checked)} className="h-4 w-4 rounded" />
        {lang === "es" ? "Empleador verificado" : "Verified employer"}
      </label>
      <label className={cb}>
        <input type="checkbox" checked={premiumBox} onChange={(e) => setPremiumBox(e.target.checked)} className="h-4 w-4 rounded" />
        {lang === "es" ? "Negocio premium" : "Premium business"}
      </label>
    </>
  );
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
  const [stateCode, setStateCode] = useState(parsed.state);
  const [zipInput, setZipInput] = useState(parsed.zip);
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
  const [verifiedBox, setVerifiedBox] = useState(parsed.verifiedOnly);
  const [premiumBox, setPremiumBox] = useState(parsed.premiumOnly);
  const [rememberPrefs, setRememberPrefs] = useState(false);

  useEffect(() => {
    setQ(parsed.q);
    setCity(parsed.city);
    setStateCode(parsed.state);
    setZipInput(parsed.zip);
    setCategory(parsed.category);
    setJobType(parsed.jobType);
    setModality(parsed.modality);
    setExperience(parsed.experience);
    setCompanyType(parsed.companyType);
    setRecent(parsed.recentOnly);
    setQuickApply(parsed.quickApplyOnly);
    setFeatured(parsed.featuredOnly);
    setVerifiedBox(parsed.verifiedOnly);
    setPremiumBox(parsed.premiumOnly);
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
    const z = normalizeZip5(zipInput);
    const next: EmpleosResultadosParams = {
      q: q.trim() || undefined,
      city: city.trim() || undefined,
      state: stateCode.trim() || undefined,
      zip: z.length === 5 ? z : undefined,
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
      verified: verifiedBox ? "1" : undefined,
      premium: premiumBox ? "1" : undefined,
      sort: parsed.sort,
    };
    if (rememberPrefs && (city.trim() || stateCode.trim())) {
      saveEmpleosFilterPrefs({ city: city.trim() || undefined, state: stateCode.trim() || undefined });
    }
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

  const emptyRecoveryActions = useMemo(() => {
    if (filtered.length > 0 || !sp) return [] as { label: string; href: string }[];
    const actions: { label: string; href: string }[] = [];
    if (parsed.q) {
      actions.push({ label: t.recoverDropQ, href: buildEmpleosResultadosUrl(lang, empleosParamsFromSearchParams(sp, "q")) });
    }
    if (parsed.zip) {
      actions.push({ label: t.recoverDropZip, href: buildEmpleosResultadosUrl(lang, empleosParamsFromSearchParams(sp, "zip")) });
    }
    if (parsed.city) {
      actions.push({ label: t.recoverDropCity, href: buildEmpleosResultadosUrl(lang, empleosParamsFromSearchParams(sp, "city")) });
    }
    if (parsed.city || parsed.zip) {
      const wider: EmpleosResultadosParams = { ...empleosParamsFromSearchParams(sp, "city") };
      delete wider.zip;
      wider.state = "CA";
      actions.push({ label: t.recoverBroaderCA, href: buildEmpleosResultadosUrl(lang, wider) });
    }
    if (!parsed.recentOnly) {
      actions.push({
        label: t.recoverRecent,
        href: buildEmpleosResultadosUrl(lang, { ...empleosParamsFromSearchParams(sp), recent: "1" }),
      });
    }
    return actions;
  }, [filtered.length, sp, lang, parsed.q, parsed.zip, parsed.city, parsed.recentOnly, t]);

  const exploreAdjacentCategories = useMemo(() => {
    const pool = ["ventas", "salud", "tecnologia", "oficina", "bodega"] as const;
    return pool.filter((slug) => slug !== parsed.category).slice(0, 3);
  }, [parsed.category]);

  const showFeaturedBlock = featuredRows.length > 0 && !parsed.featuredOnly;
  const listMain = parsed.featuredOnly ? filtered : showFeaturedBlock ? standardRows : filtered;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAF7F2] pb-24 text-[#2A2826]">
      <header className="border-b border-[#E8DFD0] bg-[#FFFBF7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[min(100rem,calc(100%-1rem))] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
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
            className="rounded-full bg-gradient-to-r from-[#E8A54B] to-[#D9A23A] px-4 py-2.5 text-xs font-bold text-[#2A2826] shadow-[0_6px_18px_rgba(201,148,46,0.28)] transition hover:brightness-105 active:scale-[0.99] sm:text-sm"
          >
            {lang === "es" ? "Publicar vacante" : "Post a job"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[min(100rem,calc(100%-1rem))] px-4 pt-[calc(6.5rem+env(safe-area-inset-top,0px))] sm:px-6 sm:pt-[calc(7.25rem+env(safe-area-inset-top,0px))] lg:px-10">
        <EmpleosFunctionalPrefsNotice lang={lang} />

        <div className="relative mt-2 border-b border-[#E8DFD0]/80 pb-8">
          <div className="absolute left-0 top-0 h-1 w-24 rounded-full bg-gradient-to-r from-[#E8A54B] via-[#D9A23A] to-[#C9942E]/40 sm:w-32" aria-hidden />
          <div className="flex flex-col gap-5 pt-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5B6F82]">{t.landing}</p>
              <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-[#2A2826] sm:text-4xl">{t.resultsTitle}</h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#4A4744]/95">{t.resultsSubtitle}</p>
            </div>
            <div className="shrink-0 rounded-2xl border border-[#F0E8DC] bg-[#FFFBF7]/90 px-6 py-4 text-right shadow-[0_8px_24px_rgba(42,40,38,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#7A756E]">{lang === "es" ? "Coincidencias" : "Matches"}</p>
              <p className="mt-2 text-2xl font-bold leading-tight tracking-tight text-[#2A2826] sm:text-3xl">{countLine(lang, filtered.length)}</p>
            </div>
          </div>
        </div>

        <form aria-label={t.formAria} onSubmit={submitSearch} className={`${EMPLEOS_RESULTS_FILTER_PANEL} mt-9`}>
          <div className="mb-8">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#5B6F82]">{lang === "es" ? "Palabra clave" : "Keyword"}</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} className={EMPLEOS_FIELD} placeholder={lang === "es" ? "Ej. enfermero, ventas, bodega…" : "e.g. nurse, sales, warehouse…"} />
            </label>
          </div>

          <div className="space-y-6">
            <div className={EMPLEOS_RESULTS_GROUP}>
              <h3 className="mb-4 text-sm font-bold text-[#2A2826]">{t.locationGroup}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="sm:col-span-1">
                  <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Ciudad" : "City"}</span>
                  <input value={city} onChange={(e) => setCity(e.target.value)} className={EMPLEOS_FIELD} autoComplete="address-level2" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Estado" : "State"}</span>
                  <select value={stateCode} onChange={(e) => setStateCode(e.target.value)} className={EMPLEOS_FIELD}>
                    {sampleUsStateSelectOptions.map((o) => (
                      <option key={o.value || "all"} value={o.value}>
                        {lang === "es" ? o.labelEs : o.labelEn}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "CP (ZIP)" : "ZIP"}</span>
                  <input
                    value={zipInput}
                    inputMode="numeric"
                    maxLength={5}
                    onChange={(e) => setZipInput(normalizeZip5(e.target.value))}
                    className={EMPLEOS_FIELD}
                    autoComplete="postal-code"
                    placeholder={lang === "es" ? "5 dígitos" : "5 digits"}
                  />
                </label>
              </div>
              <div className="mt-4 max-w-xl">
                <EmpleosUseLocationButton
                  lang={lang}
                  onFilled={(p) => {
                    setCity(p.city);
                    setStateCode(p.state);
                    setZipInput(p.zip);
                  }}
                />
              </div>
            </div>

            <div className={EMPLEOS_RESULTS_GROUP}>
              <h3 className="mb-4 text-sm font-bold text-[#2A2826]">{t.roleGroup}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="lg:col-span-1">
                  <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Categoría" : "Category"}</span>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={EMPLEOS_FIELD}>
                    {sampleCategorySelectOptions.map((o) => (
                      <option key={o.value || "all"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Tipo de empleo" : "Job type"}</span>
                  <select value={jobType} onChange={(e) => setJobType(e.target.value)} className={EMPLEOS_FIELD}>
                    {sampleJobTypeSelectOptions.map((o) => (
                      <option key={o.value || "any"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Modalidad" : "Modality"}</span>
                  <select value={modality} onChange={(e) => setModality(e.target.value)} className={EMPLEOS_FIELD}>
                    {sampleModalityOptions.map((o) => (
                      <option key={o.value || "all"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className={`${EMPLEOS_RESULTS_GROUP} hidden lg:block`}>
              <h3 className="mb-4 text-sm font-bold text-[#2A2826]">{t.conditionsGroup}</h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label>
                  <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Salario (rango)" : "Salary band"}</span>
                  <select value={salaryBand} onChange={(e) => setSalaryBand(e.target.value)} className={EMPLEOS_FIELD}>
                    {sampleSalaryBandOptions.map((o) => (
                      <option key={o.value || "any"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Experiencia" : "Experience"}</span>
                  <select value={experience} onChange={(e) => setExperience(e.target.value)} className={EMPLEOS_FIELD}>
                    {sampleExperienceOptions.map((o) => (
                      <option key={o.value || "any"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="md:col-span-2 xl:col-span-1">
                  <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Tipo de empresa" : "Company type"}</span>
                  <select value={companyType} onChange={(e) => setCompanyType(e.target.value)} className={EMPLEOS_FIELD}>
                    {sampleCompanyTypeOptions.map((o) => (
                      <option key={o.value || "any"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <details className="group rounded-2xl border border-[#F0E8DC] bg-[#FFFBF7]/90 p-4 lg:hidden">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold text-[#2A2826] [&::-webkit-details-marker]:hidden">
                <span>{t.conditionsGroup}</span>
                <FaChevronDown className="h-4 w-4 shrink-0 text-[#5B6F82] transition group-open:rotate-180" aria-hidden />
              </summary>
              <div className="mt-4 grid gap-4 border-t border-[#F0E8DC] pt-4">
                <label>
                  <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Salario (rango)" : "Salary band"}</span>
                  <select value={salaryBand} onChange={(e) => setSalaryBand(e.target.value)} className={EMPLEOS_FIELD}>
                    {sampleSalaryBandOptions.map((o) => (
                      <option key={o.value || "any"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Experiencia" : "Experience"}</span>
                  <select value={experience} onChange={(e) => setExperience(e.target.value)} className={EMPLEOS_FIELD}>
                    {sampleExperienceOptions.map((o) => (
                      <option key={o.value || "any"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Tipo de empresa" : "Company type"}</span>
                  <select value={companyType} onChange={(e) => setCompanyType(e.target.value)} className={EMPLEOS_FIELD}>
                    {sampleCompanyTypeOptions.map((o) => (
                      <option key={o.value || "any"} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </details>

            <details className="group rounded-2xl border border-[#E8DFD0] bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] lg:hidden">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold text-[#2A2826] [&::-webkit-details-marker]:hidden">
                <span>{t.filtersToggle}</span>
                <FaChevronDown className="h-4 w-4 shrink-0 text-[#5B6F82] transition group-open:rotate-180" aria-hidden />
              </summary>
              <div className="mt-3 flex flex-col gap-3 border-t border-[#F0E8DC] pt-3">
                <EmpleosFilterToggles
                  lang={lang}
                  featured={featured}
                  recent={recent}
                  quickApply={quickApply}
                  verifiedBox={verifiedBox}
                  premiumBox={premiumBox}
                  setFeatured={setFeatured}
                  setRecent={setRecent}
                  setQuickApply={setQuickApply}
                  setVerifiedBox={setVerifiedBox}
                  setPremiumBox={setPremiumBox}
                />
              </div>
            </details>

            <div className="hidden flex-wrap gap-x-6 gap-y-3 rounded-2xl border border-[#F0E8DC] bg-[#FFFBF7]/70 p-4 lg:flex">
              <EmpleosFilterToggles
                lang={lang}
                featured={featured}
                recent={recent}
                quickApply={quickApply}
                verifiedBox={verifiedBox}
                premiumBox={premiumBox}
                setFeatured={setFeatured}
                setRecent={setRecent}
                setQuickApply={setQuickApply}
                setVerifiedBox={setVerifiedBox}
                setPremiumBox={setPremiumBox}
              />
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-[#4A4744]">
              <input type="checkbox" checked={rememberPrefs} onChange={(e) => setRememberPrefs(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded" />
              <span>{t.rememberPrefs}</span>
            </label>

            {parsed.radiusKm ? <p className="text-[11px] leading-relaxed text-[#7A756E]">{t.radiusStaged}</p> : null}
          </div>

          <div className="mt-10 flex flex-col gap-5 border-t border-[#F0E8DC] pt-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch">
              <button type="submit" className={`${EMPLEOS_CTA_PRIMARY} min-h-[48px] min-w-[12rem] px-8 text-[15px]`}>
                {t.search}
              </button>
              <button
                type="button"
                onClick={() => router.push(buildEmpleosResultadosUrl(lang, { sort: parsed.sort }))}
                className={`${EMPLEOS_CTA_SECONDARY} min-h-[48px] min-w-[10rem] px-6`}
              >
                {t.clearAll}
              </button>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5 lg:max-w-sm lg:items-end">
              <label className="flex w-full flex-col gap-2 text-sm font-semibold text-[#2A2826] sm:flex-row sm:items-center sm:gap-3">
                <span className="shrink-0">{t.sortLabel}</span>
                <select value={parsed.sort} onChange={(e) => onSortChange(e.target.value)} className={`${EMPLEOS_FIELD} min-h-[48px] w-full sm:min-w-[14rem]`}>
                  <option value="relevance">{t.sortRelevance}</option>
                  <option value="date_desc">{t.sortDate}</option>
                  <option value="salary_desc">{t.sortSalary}</option>
                </select>
              </label>
              <p className="text-[11px] leading-relaxed text-[#7A756E] lg:text-right">{t.sortHint}</p>
              <button type="button" onClick={() => router.push(buildEmpleosResultadosUrl(lang, { sort: parsed.sort }))} className={`${EMPLEOS_LINK_MUTED} lg:self-end`}>
                {t.clear}
              </button>
            </div>
          </div>
        </form>

        {activeChips.length > 0 ? (
          <div className="mt-8">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#5B6F82]">{t.activeFilters}</p>
              <button
                type="button"
                onClick={() => router.push(buildEmpleosResultadosUrl(lang, { sort: parsed.sort }))}
                className={`${EMPLEOS_LINK_MUTED} self-start text-left sm:self-auto`}
              >
                {t.clearAll}
              </button>
            </div>
            <div className="-mx-1 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
              {activeChips.map((c) => (
                <Link
                  key={c.key}
                  href={c.href}
                  className="inline-flex min-h-10 shrink-0 snap-start items-center gap-1.5 rounded-full border border-[#E8DFD0] bg-white px-3.5 py-2 text-xs font-semibold text-[#2A2826] shadow-[0_4px_14px_rgba(42,40,38,0.05)] transition hover:border-[#D9A23A]/45 hover:shadow-[0_6px_18px_rgba(42,40,38,0.08)] sm:min-h-9"
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
          <div className="mt-14 rounded-[1.5rem] border border-[#E8DFD0] bg-white px-5 py-12 text-center shadow-[0_22px_60px_rgba(42,40,38,0.08)] ring-1 ring-[#D9A23A]/12 sm:px-12 sm:py-16">
            <div className="mx-auto max-w-lg">
              <p className="text-xl font-bold tracking-tight text-[#2A2826] sm:text-2xl">{t.emptyTitle}</p>
              <p className="mx-auto mt-3 text-sm leading-relaxed text-[#5C564E] sm:text-base">{t.emptyHint}</p>
            </div>
            {emptyRecoveryActions.length > 0 ? (
              <div className="mx-auto mt-10 max-w-2xl text-left">
                <p className="mb-3 text-center text-xs font-bold uppercase tracking-wide text-[#5B6F82]">{t.emptyRecoveryTitle}</p>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
                  {emptyRecoveryActions.map((a) => (
                    <Link
                      key={a.label}
                      href={a.href}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#E8DFD0] bg-[#FFFBF7] px-4 text-sm font-semibold text-[#2A2826] shadow-sm transition hover:border-[#D9A23A]/45"
                    >
                      {a.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => router.push(buildEmpleosResultadosUrl(lang, { sort: parsed.sort }))} className={EMPLEOS_CTA_SECONDARY}>
                {t.clearAll}
              </button>
              <Link href={landingHref} className={`${EMPLEOS_LINK_MUTED} text-center`}>
                {t.emptyExplore}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {filtered.length > 0 && filtered.length <= 3 ? (
              <div className="mt-10 rounded-2xl border border-[#E8DFD0] bg-[#FFFBF7]/90 p-5 shadow-[0_12px_36px_rgba(42,40,38,0.06)]">
                <p className="text-sm font-semibold text-[#2A2826]">{t.lowResultsHint}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {exploreAdjacentCategories.map((slug) => {
                    const opt = sampleCategorySelectOptions.find((o) => o.value === slug);
                    const href = buildEmpleosResultadosUrl(lang, { ...empleosParamsFromSearchParams(sp ?? new URLSearchParams()), category: slug, sort: parsed.sort });
                    return (
                      <Link
                        key={slug}
                        href={href}
                        className="inline-flex min-h-10 items-center rounded-full border border-[#E8DFD0] bg-white px-3.5 text-xs font-semibold text-[#2A2826] transition hover:border-[#D9A23A]/45"
                      >
                        {opt?.label ?? slug}
                      </Link>
                    );
                  })}
                </div>
                <p className="mt-3 text-[11px] text-[#7A756E]">{t.exploreMore}</p>
              </div>
            ) : null}

            {showFeaturedBlock ? (
              <section className="mt-12 sm:mt-14" aria-labelledby="empleos-res-featured">
                <div className="relative mb-6">
                  <div className="absolute inset-x-0 top-0 h-1 rounded-full bg-gradient-to-r from-[#D9A23A]/55 via-[#E8A54B]/35 to-transparent" aria-hidden />
                  <h2 id="empleos-res-featured" className="pt-5 text-2xl font-bold tracking-tight text-[#2A2826] sm:text-3xl">
                    {t.featuredBlock}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#5B6F82] sm:text-base">{t.featuredIntro}</p>
                </div>
                <div className="grid grid-cols-1 gap-7 xl:grid-cols-2 xl:gap-8">
                  {featuredRows.map((job) => (
                    <EmpleosJobResultCard key={job.id} job={job} lang={lang} variant="grid" />
                  ))}
                </div>
              </section>
            ) : null}

            {listMain.length > 0 ? (
              <section className="mt-12 sm:mt-14" aria-labelledby="empleos-res-all">
                <div className="mb-6">
                  <h2 id="empleos-res-all" className="text-2xl font-bold tracking-tight text-[#2A2826] sm:text-3xl">
                    {parsed.featuredOnly ? t.featuredBlock : t.allBlock}
                  </h2>
                  {!parsed.featuredOnly ? <p className="mt-2 max-w-3xl text-sm text-[#5B6F82] sm:text-base">{t.listIntro}</p> : null}
                </div>
                <div className="flex flex-col gap-5 sm:gap-6">
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
