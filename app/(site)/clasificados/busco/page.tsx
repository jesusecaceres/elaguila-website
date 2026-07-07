"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryLandingChipsRail } from "@/app/(site)/clasificados/components/categoryLanding/CategoryLandingChipsRail";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryShortcutSection,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { categoryStandardQuickFilters } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import { BuscoLandingRecentListings } from "./BuscoLandingRecentListings";
import { BUSCO_PRODUCT, buscoLangFromSearchParams, buscoPathWithLang, buscoRouteLangFromSearchParams } from "./shared/buscoShellCopy";

const COPY = {
  es: {
    eyebrow: "CLASIFICADOS · SOLICITUDES",
    ctaPost: "Publicar solicitud",
    ctaView: "Ver todos los anuncios",
    quickTopics: "Filtros rápidos",
    recentTitle: "Solicitudes recientes",
    recentEmpty:
      "Aún no hay solicitudes publicadas. Sé el primero en publicar lo que buscas en tu comunidad.",
    recentError: "No se pudieron cargar las solicitudes recientes.",
    backHub: "Volver a Clasificados",
  },
  en: {
    eyebrow: "CLASSIFIEDS · REQUESTS",
    ctaPost: "Post request",
    ctaView: "View all listings",
    quickTopics: "Quick filters",
    recentTitle: "Recent requests",
    recentEmpty:
      "No published requests yet. Be the first to post what you are looking for in your community.",
    recentError: "Could not load recent requests.",
    backHub: "Back to Classifieds",
  },
} as const;

function BuscoLandingPageInner() {
  const sp = useSearchParams();
  const lang = buscoLangFromSearchParams(sp);
  const routeLang = buscoRouteLangFromSearchParams(sp);
  const t = COPY[lang];
  const product = BUSCO_PRODUCT;
  const chips = categoryStandardQuickFilters("busco", lang);

  const postHref = useMemo(() => buscoPathWithLang("/publicar/busco/quick", routeLang), [routeLang]);
  const resultsHref = useMemo(() => buildCategoryResultsUrl("busco", routeLang as "es" | "en"), [routeLang]);
  const hubHref = useMemo(() => buscoPathWithLang("/clasificados", routeLang), [routeLang]);

  const buscoSearchForm = (
    <LeonixCategorySearchCanvas
      lang={lang as V2Lang}
      surface="landing"
      query=""
      city=""
      state=""
      zip=""
      country=""
      onQuery={() => {}}
      onCity={() => {}}
      onState={() => {}}
      onZip={() => {}}
      onCountry={() => {}}
      onSearch={() => {}}
      onOpenFilters={() => {}}
      browseAllHref={resultsHref}
      browseAllLabel={t.ctaView}
      searchButtonLabel={lang === "es" ? "Buscar" : "Search"}
      filtersButtonLabel={lang === "es" ? "Filtros" : "Filters"}
      publishHref={postHref}
      publishLabel={t.ctaPost}
    />
  );

  return (
    <LeonixCategoryPageShell surface="landing">
      <LeonixCategoryHeroGateway
        lang={lang as V2Lang}
        surface="landing"
        title={lang === "es" ? "Busco / Se Busca" : "I'm Looking For / Looking For"}
        tagline=""
        intro={lang === "es" ? "Publica lo que buscas y encuentra ofertas de tu comunidad." : "Post what you're looking for and find offers from your community."}
        introSecondary=""
        searchSlot={buscoSearchForm}
        eyebrow={t.eyebrow}
      />
      <main className="mx-auto max-w-[1280px] space-y-6 overflow-x-hidden px-3.5 pb-14 sm:px-4 sm:space-y-8 lg:px-5">
        <section className="rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-4 text-sm leading-relaxed text-[#3D3428] sm:px-5">
          <p>{product.helper[lang]}</p>
          <p className="mt-3 rounded-lg border border-[#D6C7AD]/60 bg-[#FAF6EE] px-3 py-2.5 text-xs font-medium text-[#556B3E]">
            {product.notDatingNote[lang]}
          </p>
        </section>
        <LeonixCategoryShortcutSection
          lang={lang as V2Lang}
          surface="landing"
          title={t.quickTopics}
          subtitle=""
          variant="default"
          chips={chips.map((label) => ({ id: label, label, href: buildCategoryResultsUrl("busco", lang, { q: label }) }))}
        />
        <BuscoLandingRecentListings
          lang={lang}
          title={t.recentTitle}
          emptyNote={t.recentEmpty}
          errorPrefix={t.recentError}
        />
        <p className="text-center">
          <Link href={hubHref} className="text-sm font-medium text-[#556B3E] underline-offset-2 hover:text-[#7A1E2C]">
            {t.backHub}
          </Link>
        </p>
      </main>
    </LeonixCategoryPageShell>
  );
}

export default function BuscoLandingPage() {
  return (
    <Suspense fallback={null}>
      <BuscoLandingPageInner />
    </Suspense>
  );
}
