"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { EMPLEOS_LANDING_CATEGORY_PILLS, EMPLEOS_QUICK_CHIPS } from "./shared/fields/empleosTaxonomy";
import { buildEmpleosListaUrl } from "./shared/utils/empleosListaUrl";

type Lang = "es" | "en";

const CATEGORY = "empleos";

const COPY = {
  es: {
    title: "Empleos",
    subtitle: "Ofertas de trabajo y oportunidades cerca de ti.",
    searchPlaceholder: "Buscar: puesto, industria, empresa…",
    locationPlaceholder: "Ciudad o ZIP",
    buttonView: "Ver anuncios",
    buttonPost: "Publicar anuncio",
    exploreCategory: "Explorar por categoría",
    hint: "Usa el botón para ver resultados con filtros.",
    ctaPost: "Publicar anuncio",
    ctaView: "Ver anuncios",
  },
  en: {
    title: "Jobs",
    subtitle: "Job listings and opportunities near you.",
    searchPlaceholder: "Search: position, industry, company…",
    locationPlaceholder: "City or ZIP",
    buttonView: "View listings",
    buttonPost: "Post listing",
    exploreCategory: "Browse by category",
    hint: "Use the button below to see results with filters.",
    ctaPost: "Post listing",
    ctaView: "View listings",
  },
} as const;

export default function Page() {
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);
  const t = COPY[lang];
  const chips = EMPLEOS_QUICK_CHIPS[lang];

  const listaHref = useMemo(() => buildEmpleosListaUrl(CATEGORY, lang), [lang]);
  const postHref = useMemo(() => `/login?mode=post&lang=${lang}&redirect=${encodeURIComponent(`/clasificados/publicar?cat=${CATEGORY}&lang=${lang}`)}`, [lang]);
  return (
    <div className="min-h-screen bg-[#D9D9D9] text-[#111111] pb-20 bg-[radial-gradient(ellipse_at_top,rgba(169,140,42,0.10),transparent_60%)]">
      <Navbar />

      <div className="sticky top-14 z-30 border-b border-black/10 bg-[#D9D9D9]/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 px-4 py-2">
          <Link href={postHref} className="rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-[#F5F5F5] hover:opacity-95 transition">
            {t.ctaPost}
          </Link>
          <Link href={listaHref} className="rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF] transition">
            {t.ctaView}
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 pt-6 pb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-[#111111] tracking-tight">
          {t.title}
        </h1>
        <p className="mt-2 text-[#111111] text-base">{t.subtitle}</p>

        <section className="mt-6 rounded-2xl border border-[#111111]/10 bg-[#F5F5F5] px-4 py-3">
          <p className="text-xs font-semibold text-[#111111]/80">{t.exploreCategory}</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {EMPLEOS_LANDING_CATEGORY_PILLS.map(({ key, labelEs, labelEn }) => (
              <Link
                key={key}
                href={appendLangToPath(`/clasificados/${key}`, lang)}
                className="shrink-0 rounded-full border border-[#C9B46A]/40 bg-[#F8F6F0] px-3 py-1.5 text-xs font-medium text-[#111111] hover:bg-[#EFEFEF] transition"
              >
                {lang === "es" ? labelEs : labelEn}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-[#C9B46A]/25 bg-[#F5F5F5] shadow-sm p-3 ring-1 ring-[#C9B46A]/10">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-stretch">
            <div className="relative min-w-0">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#111111]/50 text-sm" aria-hidden>⌕</span>
              <input type="text" placeholder={t.searchPlaceholder} className="w-full rounded-lg border border-[#C9B46A]/30 bg-white py-2 pl-8 pr-3 text-sm text-[#111111] outline-none placeholder:text-[#111111]/70 focus:border-[#A98C2A]/60 focus:ring-1 focus:ring-[#A98C2A]/20" aria-label={t.searchPlaceholder} readOnly onFocus={(e) => e.target.blur()} />
            </div>
            <Link href={listaHref} className="flex items-center rounded-lg border border-[#C9B46A]/30 bg-white px-3 py-2 text-sm text-[#111111]/80 hover:bg-[#EFEFEF] transition sm:w-36"><span className="truncate">{t.locationPlaceholder}</span></Link>
          </div>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {chips.map((label) => (
              <Link
                key={label}
                href={buildEmpleosListaUrl(CATEGORY, lang, label)}
                className="shrink-0 rounded-full border border-[#111111]/15 bg-white px-2.5 py-1.5 text-xs font-medium text-[#111111] hover:bg-[#EFEFEF] transition"
              >
                {label}
              </Link>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-[#111111]/70">{t.hint}</p>
        </section>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link href={listaHref} className="inline-flex justify-center rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-[#F5F5F5] hover:opacity-95 transition">
            {t.buttonView}
          </Link>
          <Link href={postHref} className="inline-flex justify-center rounded-xl border border-[#C9B46A]/50 bg-[#F5F5F5] px-5 py-3 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] transition">
            {t.buttonPost}
          </Link>
        </div>
      </main>
    </div>
  );
}
