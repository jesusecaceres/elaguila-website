"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CategoryLandingChipsRail } from "@/app/(site)/clasificados/components/categoryLanding/CategoryLandingChipsRail";
import { CategoryRecentListings } from "@/app/(site)/clasificados/components/categoryLanding/CategoryRecentListings";
import { CategoryStandardLandingPage } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPage";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { CATEGORY_STANDARD_CHIP } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
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

const CHIP_CLASS = CATEGORY_STANDARD_CHIP;

export default function Page() {
  const sp = useSearchParams();
  const routeLang = resolveRouteLang(sp?.get("lang"));
  const lang = resolveHubCopyLang(sp?.get("lang"));
  const t = COPY[lang];
  const chips = QUICK_CHIPS[lang];

  const listaHref = useMemo(() => buildClasesListaUrl("clases", routeLang as Lang), [routeLang]);
  const postHref = useMemo(() => appendLangToPath("/clasificados/publicar/clases", routeLang as Lang), [routeLang]);

  const topicChips = (
    <CategoryLandingChipsRail label={t.quickTopics}>
      {chips.map((label) => (
        <Link key={label} href={buildClasesListaUrl("clases", routeLang as Lang, label)} className={CHIP_CLASS}>
          {label}
        </Link>
      ))}
    </CategoryLandingChipsRail>
  );

  return (
    <CategoryStandardLandingPage
      category="clases"
      lang={lang}
      eyebrow={t.eyebrow}
      publishHref={postHref}
      browseHref={listaHref}
      searchAction={buildCategoryResultsUrl("clases", routeLang as Lang)}
      publishLabel={t.ctaPost}
      browseLabel={t.ctaView}
      searchChips={topicChips}
    >
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
    </CategoryStandardLandingPage>
  );
}
