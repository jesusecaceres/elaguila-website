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
import { mascotasPerdidosPublishEntryUrl } from "./shared/mascotasPerdidosBrowseUrls";
import { mascotasPerdidosLangFromSearchParams, mascotasPerdidosRouteLangFromSearchParams } from "./shared/mascotasPerdidosShellCopy";

const COPY = {
  es: {
    eyebrow: "CLASIFICADOS · MASCOTAS Y PERDIDOS",
    ctaPost: "Publicar en Mascotas y Perdidos",
    ctaView: "Ver todos los anuncios",
    tagline: "Avisos locales cuando más importa.",
    intro: "Encuentra mascotas perdidas, avisa sobre mascotas encontradas y más.",
    helper: "Busca por ciudad o tipo de aviso; comparte información clara y reciente.",
  },
  en: {
    eyebrow: "CLASSIFIEDS · PETS & LOST",
    ctaPost: "Post in Pets & Lost",
    ctaView: "View all listings",
    tagline: "Local notices when it matters most.",
    intro: "Find lost pets, report found pets, and more.",
    helper: "Search by city or notice type; share clear, timely information.",
  },
} as const;

function MascotasPerdidosLandingPageInner() {
  const sp = useSearchParams();
  const lang = mascotasPerdidosLangFromSearchParams(sp);
  const routeLang = mascotasPerdidosRouteLangFromSearchParams(sp);
  const t = COPY[lang];

  const postHref = useMemo(() => mascotasPerdidosPublishEntryUrl(routeLang), [routeLang]);
  const resultsHref = useMemo(
    () => buildCategoryResultsUrl("mascotas-y-perdidos", routeLang as "es" | "en"),
    [routeLang],
  );

  const mascotasSearchForm = (
    <CategoryStandardLandingSearchPanel
      category="mascotas-y-perdidos"
      lang={routeLang as "es" | "en"}
      routeLang={routeLang as "es" | "en"}
      browseAllHref={resultsHref}
      browseAllLabel={t.ctaView}
      publishHref={postHref}
      publishLabel={t.ctaPost}
    />
  );

  return (
    <LeonixCategoryPageShell surface="landing">
      <div className="px-3.5 pb-8 sm:px-5 lg:px-6">
        <LeonixCategoryHeroGateway
          lang={lang as V2Lang}
          surface="landing"
          title={lang === "es" ? "Mascotas y Perdidos" : "Pets & Lost"}
          tagline={t.tagline}
          intro={t.intro}
          introSecondary={t.helper}
          searchSlot={mascotasSearchForm}
          eyebrow={t.eyebrow}
        />
      </div>
    </LeonixCategoryPageShell>
  );
}

export default function MascotasPerdidosLandingPage() {
  return (
    <Suspense fallback={null}>
      <MascotasPerdidosLandingPageInner />
    </Suspense>
  );
}
