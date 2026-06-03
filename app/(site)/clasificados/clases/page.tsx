"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { CategoryLandingChipsRail } from "@/app/(site)/clasificados/components/categoryLanding/CategoryLandingChipsRail";
import { CategoryRecentListings } from "@/app/(site)/clasificados/components/categoryLanding/CategoryRecentListings";
import { CategoryStandardLandingBlock } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsChrome";
import { CATEGORY_STANDARD_MAIN, CATEGORY_STANDARD_PAGE_BG } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { CLASES_LANDING_CATEGORY_PILLS, CLASES_QUICK_CHIPS } from "./shared/fields/clasesTaxonomy";
import { buildClasesListaUrl } from "./shared/utils/clasesListaUrl";

type Lang = "es" | "en";

const CATEGORY = "clases";

const COPY = {
  es: {
    eyebrow: "Aprendizaje · Leonix",
    searchPlaceholder: "Buscar: idiomas, música, tutoría…",
    exploreCategory: "Explorar por categoría",
    ctaPost: "Publicar en Clases",
    ctaView: "Ver todos los anuncios",
  },
  en: {
    eyebrow: "Learning · Leonix",
    searchPlaceholder: "Search: languages, music, tutoring…",
    exploreCategory: "Browse by category",
    ctaPost: "Post in Classes",
    ctaView: "View all listings",
  },
} as const;

export default function Page() {
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);
  const t = COPY[lang];
  const chips = CLASES_QUICK_CHIPS[lang];

  const listaHref = useMemo(() => buildClasesListaUrl(CATEGORY, lang), [lang]);
  const postHref = useMemo(() => appendLangToPath("/clasificados/publicar/clases", lang), [lang]);

  const searchChips = (
    <CategoryLandingChipsRail label={lang === "en" ? "Quick topic shortcuts" : "Atajos de temas"}>
      {chips.map((label) => (
        <Link
          key={label}
          href={buildClasesListaUrl(CATEGORY, lang, label)}
          className="inline-flex min-h-[2.25rem] shrink-0 snap-start items-center rounded-full border border-[#D6C7AD] bg-white px-3 py-1.5 text-xs font-medium text-[#1F241C] transition hover:bg-[#FBF7EF] sm:shrink"
        >
          {label}
        </Link>
      ))}
    </CategoryLandingChipsRail>
  );

  return (
    <div className={CATEGORY_STANDARD_PAGE_BG}>
      <Navbar />
      <main className={`${CATEGORY_STANDARD_MAIN} pb-12`}>
        <CategoryStandardLandingBlock
          category="clases"
          lang={lang}
          eyebrow={t.eyebrow}
          searchAction="/clasificados/clases/resultados"
          searchPlaceholder={t.searchPlaceholder}
          publishHref={postHref}
          browseHref={listaHref}
          publishLabel={t.ctaPost}
          browseLabel={t.ctaView}
          searchChips={searchChips}
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
        </CategoryStandardLandingBlock>
      </main>
    </div>
  );
}
