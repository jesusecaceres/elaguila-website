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
  sampleUsStateSelectOptions,
} from "../data/empleosLandingSampleData";
import type { EmpleosJobRecord } from "../data/empleosJobTypes";
import { mergeEmpleosSeedWithLiveJobs } from "../lib/staged/getEmpleosMergedBrowse";
import { saveEmpleosFilterPrefs } from "../lib/empleosFunctionalStorage";
import {
  EMPLEOS_SAMPLE_NOW_MS,
  type EmpleosSortKey,
  empleosParamsFromSearchParams,
  filterEmpleosJobs,
  normalizePostalCode,
  parseEmpleosResultsQuery,
  sortEmpleosJobs,
} from "../lib/empleosResultsQuery";
import { buildEmpleosResultadosUrl, type EmpleosResultadosParams } from "../shared/utils/empleosListaUrl";
import {
  EMPLEOS_CTA_SECONDARY,
  EMPLEOS_LINK_MUTED,
} from "../lib/empleosPremiumUi";
import { CategoryStandardResultsPageShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsPageShell";
import { CategoryStandardResultsHeader } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsHeader";
import { CategoryStandardFiltersDrawerShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardFiltersDrawerShell";
import {
  CAT_STD_REFINE_EYEBROW,
  CAT_STD_RESULTS_REFINE_PANEL,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardStyles";
import { categoryStandardTitle } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import {
  LEONIX_LB_DEFAULT_COUNTRY,
  LEONIX_LB_DEFAULT_STATE,
  US_STATE_OPTIONS,
} from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessLocationContract";
import {
  LX_LB_BTN_PRIMARY,
  LX_LB_BTN_SECONDARY,
  LX_LB_SEARCH_CANVAS,
  LX_LB_SEARCH_CELL,
  LX_LB_SEARCH_INPUT,
} from "@/app/(site)/clasificados/shared/components/LeonixLocalBusinessCompactSearchCanvas";
import { EmpleosJobResultCard } from "./EmpleosJobResultCard";
import { EmpleosBrowseDrawerFields, type EmpleosDrawerValues } from "./EmpleosBrowseDrawerFields";

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
    emptyTitle: "No encontramos vacantes con esta combinación.",
    emptyHint: "Amplía ciudad, cambia filtros o restablece la búsqueda.",
    emptySupport: "",
    emptyExplore: "Volver a Empleos",
    resetShort: "Restablecer",
    viewAll: "Ver todos",
    keywordHint: "Escribe y pulsa Buscar, o Enter, para aplicar la palabra clave.",
    fieldBlurHint: "Ciudad y ZIP se actualizan al salir del campo.",
    listIntroRecent: "Solo publicaciones de los últimos 7 días, en orden cronológico.",
    featuredBlock: "Destacados y promocionados",
    allBlock: "Todas las vacantes",
    formAria: "Filtros de búsqueda de empleos",
    rememberPrefs: "Recordar ciudad y estado en este dispositivo",
    filtersToggle: "Filtros",
    clearAll: "Restablecer todo",
    locationGroup: "Ubicación",
    roleGroup: "Puesto y categoría",
    conditionsGroup: "Condiciones",
    featuredIntro: "Mayor visibilidad dentro de tu búsqueda — el listado completo sigue debajo.",
    listIntro: "Coincidencias con tus filtros; cambia el orden sin perder criterios.",
    emptyRecoveryTitle: "Recupera resultados rápido",
    recoverDropQ: "Quitar palabra clave",
    recoverDropZip: "Quitar código postal",
    recoverDropCity: "Quitar ciudad",
    recoverBroaderCA: "Ampliar ubicación",
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
    emptyTitle: "No openings match this combination.",
    emptyHint: "Broaden city, change filters, or reset your search.",
    emptySupport: "",
    emptyExplore: "Back to Jobs home",
    resetShort: "Reset",
    viewAll: "View all",
    keywordHint: "Type and press Search, or Enter, to apply your keyword.",
    fieldBlurHint: "City and postal code update when you leave the field.",
    listIntroRecent: "Last 7 days only, in chronological order.",
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
    emptyRecoveryTitle: "Get results back quickly",
    recoverDropQ: "Remove keyword",
    recoverDropZip: "Remove postal code",
    recoverDropCity: "Remove city",
    recoverBroaderCA: "Broaden location",
    recoverRecent: "Last 7 days (keep other filters)",
    exploreMore: "Explore more",
    lowResultsHint: "Few matches — try a nearby category:",
  },
} as const;

/** Same window as `filterEmpleosJobs` recent filter â€” for fair â€œRecienteâ€ ribbon on cards. */
const RESULTS_RECENT_MS = 7 * 24 * 3600 * 1000;

function isRecentPosting(job: EmpleosJobRecord, nowMs: number): boolean {
  return nowMs - new Date(job.publishedAt).getTime() <= RESULTS_RECENT_MS;
}

const CHIP_KEYS: (keyof EmpleosResultadosParams)[] = [
  "q",
  "city",
  "state",
  "zip",
  "country",
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
  "lane",
  "industry",
  "bilingual",
];

type EmpleosFormFields = {
  q: string;
  city: string;
  stateCode: string;
  zipInput: string;
  country: string;
  category: string;
  jobType: string;
  modality: string;
  salaryBand: string;
  experience: string;
  companyType: string;
  lane: string;
  industry: string;
  bilingual: boolean;
  recent: boolean;
  quickApply: boolean;
  featured: boolean;
  verifiedBox: boolean;
  premiumBox: boolean;
};

function toEmpleosParams(sortKey: EmpleosSortKey, f: EmpleosFormFields): EmpleosResultadosParams {
  const band = sampleSalaryBandOptions.find((b) => b.value === f.salaryBand);
  const z = normalizePostalCode(f.zipInput);
  return {
    q: f.q.trim() || undefined,
    city: f.city.trim() || undefined,
    state: f.stateCode.trim() || undefined,
    zip: z || undefined,
    country: f.country.trim() || undefined,
    category: f.category || undefined,
    jobType: f.jobType || undefined,
    modality: f.modality || undefined,
    salaryMin: band?.min || undefined,
    salaryMax: band?.max || undefined,
    experience: f.experience || undefined,
    companyType: f.companyType || undefined,
    recent: f.recent ? "1" : undefined,
    quickApply: f.quickApply ? "1" : undefined,
    featured: f.featured ? "1" : undefined,
    verified: f.verifiedBox ? "1" : undefined,
    premium: f.premiumBox ? "1" : undefined,
    lane: f.lane.trim() || undefined,
    industry: f.industry.trim() || undefined,
    bilingual: f.bilingual ? "1" : undefined,
    sort: sortKey,
  };
}

function sortChipLabel(lang: Lang, sort: EmpleosSortKey): string {
  if (sort === "date_desc") return lang === "es" ? "Orden: más recientes" : "Sort: newest first";
  if (sort === "salary_desc") return lang === "es" ? "Orden: salario mayor" : "Sort: highest salary";
  return lang === "es" ? "Orden: relevancia" : "Sort: relevance";
}

function chipLabel(lang: Lang, key: string, val: string): string {
  if (key === "featured" && val === "1") return lang === "es" ? "Solo destacados" : "Featured only";
  if (key === "recent" && val === "1") return lang === "es" ? "Publicados recientes" : "Recently posted";
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
  if (key === "zip") return lang === "es" ? `Código postal: ${val}` : `Postal code: ${val}`;
  if (key === "country") return lang === "es" ? `País: ${val}` : `Country: ${val}`;
  if (key === "verified" && val === "1") return lang === "es" ? "Solo verificados" : "Verified only";
  if (key === "industry" && val) return lang === "es" ? `Industria: ${val}` : `Industry: ${val}`;
  return `${key}: ${val}`;
}

type EmpleosResultsViewProps = {
  /** Server-fed merged catalog (seed + live). When empty, client falls back to seed-only merge. */
  initialJobs?: EmpleosJobRecord[];
  /** When true, empty `initialJobs` must not re-hydrate marketing seed on the client. */
  omitMarketingSeed?: boolean;
  /** Server clock for â€œrecentâ€ filter and ribbons (live listings). */
  serverNowMs?: number;
};

export function EmpleosResultsView({ initialJobs = [], omitMarketingSeed = false, serverNowMs }: EmpleosResultsViewProps) {
  const clock = serverNowMs ?? EMPLEOS_SAMPLE_NOW_MS;
  const router = useRouter();
  const sp = useSearchParams();
  // Next may reuse the same `ReadonlyURLSearchParams` instance across navigations while mutating
  // its internal snapshot. Depending on `[sp]` alone can freeze `parsed` at the first render.
  const querySignature = sp?.toString() ?? "";
  const urlSp = useMemo(() => new URLSearchParams(querySignature), [querySignature]);
  const lang = useMemo<Lang>(() => (urlSp.get("lang") === "en" ? "en" : "es"), [urlSp]);
  const t = COPY[lang];

  const [runtimeJobs, setRuntimeJobs] = useState<EmpleosJobRecord[] | null>(null);

  const parsed = useMemo(() => parseEmpleosResultsQuery(urlSp), [urlSp]);

  useEffect(() => {
    // When the server sends an empty catalog, always hydrate from the public listings API so results stay
    // DB-backed (omitMarketingSeed only controls seed merge â€” it must not block the fetch).
    if (initialJobs.length > 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/clasificados/empleos/listings", { method: "GET" });
        const json = (await res.json()) as { ok?: boolean; jobs?: EmpleosJobRecord[] };
        if (!cancelled && res.ok && json.ok && Array.isArray(json.jobs)) {
          setRuntimeJobs(json.jobs);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialJobs.length]);

  const mergedCatalog = useMemo(() => {
    const byId = new Map<string, EmpleosJobRecord>();
    for (const j of initialJobs) byId.set(j.id, j);
    if (runtimeJobs != null) {
      for (const j of runtimeJobs) byId.set(j.id, j);
    }
    const liveUnion = Array.from(byId.values());
    return mergeEmpleosSeedWithLiveJobs(liveUnion, { omitSeed: omitMarketingSeed });
  }, [initialJobs, omitMarketingSeed, runtimeJobs]);

  const filtered = useMemo(() => {
    const f = filterEmpleosJobs(mergedCatalog, parsed, clock);
    return sortEmpleosJobs(f, parsed.sort);
  }, [mergedCatalog, parsed, clock]);

  const [q, setQ] = useState(parsed.q);
  const [city, setCity] = useState(parsed.city);
  const [stateCode, setStateCode] = useState(parsed.state || LEONIX_LB_DEFAULT_STATE);
  const [zipInput, setZipInput] = useState(parsed.zip);
  const [country, setCountry] = useState(parsed.country || LEONIX_LB_DEFAULT_COUNTRY);
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
  const [lane, setLane] = useState(parsed.lane);
  const [industry, setIndustry] = useState(parsed.industry);
  const [bilingualBox, setBilingualBox] = useState(parsed.bilingualOnly);
  const [rememberPrefs, setRememberPrefs] = useState(false);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

  useEffect(() => {
    setQ(parsed.q);
    setCity(parsed.city);
    setStateCode(parsed.state || LEONIX_LB_DEFAULT_STATE);
    setZipInput(parsed.zip);
    setCountry(parsed.country || LEONIX_LB_DEFAULT_COUNTRY);
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
    setLane(parsed.lane);
    setIndustry(parsed.industry);
    setBilingualBox(parsed.bilingualOnly);
    const smin = parsed.salaryMin;
    const smax = parsed.salaryMax;
    const hit = sampleSalaryBandOptions.find((b) => b.min === smin && (b.max === smax || (!b.max && !smax)));
    setSalaryBand(hit?.value ?? "");
  }, [parsed]);

  const fieldSnapshot = (): EmpleosFormFields => ({
    q,
    city,
    stateCode,
    zipInput,
    country,
    category,
    jobType,
    modality,
    salaryBand,
    experience,
    companyType,
    recent,
    quickApply,
    featured,
    verifiedBox,
    premiumBox,
    lane,
    industry,
    bilingual: bilingualBox,
  });

  const pushFromFields = (patch: Partial<EmpleosFormFields>) => {
    const next = { ...fieldSnapshot(), ...patch };
    router.push(buildEmpleosResultadosUrl(lang, toEmpleosParams(parsed.sort, next)));
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = fieldSnapshot();
    const params = toEmpleosParams(parsed.sort, next);
    if (rememberPrefs && (next.city.trim() || next.stateCode.trim())) {
      saveEmpleosFilterPrefs({ city: next.city.trim() || undefined, state: next.stateCode.trim() || undefined });
    }
    router.push(buildEmpleosResultadosUrl(lang, params));
  };

  const onSortChange = (sort: string) => {
    const base = empleosParamsFromSearchParams(urlSp);
    const sk = (sort || "relevance") as EmpleosSortKey;
    router.push(buildEmpleosResultadosUrl(lang, { ...base, sort: sk }));
  };

  const onCityZipBlur = () => {
    const z = normalizePostalCode(zipInput);
    const ct = city.trim();
    if (ct === parsed.city && z === parsed.zip) return;
    pushFromFields({});
  };

  const landingHref = appendLangToPath("/clasificados/empleos", lang);
  const publishHref = appendLangToPath("/clasificados/publicar/empleos", lang);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; href: string }[] = [];
    CHIP_KEYS.forEach((key) => {
      const val = urlSp.get(key as string);
      if (!val) return;
      const href = buildEmpleosResultadosUrl(lang, empleosParamsFromSearchParams(urlSp, key as string));
      chips.push({ key: key as string, label: chipLabel(lang, key as string, val), href });
    });
    if (parsed.sort !== "relevance") {
      chips.push({
        key: "sort",
        label: sortChipLabel(lang, parsed.sort),
        href: buildEmpleosResultadosUrl(lang, empleosParamsFromSearchParams(urlSp, "sort")),
      });
    }
    return chips;
  }, [urlSp, lang, parsed.sort]);

  const emptyRecoveryActions = useMemo(() => {
    if (filtered.length > 0) return [] as { label: string; href: string }[];
    const actions: { label: string; href: string }[] = [];
    if (parsed.q) {
      actions.push({ label: t.recoverDropQ, href: buildEmpleosResultadosUrl(lang, empleosParamsFromSearchParams(urlSp, "q")) });
    }
    if (parsed.zip) {
      actions.push({ label: t.recoverDropZip, href: buildEmpleosResultadosUrl(lang, empleosParamsFromSearchParams(urlSp, "zip")) });
    }
    if (parsed.city) {
      actions.push({ label: t.recoverDropCity, href: buildEmpleosResultadosUrl(lang, empleosParamsFromSearchParams(urlSp, "city")) });
    }
    if (parsed.city || parsed.zip) {
      const wider: EmpleosResultadosParams = { ...empleosParamsFromSearchParams(urlSp, "city") };
      delete wider.zip;
      actions.push({ label: t.recoverBroaderCA, href: buildEmpleosResultadosUrl(lang, wider) });
    }
    if (!parsed.recentOnly) {
      actions.push({
        label: t.recoverRecent,
        href: buildEmpleosResultadosUrl(lang, { ...empleosParamsFromSearchParams(urlSp), recent: "1" }),
      });
    }
    return actions;
  }, [filtered.length, urlSp, lang, parsed.q, parsed.zip, parsed.city, parsed.recentOnly, t]);

  const clearResultsHref = buildEmpleosResultadosUrl(lang, {});

  return (
    <CategoryStandardResultsPageShell>
      <div className="pb-24 text-[#2A2826]">
        <div className="mx-auto max-w-[min(100rem,calc(100%-1rem))] px-4 pt-4 sm:px-6 lg:px-10">
          <CategoryStandardResultsHeader
            lang={lang}
            title={categoryStandardTitle("empleos", lang)}
            subtitle={t.resultsSubtitle}
            backHref={landingHref}
            backLabel={lang === "es" ? "Empleos" : "Jobs"}
            publishHref={publishHref}
            publishLabel={lang === "es" ? "Publicar vacante" : "Post a job"}
            clearHref={activeChips.length > 0 ? clearResultsHref : undefined}
            resultCount={filtered.length}
          />
        </div>

      <main className="mx-auto max-w-[1080px] px-3.5 sm:px-4 lg:px-5">
        <section
          className={CAT_STD_RESULTS_REFINE_PANEL}
          aria-label={lang === "es" ? "Afina tu búsqueda" : "Refine your search"}
        >
          <p className={CAT_STD_REFINE_EYEBROW}>{lang === "es" ? "Afina tu búsqueda" : "Refine your search"}</p>
          <form aria-label={t.formAria} onSubmit={submitSearch} className={`${LX_LB_SEARCH_CANVAS} mt-2`}>
          <div className="flex flex-col border-b border-[#D6C7AD]/80 sm:grid sm:grid-cols-12 sm:items-stretch">
            <label className={`${LX_LB_SEARCH_CELL} sm:col-span-4`}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={lang === "es" ? "Palabra clave, puesto o empresa…" : "Keyword, job, or company…"}
                aria-label={lang === "es" ? "Palabra clave" : "Keyword"}
                className={`${LX_LB_SEARCH_INPUT} px-3`}
              />
            </label>
            <label className={`${LX_LB_SEARCH_CELL} sm:col-span-2`}>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={onCityZipBlur}
                placeholder={lang === "es" ? "Ciudad" : "City"}
                aria-label={lang === "es" ? "Ciudad" : "City"}
                className={LX_LB_SEARCH_INPUT}
                autoComplete="address-level2"
              />
            </label>
            <label className={`${LX_LB_SEARCH_CELL} sm:col-span-2`}>
              <select
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                aria-label={lang === "es" ? "Estado" : "State"}
                className={`${LX_LB_SEARCH_INPUT} appearance-none`}
              >
                {US_STATE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.code}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${LX_LB_SEARCH_CELL} sm:col-span-2`}>
              <input
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                onBlur={onCityZipBlur}
                placeholder="ZIP"
                aria-label={lang === "es" ? "Código postal" : "ZIP code"}
                className={LX_LB_SEARCH_INPUT}
                autoComplete="postal-code"
                inputMode="numeric"
              />
            </label>
            <div className="hidden p-1.5 sm:col-span-2 sm:block">
              <button type="submit" className={`${LX_LB_BTN_PRIMARY} w-full`}>
                {t.search}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 p-1.5 sm:grid sm:grid-cols-12 sm:items-center">
            <label className={`${LX_LB_SEARCH_CELL} order-1 border-b-0 sm:order-none sm:col-span-3 sm:border-r-0`}>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder={lang === "es" ? "País" : "Country"}
                aria-label={lang === "es" ? "País" : "Country"}
                className={LX_LB_SEARCH_INPUT}
                autoComplete="country-name"
              />
            </label>
            <div className="order-2 flex flex-wrap items-center gap-1.5 sm:order-none sm:col-span-4">
              <button type="button" onClick={() => setFiltersDrawerOpen(true)} className={`${LX_LB_BTN_SECONDARY} min-w-[5rem]`}>
                {lang === "es" ? "Filtros" : "Filters"}
              </button>
            </div>
            <Link
              href={clearResultsHref}
              className={`${LX_LB_BTN_SECONDARY} order-4 inline-flex w-full items-center justify-center sm:order-none sm:col-span-3 sm:w-auto`}
            >
              {t.viewAll}
            </Link>
            <button type="submit" className={`${LX_LB_BTN_PRIMARY} order-3 w-full sm:hidden`}>
              {t.search}
            </button>
          </div>
        </form>
        </section>

        <div
          className="mt-3 flex flex-wrap items-center gap-2"
          role="group"
          aria-label={lang === "es" ? "Ordenar resultados" : "Sort results"}
        >
          <label className="inline-flex min-w-0 items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#7A7164]">{t.sortLabel}</span>
            <select
              value={parsed.sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="min-h-[2.625rem] rounded-lg border border-[#C9A84A]/45 bg-[#FFFDF7] px-3 text-xs font-semibold text-[#3D3428]"
            >
              <option value="relevance">{t.sortRelevance}</option>
              <option value="date_desc">{t.sortDate}</option>
              <option value="salary_desc">{t.sortSalary}</option>
            </select>
          </label>
        </div>

        <CategoryStandardFiltersDrawerShell
          open={filtersDrawerOpen}
          onClose={() => setFiltersDrawerOpen(false)}
          onApply={() => {
            setFiltersDrawerOpen(false);
            pushFromFields({
              stateCode,
              category,
              jobType,
              modality,
              salaryBand,
              experience,
              companyType,
              recent,
              featured,
              verifiedBox,
              bilingual: bilingualBox,
              quickApply,
            });
          }}
          onClear={() => {
            setFiltersDrawerOpen(false);
            router.push(buildEmpleosResultadosUrl(lang, { sort: parsed.sort }));
          }}
          lang={lang}
        >
          <EmpleosBrowseDrawerFields
            lang={lang}
            values={{
              stateCode,
              category,
              jobType,
              modality,
              salaryBand,
              experience,
              companyType,
              recent,
              featured,
              verifiedBox,
              bilingual: bilingualBox,
              quickApply,
            }}
            onChange={(key, value) => {
              if (key === "stateCode") setStateCode(String(value));
              else if (key === "category") setCategory(String(value));
              else if (key === "jobType") setJobType(String(value));
              else if (key === "modality") setModality(String(value));
              else if (key === "salaryBand") setSalaryBand(String(value));
              else if (key === "experience") setExperience(String(value));
              else if (key === "companyType") setCompanyType(String(value));
              else if (key === "recent") setRecent(Boolean(value));
              else if (key === "featured") setFeatured(Boolean(value));
              else if (key === "verifiedBox") setVerifiedBox(Boolean(value));
              else if (key === "bilingual") setBilingualBox(Boolean(value));
              else if (key === "quickApply") setQuickApply(Boolean(value));
            }}
          />
        </CategoryStandardFiltersDrawerShell>

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
                  className="inline-flex min-h-[30px] shrink-0 snap-start items-center gap-1.5 rounded-md border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-semibold text-[#2A2826] shadow-[0_4px_14px_rgba(42,40,38,0.05)] transition hover:border-[#D9A23A]/45 hover:shadow-[0_6px_18px_rgba(42,40,38,0.08)]"
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
          <div className="mt-6 rounded-xl border border-[#D6C7AD]/80 bg-[#FFFDF7] px-4 py-6 text-center sm:px-6 sm:py-7">
            <p className="text-base font-bold text-[#2A4536] sm:text-lg">{t.emptyTitle}</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#5C5346]">{t.emptyHint}</p>
            {emptyRecoveryActions.length > 0 ? (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {emptyRecoveryActions.slice(0, 3).map((a) => (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="inline-flex min-h-10 items-center rounded-lg border border-[#C9A84A]/45 bg-white px-3 text-xs font-semibold text-[#3D3428] hover:bg-[#FBF7EF]"
                  >
                    {a.label}
                  </Link>
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => router.push(buildEmpleosResultadosUrl(lang, { sort: parsed.sort }))}
                className={EMPLEOS_CTA_SECONDARY}
              >
                {t.resetShort}
              </button>
            </div>
          </div>
        ) : (
          <>
            {filtered.length > 0 ? (
              <section className="mt-8 sm:mt-10" aria-labelledby="empleos-res-all">
                <div className="mb-4">
                  <h2 id="empleos-res-all" className="text-lg font-bold tracking-tight text-[#2A2826] sm:text-xl">
                    {parsed.featuredOnly ? t.featuredBlock : t.allBlock}
                  </h2>
                  {!parsed.featuredOnly ? (
                    <p className="mt-1 max-w-3xl text-sm text-[#5B6F82]">
                      {parsed.recentOnly ? t.listIntroRecent : t.listIntro}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-5 sm:gap-6">
                  {filtered.map((job) => (
                    <EmpleosJobResultCard
                      key={job.id}
                      job={job}
                      lang={lang}
                      variant="list"
                      showRecentRibbon={job.listingTier === "standard" && isRecentPosting(job, clock)}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>
      </div>
    </CategoryStandardResultsPageShell>
  );
}
