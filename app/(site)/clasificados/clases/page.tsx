"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FiBookOpen, FiCoffee, FiGlobe, FiHeart, FiStar, FiSun, FiUsers, FiZap } from "react-icons/fi";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategoryImageDiscoveryGrid,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import { CategoryStandardLandingSearchPanel } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingSearchPanel";
import { appendLangToPath, resolveHubCopyLang, resolveRouteLang } from "@/app/clasificados/lib/hubUrl";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { CLASES_CHILD_CATEGORY_IMAGE } from "./clasesChildCategoryImages";

type Lang = "es" | "en";

const COPY = {
  es: {
    eyebrow: "CLASIFICADOS · APRENDIZAJE",
    ctaPost: "Publicar en Clases",
    ctaView: "Ver todos los anuncios",
    tagline: "Aprende cerca de ti.",
    intro: "Encuentra clases de idiomas, música, arte, tutoría y más.",
    helper: "Busca por palabra clave o ciudad; en resultados filtra por tipo, modalidad y más.",
    discoveryTitle: "Explora por tema",
    discoverySubtitle: "Elige un tema para ver clases en resultados.",
  },
  en: {
    eyebrow: "CLASSIFIEDS · LEARNING",
    ctaPost: "Post in Classes",
    ctaView: "View all listings",
    tagline: "Learn near you.",
    intro: "Find language, music, art, tutoring, and more classes.",
    helper: "Search by keyword or city; filter by type, modality, and more on results.",
    discoveryTitle: "Explore by subject",
    discoverySubtitle: "Choose a subject to view classes on results.",
  },
} as const;

const CLASES_DISCOVERY_TILES = [
  { value: "ingles", labelEs: "Inglés", labelEn: "English", icon: FiGlobe },
  { value: "espanol", labelEs: "Español", labelEn: "Spanish", icon: FiBookOpen },
  { value: "fitness", labelEs: "Fitness", labelEn: "Fitness", icon: FiZap },
  { value: "yoga", labelEs: "Yoga", labelEn: "Yoga", icon: FiSun },
  { value: "baile_danza", labelEs: "Baile / Danza", labelEn: "Dance", icon: FiStar },
  { value: "musica", labelEs: "Música", labelEn: "Music", icon: FiHeart },
  { value: "tutoria", labelEs: "Tutoría", labelEn: "Tutoring", icon: FiUsers },
  { value: "cocina", labelEs: "Cocina", labelEn: "Cooking", icon: FiCoffee },
] as const;

function ClasesLandingPageInner() {
  const sp = useSearchParams();
  const routeLang = resolveRouteLang(sp?.get("lang"));
  const lang = resolveHubCopyLang(sp?.get("lang"));
  const t = COPY[lang];

  const resultsHref = useMemo(() => buildCategoryResultsUrl("clases", routeLang as Lang), [routeLang]);
  const postHref = useMemo(() => appendLangToPath("/clasificados/publicar/clases", routeLang as Lang), [routeLang]);

  const discoveryItems = useMemo(
    () =>
      CLASES_DISCOVERY_TILES.map((tile) => {
        const label = lang === "es" ? tile.labelEs : tile.labelEn;
        return {
          id: tile.value,
          label,
          href: buildCategoryResultsUrl("clases", routeLang as Lang, { classType: tile.value }),
          imageSrc: CLASES_CHILD_CATEGORY_IMAGE[tile.value],
          imageAlt: label,
          icon: tile.icon,
        };
      }),
    [lang, routeLang],
  );

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
      <div className="px-3.5 pb-14 sm:px-5 lg:px-6">
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

        <main className="space-y-6 overflow-x-hidden sm:space-y-8">
          <LeonixCategoryImageDiscoveryGrid
            lang={lang as V2Lang}
            surface="landing"
            heading={t.discoveryTitle}
            subtitle={t.discoverySubtitle}
            items={discoveryItems}
          />
        </main>
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
