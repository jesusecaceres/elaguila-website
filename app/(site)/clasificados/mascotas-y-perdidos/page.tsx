"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FiHeart, FiMapPin, FiPackage, FiShoppingBag, FiStar } from "react-icons/fi";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategoryImageDiscoveryGrid,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import { CategoryStandardLandingSearchPanel } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingSearchPanel";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { mascotasPerdidosPublishEntryUrl } from "./shared/mascotasPerdidosBrowseUrls";
import { mascotasPerdidosLangFromSearchParams, mascotasPerdidosRouteLangFromSearchParams } from "./shared/mascotasPerdidosShellCopy";
import { MASCOTAS_CHILD_CATEGORY_IMAGE } from "./mascotasChildCategoryImages";

const COPY = {
  es: {
    eyebrow: "CLASIFICADOS · MASCOTAS Y PERDIDOS",
    ctaPost: "Publicar en Mascotas y Perdidos",
    ctaView: "Ver todos los anuncios",
    tagline: "Avisos locales cuando más importa.",
    intro: "Encuentra mascotas perdidas, avisa sobre mascotas encontradas y más.",
    helper: "Busca por ciudad o tipo de aviso; comparte información clara y reciente.",
    discoveryTitle: "Explora por tipo de aviso",
    discoverySubtitle: "Elige una categoría para ver avisos en resultados.",
  },
  en: {
    eyebrow: "CLASSIFIEDS · PETS & LOST",
    ctaPost: "Post in Pets & Lost",
    ctaView: "View all listings",
    tagline: "Local notices when it matters most.",
    intro: "Find lost pets, report found pets, and more.",
    helper: "Search by city or notice type; share clear, timely information.",
    discoveryTitle: "Explore by notice type",
    discoverySubtitle: "Choose a category to view notices on results.",
  },
} as const;

const MASCOTAS_DISCOVERY_TILES = [
  { value: "mascota-perdida", labelEs: "Mascota perdida", labelEn: "Lost pet", icon: FiMapPin },
  { value: "mascota-encontrada", labelEs: "Mascota encontrada", labelEn: "Found pet", icon: FiStar },
  { value: "adopcion-mascota", labelEs: "Adopción de mascota", labelEn: "Pet adoption", icon: FiHeart },
  { value: "objeto-perdido", labelEs: "Objeto perdido", labelEn: "Lost item", icon: FiShoppingBag },
  { value: "objeto-encontrado", labelEs: "Objeto encontrado", labelEn: "Found item", icon: FiPackage },
] as const;

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

  const discoveryItems = useMemo(
    () =>
      MASCOTAS_DISCOVERY_TILES.map((tile) => {
        const label = lang === "es" ? tile.labelEs : tile.labelEn;
        return {
          id: tile.value,
          label,
          href: buildCategoryResultsUrl("mascotas-y-perdidos", routeLang as "es" | "en", { tipo: tile.value }),
          imageSrc: MASCOTAS_CHILD_CATEGORY_IMAGE[tile.value],
          imageAlt: label,
          icon: tile.icon,
        };
      }),
    [lang, routeLang],
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
      <div className="px-3.5 pb-14 sm:px-5 lg:px-6">
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

export default function MascotasPerdidosLandingPage() {
  return (
    <Suspense fallback={null}>
      <MascotasPerdidosLandingPageInner />
    </Suspense>
  );
}
