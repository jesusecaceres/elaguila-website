"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import {
  LEONIX_LB_DEFAULT_COUNTRY,
  LEONIX_LB_DEFAULT_STATE,
  US_STATE_OPTIONS,
} from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessLocationContract";
import { LEONIX_LB_CITY_PRESETS } from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessCityPresets";
import {
  LX_LB_BTN_PRIMARY,
  LX_LB_BTN_SECONDARY,
  LX_LB_SEARCH_CANVAS,
  LX_LB_SEARCH_CELL,
  LX_LB_SEARCH_INPUT,
} from "@/app/(site)/clasificados/shared/components/LeonixLocalBusinessCompactSearchCanvas";
import { CategoryStandardFiltersDrawerShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardFiltersDrawerShell";

import { normalizePostalCode, parseEmpleosResultsQuery } from "../../lib/empleosResultsQuery";
import { buildEmpleosResultadosUrl } from "../../shared/utils/empleosListaUrl";
import { EmpleosBrowseDrawerFields, type EmpleosDrawerValues } from "../EmpleosBrowseDrawerFields";

type Props = {
  lang: Lang;
};

export function HeroAndSearch({ lang }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const parsed = useMemo(() => parseEmpleosResultsQuery(sp ?? new URLSearchParams()), [sp]);

  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState(LEONIX_LB_DEFAULT_STATE);
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState(LEONIX_LB_DEFAULT_COUNTRY);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [drawer, setDrawer] = useState<EmpleosDrawerValues>({
    stateCode: LEONIX_LB_DEFAULT_STATE,
    category: "",
    jobType: "",
    modality: "",
    salaryBand: "",
    experience: "",
    companyType: "",
    recent: false,
    featured: false,
    verifiedBox: false,
    bilingual: false,
    quickApply: false,
  });

  useEffect(() => {
    setQ(parsed.q);
    setCity(parsed.city);
    setState(parsed.state || LEONIX_LB_DEFAULT_STATE);
    setZip(parsed.zip);
    setCountry(parsed.country || LEONIX_LB_DEFAULT_COUNTRY);
    setDrawer((prev) => ({
      ...prev,
      stateCode: parsed.state || LEONIX_LB_DEFAULT_STATE,
      category: parsed.category,
      jobType: parsed.jobType,
      modality: parsed.modality,
      experience: parsed.experience,
      companyType: parsed.companyType,
      recent: parsed.recentOnly,
      featured: parsed.featuredOnly,
      verifiedBox: parsed.verifiedOnly,
      bilingual: parsed.bilingualOnly,
      quickApply: parsed.quickApplyOnly,
    }));
  }, [parsed]);

  const buildParams = useCallback(() => {
    const z = normalizePostalCode(zip);
    return {
      q: q.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      zip: z || undefined,
      country: country.trim() || undefined,
      category: drawer.category || undefined,
      jobType: drawer.jobType || undefined,
      modality: drawer.modality || undefined,
      experience: drawer.experience || undefined,
      companyType: drawer.companyType || undefined,
      recent: drawer.recent ? "1" : undefined,
      featured: drawer.featured ? "1" : undefined,
      verified: drawer.verifiedBox ? "1" : undefined,
      bilingual: drawer.bilingual ? "1" : undefined,
      quickApply: drawer.quickApply ? "1" : undefined,
    };
  }, [q, city, state, zip, country, drawer]);

  const submit = useCallback(() => {
    router.push(buildEmpleosResultadosUrl(lang, buildParams()));
  }, [router, lang, buildParams]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const filtersLabel = lang === "es" ? "Filtros" : "Filters";
  const searchLabel = lang === "es" ? "Buscar" : "Search";
  const viewAllLabel = lang === "es" ? "Ver todos los anuncios" : "View all listings";
  const viewAllHref = buildEmpleosResultadosUrl(lang, {});

  const onDrawerChange = <K extends keyof EmpleosDrawerValues>(key: K, value: EmpleosDrawerValues[K]) => {
    setDrawer((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-full min-w-0">
      <form onSubmit={onSubmit} className={LX_LB_SEARCH_CANVAS} role="search">
        <div className="flex flex-col border-b border-[#D6C7AD]/80 sm:grid sm:grid-cols-12 sm:items-stretch">
          <label className={`${LX_LB_SEARCH_CELL} sm:col-span-4`}>
            <span className="shrink-0 pl-3 text-[#556B3E]" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" strokeLinecap="round" />
              </svg>
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === "es" ? "Palabra clave, puesto o empresa…" : "Keyword, job, or company…"}
              aria-label={lang === "es" ? "Palabra clave" : "Keyword"}
              className={`${LX_LB_SEARCH_INPUT} px-2`}
              autoComplete="off"
            />
          </label>
          <label className={`${LX_LB_SEARCH_CELL} sm:col-span-2`}>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              list="leonix-empleos-city-presets"
              placeholder={lang === "es" ? "Ciudad" : "City"}
              aria-label={lang === "es" ? "Ciudad" : "City"}
              className={LX_LB_SEARCH_INPUT}
              autoComplete="address-level2"
            />
            <datalist id="leonix-empleos-city-presets">
              {LEONIX_LB_CITY_PRESETS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className={`${LX_LB_SEARCH_CELL} sm:col-span-2`}>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
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
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="ZIP"
              aria-label={lang === "es" ? "Código postal" : "ZIP code"}
              className={LX_LB_SEARCH_INPUT}
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={10}
            />
          </label>
          <div className="hidden p-1.5 sm:col-span-2 sm:block">
            <button type="submit" className={`${LX_LB_BTN_PRIMARY} w-full`}>
              {searchLabel}
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
            <button type="button" onClick={() => setFiltersOpen(true)} className={`${LX_LB_BTN_SECONDARY} min-w-[5rem]`}>
              {filtersLabel}
            </button>
          </div>
          <Link
            href={viewAllHref}
            className={`${LX_LB_BTN_SECONDARY} order-4 inline-flex w-full items-center justify-center sm:order-none sm:col-span-3 sm:w-auto`}
          >
            {viewAllLabel}
          </Link>
          <button type="submit" className={`${LX_LB_BTN_PRIMARY} order-3 w-full sm:hidden`}>
            {searchLabel}
          </button>
        </div>
      </form>

      <CategoryStandardFiltersDrawerShell
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={() => {
          setFiltersOpen(false);
          submit();
        }}
        onClear={() => {
          setFiltersOpen(false);
          router.push(viewAllHref);
        }}
        lang={lang}
      >
        <EmpleosBrowseDrawerFields lang={lang} values={drawer} onChange={onDrawerChange} />
      </CategoryStandardFiltersDrawerShell>
    </div>
  );
}
