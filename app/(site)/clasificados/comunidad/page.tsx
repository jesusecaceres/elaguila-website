"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FiCalendar, FiCoffee, FiHeart, FiMapPin, FiShoppingBag, FiStar, FiTool, FiUsers } from "react-icons/fi";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategoryImageDiscoveryGrid,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import { CategoryStandardLandingSearchPanel } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingSearchPanel";
import { appendLangToPath, resolveHubCopyLang, resolveRouteLang } from "@/app/clasificados/lib/hubUrl";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { COMUNIDAD_CHILD_CATEGORY_IMAGE } from "./comunidadChildCategoryImages";

type Lang = "es" | "en";

const COPY = {
  es: {
    eyebrow: "CLASIFICADOS · COMUNIDAD",
    ctaPost: "Publicar en Comunidad y Eventos",
    ctaView: "Ver todos los anuncios",
    tagline: "Eventos y avisos cerca de ti.",
    intro: "Encuentra eventos, ayuda, voluntariado y más en tu comunidad.",
    helper: "Busca por palabra clave o ciudad; en resultados filtra por tema.",
    discoveryTitle: "Explora por tipo de evento",
    discoverySubtitle: "Elige una categoría para ver avisos en resultados.",
  },
  en: {
    eyebrow: "CLASSIFIEDS · COMMUNITY",
    ctaPost: "Post in Community & Events",
    ctaView: "View all listings",
    tagline: "Events and notices near you.",
    intro: "Find events, help, volunteering, and more in your community.",
    helper: "Search by keyword or city; filter by topic on results.",
    discoveryTitle: "Explore by event type",
    discoverySubtitle: "Choose a category to view notices on results.",
  },
} as const;

const COMUNIDAD_DISCOVERY_TILES = [
  { value: "feria", labelEs: "Feria", labelEn: "Fair", icon: FiShoppingBag },
  { value: "festival", labelEs: "Festival", labelEn: "Festival", icon: FiStar },
  { value: "comida", labelEs: "Distribución de comida", labelEn: "Food distribution", icon: FiCoffee },
  { value: "iglesia", labelEs: "Evento de iglesia / comunidad", labelEn: "Church / community", icon: FiHeart },
  { value: "ciudad", labelEs: "Evento de la ciudad", labelEn: "City event", icon: FiMapPin },
  { value: "familia", labelEs: "Evento familiar", labelEn: "Family event", icon: FiUsers },
  { value: "taller", labelEs: "Taller abierto", labelEn: "Open workshop", icon: FiTool },
  { value: "otro", labelEs: "Otro tipo de evento", labelEn: "Other event type", icon: FiCalendar },
] as const;

function ComunidadLandingPageInner() {
  const sp = useSearchParams();
  const routeLang = resolveRouteLang(sp?.get("lang"));
  const lang = resolveHubCopyLang(sp?.get("lang"));
  const t = COPY[lang];

  const resultsHref = useMemo(() => buildCategoryResultsUrl("comunidad", routeLang as Lang), [routeLang]);
  const postHref = useMemo(() => appendLangToPath("/clasificados/publicar/comunidad", routeLang as Lang), [routeLang]);

  const discoveryItems = useMemo(
    () =>
      COMUNIDAD_DISCOVERY_TILES.map((tile) => {
        const label = lang === "es" ? tile.labelEs : tile.labelEn;
        return {
          id: tile.value,
          label,
          href: buildCategoryResultsUrl("comunidad", routeLang as Lang, { eventType: tile.value }),
          imageSrc: COMUNIDAD_CHILD_CATEGORY_IMAGE[tile.value],
          imageAlt: label,
          icon: tile.icon,
        };
      }),
    [lang, routeLang],
  );

  const comunidadSearchForm = (
    <CategoryStandardLandingSearchPanel
      category="comunidad"
      lang={routeLang as Lang}
      routeLang={routeLang as Lang}
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
          title={lang === "es" ? "Comunidad y Eventos" : "Community & Events"}
          tagline={t.tagline}
          intro={t.intro}
          introSecondary={t.helper}
          searchSlot={comunidadSearchForm}
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

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ComunidadLandingPageInner />
    </Suspense>
  );
}
