"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";
import { FaMapMarkerAlt, FaSearch } from "react-icons/fa";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import {
  sampleCategorySelectOptions,
  sampleJobTypeSelectOptions,
  samplePopularSearches,
  sampleUsStateSelectOptions,
} from "../../data/empleosLandingSampleData";
import { EmpleosUseLocationButton } from "../EmpleosUseLocationButton";
import { EMPLEOS_CTA_PRIMARY, EMPLEOS_FIELD } from "../../lib/empleosPremiumUi";
import { normalizeZip5 } from "../../lib/empleosResultsQuery";
import { buildEmpleosResultadosUrl } from "../../shared/utils/empleosListaUrl";

/** Wide workplace photo — hero atmosphere (distinct from En Venta property imagery). */
const HERO_CATEGORY_BG =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80";
/** Secondary panel — professional context, framed on md+. */
const HERO_PANEL_IMG =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80";

type Props = {
  lang: Lang;
};

export function HeroAndSearch({ lang }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [category, setCategory] = useState("");
  const [jobType, setJobType] = useState("");

  const submit = useCallback(() => {
    const z = normalizeZip5(zip);
    router.push(
      buildEmpleosResultadosUrl(lang, {
        q: q.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zip: z.length === 5 ? z : undefined,
        category: category || undefined,
        jobType: jobType || undefined,
      }),
    );
  }, [router, lang, q, city, state, zip, category, jobType]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const fieldClass = EMPLEOS_FIELD;

  return (
    <section
      id="empleos-hero"
      className="relative isolate scroll-mt-[6.5rem] overflow-hidden rounded-[1.25rem] border border-[#E8DFD0]/90 shadow-[0_22px_60px_rgba(42,40,38,0.11)] sm:scroll-mt-[7.5rem] sm:rounded-[1.75rem] lg:rounded-[2rem]"
    >
      {/* Category-scale background: full hero frame, readable text via layered gradients */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src={HERO_CATEGORY_BG}
          alt=""
          fill
          priority
          className="object-cover object-[50%_28%] sm:object-[50%_22%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F2]/97 via-[#FAF7F2]/88 to-[#FAF7F2]/82" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2] via-[#FAF7F2]/80 to-[#FFF3E0]/45 sm:via-[#FAF7F2]/70 lg:from-[#FAF7F2]/95 lg:via-[#FAF7F2]/55 lg:to-[#FAF7F2]/25" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_15%,rgba(232,165,75,0.16),transparent_52%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(91,111,130,0.08),transparent_45%)]" />
      </div>

      {/* Top: copy + optional framed visual (md+) */}
      <div className="relative px-4 py-8 sm:px-6 sm:py-10 lg:px-9 lg:py-11 xl:px-11 xl:py-12">
        <div className="grid gap-8 md:gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-center lg:gap-12 xl:gap-14">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5B6F82]">
              {lang === "es" ? "Leonix Clasificados · Empleos" : "Leonix Classifieds · Jobs"}
            </p>
            <h1 className="mt-3 max-w-[22ch] text-[1.7rem] font-bold leading-[1.12] tracking-tight text-[#2A2826] sm:max-w-none sm:text-4xl lg:text-[2.35rem] xl:text-[2.55rem]">
              {lang === "es"
                ? "Encuentra oportunidades de trabajo cerca de ti"
                : "Find job opportunities near you"}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#3d3a38]/95 sm:text-[1.05rem]">
              {lang === "es"
                ? "Conecta con empleadores que están contratando ahora. Oportunidades locales, en oficina, híbridas y remotas — con búsqueda clara desde el primer clic."
                : "Connect with employers hiring now. Local, in-office, hybrid, and remote roles — clear search from the first click."}
            </p>

            <div className="mt-6 flex max-w-2xl flex-col gap-3 rounded-2xl border border-[#E8DFD0]/90 bg-white/75 px-4 py-3.5 shadow-[0_10px_34px_rgba(42,40,38,0.07)] backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#2A2826]">
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F0C15A] to-[#D9A23A] text-sm font-bold text-[#2A2826] shadow-sm"
                  aria-hidden
                >
                  +
                </span>
                <span>{lang === "es" ? "2,450+ vacantes nuevas esta semana" : "2,450+ new openings this week"}</span>
              </div>
              <span className="hidden h-4 w-px shrink-0 bg-[#E8DFD0] sm:block" aria-hidden />
              <p className="text-sm text-[#4A4744]/95">
                {lang === "es" ? "Aplicación rápida disponible en muchas ofertas." : "Quick apply on many listings."}
              </p>
            </div>
          </div>

          {/* Framed category visual — md+ only; mobile uses full-width bg for identity */}
          <div className="relative mx-auto hidden w-full max-w-md md:mx-0 md:block md:max-w-none">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/80 bg-[#EDE8E0] shadow-[0_24px_56px_rgba(42,40,38,0.14)] ring-1 ring-[#E8DFD0]/70 lg:aspect-[5/4] lg:max-h-[min(360px,36vh)] xl:max-h-[380px]">
              <Image
                src={HERO_PANEL_IMG}
                alt=""
                fill
                className="object-cover object-[50%_22%]"
                sizes="(max-width: 1024px) 50vw, 42vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2A2826]/35 via-transparent to-transparent" />
              <div className="absolute left-3 top-3 max-w-[min(100%,220px)] rounded-xl border border-white/85 bg-white/95 px-3 py-2 text-xs font-medium text-[#2A2826] shadow-lg backdrop-blur-sm sm:left-4 sm:top-4">
                <span className="font-bold text-[#B8892C]">+2,450</span>{" "}
                {lang === "es" ? "Nuevos empleos esta semana" : "New jobs this week"}
              </div>
              <div className="absolute bottom-3 right-3 max-w-[180px] rounded-xl border border-[#E8DFD0] bg-[#FFFBF5]/95 px-3 py-2 text-center text-xs font-semibold text-[#2A2826] shadow-md backdrop-blur-sm">
                {lang === "es" ? "Aplicación rápida" : "Quick apply"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search: separated band — no negative overlap with hero body */}
      <div className="relative border-t border-[#E8DFD0]/70 bg-[#FFFBF7]/97 px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-md sm:px-6 sm:py-6 lg:px-9 xl:px-11">
        <form onSubmit={onSubmit} className="relative z-10 mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:items-end xl:gap-x-4 xl:gap-y-4">
            <label className="min-w-0 xl:col-span-5">
              <span className="mb-1.5 block text-xs font-semibold text-[#4A4744]">
                {lang === "es" ? "¿Qué trabajo buscas?" : "What job are you looking for?"}
              </span>
              <span className="relative block">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6F82]" aria-hidden />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={lang === "es" ? "Ej: Cajero, Enfermero…" : "e.g. Cashier, Nurse…"}
                  className={`${fieldClass} py-3 pl-10 pr-3 placeholder:text-[#7A756E]`}
                  autoComplete="off"
                />
              </span>
            </label>

            <label className="min-w-0 sm:col-span-1 xl:col-span-3">
              <span className="mb-1.5 block text-xs font-semibold text-[#4A4744]">
                {lang === "es" ? "Ciudad" : "City"}
              </span>
              <span className="relative block">
                <FaMapMarkerAlt className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6F82]" aria-hidden />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={lang === "es" ? "Ej: Downey" : "e.g. Downey"}
                  className={`${fieldClass} py-3 pl-10 pr-3 placeholder:text-[#7A756E]`}
                  autoComplete="address-level2"
                />
              </span>
            </label>

            <label className="min-w-0 sm:col-span-1 xl:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "Estado" : "State"}</span>
              <select value={state} onChange={(e) => setState(e.target.value)} className={fieldClass}>
                {sampleUsStateSelectOptions.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {lang === "es" ? o.labelEs : o.labelEn}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0 sm:col-span-1 xl:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-[#4A4744]">{lang === "es" ? "CP (ZIP)" : "ZIP code"}</span>
              <input
                value={zip}
                inputMode="numeric"
                onChange={(e) => setZip(normalizeZip5(e.target.value))}
                placeholder={lang === "es" ? "Ej: 90241" : "e.g. 90241"}
                maxLength={5}
                className={`${fieldClass} placeholder:text-[#7A756E]`}
                autoComplete="postal-code"
              />
            </label>

            <label className="min-w-0 sm:col-span-1 xl:col-span-3">
              <span className="mb-1.5 block text-xs font-semibold text-[#4A4744]">
                {lang === "es" ? "Categoría / Industria" : "Category / industry"}
              </span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldClass}>
                {sampleCategorySelectOptions.map((o) => (
                  <option key={o.value || "all"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0 sm:col-span-1 xl:col-span-3">
              <span className="mb-1.5 block text-xs font-semibold text-[#4A4744]">
                {lang === "es" ? "Tipo de empleo" : "Employment type"}
              </span>
              <select value={jobType} onChange={(e) => setJobType(e.target.value)} className={fieldClass}>
                {sampleJobTypeSelectOptions.map((o) => (
                  <option key={o.value || "any"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="min-w-0 sm:col-span-2 xl:col-span-3">
              <EmpleosUseLocationButton
                lang={lang}
                onFilled={(p) => {
                  setCity(p.city);
                  setState(p.state);
                  setZip(p.zip);
                }}
              />
            </div>

            <div className="min-w-0 sm:col-span-1 xl:col-span-3">
              <span className="mb-1.5 hidden text-xs font-semibold text-transparent xl:block" aria-hidden>
                &nbsp;
              </span>
              <button type="submit" className={`${EMPLEOS_CTA_PRIMARY} w-full px-4`}>
                {lang === "es" ? "Buscar empleos" : "Search jobs"}
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-[#F0E8DC] pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
            <span className="shrink-0 text-xs font-semibold text-[#5B6F82]">
              {lang === "es" ? "Búsquedas populares:" : "Popular searches:"}
            </span>
            <div className="flex flex-wrap gap-2">
              {samplePopularSearches.map((label) => (
                <Link
                  key={label}
                  href={buildEmpleosResultadosUrl(lang, { q: label })}
                  className="inline-flex min-h-9 items-center rounded-full border border-[#E8DFD0] bg-[#FFFBF5] px-3 py-1.5 text-xs font-medium text-[#2A2826] transition hover:border-[#D9A23A]/50 hover:bg-white"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
