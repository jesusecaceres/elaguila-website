"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryLandingChipsRail } from "@/app/(site)/clasificados/components/categoryLanding/CategoryLandingChipsRail";
import { CategoryRecentListings } from "@/app/(site)/clasificados/components/categoryLanding/CategoryRecentListings";
import { CategoryStandardLandingPage } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPage";
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

const CHIP_CLASS =
  "inline-flex min-h-[2.75rem] shrink-0 snap-start items-center rounded-full border border-[#D6C7AD] bg-[#FAF6EE] px-3.5 py-1.5 text-xs font-medium text-[#1F241C] transition hover:border-[#C9A84A]/55 hover:bg-[#FBF7EF] sm:shrink";

export default function Page() {
  const sp = useSearchParams();
  const routeLang = resolveRouteLang(sp?.get("lang"));
  const lang = resolveHubCopyLang(sp?.get("lang"));
  const t = COPY[lang];
  const chips = QUICK_CHIPS[lang];

  const listaHref = useMemo(() => buildComunidadListaUrl("comunidad", lang), [lang]);
  const postHref = useMemo(() => appendLangToPath("/clasificados/publicar/comunidad", routeLang as Lang), [routeLang]);
  const hubHref = useMemo(() => appendLangToPath("/clasificados", routeLang as Lang), [routeLang]);

  const topicChips = (
    <CategoryLandingChipsRail label={t.quickTopics}>
      {chips.map((label) => (
        <Link key={label} href={buildComunidadListaUrl("comunidad", lang, label)} className={CHIP_CLASS}>
          {label}
        </Link>
      ))}
    </CategoryLandingChipsRail>
  );

  return (
    <CategoryStandardLandingPage
      category="comunidad"
      lang={lang}
      eyebrow={t.eyebrow}
      publishHref={postHref}
      browseHref={listaHref}
      searchAction={buildCategoryResultsUrl("comunidad", lang)}
      publishLabel={t.ctaPost}
      browseLabel={t.ctaView}
      searchChips={topicChips}
    >
      <CategoryRecentListings
        category="comunidad"
        lang={lang}
        title={lang === "es" ? "Anuncios recientes" : "Recent listings"}
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
    </CategoryStandardLandingPage>
  );
}
