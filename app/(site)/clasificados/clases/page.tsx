"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryLandingChipsRail } from "@/app/(site)/clasificados/components/categoryLanding/CategoryLandingChipsRail";
import { CategoryRecentListings } from "@/app/(site)/clasificados/components/categoryLanding/CategoryRecentListings";
import { CategoryStandardLandingPage } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPage";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { appendLangToPath, resolveHubCopyLang, resolveRouteLang } from "@/app/clasificados/lib/hubUrl";
import { CLASES_LANDING_CATEGORY_PILLS, CLASES_QUICK_CHIPS } from "./shared/fields/clasesTaxonomy";
import { buildClasesListaUrl } from "./shared/utils/clasesListaUrl";

type Lang = "es" | "en";

const COPY = {
  es: {
    eyebrow: "APRENDIZAJE · LEONIX",
    ctaPost: "Publicar en Clases",
    ctaView: "Ver todos los anuncios",
    exploreCategory: "Explorar por categoría",
    quickTopics: "Filtros rápidos",
  },
  en: {
    eyebrow: "LEARNING · LEONIX",
    ctaPost: "Post in Classes",
    ctaView: "View all listings",
    exploreCategory: "Browse by category",
    quickTopics: "Quick filters",
  },
} as const;

export default function Page() {
  const sp = useSearchParams();
  const routeLang = resolveRouteLang(sp?.get("lang"));
  const lang = resolveHubCopyLang(sp?.get("lang"));
  const t = COPY[lang];
  const chips = CLASES_QUICK_CHIPS[lang];

  const listaHref = useMemo(() => buildClasesListaUrl("clases", lang), [lang]);
  const postHref = useMemo(() => appendLangToPath("/clasificados/publicar/clases", routeLang as Lang), [routeLang]);

  const topicChips = (
    <CategoryLandingChipsRail label={t.quickTopics}>
      {chips.map((label) => (
        <Link
          key={label}
          href={buildClasesListaUrl("clases", lang, label)}
          className="inline-flex min-h-[2.25rem] shrink-0 snap-start items-center rounded-full border border-[#D6C7AD] bg-white px-3 py-1.5 text-xs font-medium text-[#1F241C] transition hover:bg-[#FBF7EF] sm:shrink"
        >
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
      searchAction={buildCategoryResultsUrl("clases", lang)}
      publishLabel={t.ctaPost}
      browseLabel={t.ctaView}
      searchChips={topicChips}
      belowHero={
        <section className="rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-4 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556B3E]">{t.exploreCategory}</p>
          <div className="mt-3">
            <CategoryLandingChipsRail label={t.exploreCategory}>
              {CLASES_LANDING_CATEGORY_PILLS.map(({ key, labelEs, labelEn }) => (
                <Link
                  key={key}
                  href={appendLangToPath(`/clasificados/${key}`, lang)}
                  className="inline-flex min-h-[2.25rem] shrink-0 snap-start items-center rounded-full border border-[#D6C7AD] bg-[#FAF6EE] px-3.5 py-1.5 text-xs font-medium text-[#1F241C] transition hover:bg-[#FBF7EF] sm:shrink"
                >
                  {lang === "es" ? labelEs : labelEn}
                </Link>
              ))}
            </CategoryLandingChipsRail>
          </div>
        </section>
      }
    >
      <CategoryRecentListings
        category="clases"
        lang={lang}
        title={lang === "es" ? "Anuncios recientes" : "Recent listings"}
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
