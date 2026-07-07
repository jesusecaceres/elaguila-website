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
import { RestaurantesLandingShell } from "./RestaurantesLandingShell";
import { RestaurantesLandingHeroGateway } from "./RestaurantesLandingHeroGateway";
import { RestaurantesCompactSearchCanvas } from "./RestaurantesCompactSearchCanvas";
import { RestaurantePublishedListingCard } from "@/app/clasificados/restaurantes/components/RestaurantePublishedListingCard";
import { RestaurantesDestacadosSection } from "@/app/clasificados/restaurantes/components/RestaurantesDestacadosSection";

const ACCENT = "#D4A574";

function RestaurantesLandingPageFallback() {
  return (
    <RestaurantesLandingShell>
      <main className="mx-auto max-w-[1280px] px-4 py-10">
        <h1 className="font-serif text-2xl font-semibold text-[color:var(--lx-text)]">Restaurantes</h1>
        <p className="mt-2 text-sm text-[color:var(--lx-muted)]">Cargando…</p>
      </main>
    </RestaurantesLandingShell>
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
    <RestaurantesCompactSearchCanvas
      lang={lang}
      defaultQ={searchQ}
      defaultCity={searchCity}
      defaultState={searchState}
      defaultZip={searchZip}
      defaultCountry={searchCountry}
    />
  );

  return (
    <RestaurantesLandingShell>
      <div className="mx-auto flex max-w-[1280px] justify-end px-3.5 pt-3 sm:px-4 lg:px-5">
        <ViajesLangSwitch compact />
      </div>

      <div className="mx-auto w-full min-w-0 max-w-[1280px] px-3.5 pb-14 sm:px-4 lg:px-5">
        <RestaurantesLandingHeroGateway
          lang={lang}
          title={copy.title}
          tagline={copy.tagline}
          intro={copy.intro}
          introSecondary={copy.introSecondary}
          searchSlot={landingSearchForm}
        />
      </div>

      <main className="mx-auto max-w-[1280px] space-y-6 overflow-x-hidden px-3.5 pb-14 sm:px-4 sm:space-y-8 lg:px-5">

        {/* Sponsor section - landing only, compact Rentas/Bienes rhythm */}
        <section
          className="rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)] px-4 py-5 sm:px-6 sm:py-6"
          aria-labelledby="restaurantes-sponsors-title"
        >
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{copy.sponsorEyebrow}</p>
          <h2 id="restaurantes-sponsors-title" className="mt-2 font-serif text-xl font-bold leading-snug text-[#2A4536] sm:text-2xl">
            {copy.sponsorTitle}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{copy.sponsorBody}</p>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[#5C5346] sm:text-sm">{copy.sponsorSupport}</p>

          <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
            {copy.sponsorChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link href={publishHref} className="inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[#7A1E2C] px-5 text-sm font-bold text-[#FFFDF7] shadow-[0_6px_20px_-8px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721] sm:min-h-[3.125rem] sm:text-[0.9375rem]">
              {copy.sponsorPrimaryCta}
            </Link>
            <Link href={allResultsHref} className="inline-flex min-h-[3rem] items-center justify-center gap-1.5 rounded-xl border border-[#C9A84A]/60 bg-[#FFFDF7] px-4 text-sm font-semibold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] sm:min-h-[3.125rem]">
              {copy.sponsorSecondaryCta}
            </Link>
          </div>
        </section>

        {/* Discovery section 1 - Cuisine cards */}
        <section
          className="rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)] px-4 py-5 sm:px-6 sm:py-6"
          aria-labelledby="restaurantes-discovery-title"
        >
          <h2 id="restaurantes-discovery-title" className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl">
            {copy.discoveryTitle}
          </h2>
          <p className="mt-1 text-xs text-[#5C5346]/85">{copy.discoverySubtitle}</p>
          <div className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:gap-4 lg:grid-cols-4">
            <Link
              href={buildRestaurantesResultsHref(lang, { cuisine: "mexican" })}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#D6C7AD]/70 bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF] p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-[5rem]"
            >
              <span className="text-xs font-semibold text-[#2A4536] sm:text-sm">{lang === "es" ? "Mexicana" : "Mexican"}</span>
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { cuisine: "italian" })}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#D6C7AD]/70 bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF] p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-[5rem]"
            >
              <span className="text-xs font-semibold text-[#2A4536] sm:text-sm">{lang === "es" ? "Italiana" : "Italian"}</span>
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { cuisine: "chinese" })}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#D6C7AD]/70 bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF] p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-[5rem]"
            >
              <span className="text-xs font-semibold text-[#2A4536] sm:text-sm">{lang === "es" ? "China" : "Chinese"}</span>
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { cuisine: "burgers" })}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#D6C7AD]/70 bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF] p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-[5rem]"
            >
              <span className="text-xs font-semibold text-[#2A4536] sm:text-sm">{lang === "es" ? "Hamburguesas" : "Burgers"}</span>
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { cuisine: "pizza" })}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#D6C7AD]/70 bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF] p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-[5rem]"
            >
              <span className="text-xs font-semibold text-[#2A4536] sm:text-sm">{lang === "es" ? "Pizza" : "Pizza"}</span>
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { cuisine: "dessert" })}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#D6C7AD]/70 bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF] p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-[5rem]"
            >
              <span className="text-xs font-semibold text-[#2A4536] sm:text-sm">{lang === "es" ? "Postres" : "Desserts"}</span>
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { ft: "1" })}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#D6C7AD]/70 bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF] p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-[5rem]"
            >
              <span className="text-xs font-semibold text-[#2A4536] sm:text-sm">{lang === "es" ? "Food truck" : "Food truck"}</span>
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { svc: "catering" })}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#D6C7AD]/70 bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF] p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-[5rem]"
            >
              <span className="text-xs font-semibold text-[#2A4536] sm:text-sm">{lang === "es" ? "Catering" : "Catering"}</span>
            </Link>
          </div>
        </section>

        {/* Discovery section 2 - Service chips */}
        <section
          className="rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)] px-4 py-5 sm:px-6 sm:py-6"
          aria-labelledby="restaurantes-service-title"
        >
          <h2 id="restaurantes-service-title" className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl">
            {lang === "es" ? "Servicio" : "Service"}
          </h2>
          <div className="mt-3.5 flex flex-wrap gap-2 sm:gap-2.5">
            <Link
              href={buildRestaurantesResultsHref(lang, { svc: "dine_in" })}
              className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
            >
              {lang === "es" ? "Comer en local" : "Dine-in"}
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { svc: "takeout" })}
              className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
            >
              {lang === "es" ? "Para llevar" : "Takeout"}
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { svc: "delivery" })}
              className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
            >
              {lang === "es" ? "Entrega" : "Delivery"}
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { svc: "catering" })}
              className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
            >
              {lang === "es" ? "Catering" : "Catering"}
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { svc: "events" })}
              className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
            >
              {lang === "es" ? "Eventos" : "Events"}
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { rsv: "1" })}
              className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
            >
              {lang === "es" ? "Reservas" : "Reservations"}
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { pku: "1" })}
              className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
            >
              {lang === "es" ? "Pickup" : "Pickup"}
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { open: "1" })}
              className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
            >
              {lang === "es" ? "Abierto ahora" : "Open now"}
            </Link>
          </div>
        </section>

        {/* Discovery section 3 - What matters chips */}
        <section
          className="rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)] px-4 py-5 sm:px-6 sm:py-6"
          aria-labelledby="restaurantes-matters-title"
        >
          <h2 id="restaurantes-matters-title" className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl">
            {lang === "es" ? "Lo que más importa" : "What matters most"}
          </h2>
          <div className="mt-3.5 flex flex-wrap gap-2 sm:gap-2.5">
            <Link
              href={buildRestaurantesResultsHref(lang, { family: "1" })}
              className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
            >
              {lang === "es" ? "Familiar" : "Family-friendly"}
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { menu: "1" })}
              className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
            >
              {lang === "es" ? "Menú disponible" : "Menu available"}
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { wa: "1" })}
              className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
            >
              {lang === "es" ? "Con WhatsApp" : "Has WhatsApp"}
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { web: "1" })}
              className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
            >
              {lang === "es" ? "Con sitio web" : "Has website"}
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { social: "1" })}
              className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
            >
              {lang === "es" ? "Redes sociales" : "Social media"}
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { diet: "vegan" })}
              className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
            >
              {lang === "es" ? "Vegano" : "Vegan"}
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { diet: "glutenfree" })}
              className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
            >
              {lang === "es" ? "Sin gluten" : "Gluten-free"}
            </Link>
            <Link
              href={buildRestaurantesResultsHref(lang, { diet: "halal" })}
              className="inline-flex h-[36px] max-w-full shrink-0 snap-start items-center gap-1.5 rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-b from-[#FFFDF7] to-[#FBF7EF] px-3.5 text-xs font-semibold text-[#2A4536]"
            >
              {lang === "es" ? "Halal" : "Halal"}
            </Link>
          </div>
        </section>
      </main>
    </RestaurantesLandingShell>
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
