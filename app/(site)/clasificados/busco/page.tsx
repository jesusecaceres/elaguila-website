"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/app/components/Navbar";
import { CategoryHeroFrame } from "@/app/(site)/clasificados/components/categoryLanding/CategoryHeroFrame";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import { BuscoLandingRecentListings } from "./BuscoLandingRecentListings";
import { BUSCO_PRODUCT, buscoLangFromSearchParams, buscoPathWithLang } from "./shared/buscoShellCopy";

const HERO_IMAGE = "/logo.png";

const COPY = {
  es: {
    eyebrow: "Solicitudes · Leonix",
    ctaPost: "Publicar solicitud",
    ctaView: "Ver solicitudes",
    heroImageAlt: "Personas conectando en la comunidad local",
    recentTitle: "Solicitudes recientes",
    recentEmpty:
      "Aún no hay solicitudes publicadas. Sé el primero en publicar lo que buscas en tu comunidad.",
    recentError: "No se pudieron cargar las solicitudes recientes.",
    backHub: "Volver a Clasificados",
  },
  en: {
    eyebrow: "Requests · Leonix",
    ctaPost: "Post request",
    ctaView: "View requests",
    heroImageAlt: "People connecting in the local community",
    recentTitle: "Recent requests",
    recentEmpty:
      "No published requests yet. Be the first to post what you are looking for in your community.",
    recentError: "Could not load recent requests.",
    backHub: "Back to Classifieds",
  },
} as const;

export default function BuscoLandingPage() {
  const sp = useSearchParams();
  const lang = buscoLangFromSearchParams(sp);
  const t = COPY[lang];
  const product = BUSCO_PRODUCT;

  const postHref = useMemo(() => buscoPathWithLang("/publicar/busco/quick", lang), [lang]);
  const resultsHref = useMemo(() => buscoPathWithLang("/clasificados/busco/resultados", lang), [lang]);
  const hubHref = useMemo(() => appendLangToPath("/clasificados", lang), [lang]);

  return (
    <div className="min-h-screen pb-20 text-[#111111] [background:radial-gradient(ellipse_at_top,rgba(120,150,200,0.12),transparent_58%),#F4EFE6]">
      <Navbar />

      <div className="sticky top-14 z-30 border-b border-[#B8C8EA]/20 bg-[#F4EFE6]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 px-4 py-2.5">
          <Link
            href={postHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#111111] px-4 py-2 text-sm font-semibold text-[#F5F5F5] transition hover:opacity-95"
          >
            {t.ctaPost}
          </Link>
          <Link
            href={resultsHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#B8C8EA]/70 bg-[#FFFCF7] px-4 py-2 text-sm font-semibold text-[#111111] transition hover:bg-[#F5F0E6]"
          >
            {t.ctaView}
          </Link>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[min(100%,960px)] min-w-0 space-y-5 px-4 pb-12 pt-4 sm:space-y-6 sm:px-5 sm:pt-5 md:space-y-7 md:pt-6">
        <CategoryHeroFrame
          imageSrc={HERO_IMAGE}
          imageAlt={t.heroImageAlt}
          overlay="leonix-slate"
          contentJustify="end"
          minHeightClass="min-h-[min(36vh,300px)] sm:min-h-[min(40vh,360px)] md:min-h-[min(44vh,400px)]"
          objectClassName="object-cover object-center"
          contentClassName="sm:max-w-[46rem]"
        >
          <div className="w-full max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4e5c72]/95 sm:text-[11px] sm:tracking-[0.24em]">
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

        <section className="rounded-2xl border border-[#B8C8EA]/25 bg-[#FFFCF7]/98 px-4 py-4 shadow-[0_6px_28px_-18px_rgba(42,36,22,0.14)] ring-1 ring-[#B8C8EA]/12 sm:px-5 sm:py-5">
          <p className="text-sm leading-relaxed text-[#2a241c]/90">{product.helper[lang]}</p>
          <p className="mt-3 rounded-xl border border-[#B8C8EA]/30 bg-[#F0F4FF]/80 px-3 py-2.5 text-xs font-medium leading-relaxed text-[#3d4a5c]">
            {product.notDatingNote[lang]}
          </p>
        </section>

        <BuscoLandingRecentListings
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
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#B8C8EA]/55 bg-[#FFFCF7] px-5 py-3 text-sm font-medium text-[#111111] transition hover:bg-[#F5F0E6] sm:w-auto sm:min-w-[11rem]"
          >
            {t.ctaPost}
          </Link>
        </div>

        <p className="text-center">
          <Link href={hubHref} className="text-sm font-medium text-[#3d5a73] underline-offset-2 hover:underline">
            {t.backHub}
          </Link>
        </p>
      </main>
    </div>
  );
}
