"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
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
import { buildComunidadListaUrl } from "./shared/utils/comunidadListaUrl";

type Lang = "es" | "en";

const QUICK_CHIPS: Record<Lang, readonly string[]> = {
  es: ["Eventos", "Ayuda", "Avisos", "Voluntariado", "Familias", "Comunidad", "Gratis"],
  en: ["Events", "Help", "Notices", "Volunteering", "Families", "Community", "Free"],
};

const COPY = {
  es: {
    eyebrow: "CLASIFICADOS · COMUNIDAD",
    ctaPost: "Publicar en Comunidad y Eventos",
    ctaView: "Ver todos los anuncios",
    quickTopics: "Filtros rápidos",
    backHub: "Volver a Clasificados",
  },
  en: {
    eyebrow: "CLASSIFIEDS · COMMUNITY",
    ctaPost: "Post in Community & Events",
    ctaView: "View all listings",
    quickTopics: "Quick filters",
    backHub: "Back to Classifieds",
  },
} as const;

function ComunidadLandingPageInner() {
  const sp = useSearchParams();
  const routeLang = resolveRouteLang(sp?.get("lang"));
  const lang = resolveHubCopyLang(sp?.get("lang"));
  const t = COPY[lang];
  const chips = QUICK_CHIPS[lang];

  const listaHref = useMemo(() => buildComunidadListaUrl("comunidad", routeLang as Lang), [routeLang]);
  const postHref = useMemo(() => appendLangToPath("/clasificados/publicar/comunidad", routeLang as Lang), [routeLang]);
  const hubHref = useMemo(() => appendLangToPath("/clasificados", routeLang as Lang), [routeLang]);

  const comunidadSearchForm = (
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
        title={lang === "es" ? "Comunidad y Eventos" : "Community & Events"}
        tagline=""
        intro={lang === "es" ? "Encuentra eventos, ayuda, voluntariado y más en tu comunidad." : "Find events, help, volunteering, and more in your community."}
        introSecondary=""
        searchSlot={comunidadSearchForm}
        eyebrow={t.eyebrow}
      />
      <main className="mx-auto max-w-[1280px] space-y-6 overflow-x-hidden px-3.5 pb-14 sm:px-4 sm:space-y-8 lg:px-5">
        <LeonixCategoryShortcutSection
          lang={lang as V2Lang}
          surface="landing"
          title={t.quickTopics}
          subtitle=""
          variant="default"
          chips={chips.map((label) => ({ id: label, label, href: buildComunidadListaUrl("comunidad", routeLang as Lang, label) }))}
        />
        <CategoryRecentListings
          category="comunidad"
          lang={lang}
          previewLimit={4}
          title={lang === "es" ? "Eventos recientes" : "Recent events"}
          emptyNote={
            lang === "es"
              ? "Aún no hay eventos de Comunidad y Eventos publicados en Leonix Clasificados."
              : "No Community & Events listings published on Leonix Clasificados yet."
          }
          errorPrefix={lang === "es" ? "No se pudo cargar la lista:" : "Could not load listings:"}
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

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ComunidadLandingPageInner />
    </Suspense>
  );
}
