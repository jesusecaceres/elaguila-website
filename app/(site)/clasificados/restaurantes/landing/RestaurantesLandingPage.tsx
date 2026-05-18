"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaMapMarkerAlt, FaSearch, FaStar } from "react-icons/fa";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { ViajesLangSwitch } from "@/app/clasificados/viajes/components/ViajesLangSwitch";

import {
  buildRestaurantesResultsHref,
  defaultRestaurantesDiscoveryState,
  restaurantesDiscoveryStateToParams,
  splitLocationInput,
} from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import { rememberRestaurantesDiscoveryFromState } from "@/app/clasificados/restaurantes/lib/restaurantesFirstPartyPreferences";
import {
  type RestaurantesBlueprintCard,
  RESTAURANTES_BLUEPRINT_CATEGORY_TILES,
  RESTAURANTES_BLUEPRINT_CUISINE_CHIPS,
  RESTAURANTES_BLUEPRINT_QUICK_FILTERS,
} from "./restaurantesBlueprintSampleData";
import { RESTAURANTES_LANDING_CTA_BG, RESTAURANTES_LANDING_CTA_TEAM } from "./restaurantesLandingAssets";
import { RestaurantesLandingShell } from "./RestaurantesLandingShell";
import { CategoryHeroFrame } from "@/app/(site)/clasificados/components/categoryLanding/CategoryHeroFrame";
import { CategoryLandingChipsRail } from "@/app/(site)/clasificados/components/categoryLanding/CategoryLandingChipsRail";
import { RestaurantePublishedListingCard } from "@/app/clasificados/restaurantes/components/RestaurantePublishedListingCard";

const ACCENT = "#D4A574";

/** Editorial dining atmosphere — strong hero presence without competing with search module */
const RESTAURANTES_HERO_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2400&q=82";

function RestaurantesLandingPageFallback() {
  return (
    <RestaurantesLandingShell>
      <Navbar />
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
  landingNote,
  discoveryLookupRows,
}: {
  featuredCards: RestaurantesBlueprintCard[];
  recentCards: RestaurantesBlueprintCard[];
  landingNote?: string;
  discoveryLookupRows: RestaurantesPublicBlueprintRow[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const spStr = sp?.toString() ?? "";
  const lang: Lang = useMemo(() => (new URLSearchParams(spStr).get("lang") === "en" ? "en" : "es"), [spStr]);

  const [searchQ, setSearchQ] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const q = sp?.get("q") ?? "";
    const city = sp?.get("city") ?? "";
    const zip = sp?.get("zip") ?? "";
    if (q) setSearchQ(q);
    if (city || zip) setLocation(zip || city);
  }, [sp]);

  const clasificadosHref = appendLangToPath("/clasificados", lang);
  const publishHref = appendLangToPath("/publicar/restaurantes", lang);

  const allResultsHref = useMemo(() => buildRestaurantesResultsHref(lang, {}), [lang]);

  const copy = useMemo(() => {
    if (lang === "en") {
      return {
        breadcrumbParent: "Classifieds",
        breadcrumbCurrent: "Restaurants",
        heroLead: "Find the best restaurants ",
        heroAccent: "near you",
        heroSub: "Trusted local spots for every craving—search by name, cuisine, or dish.",
        searchPh: "Restaurant, cuisine, or dish…",
        locationPh: "City or 5-digit ZIP",
        searchHelper: "Search by restaurant name, cuisine type, or a specific dish.",
        locationHelper: "Add a city or U.S. ZIP to focus results near that area.",
        searchCta: "Search",
        trust: [
          "Discover options near you with phone, text, and directions in one place.",
          "Verified and featured businesses on Leonix—confidence before you choose.",
          "Quick paths to delivery, takeout, family-friendly picks, and more in results.",
        ],
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
        continuityHint:
          "Quick search opens results with the same URL parameters; refine cuisine, service, and more on the results page.",
      };
    }
    return {
      breadcrumbParent: "Clasificados",
      breadcrumbCurrent: "Restaurantes",
      heroLead: "Encuentra los mejores restaurantes ",
      heroAccent: "cerca de ti",
      heroSub: "Lugares de confianza para cada antojo: busca por nombre, cocina o platillo.",
      searchPh: "Restaurante, cocina o platillo…",
      locationPh: "Ciudad o código postal (5 dígitos)",
      searchHelper: "Puedes buscar por nombre del lugar, tipo de cocina o un platillo concreto.",
      locationHelper: "Indica ciudad o código postal de EE. UU. para acotar la zona.",
      searchCta: "Buscar",
      trust: [
        "Encuentra opciones cerca de ti con llamada, mensaje y direcciones en un solo lugar.",
        "Negocios verificados y destacados en Leonix: confianza antes de elegir.",
        "Atajos útiles a delivery, para llevar, ambiente familiar y más desde resultados.",
      ],
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
      continuityHint:
        "La búsqueda rápida abre resultados con los mismos parámetros de URL; allí afinas cocina, servicio y más.",
    };
  }, [lang]);

  return (
    <RestaurantesLandingShell>
      <Navbar />

      <div className="sticky top-0 z-30 border-b border-[color:var(--lx-border)]/25 bg-[color:var(--lx-card)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] min-w-0 flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-5 lg:px-6">
          <nav className="text-[11px] font-medium text-[color:var(--lx-muted)]" aria-label="Breadcrumb">
            <Link href={clasificadosHref} className="transition hover:text-[color:var(--lx-text)] hover:underline">
              {copy.breadcrumbParent}
            </Link>
            <span className="mx-1.5 opacity-45">/</span>
            <span className="font-semibold text-[color:var(--lx-text)]">{copy.breadcrumbCurrent}</span>
          </nav>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ViajesLangSwitch compact />
            <Link
              href={publishHref}
              className="inline-flex min-h-[40px] items-center rounded-full border border-[color:var(--lx-border)]/50 bg-[color:var(--lx-card)] px-4 text-[11px] font-bold text-[color:var(--lx-text)] shadow-sm transition hover:border-[#D97706]/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/60 focus-visible:ring-offset-2"
            >
              {lang === "es" ? "Anunciar" : "Advertise"}
            </Link>
          </div>
        </div>
      </div>

      <header className="mx-auto max-w-[1280px] space-y-5 px-4 pb-8 pt-5 sm:space-y-6 sm:px-5 sm:pb-11 sm:pt-7 md:space-y-7 md:pb-12 md:pt-8 lg:px-6 lg:space-y-8 lg:pb-14">
        <CategoryHeroFrame
          imageSrc={RESTAURANTES_HERO_IMAGE}
          overlay="leonix-cream"
          contentJustify="center"
          minHeightClass="min-h-[min(32vh,260px)] sm:min-h-[min(36vh,320px)] md:min-h-[min(38vh,360px)] lg:min-h-[min(40vh,400px)]"
          objectClassName="object-cover object-[center_44%] sm:object-[center_40%] md:object-[center_38%]"
          contentClassName="text-center"
        >
          <div className="mx-auto w-full max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5c4a3d]/80 sm:text-[11px]">
              {lang === "en" ? "Dining · Leonix" : "Restaurantes · Leonix"}
            </p>
            <h1 className="mt-2 text-balance font-serif text-[clamp(1.55rem,3.5vw+0.5rem,2.55rem)] font-semibold leading-[1.12] tracking-tight text-[color:var(--lx-text)] drop-shadow-[0_1px_0_rgba(255,252,247,0.88)] sm:mt-2.5">
              {copy.heroLead}
              <span className="font-serif font-semibold" style={{ color: ACCENT }}>
                {copy.heroAccent}
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-[color:var(--lx-text)]/80 sm:mt-3.5 sm:text-base">
              {copy.heroSub}
            </p>
          </div>
        </CategoryHeroFrame>

        <div className="mx-auto max-w-[960px] rounded-[20px] border border-[color:var(--lx-border)]/25 bg-[color:var(--lx-card)]/97 p-4 shadow-[0_14px_44px_-26px_rgba(45,36,30,0.28)] ring-1 ring-[#D97706]/18 backdrop-blur-sm sm:rounded-[22px] sm:p-5 md:p-6 lg:rounded-[24px]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const loc = splitLocationInput(location);
              const next = {
                ...defaultRestaurantesDiscoveryState(lang),
                lang,
                q: searchQ.trim(),
                city: loc.city ?? "",
                zip: loc.zip ?? "",
              };
              rememberRestaurantesDiscoveryFromState(next);
              router.push(buildRestaurantesResultsHref(lang, restaurantesDiscoveryStateToParams(next)));
            }}
            className="flex flex-col gap-3.5 sm:gap-4 xl:flex-row xl:items-start"
          >
            <div className="grid min-w-0 w-full flex-1 grid-cols-1 gap-3 sm:gap-3.5 md:grid-cols-2 xl:contents">
              <div className="min-w-0 md:min-w-0 xl:flex-1">
                <label className="sr-only" htmlFor="rx-landing-q">
                  {copy.searchPh}
                </label>
                <div className="relative">
                  <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--lx-muted)]" aria-hidden />
                  <input
                    id="rx-landing-q"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder={copy.searchPh}
                    autoComplete="off"
                    aria-describedby="rx-landing-q-hint"
                    className="min-h-[50px] w-full min-w-0 rounded-[14px] border border-[color:var(--lx-border)]/40 bg-[color:var(--lx-card)] py-3 pl-11 pr-3 text-sm text-[color:var(--lx-text)] outline-none ring-[var(--brand-color-1)]/25 transition-shadow focus:ring-2"
                  />
                </div>
                <p id="rx-landing-q-hint" className="mt-1.5 text-left text-[11px] leading-snug text-[color:var(--lx-muted)] sm:text-xs">
                {copy.searchHelper}
                </p>
              </div>
              <div className="min-w-0 md:min-w-0 xl:flex-1">
                <label className="sr-only" htmlFor="rx-landing-loc">
                  {copy.locationPh}
                </label>
                <div className="relative">
                  <FaMapMarkerAlt className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--lx-muted)]" aria-hidden />
                  <input
                    id="rx-landing-loc"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={copy.locationPh}
                    autoComplete="address-level2"
                    aria-describedby="rx-landing-loc-hint"
                    className="min-h-[50px] w-full min-w-0 rounded-[14px] border border-[color:var(--lx-border)]/40 bg-[color:var(--lx-card)] py-3 pl-11 pr-3 text-sm text-[color:var(--lx-text)] outline-none ring-[#D97706]/25 transition-shadow focus:ring-2"
                  />
                </div>
                <p id="rx-landing-loc-hint" className="mt-1.5 text-left text-[11px] leading-snug text-[color:var(--lx-muted)] sm:text-xs">
                {copy.locationHelper}
                </p>
              </div>
            </div>
            <div className="w-full shrink-0 xl:w-[min(100%,188px)] xl:self-center">
              <button
                type="submit"
                className="inline-flex min-h-[50px] w-full items-center justify-center rounded-[14px] px-6 text-sm font-bold text-white shadow-[0_10px_32px_-12px_rgba(180,83,9,0.5)] transition hover:brightness-[1.04] hover:shadow-[0_12px_36px_-12px_rgba(180,83,9,0.52)] active:scale-[0.99] active:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 touch-manipulation"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
              >
                {copy.searchCta}
              </button>
            </div>
          </form>
          <p className="mt-3 border-t border-[color:var(--lx-border)]/20 pt-3 text-center text-[11px] leading-relaxed text-[color:var(--lx-muted)] sm:text-xs">
            {copy.continuityHint}
          </p>
          {landingNote ? (
            <p
              className="mt-3 rounded-[12px] border border-amber-300/70 bg-amber-50/90 px-3 py-2.5 text-left text-[11px] leading-relaxed text-amber-950 sm:text-xs"
              role="note"
            >
              {landingNote}
            </p>
          ) : null}

          <CategoryLandingChipsRail
            className="mt-4 sm:mt-5"
            label={lang === "en" ? "Quick restaurant filters" : "Filtros rápidos de restaurantes"}
          >
            {RESTAURANTES_BLUEPRINT_QUICK_FILTERS.map((f) => (
              <Link
                key={f.id}
                href={buildRestaurantesResultsHref(lang, f.resultParams)}
                className="inline-flex min-h-[40px] shrink-0 snap-start items-center whitespace-nowrap rounded-full border border-[#D97706]/35 bg-[color:var(--lx-card)] px-4 py-2 text-xs font-semibold text-[color:var(--lx-text)] shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-[#D97706]/60 hover:bg-[color:var(--lx-section)] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--lx-card)] touch-manipulation sm:shrink"
              >
                {lang === "es" ? f.labelEs : f.labelEn}
              </Link>
            ))}
          </CategoryLandingChipsRail>

          <div
            className="mt-4 overflow-x-auto overflow-y-hidden rounded-[20px] border border-white/10 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-5 sm:overflow-visible [&::-webkit-scrollbar]:hidden"
            style={{ background: "rgba(45,36,30,0.88)" }}
          >
            <div className="flex w-max min-w-full flex-nowrap gap-2 scroll-pl-3 scroll-pr-3 px-3 py-3 sm:w-auto sm:flex-wrap sm:scroll-pl-0 sm:scroll-pr-0 sm:px-4">
              {RESTAURANTES_BLUEPRINT_CUISINE_CHIPS.map((c) => (
                <Link
                  key={c.id}
                  href={buildRestaurantesResultsHref(lang, { cuisine: c.cuisineKey })}
                  className="inline-flex min-h-[40px] shrink-0 snap-start items-center whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-[#FFFCF7] backdrop-blur-sm transition-all duration-200 hover:-translate-y-px hover:border-amber-300/45 hover:bg-white/[0.18] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24]/85 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D241E] touch-manipulation"
                >
                  {lang === "es" ? c.labelEs : c.labelEn}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] space-y-10 overflow-x-hidden bg-[color:var(--lx-page)] px-4 pb-14 text-[color:var(--lx-text)] sm:space-y-12 sm:px-5 sm:pb-20 md:space-y-14 lg:space-y-16 lg:px-6">
        <section
          className="grid grid-cols-1 gap-5 rounded-[20px] border border-[color:var(--lx-border)]/20 bg-[color:var(--lx-card)]/90 p-5 shadow-sm sm:gap-6 sm:p-6 md:grid-cols-2 md:gap-6 md:p-7 lg:grid-cols-3 lg:gap-8 lg:p-8"
          aria-label={lang === "es" ? "Por qué Leonix Restaurantes" : "Why search Leonix Restaurants"}
        >
          {copy.trust.map((line) => (
            <p key={line} className="text-center text-sm font-medium leading-relaxed text-[color:var(--lx-text)]/80">
              {line}
            </p>
          ))}
        </section>

        <section aria-labelledby="rx-featured-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FaStar className="h-4 w-4 shrink-0" style={{ color: ACCENT }} aria-hidden />
                <h2 id="rx-featured-heading" className="font-serif text-xl font-semibold tracking-tight sm:text-2xl">
                  {copy.featuredTitle}
                </h2>
              </div>
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[color:var(--lx-muted)] sm:text-sm">{copy.featuredIntro}</p>
            </div>
          </div>
          {featuredCards.length ? (
            <div className="mt-6 flex w-full min-w-0 flex-col gap-5 sm:gap-6">
              {featuredCards.map((card) => {
                const row = discoveryLookupRows.find((r) => r.id === card.id);
                if (!row) return null;
                return (
                  <div key={card.id} className="min-w-0 w-full">
                    <RestaurantePublishedListingCard
                      row={row}
                      lang={lang}
                      badge={lang === "es" ? "Selección en portada" : "Homepage pick"}
                      cta={lang === "es" ? "Ver más" : "See more"}
                      narrowLabel={lang === "es" ? "Misma búsqueda en resultados" : "Same search in results"}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-6 rounded-[14px] border border-[color:var(--lx-border)]/35 bg-[color:var(--lx-card)] px-4 py-4 text-sm leading-relaxed text-[color:var(--lx-muted)]">
              {lang === "es"
                ? "Cuando haya listados publicados, aparecerán aquí los destacados según la política de exposición de Leonix."
                : "When published listings exist, featured picks will appear here using Leonix exposure rules."}
            </p>
          )}
        </section>

        <section aria-labelledby="rx-browse-heading">
          <div>
            <div className="flex items-center gap-2">
              <FaStar className="h-4 w-4 shrink-0" style={{ color: ACCENT }} aria-hidden />
              <h2 id="rx-browse-heading" className="font-serif text-xl font-semibold tracking-tight sm:text-2xl">
                {copy.browseTitle}
              </h2>
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[color:var(--lx-muted)] sm:text-sm">{copy.browseIntro}</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:gap-4 lg:grid-cols-6">
            {RESTAURANTES_BLUEPRINT_CATEGORY_TILES.map((tile) => (
              <Link
                key={tile.id}
                href={buildRestaurantesResultsHref(lang, { cuisine: tile.cuisineKey })}
                className="group flex flex-col overflow-hidden rounded-[16px] border border-[color:var(--lx-border)]/30 bg-[color:var(--lx-card)] shadow-[0_10px_32px_-22px_rgba(45,36,30,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-20px_rgba(45,36,30,0.45)] touch-manipulation"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-t-[16px]">
                  <Image
                    src={tile.imageSrc}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover object-center transition duration-500 group-hover:scale-[1.05]"
                  />
                </div>
                <div className="p-3 text-center">
                  <span className="text-xs font-semibold text-[color:var(--lx-text)] sm:text-sm">
                    {lang === "es" ? tile.labelEs : tile.labelEn}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="rx-recent-heading">
          <div>
            <div className="flex items-center gap-2">
              <FaStar className="h-4 w-4 shrink-0" style={{ color: ACCENT }} aria-hidden />
              <h2 id="rx-recent-heading" className="font-serif text-xl font-semibold tracking-tight sm:text-2xl">
                {copy.recentTitle}
              </h2>
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[color:var(--lx-muted)] sm:text-sm">{copy.recentIntro}</p>
          </div>
          {recentCards.length ? (
            <div className="mt-6 flex w-full min-w-0 flex-col gap-5 sm:gap-6">
              {recentCards.map((card) => {
                const row = discoveryLookupRows.find((r) => r.id === card.id);
                if (!row) return null;
                return (
                  <div key={card.id} className="min-w-0 w-full">
                    <RestaurantePublishedListingCard
                      row={row}
                      lang={lang}
                      badge={lang === "es" ? "Recién publicado" : "New listing"}
                      cta={lang === "es" ? "Ver más" : "See more"}
                      narrowLabel={lang === "es" ? "Misma búsqueda en resultados" : "Same search in results"}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-6 rounded-[14px] border border-dashed border-[#D97706]/35 bg-[color:var(--lx-section)] px-4 py-4 text-sm leading-relaxed text-[color:var(--lx-muted)]">
              {lang === "es"
                ? "Los recientes se rellenan con publicaciones vivas ordenadas por fecha."
                : "Recent listings fill in from live posts ordered by publish date."}
            </p>
          )}
        </section>

        <div className="mt-8 flex justify-center sm:mt-10 md:mt-12">
          <Link
            href={allResultsHref}
            className="inline-flex min-h-[44px] w-full max-w-md items-center justify-center rounded-full border border-[#D97706]/40 bg-[color:var(--lx-card)] px-6 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[#D97706]/65 hover:bg-[color:var(--lx-section)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/70 focus-visible:ring-offset-2 sm:w-auto sm:max-w-none"
          >
            {copy.exploreAll}
          </Link>
        </div>

        <section
          className="relative overflow-hidden rounded-[20px] border border-[color:var(--lx-border)]/25 shadow-[0_20px_50px_-28px_rgba(45,36,30,0.35)] sm:rounded-[24px]"
          aria-labelledby="rx-owner-cta"
        >
          <div className="absolute inset-0" aria-hidden>
            <Image
              src={RESTAURANTES_LANDING_CTA_BG}
              alt=""
              fill
              className="object-cover object-center opacity-90 sm:object-[center_40%]"
              sizes="(max-width: 768px) 100vw, 1280px"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#FDFBF7]/92 via-[#FDFBF7]/86 to-[#FDFBF7]/78 sm:bg-gradient-to-r sm:from-[#FDFBF7]/95 sm:via-[#FDFBF7]/88 sm:to-[#FDFBF7]/75" />
          </div>
          <div className="relative grid grid-cols-1 items-center gap-6 p-5 sm:gap-8 sm:p-7 md:grid-cols-[minmax(0,240px)_1fr] md:gap-10 lg:grid-cols-[minmax(0,280px)_1fr] lg:p-10">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-[260px] overflow-hidden rounded-[18px] shadow-lg sm:max-w-[280px] md:mx-0 md:max-w-none">
              <Image
                src={RESTAURANTES_LANDING_CTA_TEAM}
                alt=""
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 260px, min(360px, 35vw)"
              />
            </div>
            <div className="min-w-0 text-center md:text-left">
              <h2
                id="rx-owner-cta"
                className="font-serif text-[clamp(1.375rem,2.5vw+0.75rem,1.875rem)] font-semibold leading-tight text-[color:var(--lx-text)] sm:text-2xl lg:text-3xl"
              >
                {copy.ctaHeadline}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[color:var(--lx-muted)] md:mx-0 md:text-base">{copy.ctaSub}</p>
              <div className="mt-5 flex justify-center md:mt-6 md:justify-start">
                <Link
                  href={publishHref}
                  className="inline-flex min-h-[52px] w-full max-w-sm items-center justify-center rounded-[16px] px-8 text-sm font-bold text-white shadow-[0_14px_40px_-12px_rgba(180,83,9,0.58)] transition hover:brightness-[1.04] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2 sm:min-w-[220px] sm:w-auto sm:max-w-none touch-manipulation"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
                >
                  {copy.ctaBtn}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </RestaurantesLandingShell>
  );
}

export function RestaurantesLandingPage(props: {
  featuredCards: RestaurantesBlueprintCard[];
  recentCards: RestaurantesBlueprintCard[];
  landingNote?: string;
  discoveryLookupRows: RestaurantesPublicBlueprintRow[];
}) {
  return (
    <Suspense fallback={<RestaurantesLandingPageFallback />}>
      <RestaurantesLandingPageInner {...props} />
    </Suspense>
  );
}
