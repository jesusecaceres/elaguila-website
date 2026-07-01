"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import {
  sampleCategorySelectOptions,
  sampleJobTypeSelectOptions,
} from "../../data/empleosLandingSampleData";
import { EMPLEOS_CTA_PRIMARY, EMPLEOS_CTA_SECONDARY, EMPLEOS_FIELD } from "../../lib/empleosPremiumUi";
import { normalizePostalCode, parseEmpleosResultsQuery } from "../../lib/empleosResultsQuery";
import { buildEmpleosResultadosUrl } from "../../shared/utils/empleosListaUrl";

const SEARCH_CANVAS =
  "overflow-hidden rounded-xl border border-[#D6C7AD]/90 bg-[#FFFDF7] shadow-[0_6px_22px_-16px_rgba(31,36,28,0.16)]";

type Props = {
  lang: Lang;
};

export function HeroAndSearch({ lang }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const parsed = useMemo(() => parseEmpleosResultsQuery(sp ?? new URLSearchParams()), [sp]);

  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [category, setCategory] = useState("");
  const [jobType, setJobType] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setQ(parsed.q);
    setCity(parsed.city);
    setState(parsed.state);
    setZip(parsed.zip);
    setCategory(parsed.category);
    setJobType(parsed.jobType);
  }, [parsed]);

  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  const submit = useCallback(() => {
    const z = normalizePostalCode(zip);
    router.push(
      buildEmpleosResultadosUrl(lang, {
        q: q.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zip: z || undefined,
        category: category || undefined,
        jobType: jobType || undefined,
      }),
    );
  }, [router, lang, q, city, state, zip, category, jobType]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const filtersLabel = lang === "es" ? "Filtros" : "Filters";
  const searchLabel = lang === "es" ? "Buscar" : "Search";
  const fieldClass = `${EMPLEOS_FIELD} min-h-[2.625rem]`;

  return (
    <div className="w-full min-w-0 space-y-2">
      <form onSubmit={onSubmit} className={SEARCH_CANVAS} role="search">
        <div className="flex flex-col sm:grid sm:grid-cols-12 sm:items-stretch">
          <label className="flex min-h-[2.625rem] min-w-0 items-center border-b border-[#D6C7AD]/80 sm:col-span-5 sm:border-b-0 sm:border-r">
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
              className="min-h-[2.625rem] min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[#3D3428]/45"
              autoComplete="off"
            />
          </label>
          <label className="flex min-h-[2.625rem] min-w-0 border-b border-[#D6C7AD]/80 sm:col-span-2 sm:border-b-0 sm:border-r">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={lang === "es" ? "Ciudad" : "City"}
              aria-label={lang === "es" ? "Ciudad" : "City"}
              className="min-h-[2.625rem] w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#3D3428]/45"
              autoComplete="address-level2"
            />
          </label>
          <label className="hidden min-h-[2.625rem] min-w-0 border-b border-[#D6C7AD]/80 sm:flex sm:col-span-1 sm:border-b-0 sm:border-r">
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder={lang === "es" ? "Estado" : "State"}
              aria-label={lang === "es" ? "Estado" : "State"}
              className="min-h-[2.625rem] w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#3D3428]/45"
              autoComplete="address-level1"
            />
          </label>
          <label className="flex min-h-[2.625rem] min-w-0 border-b border-[#D6C7AD]/80 sm:col-span-2 sm:border-b-0 sm:border-r">
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder={lang === "es" ? "ZIP" : "ZIP"}
              aria-label={lang === "es" ? "Código postal" : "ZIP code"}
              className="min-h-[2.625rem] w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#3D3428]/45"
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={10}
            />
          </label>
          <div className="flex gap-1.5 p-1.5 sm:col-span-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className={`${EMPLEOS_CTA_SECONDARY} flex-1`}
            >
              {filtersLabel}
            </button>
            <button type="submit" className={`${EMPLEOS_CTA_PRIMARY} flex-[1.2]`}>
              {searchLabel}
            </button>
          </div>
        </div>
      </form>

      {filtersOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[70] bg-black/40"
            aria-label={lang === "es" ? "Cerrar" : "Close"}
            onClick={() => setFiltersOpen(false)}
          />
          <div
            className={
              "fixed z-[71] flex flex-col overflow-hidden border border-[#D6C7AD]/90 bg-[#FFFDF7] shadow-xl " +
              "inset-x-0 bottom-0 top-[12vh] rounded-t-2xl max-lg:max-h-[88vh] " +
              "lg:inset-y-0 lg:left-auto lg:right-0 lg:top-0 lg:w-full lg:max-w-[400px] lg:rounded-none lg:rounded-l-2xl"
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="empleos-landing-filters-title"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#D6C7AD]/60 px-4 py-3">
              <h2 id="empleos-landing-filters-title" className="font-serif text-base font-bold text-[#2A4536]">
                {filtersLabel}
              </h2>
              <button
                type="button"
                className="rounded-lg border border-[#C9A84A]/45 px-3 py-1 text-xs font-semibold text-[#3D3428] hover:bg-[#FBF7EF]"
                onClick={() => setFiltersOpen(false)}
              >
                {lang === "es" ? "Cerrar" : "Close"}
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <label className="block text-xs font-semibold text-[#3D3428]">
                {lang === "es" ? "Estado" : "State"}
                <input value={state} onChange={(e) => setState(e.target.value)} className={`${fieldClass} mt-1`} />
              </label>
              <label className="mt-3 block text-xs font-semibold text-[#3D3428]">
                {lang === "es" ? "Categoría" : "Category"}
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${fieldClass} mt-1`}>
                  {sampleCategorySelectOptions.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 block text-xs font-semibold text-[#3D3428]">
                {lang === "es" ? "Tipo de empleo" : "Employment type"}
                <select value={jobType} onChange={(e) => setJobType(e.target.value)} className={`${fieldClass} mt-1`}>
                  {sampleJobTypeSelectOptions.map((o) => (
                    <option key={o.value || "any"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-2 border-t border-[#D6C7AD]/60 bg-[#FFFDF7] p-4">
              <Link
                href={buildEmpleosResultadosUrl(lang, {})}
                onClick={() => setFiltersOpen(false)}
                className={`${EMPLEOS_CTA_SECONDARY} flex-1`}
              >
                {lang === "es" ? "Limpiar" : "Clear"}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setFiltersOpen(false);
                  submit();
                }}
                className={`${EMPLEOS_CTA_PRIMARY} flex-[1.2]`}
              >
                {lang === "es" ? "Aplicar" : "Apply"}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
