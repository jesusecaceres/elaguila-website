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
import { MASCOTAS_PERDIDOS_NOTICE_OPTIONS } from "@/app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy";
import { MascotasPerdidosLandingRecentListings } from "./MascotasPerdidosLandingRecentListings";
import { mascotasPerdidosPublishEntryUrl, mascotasPerdidosTipoChipHref } from "./shared/mascotasPerdidosBrowseUrls";
import { mascotasPerdidosLangFromSearchParams, mascotasPerdidosPathWithLang, mascotasPerdidosRouteLangFromSearchParams } from "./shared/mascotasPerdidosShellCopy";

const COPY = {
  es: {
    eyebrow: "CLASIFICADOS · MASCOTAS Y PERDIDOS",
    ctaPost: "Publicar en Mascotas y Perdidos",
    ctaView: "Ver todos los anuncios",
    typesTitle: "Filtros rápidos",
    recentTitle: "Avisos recientes",
    recentEmpty: "Aún no hay avisos publicados. Sé el primero en publicar un aviso gratuito.",
    recentError: "No se pudieron cargar los avisos recientes.",
    backHub: "Volver a Clasificados",
  },
  en: {
    eyebrow: "CLASSIFIEDS · PETS & LOST",
    ctaPost: "Post in Pets & Lost",
    ctaView: "View all listings",
    typesTitle: "Quick filters",
    recentTitle: "Recent notices",
    recentEmpty: "No published notices yet. Be the first to post a free notice.",
    recentError: "Could not load recent notices.",
    backHub: "Back to Classifieds",
  },
} as const;

function MascotasPerdidosLandingPageInner() {
  const sp = useSearchParams();
  const lang = mascotasPerdidosLangFromSearchParams(sp);
  const routeLang = mascotasPerdidosRouteLangFromSearchParams(sp);
  const t = COPY[lang];

  const postHref = useMemo(() => mascotasPerdidosPublishEntryUrl(routeLang), [routeLang]);
  const resultsHref = useMemo(() => buildCategoryResultsUrl("mascotas-y-perdidos", routeLang as "es" | "en"), [routeLang]);
  const hubHref = useMemo(() => mascotasPerdidosPathWithLang("/clasificados", routeLang), [routeLang]);

  const mascotasSearchForm = (
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
        title={lang === "es" ? "Mascotas y Perdidos" : "Pets & Lost"}
        tagline=""
        intro={lang === "es" ? "Encuentra mascotas perdidas, avisa sobre mascotas encontradas y más." : "Find lost pets, report found pets, and more."}
        introSecondary=""
        searchSlot={mascotasSearchForm}
        eyebrow={t.eyebrow}
      />
      <main className="mx-auto max-w-[1280px] space-y-6 overflow-x-hidden px-3.5 pb-14 sm:px-4 sm:space-y-8 lg:px-5">
        <LeonixCategoryShortcutSection
          lang={lang as V2Lang}
          surface="landing"
          title={t.typesTitle}
          subtitle=""
          variant="default"
          chips={MASCOTAS_PERDIDOS_NOTICE_OPTIONS.map((opt) => ({
            id: opt.value,
            label: lang === "en" ? opt.labelEn : opt.labelEs,
            href: mascotasPerdidosTipoChipHref(routeLang, opt.value)
          }))}
        />
        <MascotasPerdidosLandingRecentListings
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

export default function MascotasPerdidosLandingPage() {
  return (
    <Suspense fallback={null}>
      <MascotasPerdidosLandingPageInner />
    </Suspense>
  );
}
