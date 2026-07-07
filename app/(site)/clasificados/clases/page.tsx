"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CategoryLandingChipsRail } from "@/app/(site)/clasificados/components/categoryLanding/CategoryLandingChipsRail";
import { CategoryRecentListings } from "@/app/(site)/clasificados/components/categoryLanding/CategoryRecentListings";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryShortcutSection,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { appendLangToPath, resolveHubCopyLang, resolveRouteLang } from "@/app/clasificados/lib/hubUrl";
import { buildClasesListaUrl } from "./shared/utils/clasesListaUrl";

type Lang = "es" | "en";

const QUICK_CHIPS: Record<Lang, readonly string[]> = {
  es: ["Idiomas", "Música", "Tutoría", "Arte", "Computación", "Oficios", "Niños"],
  en: ["Languages", "Music", "Tutoring", "Art", "Computers", "Trades", "Kids"],
};

const COPY = {
  es: {
    eyebrow: "CLASIFICADOS · APRENDIZAJE",
    ctaPost: "Publicar en Clases",
    ctaView: "Ver todos los anuncios",
    quickTopics: "Filtros rápidos",
  },
  en: {
    eyebrow: "CLASSIFIEDS · LEARNING",
    ctaPost: "Post in Classes",
    ctaView: "View all listings",
    quickTopics: "Quick filters",
  },
} as const;

function ClasesLandingPageInner() {
  const sp = useSearchParams();
  const routeLang = resolveRouteLang(sp?.get("lang"));
  const lang = resolveHubCopyLang(sp?.get("lang"));
  const t = COPY[lang];
  const chips = QUICK_CHIPS[lang];

  const listaHref = useMemo(() => buildClasesListaUrl("clases", routeLang as Lang), [routeLang]);
  const postHref = useMemo(() => appendLangToPath("/clasificados/publicar/clases", routeLang as Lang), [routeLang]);

  const clasesSearchForm = (
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
      browseAllHref={listaHref}
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
        title={lang === "es" ? "Clases" : "Classes"}
        tagline=""
        intro={lang === "es" ? "Encuentra clases de idiomas, música, arte, tutoría y más." : "Find language, music, art, tutoring, and more classes."}
        introSecondary=""
        searchSlot={clasesSearchForm}
        eyebrow={t.eyebrow}
      />
      <main className="mx-auto max-w-[1280px] space-y-6 overflow-x-hidden px-3.5 pb-14 sm:px-4 sm:space-y-8 lg:px-5">
        <LeonixCategoryShortcutSection
          lang={lang as V2Lang}
          surface="landing"
          title={t.quickTopics}
          subtitle=""
          variant="default"
          chips={chips.map((label) => ({ id: label, label, href: buildClasesListaUrl("clases", routeLang as Lang, label) }))}
        />
        <CategoryRecentListings
          category="clases"
          lang={lang}
          previewLimit={4}
          title={lang === "es" ? "Clases recientes" : "Recent classes"}
          emptyNote={
            lang === "es"
              ? "Aún no hay clases publicadas en Leonix Clasificados."
              : "No Classes listings published on Leonix Clasificados yet."
          }
          errorPrefix={lang === "es" ? "No se pudo cargar la lista:" : "Could not load listings:"}
        />
      </main>
    </LeonixCategoryPageShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ClasesLandingPageInner />
    </Suspense>
  );
}
