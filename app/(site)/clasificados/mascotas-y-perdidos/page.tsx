"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import { CategoryHeroFrame } from "@/app/(site)/clasificados/components/categoryLanding/CategoryHeroFrame";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { MASCOTAS_PERDIDOS_NOTICE_OPTIONS } from "@/app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy";

import { MascotasPerdidosLandingRecentListings } from "./MascotasPerdidosLandingRecentListings";
import {
  mascotasPerdidosPublishEntryUrl,
  mascotasPerdidosTipoChipHref,
} from "./shared/mascotasPerdidosBrowseUrls";
import {
  MASCOTAS_PERDIDOS_PRODUCT,
  mascotasPerdidosLangFromSearchParams,
  mascotasPerdidosPathWithLang,
} from "./shared/mascotasPerdidosShellCopy";

const HERO_IMAGE = "/logo.png";

const COPY = {
  es: {
    eyebrow: "Mascotas y Perdidos · Leonix",
    ctaPost: "Publicar aviso gratis",
    ctaView: "Ver avisos",
    heroImageAlt: "Mascota y comunidad local",
    typesTitle: "Tipos de aviso",
    search: "Buscar avisos",
    searchPlaceholder: "Título, descripción, tipo…",
    searchCta: "Buscar",
    recentTitle: "Avisos recientes",
    recentEmpty: "Aún no hay avisos publicados. Sé el primero en publicar un aviso gratuito.",
    recentError: "No se pudieron cargar los avisos recientes.",
    backHub: "Volver a Clasificados",
  },
  en: {
    eyebrow: "Pets & Lost & Found · Leonix",
    ctaPost: "Post a free notice",
    ctaView: "View notices",
    heroImageAlt: "Pet and local community",
    typesTitle: "Notice types",
    search: "Search notices",
    searchPlaceholder: "Title, description, type…",
    searchCta: "Search",
    recentTitle: "Recent notices",
    recentEmpty: "No published notices yet. Be the first to post a free notice.",
    recentError: "Could not load recent notices.",
    backHub: "Back to Classifieds",
  },
} as const;

export default function MascotasPerdidosLandingPage() {
  const sp = useSearchParams();
  const lang = mascotasPerdidosLangFromSearchParams(sp);
  const t = COPY[lang];
  const product = MASCOTAS_PERDIDOS_PRODUCT;

  const postHref = useMemo(() => mascotasPerdidosPublishEntryUrl(lang), [lang]);
  const resultsHref = useMemo(
    () => mascotasPerdidosPathWithLang("/clasificados/mascotas-y-perdidos/resultados", lang),
    [lang],
  );
  const hubHref = useMemo(() => appendLangToPath("/clasificados", lang), [lang]);

  return (
    <div className="min-h-screen pb-20 text-[#111111] [background:radial-gradient(ellipse_at_top,rgba(169,140,42,0.12),transparent_58%),#F4EFE6]">
      <Navbar />

      <div className="sticky top-14 z-30 border-b border-[#C9B46A]/20 bg-[#F4EFE6]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 px-4 py-2.5">
          <Link
            href={postHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-[#F5F5F5] transition hover:opacity-95"
            data-testid="mascotas-landing-cta-post"
          >
            {t.ctaPost}
          </Link>
          <Link
            href={resultsHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#C9B46A]/70 bg-[#FFFCF7] px-4 py-2 text-sm font-semibold text-[#111111] transition hover:bg-[#FFF9ED]"
            data-testid="mascotas-landing-cta-view"
          >
            {t.ctaView}
          </Link>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[min(100%,960px)] min-w-0 space-y-5 px-4 pb-12 pt-4 sm:space-y-6 sm:px-5 sm:pt-5 md:space-y-7 md:pt-6">
        <CategoryHeroFrame
          imageSrc={HERO_IMAGE}
          imageAlt={t.heroImageAlt}
          overlay="leonix-warm"
          contentJustify="end"
          minHeightClass="min-h-[min(36vh,300px)] sm:min-h-[min(40vh,360px)] md:min-h-[min(44vh,400px)]"
          objectClassName="object-cover object-center"
          contentClassName="sm:max-w-[46rem]"
        >
          <div className="w-full max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6B5A32]/95 sm:text-[11px] sm:tracking-[0.24em]">
              {t.eyebrow}
            </p>
            <h1 className="mt-2.5 text-balance font-serif text-[clamp(1.6rem,3.8vw+0.45rem,2.6rem)] font-semibold leading-[1.08] tracking-tight text-[#1E1810] drop-shadow-[0_1px_0_rgba(255,252,247,0.85)] sm:mt-3">
              {product.title[lang]}
            </h1>
            <p className="mt-2.5 max-w-xl text-[0.9375rem] leading-relaxed text-[#2a241c]/90 sm:mt-3 sm:text-base">
              {product.description[lang]}
            </p>
          </div>
        </CategoryHeroFrame>

        <section className="rounded-2xl border border-[#C9B46A]/25 bg-[#FFFCF7]/98 px-4 py-4 shadow-[0_6px_28px_-18px_rgba(42,36,22,0.14)] ring-1 ring-[#C9B46A]/12 sm:px-5 sm:py-5">
          <p className="text-sm leading-relaxed text-[#2a241c]/90">{product.helper[lang]}</p>
        </section>

        <form
          className="rounded-2xl border border-[#C9B46A]/22 bg-[#FFFCF7]/98 p-4 shadow-[0_6px_28px_-18px_rgba(42,36,22,0.14)] ring-1 ring-[#C9B46A]/10 sm:p-5"
          action="/clasificados/mascotas-y-perdidos/resultados"
          method="get"
          data-testid="mascotas-landing-search"
        >
          <input type="hidden" name="lang" value={lang} />
          <label className="block text-xs font-semibold text-[#5C5346]">
            {t.search}
            <input
              className="mt-1 min-h-[44px] w-full rounded-xl border border-[#C9B46A]/35 bg-white px-3 py-2 text-sm"
              name="q"
              placeholder={t.searchPlaceholder}
            />
          </label>
          <button
            type="submit"
            className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#111111] px-4 py-2 text-sm font-semibold text-[#F5F5F5]"
          >
            {t.searchCta}
          </button>
        </form>

        <section className="rounded-2xl border border-[#C9B46A]/25 bg-[#FFFCF7]/98 px-4 py-4 shadow-[0_6px_28px_-18px_rgba(42,36,22,0.14)] ring-1 ring-[#C9B46A]/12 sm:px-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B5A32]/85">{t.typesTitle}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {MASCOTAS_PERDIDOS_NOTICE_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={mascotasPerdidosTipoChipHref(lang, opt.value)}
                className="inline-flex min-h-[40px] items-center rounded-full border border-[#C9B46A]/50 bg-[#FFF9ED] px-3 py-1.5 text-xs font-semibold text-[#3D3428] transition hover:border-[#A98C2A]/60 hover:bg-[#FFF3DC]"
                data-testid={`mascotas-landing-tipo-${opt.value}`}
              >
                {lang === "en" ? opt.labelEn : opt.labelEs}
              </Link>
            ))}
          </div>
        </section>

        <MascotasPerdidosLandingRecentListings
          lang={lang}
          title={t.recentTitle}
          emptyNote={t.recentEmpty}
          errorPrefix={t.recentError}
        />

        <div className="flex min-w-0 flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:gap-3">
          <Link
            href={resultsHref}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#111111] px-5 py-3 text-sm font-semibold text-[#F5F5F5] transition hover:opacity-95 sm:w-auto sm:min-w-[11rem]"
          >
            {t.ctaView}
          </Link>
          <Link
            href={postHref}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#C9B46A]/55 bg-[#FFFCF7] px-5 py-3 text-sm font-medium text-[#111111] transition hover:bg-[#FFF9ED] sm:w-auto sm:min-w-[11rem]"
          >
            {t.ctaPost}
          </Link>
        </div>

        <p className="text-center">
          <Link href={hubHref} className="text-sm font-medium text-[#6B5A32] underline-offset-2 hover:underline">
            {t.backHub}
          </Link>
        </p>
      </main>
    </div>
  );
}
