"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FiBriefcase, FiHeart, FiMapPin, FiShoppingBag, FiStar, FiTool, FiTruck, FiUsers } from "react-icons/fi";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategoryImageDiscoveryGrid,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import { CategoryStandardLandingSearchPanel } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingSearchPanel";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { BUSCO_PRODUCT, buscoLangFromSearchParams, buscoPathWithLang, buscoRouteLangFromSearchParams } from "./shared/buscoShellCopy";
import { BUSCO_CHILD_CATEGORY_IMAGE } from "./buscoChildCategoryImages";

const COPY = {
  es: {
    eyebrow: "CLASIFICADOS · SOLICITUDES",
    ctaPost: "Publicar solicitud",
    ctaView: "Ver todos los anuncios",
    tagline: "Solicitudes locales, sin complicaciones.",
    discoveryTitle: "Explora por tipo de solicitud",
    discoverySubtitle: "Elige una categoría para ver solicitudes en resultados.",
  },
  en: {
    eyebrow: "CLASSIFIEDS · REQUESTS",
    ctaPost: "Post request",
    ctaView: "View all listings",
    tagline: "Local requests, kept simple.",
    discoveryTitle: "Explore by request type",
    discoverySubtitle: "Choose a category to view requests on results.",
  },
} as const;

const BUSCO_DISCOVERY_TILES = [
  { value: "articulo", labelEs: "Busco artículo", labelEn: "Looking for item", icon: FiShoppingBag },
  { value: "ayuda", labelEs: "Busco ayuda", labelEn: "Looking for help", icon: FiHeart },
  { value: "servicio", labelEs: "Busco servicio", labelEn: "Looking for service", icon: FiTool },
  { value: "grupo_actividad", labelEs: "Busco grupo o actividad", labelEn: "Looking for group or activity", icon: FiUsers },
  { value: "transporte", labelEs: "Busco transporte / ride", labelEn: "Looking for ride / transport", icon: FiTruck },
  { value: "voluntarios", labelEs: "Busco voluntarios", labelEn: "Looking for volunteers", icon: FiStar },
  { value: "recurso_comunitario", labelEs: "Busco recurso comunitario", labelEn: "Looking for community resource", icon: FiMapPin },
  { value: "trabajo", labelEs: "Busco trabajo / trabajo extra", labelEn: "Looking for work / side work", icon: FiBriefcase },
] as const;

function BuscoLandingPageInner() {
  const sp = useSearchParams();
  const lang = buscoLangFromSearchParams(sp);
  const routeLang = buscoRouteLangFromSearchParams(sp);
  const t = COPY[lang];
  const product = BUSCO_PRODUCT;

  const postHref = useMemo(() => buscoPathWithLang("/publicar/busco/quick", routeLang), [routeLang]);
  const resultsHref = useMemo(() => buildCategoryResultsUrl("busco", routeLang as "es" | "en"), [routeLang]);

  const discoveryItems = useMemo(
    () =>
      BUSCO_DISCOVERY_TILES.map((tile) => {
        const label = lang === "es" ? tile.labelEs : tile.labelEn;
        return {
          id: tile.value,
          label,
          href: buildCategoryResultsUrl("busco", routeLang as "es" | "en", { tipo: tile.value }),
          imageSrc: BUSCO_CHILD_CATEGORY_IMAGE[tile.value],
          imageAlt: label,
          icon: tile.icon,
        };
      }),
    [lang, routeLang],
  );

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
      <div className="px-3.5 pb-14 sm:px-5 lg:px-6">
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

        <main className="space-y-6 overflow-x-hidden sm:space-y-8">
          <LeonixCategoryImageDiscoveryGrid
            lang={lang as V2Lang}
            surface="landing"
            heading={t.discoveryTitle}
            subtitle={t.discoverySubtitle}
            items={discoveryItems}
          />
        </main>
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
