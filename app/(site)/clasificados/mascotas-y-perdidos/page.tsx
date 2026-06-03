"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CategoryStandardLandingPage } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPage";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { MASCOTAS_PERDIDOS_NOTICE_OPTIONS } from "@/app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosTaxonomy";
import { MascotasPerdidosLandingRecentListings } from "./MascotasPerdidosLandingRecentListings";
import { mascotasPerdidosPublishEntryUrl, mascotasPerdidosTipoChipHref } from "./shared/mascotasPerdidosBrowseUrls";
import { mascotasPerdidosLangFromSearchParams } from "./shared/mascotasPerdidosShellCopy";

const COPY = {
  es: {
    eyebrow: "Mascotas y Perdidos · Leonix",
    ctaPost: "Publicar en Mascotas y Perdidos",
    ctaView: "Ver todos los anuncios",
    typesTitle: "Tipos de aviso",
    recentTitle: "Avisos recientes",
    recentEmpty: "Aún no hay avisos publicados. Sé el primero en publicar un aviso gratuito.",
    recentError: "No se pudieron cargar los avisos recientes.",
    backHub: "Volver a Clasificados",
  },
  en: {
    eyebrow: "Pets & Lost & Found · Leonix",
    ctaPost: "Post in Pets & Lost & Found",
    ctaView: "View all listings",
    typesTitle: "Notice types",
    recentTitle: "Recent notices",
    recentEmpty: "No published notices yet. Be the first to post a free notice.",
    recentError: "Could not load recent notices.",
    backHub: "Back to Classifieds",
  },
} as const;

export default function MascotasPerdidosLandingPage() {
  const sp = useSearchParams();
  const lang = mascotasPerdidosLangFromSearchParams(sp);
  const t = COPY[lang];

  const postHref = useMemo(() => mascotasPerdidosPublishEntryUrl(lang), [lang]);
  const resultsHref = useMemo(() => buildCategoryResultsUrl("mascotas-y-perdidos", lang), [lang]);
  const hubHref = useMemo(() => appendLangToPath("/clasificados", lang), [lang]);

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
      belowHero={
        <section className="rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-4 sm:px-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[#556B3E]">{t.typesTitle}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {MASCOTAS_PERDIDOS_NOTICE_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={mascotasPerdidosTipoChipHref(lang, opt.value)}
                className="inline-flex min-h-[2.25rem] items-center rounded-full border border-[#C9A84A]/50 bg-[#FAF6EE] px-3 py-1.5 text-xs font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]"
                data-testid={`mascotas-landing-tipo-${opt.value}`}
              >
                {lang === "en" ? opt.labelEn : opt.labelEs}
              </Link>
            ))}
          </div>
        </section>
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
