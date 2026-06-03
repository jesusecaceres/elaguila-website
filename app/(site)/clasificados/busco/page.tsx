"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { CategoryStandardLandingBlock } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsChrome";
import { CategoryStandardLandingPageShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPageShell";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import { BuscoLandingRecentListings } from "./BuscoLandingRecentListings";
import { BUSCO_PRODUCT, buscoLangFromSearchParams, buscoPathWithLang } from "./shared/buscoShellCopy";

const COPY = {
  es: {
    eyebrow: "Solicitudes · Leonix",
    searchPlaceholder: "Buscar solicitudes, necesidades…",
    ctaPost: "Publicar solicitud",
    ctaView: "Ver todos los anuncios",
    recentTitle: "Solicitudes recientes",
    recentEmpty:
      "Aún no hay solicitudes publicadas. Sé el primero en publicar lo que buscas en tu comunidad.",
    recentError: "No se pudieron cargar las solicitudes recientes.",
    backHub: "Volver a Clasificados",
  },
  en: {
    eyebrow: "Requests · Leonix",
    searchPlaceholder: "Search requests, needs…",
    ctaPost: "Post request",
    ctaView: "View all listings",
    recentTitle: "Recent requests",
    recentEmpty:
      "No published requests yet. Be the first to post what you are looking for in your community.",
    recentError: "Could not load recent requests.",
    backHub: "Back to Classifieds",
  },
} as const;

export default function BuscoLandingPage() {
  const sp = useSearchParams();
  const lang = buscoLangFromSearchParams(sp);
  const t = COPY[lang];
  const product = BUSCO_PRODUCT;

  const postHref = useMemo(() => buscoPathWithLang("/publicar/busco/quick", lang), [lang]);
  const resultsHref = useMemo(() => buscoPathWithLang("/clasificados/busco/resultados", lang), [lang]);
  const hubHref = useMemo(() => appendLangToPath("/clasificados", lang), [lang]);

  return (
    <CategoryStandardLandingPageShell>
        <CategoryStandardLandingBlock
          category="busco"
          lang={lang}
          eyebrow={t.eyebrow}
          title={product.title[lang]}
          description={product.description[lang]}
          searchAction="/clasificados/busco/resultados"
          searchPlaceholder={t.searchPlaceholder}
          publishHref={postHref}
          browseHref={resultsHref}
          publishLabel={t.ctaPost}
          browseLabel={t.ctaView}
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
        </CategoryStandardLandingBlock>
    </CategoryStandardLandingPageShell>
  );
}
