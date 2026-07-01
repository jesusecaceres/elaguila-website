"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryLandingChipsRail } from "@/app/(site)/clasificados/components/categoryLanding/CategoryLandingChipsRail";
import { CategoryStandardLandingPage } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPage";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { categoryStandardQuickFilters, CATEGORY_STANDARD_CHIP } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import { BuscoLandingRecentListings } from "./BuscoLandingRecentListings";
import { BUSCO_PRODUCT, buscoLangFromSearchParams, buscoPathWithLang, buscoRouteLangFromSearchParams } from "./shared/buscoShellCopy";

const COPY = {
  es: {
    eyebrow: "CLASIFICADOS · SOLICITUDES",
    ctaPost: "Publicar solicitud",
    ctaView: "Ver todos los anuncios",
    quickTopics: "Filtros rápidos",
    recentTitle: "Solicitudes recientes",
    recentEmpty:
      "Aún no hay solicitudes publicadas. Sé el primero en publicar lo que buscas en tu comunidad.",
    recentError: "No se pudieron cargar las solicitudes recientes.",
    backHub: "Volver a Clasificados",
  },
  en: {
    eyebrow: "CLASSIFIEDS · REQUESTS",
    ctaPost: "Post request",
    ctaView: "View all listings",
    quickTopics: "Quick filters",
    recentTitle: "Recent requests",
    recentEmpty:
      "No published requests yet. Be the first to post what you are looking for in your community.",
    recentError: "Could not load recent requests.",
    backHub: "Back to Classifieds",
  },
} as const;

const CHIP_CLASS = CATEGORY_STANDARD_CHIP;

export default function BuscoLandingPage() {
  const sp = useSearchParams();
  const lang = buscoLangFromSearchParams(sp);
  const routeLang = buscoRouteLangFromSearchParams(sp);
  const t = COPY[lang];
  const product = BUSCO_PRODUCT;
  const chips = categoryStandardQuickFilters("busco", lang);

  const postHref = useMemo(() => buscoPathWithLang("/publicar/busco/quick", routeLang), [routeLang]);
  const resultsHref = useMemo(() => buildCategoryResultsUrl("busco", routeLang as "es" | "en"), [routeLang]);
  const hubHref = useMemo(() => buscoPathWithLang("/clasificados", routeLang), [routeLang]);

  const topicChips = (
    <CategoryLandingChipsRail label={t.quickTopics}>
      {chips.map((label) => (
        <Link
          key={label}
          href={buildCategoryResultsUrl("busco", lang, { q: label })}
          className={CHIP_CLASS}
        >
          {label}
        </Link>
      ))}
    </CategoryLandingChipsRail>
  );

  return (
    <CategoryStandardLandingPage
      category="busco"
      lang={lang}
      eyebrow={t.eyebrow}
      publishHref={postHref}
      browseHref={resultsHref}
      searchAction={buildCategoryResultsUrl("busco", lang)}
      publishLabel={t.ctaPost}
      browseLabel={t.ctaView}
      searchChips={topicChips}
      belowHero={
        <section className="rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-4 text-sm leading-relaxed text-[#3D3428] sm:px-5">
          <p>{product.helper[lang]}</p>
          <p className="mt-3 rounded-lg border border-[#D6C7AD]/60 bg-[#FAF6EE] px-3 py-2.5 text-xs font-medium text-[#556B3E]">
            {product.notDatingNote[lang]}
          </p>
        </section>
      }
    >
      <BuscoLandingRecentListings
        lang={lang}
        title={t.recentTitle}
        emptyNote={t.recentEmpty}
        errorPrefix={t.recentError}
      />
      <p className="text-center">
        <Link href={hubHref} className="text-sm font-medium text-[#556B3E] underline-offset-2 hover:text-[#7A1E2C]">
          {t.backHub}
        </Link>
      </p>
    </CategoryStandardLandingPage>
  );
}
