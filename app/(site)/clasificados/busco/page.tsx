"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import { CategoryStandardLandingSearchPanel } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingSearchPanel";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { BUSCO_PRODUCT, buscoLangFromSearchParams, buscoPathWithLang, buscoRouteLangFromSearchParams } from "./shared/buscoShellCopy";

const COPY = {
  es: {
    eyebrow: "CLASIFICADOS · SOLICITUDES",
    ctaPost: "Publicar solicitud",
    ctaView: "Ver todos los anuncios",
    tagline: "Solicitudes locales, sin complicaciones.",
  },
  en: {
    eyebrow: "CLASSIFIEDS · REQUESTS",
    ctaPost: "Post request",
    ctaView: "View all listings",
    tagline: "Local requests, kept simple.",
  },
} as const;

function BuscoLandingPageInner() {
  const sp = useSearchParams();
  const lang = buscoLangFromSearchParams(sp);
  const routeLang = buscoRouteLangFromSearchParams(sp);
  const t = COPY[lang];
  const product = BUSCO_PRODUCT;

  const postHref = useMemo(() => buscoPathWithLang("/publicar/busco/quick", routeLang), [routeLang]);
  const resultsHref = useMemo(() => buildCategoryResultsUrl("busco", routeLang as "es" | "en"), [routeLang]);

  const buscoSearchForm = (
    <CategoryStandardLandingSearchPanel
      category="busco"
      lang={routeLang as "es" | "en"}
      routeLang={routeLang as "es" | "en"}
      browseAllHref={resultsHref}
      browseAllLabel={t.ctaView}
      publishHref={postHref}
      publishLabel={t.ctaPost}
    />
  );

  const introSecondary =
    lang === "es"
      ? `${product.helper.es} ${product.notDatingNote.es}`
      : `${product.helper.en} ${product.notDatingNote.en}`;

  return (
    <LeonixCategoryPageShell surface="landing">
      <div className="px-3.5 pb-8 sm:px-5 lg:px-6">
        <LeonixCategoryHeroGateway
          lang={lang as V2Lang}
          surface="landing"
          title={lang === "es" ? "Busco / Se Busca" : "I'm Looking For / Looking For"}
          tagline={t.tagline}
          intro={
            lang === "es"
              ? "Publica lo que buscas y encuentra ofertas de tu comunidad."
              : "Post what you're looking for and find offers from your community."
          }
          introSecondary={introSecondary}
          searchSlot={buscoSearchForm}
          eyebrow={t.eyebrow}
        />
      </div>
    </LeonixCategoryPageShell>
  );
}

export default function BuscoLandingPage() {
  return (
    <Suspense fallback={null}>
      <BuscoLandingPageInner />
    </Suspense>
  );
}
