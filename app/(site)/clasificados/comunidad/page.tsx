"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import { CategoryStandardLandingSearchPanel } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingSearchPanel";
import { appendLangToPath, resolveHubCopyLang, resolveRouteLang } from "@/app/clasificados/lib/hubUrl";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";

type Lang = "es" | "en";

const COPY = {
  es: {
    eyebrow: "CLASIFICADOS · COMUNIDAD",
    ctaPost: "Publicar en Comunidad y Eventos",
    ctaView: "Ver todos los anuncios",
    tagline: "Eventos y avisos cerca de ti.",
    intro: "Encuentra eventos, ayuda, voluntariado y más en tu comunidad.",
    helper: "Busca por palabra clave o ciudad; en resultados filtra por tema.",
  },
  en: {
    eyebrow: "CLASSIFIEDS · COMMUNITY",
    ctaPost: "Post in Community & Events",
    ctaView: "View all listings",
    tagline: "Events and notices near you.",
    intro: "Find events, help, volunteering, and more in your community.",
    helper: "Search by keyword or city; filter by topic on results.",
  },
} as const;

function ComunidadLandingPageInner() {
  const sp = useSearchParams();
  const routeLang = resolveRouteLang(sp?.get("lang"));
  const lang = resolveHubCopyLang(sp?.get("lang"));
  const t = COPY[lang];

  const resultsHref = useMemo(() => buildCategoryResultsUrl("comunidad", routeLang as Lang), [routeLang]);
  const postHref = useMemo(() => appendLangToPath("/clasificados/publicar/comunidad", routeLang as Lang), [routeLang]);

  const comunidadSearchForm = (
    <CategoryStandardLandingSearchPanel
      category="comunidad"
      lang={routeLang as Lang}
      routeLang={routeLang as Lang}
      browseAllHref={resultsHref}
      browseAllLabel={t.ctaView}
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
          tagline={t.tagline}
          intro={t.intro}
          introSecondary={t.helper}
          searchSlot={comunidadSearchForm}
          eyebrow={t.eyebrow}
        />
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
