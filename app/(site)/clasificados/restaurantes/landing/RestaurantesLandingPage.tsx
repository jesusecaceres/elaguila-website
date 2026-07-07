"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FaStar } from "react-icons/fa";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { ViajesLangSwitch } from "@/app/clasificados/viajes/components/ViajesLangSwitch";

import {
  buildRestaurantesResultsHref,
} from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import {
  type RestaurantesBlueprintCard,
  RESTAURANTES_BLUEPRINT_CATEGORY_TILES,
  RESTAURANTES_BLUEPRINT_QUICK_FILTERS,
} from "./restaurantesBlueprintSampleData";
import { RESTAURANTES_LANDING_CTA_BG, RESTAURANTES_LANDING_CTA_TEAM } from "./restaurantesLandingAssets";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryCta,
  LeonixCategoryPartnerSection,
  LeonixCategoryDiscoveryGrid,
  LeonixCategoryShortcutSection,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import { RestaurantePublishedListingCard } from "@/app/clasificados/restaurantes/components/RestaurantePublishedListingCard";
import { RestaurantesDestacadosSection } from "@/app/clasificados/restaurantes/components/RestaurantesDestacadosSection";

const ACCENT = "#D4A574";

function RestaurantesLandingPageFallback() {
  return (
    <LeonixCategoryPageShell surface="landing">
      <main className="mx-auto max-w-[1280px] px-4 py-10">
        <h1 className="font-serif text-2xl font-semibold text-[#2A4536]">Restaurantes</h1>
        <p className="mt-2 text-sm text-[#5C5346]">Cargando…</p>
      </main>
    </LeonixCategoryPageShell>
  );
}

function RestaurantesLandingPageInner({
  featuredCards,
  recentCards,
  destacadosRows = [],
  landingNote,
  discoveryLookupRows,
}: {
  featuredCards: RestaurantesBlueprintCard[];
  recentCards: RestaurantesBlueprintCard[];
  destacadosRows?: RestaurantesPublicBlueprintRow[];
  landingNote?: string;
  discoveryLookupRows: RestaurantesPublicBlueprintRow[];
}) {
  const sp = useSearchParams();
  const spStr = sp?.toString() ?? "";
  const lang: Lang = useMemo(() => (new URLSearchParams(spStr).get("lang") === "en" ? "en" : "es"), [spStr]);

  const [searchQ, setSearchQ] = useState("");
  const [searchCity, setSearchCity] = useState("");
  const [searchState, setSearchState] = useState("CA");
  const [searchZip, setSearchZip] = useState("");
  const [searchCountry, setSearchCountry] = useState("United States");

  useEffect(() => {
    const q = sp?.get("q") ?? "";
    const city = sp?.get("city") ?? "";
    const state = sp?.get("state") ?? "CA";
    const zip = sp?.get("zip") ?? "";
    const country = sp?.get("country") ?? "United States";
    if (q) setSearchQ(q);
    setSearchCity(city);
    setSearchState(state);
    setSearchZip(zip);
    setSearchCountry(country);
  }, [sp]);

  const publishHref = appendLangToPath("/publicar/restaurantes", lang);

  const allResultsHref = useMemo(() => buildRestaurantesResultsHref(lang, {}), [lang]);

  const copy = useMemo(() => {
    if (lang === "en") {
      return {
        title: "Restaurants",
        tagline: "Local flavor close to your community.",
        intro: "Find restaurants, local food, catering, and food businesses with clear details and direct contact.",
        introSecondary: "Search by name, cuisine, city, or ZIP; use filters for delivery, takeout, family-friendly options, and more.",
        sponsorEyebrow: "MAGAZINE · DIGITAL · RESTAURANTS",
        sponsorTitle: "Leonix Sponsors",
        sponsorBody: "Restaurants and food businesses with premium visibility across Leonix Media, print/digital magazine, and community campaigns.",
        sponsorSupport: "Built for restaurants, taquerias, bakeries, food trucks, catering, and food brands that want to be seen by the community.",
        sponsorPrimaryCta: "Advertise my restaurant",
        sponsorSecondaryCta: "View restaurants",
        sponsorChips: [
          "Print magazine",
          "Digital magazine",
          "Business profile",
          "Menu & contact",
          "Local campaigns",
          "Premium visibility",
        ],
        discoveryTitle: "What are you craving?",
        discoverySubtitle: "Explore by cuisine or food type.",
        featuredTitle: "Featured restaurants",
        featuredIntro: "Premium visibility mixed with strong organic picks—not pay-only.",
        browseTitle: "Explore cuisine types",
        browseIntro: "Jump straight into results with a cuisine in mind.",
        recentTitle: "Recently added",
        recentIntro: "New listings on Leonix—fresh places to try first.",
        ctaHeadline: "Own a restaurant?",
        ctaSub:
          "Put your menu in front of diners actively searching Leonix—premium exposure, clear discovery, and room to grow with featured placement.",
        ctaBtn: "Advertise your restaurant",
        exploreAll: "Explore all results",
      };
    }
    return {
      title: "Restaurantes",
      tagline: "Sabores cerca de tu comunidad.",
      intro: "Encuentra restaurantes, comida local, catering y negocios de comida con datos claros y contacto directo.",
      introSecondary: "Busca por nombre, cocina, ciudad o código postal; usa filtros para delivery, para llevar, familiar y más.",
      sponsorEyebrow: "REVISTA · DIGITAL · RESTAURANTES",
      sponsorTitle: "Patrocinadores de Leonix",
      sponsorBody: "Restaurantes y negocios de comida con presencia premium en Leonix Media, revista impresa/digital y campañas comunitarias.",
      sponsorSupport: "Ideal para restaurantes, taquerías, panaderías, food trucks, catering y marcas de comida que quieren ser vistas por la comunidad.",
      sponsorPrimaryCta: "Quiero anunciar mi restaurante",
      sponsorSecondaryCta: "Ver restaurantes",
      sponsorChips: [
        "Revista impresa",
        "Revista digital",
        "Perfil de negocio",
        "Menú y contacto",
        "Campañas locales",
        "Visibilidad premium",
      ],
      discoveryTitle: "¿Qué se te antoja?",
      discoverySubtitle: "Explora por cocina o tipo de comida.",
      featuredTitle: "Restaurantes Destacados",
      featuredIntro: "Visibilidad premium mezclada con buena señal orgánica—no solo pago.",
      browseTitle: "Explora los tipos de cocina",
      browseIntro: "Entra a resultados con una cocina ya seleccionada.",
      recentTitle: "Restaurantes recientes",
      recentIntro: "Ordenados por fecha de publicación (más recientes primero).",
      ctaHeadline: "¿Tienes un restaurante?",
      ctaSub:
        "Llega a comensales que ya buscan en Leonix: visibilidad clara, descubrimiento premium y espacio para crecer con destacados.",
      ctaBtn: "Anuncia tu Restaurante",
      exploreAll: "Explorar todos los resultados",
    };
  }, [lang]);

  const landingSearchForm = (
    <LeonixCategorySearchCanvas
      lang={lang as V2Lang}
      surface="landing"
      query={searchQ}
      city={searchCity}
      state={searchState}
      zip={searchZip}
      country={searchCountry}
      onQuery={setSearchQ}
      onCity={setSearchCity}
      onState={setSearchState}
      onZip={setSearchZip}
      onCountry={setSearchCountry}
      onSearch={() => {
        const params = new URLSearchParams();
        params.set("lang", lang);
        if (searchQ.trim()) params.set("q", searchQ.trim());
        if (searchCity.trim()) params.set("city", searchCity.trim());
        if (searchState.trim()) params.set("state", searchState.trim());
        if (searchZip.trim()) params.set("zip", searchZip.trim());
        if (searchCountry.trim()) params.set("country", searchCountry.trim());
        window.location.href = `${allResultsHref}?${params.toString()}`;
      }}
      onOpenFilters={() => {}}
      browseAllHref={allResultsHref}
      browseAllLabel={copy.exploreAll}
      searchButtonLabel={lang === "es" ? "Buscar" : "Search"}
      filtersButtonLabel={lang === "es" ? "Filtros" : "Filters"}
      publishHref={publishHref}
      publishLabel={copy.sponsorPrimaryCta}
    />
  );

  return (
    <LeonixCategoryPageShell surface="landing" topSlot={
      <div className="mx-auto flex max-w-[1280px] justify-end px-3.5 pt-3 sm:px-4 lg:px-5">
        <ViajesLangSwitch compact />
      </div>
    }>
      <LeonixCategoryHeroGateway
        lang={lang as V2Lang}
        surface="landing"
        title={copy.title}
        tagline={copy.tagline}
        intro={copy.intro}
        introSecondary={copy.introSecondary}
        searchSlot={landingSearchForm}
        eyebrow={copy.sponsorEyebrow}
      />

      <main className="mx-auto max-w-[1280px] space-y-6 overflow-x-hidden px-3.5 pb-14 sm:px-4 sm:space-y-8 lg:px-5">

        {/* Sponsor section - landing only */}
        <LeonixCategoryPartnerSection
          enabled={true}
          lang={lang as V2Lang}
          surface="landing"
          eyebrow={copy.sponsorEyebrow}
          title={copy.sponsorTitle}
          body={copy.sponsorBody}
          supportingLine={copy.sponsorSupport}
          chips={copy.sponsorChips}
          primaryCta={{ label: copy.sponsorPrimaryCta, href: publishHref }}
          secondaryCta={{ label: copy.sponsorSecondaryCta, href: allResultsHref }}
        />

        {/* Discovery section 1 - Cuisine cards */}
        <LeonixCategoryDiscoveryGrid
          lang={lang as V2Lang}
          surface="landing"
          heading={copy.discoveryTitle}
          subtitle={copy.discoverySubtitle}
          items={[
            { id: "mexican", label: lang === "es" ? "Mexicana" : "Mexican", href: buildRestaurantesResultsHref(lang, { cuisine: "mexican" }), icon: () => null },
            { id: "italian", label: lang === "es" ? "Italiana" : "Italian", href: buildRestaurantesResultsHref(lang, { cuisine: "italian" }), icon: () => null },
            { id: "chinese", label: lang === "es" ? "China" : "Chinese", href: buildRestaurantesResultsHref(lang, { cuisine: "chinese" }), icon: () => null },
            { id: "burgers", label: lang === "es" ? "Hamburguesas" : "Burgers", href: buildRestaurantesResultsHref(lang, { cuisine: "burgers" }), icon: () => null },
            { id: "pizza", label: "Pizza", href: buildRestaurantesResultsHref(lang, { cuisine: "pizza" }), icon: () => null },
            { id: "dessert", label: lang === "es" ? "Postres" : "Desserts", href: buildRestaurantesResultsHref(lang, { cuisine: "dessert" }), icon: () => null },
            { id: "foodtruck", label: "Food truck", href: buildRestaurantesResultsHref(lang, { ft: "1" }), icon: () => null },
            { id: "catering", label: "Catering", href: buildRestaurantesResultsHref(lang, { svc: "catering" }), icon: () => null },
          ]}
        />

        {/* Discovery section 2 - Service chips */}
        <LeonixCategoryShortcutSection
          lang={lang as V2Lang}
          surface="landing"
          title={lang === "es" ? "Servicio" : "Service"}
          subtitle=""
          variant="default"
          chips={[
            { id: "dine_in", label: lang === "es" ? "Comer en local" : "Dine-in", href: buildRestaurantesResultsHref(lang, { svc: "dine_in" }) },
            { id: "takeout", label: lang === "es" ? "Para llevar" : "Takeout", href: buildRestaurantesResultsHref(lang, { svc: "takeout" }) },
            { id: "delivery", label: lang === "es" ? "Entrega" : "Delivery", href: buildRestaurantesResultsHref(lang, { svc: "delivery" }) },
            { id: "catering2", label: "Catering", href: buildRestaurantesResultsHref(lang, { svc: "catering" }) },
            { id: "events", label: lang === "es" ? "Eventos" : "Events", href: buildRestaurantesResultsHref(lang, { svc: "events" }) },
            { id: "reservations", label: lang === "es" ? "Reservas" : "Reservations", href: buildRestaurantesResultsHref(lang, { rsv: "1" }) },
            { id: "pickup", label: "Pickup", href: buildRestaurantesResultsHref(lang, { pku: "1" }) },
            { id: "open", label: lang === "es" ? "Abierto ahora" : "Open now", href: buildRestaurantesResultsHref(lang, { open: "1" }) },
          ]}
        />

        {/* Discovery section 3 - What matters chips */}
        <LeonixCategoryShortcutSection
          lang={lang as V2Lang}
          surface="landing"
          title={lang === "es" ? "Lo que más importa" : "What matters most"}
          subtitle=""
          variant="default"
          chips={[
            { id: "family", label: lang === "es" ? "Familiar" : "Family-friendly", href: buildRestaurantesResultsHref(lang, { family: "1" }) },
            { id: "menu", label: lang === "es" ? "Menú disponible" : "Menu available", href: buildRestaurantesResultsHref(lang, { menu: "1" }) },
            { id: "whatsapp", label: lang === "es" ? "Con WhatsApp" : "Has WhatsApp", href: buildRestaurantesResultsHref(lang, { wa: "1" }) },
            { id: "website", label: lang === "es" ? "Con sitio web" : "Has website", href: buildRestaurantesResultsHref(lang, { web: "1" }) },
            { id: "social", label: lang === "es" ? "Redes sociales" : "Social media", href: buildRestaurantesResultsHref(lang, { social: "1" }) },
            { id: "vegan", label: lang === "es" ? "Vegano" : "Vegan", href: buildRestaurantesResultsHref(lang, { diet: "vegan" }) },
            { id: "glutenfree", label: lang === "es" ? "Sin gluten" : "Gluten-free", href: buildRestaurantesResultsHref(lang, { diet: "glutenfree" }) },
            { id: "halal", label: "Halal", href: buildRestaurantesResultsHref(lang, { diet: "halal" }) },
          ]}
        />
      </main>
    </LeonixCategoryPageShell>
  );
}

export function RestaurantesLandingPage(props: {
  featuredCards: RestaurantesBlueprintCard[];
  recentCards: RestaurantesBlueprintCard[];
  destacadosRows?: RestaurantesPublicBlueprintRow[];
  landingNote?: string;
  discoveryLookupRows: RestaurantesPublicBlueprintRow[];
}) {
  return (
    <Suspense fallback={<RestaurantesLandingPageFallback />}>
      <RestaurantesLandingPageInner {...props} />
    </Suspense>
  );
}
