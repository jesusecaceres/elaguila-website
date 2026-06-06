"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CategoryLandingChipsRail } from "@/app/(site)/clasificados/components/categoryLanding/CategoryLandingChipsRail";
import { CategoryRecentListings } from "@/app/(site)/clasificados/components/categoryLanding/CategoryRecentListings";
import { CategoryStandardLandingPage } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPage";
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

const CHIP_CLASS =
  "inline-flex min-h-[2.75rem] shrink-0 snap-start items-center rounded-full border border-[#D6C7AD] bg-[#FAF6EE] px-3.5 py-1.5 text-xs font-medium text-[#1F241C] transition hover:border-[#C9A84A]/55 hover:bg-[#FBF7EF] sm:shrink";

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
