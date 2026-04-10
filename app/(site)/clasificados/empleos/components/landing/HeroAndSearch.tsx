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
} from "../../data/empleosLandingSampleData";
import { buildEmpleosResultadosUrl } from "../../shared/utils/empleosListaUrl";

type Props = {
  lang: Lang;
};

export function HeroAndSearch({ lang }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [jobType, setJobType] = useState("");

  const submit = useCallback(() => {
    router.push(
      buildEmpleosResultadosUrl(lang, {
        q: q.trim() || undefined,
        city: city.trim() || undefined,
        category: category || undefined,
        jobType: jobType || undefined,
      }),
    );
  }, [router, lang, q, city, category, jobType]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <div className="relative">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5B6F82]">
            {lang === "es" ? "Leonix Clasificados · Empleos" : "Leonix Classifieds · Jobs"}
          </p>
          <h1 className="mt-3 text-[1.75rem] font-bold leading-[1.15] tracking-tight text-[#2A2826] sm:text-4xl lg:text-[2.45rem]">
            {lang === "es"
              ? "Encuentra oportunidades de trabajo cerca de ti"
              : "Find job opportunities near you"}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#4A4744]/95">
            {lang === "es"
              ? "Conecta con empleadores que están contratando ahora. Oportunidades locales, en oficina, híbridas y remotas — con búsqueda clara desde el primer clic."
              : "Connect with employers hiring now. Local, in-office, hybrid, and remote roles — clear search from the first click."}
          </p>

          <div className="mt-7 inline-flex flex-wrap items-center gap-3 rounded-2xl border border-[#E8DFD0] bg-white/70 px-4 py-3 shadow-[0_8px_30px_rgba(42,40,38,0.06)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#2A2826]">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#F0C15A] to-[#D9A23A] text-sm font-bold text-[#2A2826] shadow-sm"
                aria-hidden
              >
                +
              </span>
              <span>{lang === "es" ? "2,450+ vacantes nuevas esta semana" : "2,450+ new openings this week"}</span>
            </div>
            <span className="hidden h-4 w-px bg-[#E8DFD0] sm:block" aria-hidden />
            <p className="text-sm text-[#4A4744]/90">
              {lang === "es" ? "Aplicación rápida disponible en muchas ofertas." : "Quick apply on many listings."}
            </p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-[#E8DFD0] bg-[#EDE8E0] shadow-[0_20px_50px_rgba(42,40,38,0.12)]">
            <Image
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2A2826]/25 via-transparent to-transparent" />
          </div>
          <div className="absolute -left-2 top-6 max-w-[220px] rounded-2xl border border-white/80 bg-white/95 px-3 py-2.5 text-xs font-medium text-[#2A2826] shadow-lg backdrop-blur-sm sm:left-4">
            <span className="font-bold text-[#B8892C]">+2,450</span>{" "}
            {lang === "es" ? "Nuevos empleos esta semana" : "New jobs this week"}
          </div>
          <div className="absolute -right-1 bottom-10 max-w-[160px] rounded-2xl border border-[#E8DFD0] bg-[#FFFBF5] px-3 py-2 text-center text-xs font-semibold text-[#2A2826] shadow-md sm:right-2">
            {lang === "es" ? "Aplicación rápida" : "Quick apply"}
          </div>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="relative z-10 -mt-4 rounded-[1.35rem] border border-[#E8DFD0] bg-white p-5 shadow-[0_24px_60px_rgba(42,40,38,0.1)] sm:p-7 lg:-mt-8"
      >
        <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
          <label className="lg:col-span-3">
            <span className="mb-1.5 block text-xs font-semibold text-[#4A4744]">
              {lang === "es" ? "¿Qué trabajo buscas?" : "What job are you looking for?"}
            </span>
            <span className="relative block">
              <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6F82]" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={lang === "es" ? "Ej: Cajero, Enfermero…" : "e.g. Cashier, Nurse…"}
                className="min-h-12 w-full rounded-xl border border-[#E5DCCD] bg-[#FFFBF7] py-3 pl-10 pr-3 text-sm text-[#2A2826] outline-none ring-[#D9A23A]/0 transition placeholder:text-[#7A756E] focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
              />
            </span>
          </label>

          <label className="lg:col-span-3">
            <span className="mb-1.5 block text-xs font-semibold text-[#4A4744]">
              {lang === "es" ? "Ciudad o ubicación" : "City or location"}
            </span>
            <span className="relative block">
              <FaMapMarkerAlt className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5B6F82]" aria-hidden />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={lang === "es" ? "Ej: Downey, CA o 90241" : "e.g. Downey, CA or 90241"}
                className="min-h-12 w-full rounded-xl border border-[#E5DCCD] bg-[#FFFBF7] py-3 pl-10 pr-3 text-sm text-[#2A2826] outline-none transition placeholder:text-[#7A756E] focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
              />
            </span>
          </label>

          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-[#4A4744]">
              {lang === "es" ? "Categoría / Industria" : "Category / industry"}
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-[#E5DCCD] bg-[#FFFBF7] px-3 text-sm text-[#2A2826] outline-none focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
            >
              {sampleCategorySelectOptions.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold text-[#4A4744]">
              {lang === "es" ? "Tipo de empleo" : "Employment type"}
            </span>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="min-h-12 w-full rounded-xl border border-[#E5DCCD] bg-[#FFFBF7] px-3 text-sm text-[#2A2826] outline-none focus:border-[#D9A23A]/70 focus:ring-4 focus:ring-[#D9A23A]/15"
            >
              {sampleJobTypeSelectOptions.map((o) => (
                <option key={o.value || "any"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div className="lg:col-span-2">
            <button
              type="submit"
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#E8A54B] via-[#D9A23A] to-[#C9942E] px-4 text-sm font-bold text-[#2A2826] shadow-[0_10px_28px_rgba(201,148,46,0.35)] transition hover:brightness-[1.03] active:scale-[0.99]"
            >
              {lang === "es" ? "Buscar empleos" : "Search jobs"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#F0E8DC] pt-4">
          <span className="text-xs font-semibold text-[#5B6F82]">
            {lang === "es" ? "Búsquedas populares:" : "Popular searches:"}
          </span>
          <div className="flex flex-wrap gap-2">
            {samplePopularSearches.map((label) => (
              <Link
                key={label}
                href={buildEmpleosResultadosUrl(lang, { q: label })}
                className="rounded-full border border-[#E8DFD0] bg-[#FFFBF5] px-3 py-1.5 text-xs font-medium text-[#2A2826] transition hover:border-[#D9A23A]/50 hover:bg-white"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
