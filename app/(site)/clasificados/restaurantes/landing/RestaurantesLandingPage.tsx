"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FiCalendar, FiClock, FiCoffee, FiGlobe, FiHeart, FiHome, FiMapPin, FiMessageCircle, FiShoppingBag, FiStar, FiTruck } from "react-icons/fi";

import { resolveClasificadosPublishLang } from "@/app/lib/clasificados/clasificadosPublishLang";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { ViajesLangSwitch } from "@/app/clasificados/viajes/components/ViajesLangSwitch";

import {
  buildRestaurantesResultsHref,
} from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import {
  type RestaurantesBlueprintCard,
} from "./restaurantesBlueprintSampleData";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryPartnerSection,
  LeonixCategoryDiscoveryGrid,
  LeonixCategoryShortcutSection,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";

function RestaurantesLandingPageFallback() {
  return (
    <LeonixCategoryPageShell surface="landing">
      <main className="mx-auto max-w-[1280px] px-4 py-10">
        <h1 className="font-serif text-2xl font-semibold text-[#2A4536]">Restaurantes</h1>
        <p className="mt-2 text-sm text-[#5C5346]">Cargando… / Loading…</p>
      </main>
    </LeonixCategoryPageShell>
  );
}

function RestaurantesLandingPageInner(_props: {
  featuredCards: RestaurantesBlueprintCard[];
  recentCards: RestaurantesBlueprintCard[];
  destacadosRows?: RestaurantesPublicBlueprintRow[];
  landingNote?: string;
  discoveryLookupRows: RestaurantesPublicBlueprintRow[];
}) {
  const sp = useSearchParams();
  const spStr = sp?.toString() ?? "";
  const { routeLang, copyLang: lang } = useMemo(
    () => resolveClasificadosPublishLang(sp?.get("lang")),
    [spStr, sp],
  );

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

  const publishHref = appendLangToPath("/publicar/restaurantes", routeLang);

  const allResultsHref = useMemo(() => buildRestaurantesResultsHref(routeLang, {}), [routeLang]);

  const copy = useMemo(() => {
    if (lang === "en") {
      return {
        title: "Restaurants",
        tagline: "Local flavor close to your community.",
        intro: "Find restaurants, local food, catering, and food businesses with clear details and direct contact.",
        introSecondary: "Search by name, cuisine, city, or ZIP; use filters for delivery, takeout, family-friendly options, and more.",
        searchPlaceholder: "Search restaurant, cuisine, or food...",
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
      searchPlaceholder: "Buscar restaurante, cocina o comida...",
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
        window.location.href = buildRestaurantesResultsHref(routeLang, {
          q: searchQ.trim(),
          city: searchCity.trim(),
          state: searchState.trim(),
          zip: searchZip.trim(),
          country: searchCountry.trim(),
        });
      }}
      onOpenFilters={() => {}}
      browseAllHref={allResultsHref}
      browseAllLabel={copy.exploreAll}
      queryPlaceholder={copy.searchPlaceholder}
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
      <div className="px-3.5 pb-14 sm:px-5 lg:px-6">
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

      <main className="space-y-6 overflow-x-hidden sm:space-y-8">

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
          secondaryCta={{ label: copy.sponsorSecondaryCta, href: allResultsHref }}
        />

        {/* Discovery section 1 - Cuisine cards */}
        <LeonixCategoryDiscoveryGrid
          lang={lang as V2Lang}
          surface="landing"
          heading={copy.discoveryTitle}
          subtitle={copy.discoverySubtitle}
          items={[
            { id: "mexican", label: lang === "es" ? "Mexicana" : "Mexican", href: buildRestaurantesResultsHref(routeLang, { cuisine: "mexican" }), icon: FiCoffee },
            { id: "italian", label: lang === "es" ? "Italiana" : "Italian", href: buildRestaurantesResultsHref(routeLang, { cuisine: "italian" }), icon: FiCoffee },
            { id: "chinese", label: lang === "es" ? "China" : "Chinese", href: buildRestaurantesResultsHref(routeLang, { cuisine: "chinese" }), icon: FiCoffee },
            { id: "burgers", label: lang === "es" ? "Hamburguesas" : "Burgers", href: buildRestaurantesResultsHref(routeLang, { cuisine: "burgers" }), icon: FiCoffee },
            { id: "pizza", label: "Pizza", href: buildRestaurantesResultsHref(routeLang, { cuisine: "pizza" }), icon: FiCoffee },
            { id: "dessert", label: lang === "es" ? "Postres" : "Desserts", href: buildRestaurantesResultsHref(routeLang, { cuisine: "dessert" }), icon: FiStar },
            { id: "foodtruck", label: "Food truck", href: buildRestaurantesResultsHref(routeLang, { ft: "1" }), icon: FiTruck },
            { id: "catering", label: "Catering", href: buildRestaurantesResultsHref(routeLang, { svc: "catering" }), icon: FiCalendar },
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
            { id: "dine_in", label: lang === "es" ? "Comer en local" : "Dine-in", href: buildRestaurantesResultsHref(routeLang, { svc: "dine_in" }), icon: FiHome },
            { id: "takeout", label: lang === "es" ? "Para llevar" : "Takeout", href: buildRestaurantesResultsHref(routeLang, { svc: "takeout" }), icon: FiShoppingBag },
            { id: "delivery", label: lang === "es" ? "Entrega" : "Delivery", href: buildRestaurantesResultsHref(routeLang, { svc: "delivery" }), icon: FiTruck },
            { id: "catering2", label: "Catering", href: buildRestaurantesResultsHref(routeLang, { svc: "catering" }), icon: FiCalendar },
            { id: "events", label: lang === "es" ? "Eventos" : "Events", href: buildRestaurantesResultsHref(routeLang, { svc: "events" }), icon: FiCalendar },
            { id: "reservations", label: lang === "es" ? "Reservas" : "Reservations", href: buildRestaurantesResultsHref(routeLang, { rsv: "1" }), icon: FiStar },
            { id: "pickup", label: "Pickup", href: buildRestaurantesResultsHref(routeLang, { pku: "1" }), icon: FiMapPin },
            { id: "open", label: lang === "es" ? "Abierto ahora" : "Open now", href: buildRestaurantesResultsHref(routeLang, { open: "1" }), icon: FiClock },
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
            { id: "family", label: lang === "es" ? "Familiar" : "Family-friendly", href: buildRestaurantesResultsHref(routeLang, { family: "1" }), icon: FiHeart },
            { id: "menu", label: lang === "es" ? "Menú disponible" : "Menu available", href: buildRestaurantesResultsHref(routeLang, { menu: "1" }), icon: FiCoffee },
            { id: "whatsapp", label: "WhatsApp", href: buildRestaurantesResultsHref(routeLang, { wa: "1" }), icon: FiMessageCircle },
            { id: "website", label: lang === "es" ? "Con sitio web" : "Has website", href: buildRestaurantesResultsHref(routeLang, { web: "1" }), icon: FiGlobe },
            { id: "social", label: lang === "es" ? "Redes sociales" : "Social media", href: buildRestaurantesResultsHref(routeLang, { social: "1" }), icon: FiStar },
            { id: "vegan", label: lang === "es" ? "Vegano" : "Vegan", href: buildRestaurantesResultsHref(routeLang, { diet: "vegan" }), icon: FiHeart },
            { id: "glutenfree", label: lang === "es" ? "Sin gluten" : "Gluten-free", href: buildRestaurantesResultsHref(routeLang, { diet: "glutenfree" }), icon: FiHeart },
            { id: "halal", label: "Halal", href: buildRestaurantesResultsHref(routeLang, { diet: "halal" }), icon: FiHeart },
          ]}
        />
      </main>
      </div>
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
