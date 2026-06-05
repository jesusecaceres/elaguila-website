"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryStandardLandingPage } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPage";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { MASCOTAS_PERDIDOS_NOTICE_OPTIONS } from "@/app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy";
import { MascotasPerdidosLandingRecentListings } from "./MascotasPerdidosLandingRecentListings";
import { mascotasPerdidosPublishEntryUrl, mascotasPerdidosTipoChipHref } from "./shared/mascotasPerdidosBrowseUrls";
import { mascotasPerdidosLangFromSearchParams, mascotasPerdidosPathWithLang, mascotasPerdidosRouteLangFromSearchParams } from "./shared/mascotasPerdidosShellCopy";

const COPY = {
  es: {
    eyebrow: "MASCOTAS Y PERDIDOS · LEONIX",
    ctaPost: "Publicar en Mascotas y Perdidos",
    ctaView: "Ver todos los anuncios",
    typesTitle: "Filtros rápidos",
    recentTitle: "Avisos recientes",
    recentEmpty: "Aún no hay avisos publicados. Sé el primero en publicar un aviso gratuito.",
    recentError: "No se pudieron cargar los avisos recientes.",
    backHub: "Volver a Clasificados",
  },
  en: {
    eyebrow: "PETS & LOST · LEONIX",
    ctaPost: "Post in Pets & Lost",
    ctaView: "View all listings",
    typesTitle: "Quick filters",
    recentTitle: "Recent notices",
    recentEmpty: "No published notices yet. Be the first to post a free notice.",
    recentError: "Could not load recent notices.",
    backHub: "Back to Classifieds",
  },
} as const;

export default function MascotasPerdidosLandingPage() {
  const sp = useSearchParams();
  const lang = mascotasPerdidosLangFromSearchParams(sp);
  const routeLang = mascotasPerdidosRouteLangFromSearchParams(sp);
  const t = COPY[lang];

  const postHref = useMemo(() => mascotasPerdidosPublishEntryUrl(routeLang), [routeLang]);
  const resultsHref = useMemo(() => buildCategoryResultsUrl("mascotas-y-perdidos", routeLang as "es" | "en"), [routeLang]);
  const hubHref = useMemo(() => mascotasPerdidosPathWithLang("/clasificados", routeLang), [routeLang]);

  return (
    <CategoryStandardLandingPage
      category="mascotas-y-perdidos"
      lang={lang}
      eyebrow={t.eyebrow}
      publishHref={postHref}
      browseHref={resultsHref}
      searchAction={buildCategoryResultsUrl("mascotas-y-perdidos", lang)}
      publishLabel={t.ctaPost}
      browseLabel={t.ctaView}
      searchChips={
        <div className="flex flex-wrap gap-2">
          {MASCOTAS_PERDIDOS_NOTICE_OPTIONS.map((opt) => (
            <Link
              key={opt.value}
              href={mascotasPerdidosTipoChipHref(routeLang, opt.value)}
              className="inline-flex min-h-[2.25rem] shrink-0 snap-start items-center rounded-full border border-[#D6C7AD] bg-[#FAF6EE] px-3.5 py-1.5 text-xs font-medium text-[#1F241C] transition hover:border-[#C9A84A]/55 hover:bg-[#FBF7EF]"
              data-testid={`mascotas-landing-tipo-${opt.value}`}
            >
              {lang === "en" ? opt.labelEn : opt.labelEs}
            </Link>
          ))}
        </div>
      }
    >
      <MascotasPerdidosLandingRecentListings
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
