"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaMapMarkerAlt, FaSearch, FaStar } from "react-icons/fa";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { ViajesLangSwitch } from "@/app/clasificados/viajes/components/ViajesLangSwitch";

import { buildRestaurantesResultsHref, splitLocationInput } from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import {
  type RestaurantesBlueprintCard,
  RESTAURANTES_BLUEPRINT_CATEGORY_TILES,
  RESTAURANTES_BLUEPRINT_CUISINE_CHIPS,
  RESTAURANTES_BLUEPRINT_FEATURED,
  RESTAURANTES_BLUEPRINT_QUICK_FILTERS,
  RESTAURANTES_BLUEPRINT_RECENT,
} from "./restaurantesBlueprintSampleData";
import { RESTAURANTES_LANDING_CTA_BG, RESTAURANTES_LANDING_CTA_TEAM } from "./restaurantesLandingAssets";
import { RestaurantesLandingShell } from "./RestaurantesLandingShell";

const ACCENT = "#D97706";

function StarRow({ rating, lang }: { rating: number; lang: Lang }) {
  const rounded = Math.min(5, Math.max(0, Math.round(rating)));
  const aria =
    lang === "es" ? `${rating.toFixed(1)} de 5 estrellas` : `${rating.toFixed(1)} out of 5 stars`;
  return (
    <div className="flex items-center gap-0.5" style={{ color: ACCENT }} aria-label={aria}>
      {Array.from({ length: 5 }, (_, i) => (
        <FaStar key={i} className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ opacity: i < rounded ? 1 : 0.22 }} aria-hidden />
      ))}
    </div>
  );
}

function ListingCard({
  card,
  lang,
  variant,
  detailHref,
}: {
  card: RestaurantesBlueprintCard;
  lang: Lang;
  variant: "featured" | "recent";
  detailHref: string;
}) {
  const name = card.name;
  const cuisine = card.cuisineLine;
  const city = card.cityLine;

  const shell =
    variant === "recent"
      ? "group flex h-full flex-col overflow-hidden rounded-[20px] border border-dashed border-[#D97706]/30 bg-[#FDFBF7] shadow-[0_6px_24px_-16px_rgba(45,36,30,0.22)] ring-1 ring-[#D97706]/20 transition hover:-translate-y-0.5 hover:shadow-[0_10px_32px_-14px_rgba(45,36,30,0.3)]"
      : "group flex h-full flex-col overflow-hidden rounded-[20px] border border-[#2D241E]/[0.08] bg-[#FFFCF7] shadow-[0_14px_48px_-22px_rgba(45,36,30,0.38)] ring-1 ring-[#D97706]/15 transition hover:-translate-y-0.5 hover:shadow-[0_18px_52px_-20px_rgba(45,36,30,0.42)]";

  return (
    <article className={shell}>
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={card.imageSrc}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {variant === "featured" ? (
          <span
            className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold text-[#FFFCF7] shadow-[0_4px_14px_-4px_rgba(180,83,9,0.55)] ring-1 ring-white/25"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
          >
            {lang === "es" ? "Destacado" : "Featured"}
          </span>
        ) : (
          <span className="absolute left-3 top-3 rounded-full border border-[#2D241E]/10 bg-[#FFFCF7]/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2D241E]/75 shadow-sm backdrop-blur-sm">
            {lang === "es" ? "Recién publicado" : "New listing"}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-serif text-lg font-semibold leading-snug text-[#2D241E]">{name}</h3>
        <p className="mt-1 text-xs leading-relaxed text-[#2D241E]/65 sm:text-sm">{cuisine}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <StarRow rating={card.rating} lang={lang} />
          <span className="text-xs font-medium text-[#2D241E]/55">
            {card.rating.toFixed(1)} · {lang === "es" ? "valoración" : "rating"}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#2D241E]/[0.07] pt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2D241E]/70">
            <FaMapMarkerAlt className="h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} aria-hidden />
            {city}
          </span>
          <Link
            href={detailHref}
            className="inline-flex min-h-[40px] min-w-[96px] items-center justify-center rounded-full px-4 text-xs font-bold text-[#FFFCF7] shadow-[0_8px_22px_-10px_rgba(180,83,9,0.58)] transition hover:brightness-[1.05] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
          >
            {lang === "es" ? "Ver más" : "See more"}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function RestaurantesLandingPage() {
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

  const searchResultsHref = useMemo(() => {
    const loc = splitLocationInput(location);
    return buildRestaurantesResultsHref(lang, { q: searchQ.trim(), ...loc });
  }, [lang, searchQ, location]);

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
        featuredIntro: "Premium placements—hand-picked visibility for standout listings.",
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
      featuredIntro: "Ubicaciones premium: mayor visibilidad para anuncios destacados.",
      browseTitle: "Explora los tipos de cocina",
      browseIntro: "Entra a resultados con una cocina ya seleccionada.",
      recentTitle: "Restaurantes recientes",
      recentIntro: "Nuevas fichas en Leonix: lugares recién publicados para descubrir.",
      ctaHeadline: "¿Tienes un restaurante?",
      ctaSub:
        "Llega a comensales que ya buscan en Leonix: visibilidad clara, descubrimiento premium y espacio para crecer con destacados.",
      ctaBtn: "Anuncia tu Restaurante",
      exploreAll: "Explorar todos los resultados",
    };
  }, [lang]);

  return (
    <RestaurantesLandingShell>
      <Navbar />

      <div className="sticky top-0 z-30 border-b border-[#2D241E]/[0.08] bg-[#FFFCF7]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-6">
          <nav className="text-[11px] font-medium text-[#2D241E]/55" aria-label="Breadcrumb">
            <Link href={clasificadosHref} className="transition hover:text-[#2D241E] hover:underline">
              {copy.breadcrumbParent}
            </Link>
            <span className="mx-1.5 opacity-45">/</span>
            <span className="font-semibold text-[#2D241E]">{copy.breadcrumbCurrent}</span>
          </nav>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <ViajesLangSwitch compact />
            <Link
              href={publishHref}
              className="inline-flex min-h-[40px] items-center rounded-full border border-[#2D241E]/12 bg-[#FFFCF7] px-4 text-[11px] font-bold text-[#2D241E] shadow-sm transition hover:border-[#D97706]/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/60 focus-visible:ring-offset-2"
            >
              {lang === "es" ? "Anunciar" : "Advertise"}
            </Link>
          </div>
        </div>
      </div>

      <header className="mx-auto max-w-[1280px] px-4 pb-12 pt-8 sm:px-5 sm:pb-16 sm:pt-10 lg:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance font-serif text-[2rem] font-semibold leading-[1.12] tracking-tight text-[#2D241E] sm:text-[2.35rem] md:text-[2.65rem]">
            {copy.heroLead}
            <span className="font-serif font-semibold" style={{ color: ACCENT }}>
              {copy.heroAccent}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#2D241E]/78 sm:text-base">{copy.heroSub}</p>
        </div>

        <div className="mx-auto mt-8 max-w-[960px] rounded-[24px] border border-[#2D241E]/[0.1] bg-[#FFFCF7]/95 p-4 shadow-[0_20px_56px_-28px_rgba(45,36,30,0.45)] backdrop-blur-sm sm:p-5 md:p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(searchResultsHref);
            }}
            className="flex flex-col gap-4 lg:flex-row lg:items-start"
          >
            <div className="min-w-0 flex-1">
              <label className="sr-only" htmlFor="rx-landing-q">
                {copy.searchPh}
              </label>
              <div className="relative">
                <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2D241E]/40" aria-hidden />
                <input
                  id="rx-landing-q"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder={copy.searchPh}
                  autoComplete="off"
                  aria-describedby="rx-landing-q-hint"
                  className="min-h-[52px] w-full rounded-[16px] border border-[#2D241E]/[0.12] bg-[#FFFCF7] py-3 pl-11 pr-3 text-sm text-[#2D241E] outline-none ring-[#D97706]/30 transition-shadow focus:ring-2"
                />
              </div>
              <p id="rx-landing-q-hint" className="mt-2 text-left text-[11px] leading-snug text-[#2D241E]/55 sm:text-xs">
                {copy.searchHelper}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <label className="sr-only" htmlFor="rx-landing-loc">
                {copy.locationPh}
              </label>
              <div className="relative">
                <FaMapMarkerAlt
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2D241E]/40"
                  aria-hidden
                />
                <input
                  id="rx-landing-loc"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={copy.locationPh}
                  autoComplete="address-level2"
                  aria-describedby="rx-landing-loc-hint"
                  className="min-h-[52px] w-full rounded-[16px] border border-[#2D241E]/[0.12] bg-[#FFFCF7] py-3 pl-11 pr-3 text-sm text-[#2D241E] outline-none ring-[#D97706]/30 transition-shadow focus:ring-2"
                />
              </div>
              <p id="rx-landing-loc-hint" className="mt-2 text-left text-[11px] leading-snug text-[#2D241E]/55 sm:text-xs">
                {copy.locationHelper}
              </p>
            </div>
            <div className="flex items-stretch self-center lg:w-[200px] lg:self-center">
              <button
                type="submit"
                className="inline-flex min-h-[52px] w-full flex-1 items-center justify-center rounded-[16px] px-6 text-sm font-bold text-[#FFFCF7] shadow-[0_12px_36px_-10px_rgba(180,83,9,0.6)] transition hover:brightness-[1.04] hover:shadow-[0_14px_40px_-10px_rgba(180,83,9,0.58)] active:scale-[0.99] active:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
              >
                {copy.searchCta}
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {RESTAURANTES_BLUEPRINT_QUICK_FILTERS.map((f) => (
              <Link
                key={f.id}
                href={buildRestaurantesResultsHref(lang, f.resultParams)}
                className="inline-flex min-h-[40px] items-center rounded-full border border-[#D97706]/35 bg-[#FFFCF7] px-4 py-2 text-xs font-semibold text-[#2D241E] shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-[#D97706]/60 hover:bg-[#FFF7ED] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/70 focus-visible:ring-offset-2 touch-manipulation"
              >
                {lang === "es" ? f.labelEs : f.labelEn}
              </Link>
            ))}
          </div>

          <div
            className="mt-5 flex flex-wrap gap-2 rounded-[20px] border border-white/10 px-3 py-3 sm:px-4"
            style={{ background: "rgba(45,36,30,0.88)" }}
          >
            {RESTAURANTES_BLUEPRINT_CUISINE_CHIPS.map((c) => (
              <Link
                key={c.id}
                href={buildRestaurantesResultsHref(lang, { cuisine: c.cuisineKey })}
                className="inline-flex min-h-[40px] items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-[#FFFCF7] backdrop-blur-sm transition-all duration-200 hover:-translate-y-px hover:border-amber-300/45 hover:bg-white/[0.18] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24]/85 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2D241E] touch-manipulation"
              >
                {lang === "es" ? c.labelEs : c.labelEn}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] space-y-12 bg-[#FDFBF7] px-4 pb-16 text-[#2D241E] sm:space-y-16 sm:px-5 sm:pb-20 lg:px-6">
        <section
          className="grid grid-cols-1 gap-6 rounded-[20px] border border-[#2D241E]/[0.06] bg-[#FFFCF7]/90 p-6 shadow-sm sm:grid-cols-3 sm:gap-8 sm:p-8"
          aria-label={lang === "es" ? "Por qué Leonix Restaurantes" : "Why search Leonix Restaurants"}
        >
          {copy.trust.map((line) => (
            <p key={line} className="text-center text-sm font-medium leading-relaxed text-[#2D241E]/80">
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
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#2D241E]/60 sm:text-sm">{copy.featuredIntro}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {RESTAURANTES_BLUEPRINT_FEATURED.map((card) => (
              <ListingCard
                key={card.id}
                card={card}
                lang={lang}
                variant="featured"
                detailHref={buildRestaurantesResultsHref(lang, { q: card.name })}
              />
            ))}
          </div>
        </section>

        <section aria-labelledby="rx-browse-heading">
          <div>
            <div className="flex items-center gap-2">
              <FaStar className="h-4 w-4 shrink-0" style={{ color: ACCENT }} aria-hidden />
              <h2 id="rx-browse-heading" className="font-serif text-xl font-semibold tracking-tight sm:text-2xl">
                {copy.browseTitle}
              </h2>
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#2D241E]/60 sm:text-sm">{copy.browseIntro}</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
            {RESTAURANTES_BLUEPRINT_CATEGORY_TILES.map((tile) => (
              <Link
                key={tile.id}
                href={buildRestaurantesResultsHref(lang, { cuisine: tile.cuisineKey })}
                className="group flex flex-col overflow-hidden rounded-[16px] border border-[#2D241E]/[0.08] bg-[#FFFCF7] shadow-[0_10px_32px_-22px_rgba(45,36,30,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-20px_rgba(45,36,30,0.45)] touch-manipulation"
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={tile.imageSrc}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.05]"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  />
                </div>
                <div className="p-3 text-center">
                  <span className="text-xs font-semibold text-[#2D241E] sm:text-sm">
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
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#2D241E]/60 sm:text-sm">{copy.recentIntro}</p>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {RESTAURANTES_BLUEPRINT_RECENT.map((card) => (
              <ListingCard
                key={card.id}
                card={card}
                lang={lang}
                variant="recent"
                detailHref={buildRestaurantesResultsHref(lang, { q: card.name })}
              />
            ))}
          </div>
        </section>

        <div className="mt-10 flex justify-center sm:mt-12">
          <Link
            href={allResultsHref}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#D97706]/40 bg-[#FFFCF7] px-6 text-sm font-semibold text-[#2D241E] shadow-sm transition hover:border-[#D97706]/65 hover:bg-[#FFF7ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/70 focus-visible:ring-offset-2"
          >
            {copy.exploreAll}
          </Link>
        </div>

        <section
          className="relative overflow-hidden rounded-[24px] border border-[#2D241E]/[0.08] shadow-[0_20px_50px_-28px_rgba(45,36,30,0.35)]"
          aria-labelledby="rx-owner-cta"
        >
          <div className="absolute inset-0" aria-hidden>
            <Image src={RESTAURANTES_LANDING_CTA_BG} alt="" fill className="object-cover opacity-90" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#FDFBF7]/95 via-[#FDFBF7]/88 to-[#FDFBF7]/75" />
          </div>
          <div className="relative grid grid-cols-1 items-center gap-8 p-6 sm:grid-cols-[minmax(0,280px)_1fr] sm:gap-10 sm:p-8 lg:p-10">
            <div className="relative mx-auto aspect-[4/3] w-full max-w-[280px] overflow-hidden rounded-[20px] shadow-lg sm:mx-0 sm:max-w-none">
              <Image src={RESTAURANTES_LANDING_CTA_TEAM} alt="" fill className="object-cover" sizes="(max-width:640px) 280px, 360px" />
            </div>
            <div className="min-w-0 text-center sm:text-left">
              <h2 id="rx-owner-cta" className="font-serif text-2xl font-semibold leading-tight text-[#2D241E] sm:text-3xl">
                {copy.ctaHeadline}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#2D241E]/78 sm:mx-0 sm:text-base">{copy.ctaSub}</p>
              <div className="mt-6 flex justify-center sm:justify-start">
                <Link
                  href={publishHref}
                  className="inline-flex min-h-[52px] min-w-[220px] items-center justify-center rounded-[16px] px-8 text-sm font-bold text-[#FFFCF7] shadow-[0_14px_40px_-12px_rgba(180,83,9,0.58)] transition hover:brightness-[1.04] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
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
