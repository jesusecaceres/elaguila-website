"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { CategoryHeroFrame } from "@/app/(site)/clasificados/components/categoryLanding/CategoryHeroFrame";
import { CategoryLandingChipsRail } from "@/app/(site)/clasificados/components/categoryLanding/CategoryLandingChipsRail";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { CLASES_LANDING_CATEGORY_PILLS, CLASES_QUICK_CHIPS } from "./shared/fields/clasesTaxonomy";
import { buildClasesListaUrl } from "./shared/utils/clasesListaUrl";

type Lang = "es" | "en";

const CATEGORY = "clases";

/** Editorial learning / workshop atmosphere */
const CLASES_HERO_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=2400&q=82";

const COPY = {
  es: {
    eyebrow: "Aprendizaje · Leonix",
    title: "Clases",
    subtitle: "Clases, talleres y aprendizaje comunitario.",
    searchPlaceholder: "Buscar: idiomas, música, tutoría…",
    locationPlaceholder: "Ciudad o ZIP",
    buttonView: "Ver anuncios",
    buttonPost: "Publicar anuncio",
    exploreCategory: "Explorar por categoría",
    hint: "Usa el botón para ver resultados con filtros.",
    ctaPost: "Publicar anuncio",
    ctaView: "Ver anuncios",
    heroImageAlt: "Personas aprendiendo en un taller",
  },
  en: {
    eyebrow: "Learning · Leonix",
    title: "Classes",
    subtitle: "Classes, workshops and community learning.",
    searchPlaceholder: "Search: languages, music, tutoring…",
    locationPlaceholder: "City or ZIP",
    buttonView: "View listings",
    buttonPost: "Post listing",
    exploreCategory: "Browse by category",
    hint: "Use the button below to see results with filters.",
    ctaPost: "Post listing",
    ctaView: "View listings",
    heroImageAlt: "People learning together in a workshop",
  },
} as const;

export default function Page() {
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);
  const t = COPY[lang];
  const chips = CLASES_QUICK_CHIPS[lang];

  const listaHref = useMemo(() => buildClasesListaUrl(CATEGORY, lang), [lang]);
  const postHref = useMemo(
    () =>
      `/login?mode=post&lang=${lang}&redirect=${encodeURIComponent(`/clasificados/publicar?cat=${CATEGORY}&lang=${lang}`)}`,
    [lang],
  );

  return (
    <div className="min-h-screen pb-20 text-[#111111] [background:radial-gradient(ellipse_at_top,rgba(169,140,42,0.12),transparent_58%),#F4EFE6]">
      <Navbar />

      <div className="sticky top-14 z-30 border-b border-[#C9B46A]/20 bg-[#F4EFE6]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 px-4 py-2.5">
          <Link
            href={postHref}
            className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-[#F5F5F5] transition hover:opacity-95"
          >
            {t.ctaPost}
          </Link>
          <Link
            href={listaHref}
            className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-[#C9B46A]/70 bg-[#FFFCF7] px-4 py-2 text-sm font-semibold text-[#111111] transition hover:bg-[#F5F0E6]"
          >
            {t.ctaView}
          </Link>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[min(100%,960px)] min-w-0 space-y-5 px-4 pb-12 pt-4 sm:space-y-6 sm:px-5 sm:pt-5 md:space-y-7 md:pt-6">
        <CategoryHeroFrame
          imageSrc={CLASES_HERO_IMAGE}
          imageAlt={t.heroImageAlt}
          overlay="leonix-warm"
          contentJustify="end"
          minHeightClass="min-h-[min(36vh,300px)] sm:min-h-[min(40vh,360px)] md:min-h-[min(44vh,400px)]"
          objectClassName="object-cover object-[center_36%] sm:object-[center_34%] md:object-[center_32%]"
          contentClassName="sm:max-w-[46rem]"
        >
          <div className="w-full max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5c4a38]/90 sm:text-[11px] sm:tracking-[0.24em]">{t.eyebrow}</p>
            <h1 className="mt-2.5 text-balance font-serif text-[clamp(1.6rem,3.8vw+0.45rem,2.6rem)] font-semibold leading-[1.08] tracking-tight text-[#1E1810] drop-shadow-[0_1px_0_rgba(255,252,247,0.85)] sm:mt-3">
              {t.title}
            </h1>
            <p className="mt-2.5 max-w-xl text-[0.9375rem] leading-relaxed text-[#2a241c]/90 sm:mt-3 sm:text-base">{t.subtitle}</p>
          </div>
        </CategoryHeroFrame>

        <section className="rounded-2xl border border-[#C9B46A]/20 bg-[#FFFCF7]/96 px-4 py-4 shadow-[0_10px_36px_-24px_rgba(42,36,22,0.22)] ring-1 ring-[#C9B46A]/08 sm:px-5 sm:py-4.5">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#3d5a73]/80 sm:text-left">{t.exploreCategory}</p>
          <div className="mt-3">
            <CategoryLandingChipsRail label={t.exploreCategory}>
              {CLASES_LANDING_CATEGORY_PILLS.map(({ key, labelEs, labelEn }) => (
                <Link
                  key={key}
                  href={appendLangToPath(`/clasificados/${key}`, lang)}
                  className="inline-flex min-h-[40px] shrink-0 snap-start items-center rounded-full border border-[#C9B46A]/45 bg-[#F8F6F0] px-3.5 py-2 text-xs font-medium text-[#111111] transition hover:bg-[#EFEFEF] sm:shrink"
                >
                  {lang === "es" ? labelEs : labelEn}
                </Link>
              ))}
            </CategoryLandingChipsRail>
          </div>
        </section>

        <section className="rounded-2xl border border-[#C9B46A]/22 bg-[#FFFCF7]/98 p-4 shadow-[0_6px_28px_-18px_rgba(42,36,22,0.14)] ring-1 ring-[#C9B46A]/10 sm:p-5">
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-stretch sm:gap-3">
            <div className="relative min-w-0">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#111111]/50 text-sm" aria-hidden>
                ⌕
              </span>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                className="min-h-[44px] w-full rounded-xl border border-[#C9B46A]/35 bg-white py-2.5 pl-8 pr-3 text-sm text-[#111111] outline-none placeholder:text-[#111111]/70 focus:border-[#A98C2A]/60 focus:ring-2 focus:ring-[#A98C2A]/18"
                aria-label={t.searchPlaceholder}
                readOnly
                onFocus={(e) => e.target.blur()}
              />
            </div>
            <Link
              href={listaHref}
              className="flex min-h-[44px] min-w-0 items-center justify-center rounded-xl border border-[#C9B46A]/35 bg-white px-3 py-2.5 text-sm text-[#111111]/85 transition hover:bg-[#EFEFEF] sm:w-40 sm:justify-start"
            >
              <span className="truncate">{t.locationPlaceholder}</span>
            </Link>
          </div>
          <div className="mt-3">
            <CategoryLandingChipsRail label={lang === "en" ? "Quick topic shortcuts" : "Atajos de temas"}>
              {chips.map((label) => (
                <Link
                  key={label}
                  href={buildClasesListaUrl(CATEGORY, lang, label)}
                  className="inline-flex min-h-[40px] shrink-0 snap-start items-center rounded-full border border-[#111111]/14 bg-white px-3 py-2 text-xs font-medium text-[#111111] transition hover:bg-[#EFEFEF] sm:shrink"
                >
                  {label}
                </Link>
              ))}
            </CategoryLandingChipsRail>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-[#111111]/68">{t.hint}</p>
        </section>

        <div className="flex min-w-0 flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:gap-3">
          <Link
            href={listaHref}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-[#F5F5F5] transition hover:opacity-95 sm:w-auto sm:min-w-[11rem]"
          >
            {t.buttonView}
          </Link>
          <Link
            href={postHref}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#C9B46A]/55 bg-[#FFFCF7] px-5 py-3 text-sm font-medium text-[#111111] transition hover:bg-[#F5F0E6] sm:w-auto sm:min-w-[11rem]"
          >
            {t.buttonPost}
          </Link>
        </div>
      </main>
    </div>
  );
}
