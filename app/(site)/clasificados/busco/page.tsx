"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryShortcutSection,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import {
  LEONIX_LANDING_SECTION,
  LEONIX_LANDING_SECTION_PAD,
} from "@/app/(site)/clasificados/components/categoryStandardV2/constants";
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
      <div className="px-3.5 pb-8 sm:px-5 lg:px-6">
        <LeonixCategoryHeroGateway
          lang={lang as V2Lang}
          surface="landing"
          title={lang === "es" ? "Busco / Se Busca" : "I'm Looking For / Looking For"}
          tagline={lang === "es" ? "Solicitudes locales, sin complicaciones." : "Local requests, kept simple."}
          intro={
            lang === "es"
              ? "Publica lo que buscas y encuentra ofertas de tu comunidad."
              : "Post what you're looking for and find offers from your community."
          }
          introSecondary={product.helper[lang]}
          searchSlot={buscoSearchForm}
          eyebrow={t.eyebrow}
        />

        <main className="space-y-5 overflow-x-hidden sm:space-y-6">
          <section className={LEONIX_LANDING_SECTION} aria-label={lang === "es" ? "Aviso importante" : "Important notice"}>
            <div className={`${LEONIX_LANDING_SECTION_PAD} !py-4 sm:!py-5`}>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556B3E]">
                {lang === "es" ? "Uso de esta sección" : "How to use this section"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{product.notDatingNote[lang]}</p>
            </div>
          </section>

          <LeonixCategoryShortcutSection
            lang={lang as V2Lang}
            surface="landing"
            title={t.quickTopics}
            subtitle=""
            variant="default"
            chips={chips.map((label) => ({
              id: label,
              label,
              href: buildCategoryResultsUrl("busco", lang, { q: label }),
            }))}
          />

          <BuscoLandingRecentListings
            lang={lang}
            title={t.recentTitle}
            emptyNote={t.recentEmpty}
            errorPrefix={t.recentError}
          />
        </main>
      </div>
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
