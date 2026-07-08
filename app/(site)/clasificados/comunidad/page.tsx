"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryRecentListings } from "@/app/(site)/clasificados/components/categoryLanding/CategoryRecentListings";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryShortcutSection,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
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
  },
  en: {
    eyebrow: "CLASSIFIEDS · COMMUNITY",
    ctaPost: "Post in Community & Events",
    ctaView: "View all listings",
    quickTopics: "Quick filters",
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
      <div className="px-3.5 pb-8 sm:px-5 lg:px-6">
        <LeonixCategoryHeroGateway
          lang={lang as V2Lang}
          surface="landing"
          title={lang === "es" ? "Comunidad y Eventos" : "Community & Events"}
          tagline={lang === "es" ? "Eventos y avisos cerca de ti." : "Events and notices near you."}
          intro={
            lang === "es"
              ? "Encuentra eventos, ayuda, voluntariado y más en tu comunidad."
              : "Find events, help, volunteering, and more in your community."
          }
          introSecondary={
            lang === "es"
              ? "Busca por palabra clave o ciudad; en resultados filtra por tema."
              : "Search by keyword or city; filter by topic on results."
          }
          searchSlot={comunidadSearchForm}
          eyebrow={t.eyebrow}
        />

        <main className="space-y-5 overflow-x-hidden sm:space-y-6">
          <LeonixCategoryShortcutSection
            lang={lang as V2Lang}
            surface="landing"
            title={t.quickTopics}
            subtitle=""
            variant="default"
            chips={chips.map((label) => ({
              id: label,
              label,
              href: buildComunidadListaUrl("comunidad", routeLang as Lang, label),
            }))}
          />

          <CategoryRecentListings
            category="comunidad"
            lang={lang}
            previewLimit={4}
            title={lang === "es" ? "Eventos recientes" : "Recent events"}
            emptyNote={
              lang === "es"
                ? "Aún no hay eventos publicados. Sé el primero en compartir algo con tu comunidad."
                : "No events published yet. Be the first to share something with your community."
            }
            errorPrefix={lang === "es" ? "No se pudo cargar la lista:" : "Could not load listings:"}
          />
        </main>
      </div>
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
