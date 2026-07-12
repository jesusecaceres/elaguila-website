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
    eyebrow: "CLASIFICADOS · APRENDIZAJE",
    ctaPost: "Publicar en Clases",
    ctaView: "Ver todos los anuncios",
    tagline: "Aprende cerca de ti.",
    intro: "Encuentra clases de idiomas, música, arte, tutoría y más.",
    helper: "Busca por palabra clave o ciudad; en resultados filtra por tipo, modalidad y más.",
  },
  en: {
    eyebrow: "CLASSIFIEDS · LEARNING",
    ctaPost: "Post in Classes",
    ctaView: "View all listings",
    tagline: "Learn near you.",
    intro: "Find language, music, art, tutoring, and more classes.",
    helper: "Search by keyword or city; filter by type, modality, and more on results.",
  },
} as const;

function ClasesLandingPageInner() {
  const sp = useSearchParams();
  const routeLang = resolveRouteLang(sp?.get("lang"));
  const lang = resolveHubCopyLang(sp?.get("lang"));
  const t = COPY[lang];

  const resultsHref = useMemo(() => buildCategoryResultsUrl("clases", routeLang as Lang), [routeLang]);
  const postHref = useMemo(() => appendLangToPath("/clasificados/publicar/clases", routeLang as Lang), [routeLang]);

  const clasesSearchForm = (
    <CategoryStandardLandingSearchPanel
      category="clases"
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
          title={lang === "es" ? "Clases" : "Classes"}
          tagline={t.tagline}
          intro={t.intro}
          introSecondary={t.helper}
          searchSlot={clasesSearchForm}
          eyebrow={t.eyebrow}
        />
      </div>
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
