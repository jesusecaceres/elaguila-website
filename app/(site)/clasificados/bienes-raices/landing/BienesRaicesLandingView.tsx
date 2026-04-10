"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import {
  BR_PUBLICAR_NEGOCIOS_PUBLIC_ENTRY,
  BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY,
  BR_RESULTS,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { buildBrResultsUrl } from "@/app/clasificados/bienes-raices/shared/constants/brResultsRoutes";
import { BienesRaicesNegocioCard } from "@/app/clasificados/bienes-raices/resultados/cards/BienesRaicesNegocioCard";
import { BienesRaicesNegocioFeaturedCard } from "@/app/clasificados/bienes-raices/resultados/cards/BienesRaicesNegocioFeaturedCard";
import { BienesRaicesMapPreview } from "@/app/clasificados/bienes-raices/resultados/map/BienesRaicesMapPreview";
import { BienesRaicesResultsShell } from "@/app/clasificados/bienes-raices/resultados/components/BienesRaicesResultsShell";
import {
  BR_LANDING_QUICK_CHIPS,
  brLandingDestacadas,
  brLandingFeaturedHero,
  brLandingNegocios,
  brLandingPrivado,
  brLandingRecientes,
} from "./bienesRaicesLandingSample";
import { getBrLandingCopy, type BrLandingCopy } from "./bienesRaicesLandingCopy";

const BTN_PRIMARY =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#C2542D] px-5 py-3 text-center text-sm font-bold text-[#FFFCF7] shadow-[0_12px_32px_-14px_rgba(194,84,45,0.55)] transition hover:bg-[#A84724] hover:shadow-[0_14px_36px_-12px_rgba(194,84,45,0.45)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B46A]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4EFE6] sm:w-auto";

const BTN_SECONDARY =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#E8DFD0]/95 bg-gradient-to-b from-[#FFFCF7] to-[#F5EFE6]/90 px-5 py-3 text-center text-sm font-bold text-[#1E1810] shadow-[0_6px_20px_-12px_rgba(42,36,22,0.2)] transition hover:border-[#C9B46A]/50 hover:shadow-[0_10px_28px_-14px_rgba(42,36,22,0.18)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B46A]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4EFE6] sm:w-auto";

const INPUT_CLASS =
  "w-full rounded-xl border border-[#E8DFD0]/95 bg-white/95 py-3 text-sm text-[#1E1810] shadow-[inset_0_1px_2px_rgba(61,54,48,0.04)] outline-none transition placeholder:text-[#5C5346]/38 focus:border-[#C9B46A]/65 focus:bg-white focus:ring-2 focus:ring-[#C9B46A]/18";

function BandHeader({
  id,
  title,
  subtitle,
  accent,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  accent?: "gold" | "neutral";
}) {
  return (
    <div className="mb-6 max-w-2xl">
      {accent === "gold" ? (
        <span className="mb-2 inline-block h-1 w-10 rounded-full bg-gradient-to-r from-[#C9B46A] to-[#E8D5A8]" aria-hidden />
      ) : null}
      <h2
        id={id}
        className="font-serif text-2xl font-semibold tracking-tight text-[#1E1810] sm:text-[1.7rem] sm:leading-snug"
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-2.5 text-sm leading-relaxed text-[#5C5346]/88 sm:max-w-prose">{subtitle}</p>
      ) : null}
    </div>
  );
}

function LandingSearchForm({
  withLang,
  copy,
}: {
  withLang: (path: string) => string;
  copy: BrLandingCopy;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [operationType, setOperationType] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [city, setCity] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const path = buildBrResultsUrl({
      q: q.trim() || undefined,
      operationType: operationType || undefined,
      city: city.trim() || undefined,
      propertyType: propertyType || undefined,
    });
    router.push(withLang(path));
  };

  return (
    <form
      onSubmit={onSubmit}
      className="overflow-hidden rounded-[1.25rem] border border-[#E8DFD0]/75 bg-gradient-to-b from-white/[0.97] to-[#FDFBF7]/95 p-4 shadow-[0_20px_56px_-32px_rgba(42,36,22,0.38)] ring-1 ring-[#C9B46A]/[0.09] backdrop-blur-[2px] sm:p-6"
    >
      <div className="flex flex-col gap-5">
        <label className="min-w-0">
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#5C5346]/72">
            {copy.searchKeywordLabel}
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B8954A]" aria-hidden>
              ⌕
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={copy.searchKeywordPlaceholder}
              autoComplete="off"
              className={`${INPUT_CLASS} pl-11 pr-3.5`}
            />
          </div>
        </label>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#E8DFD0]/80 to-transparent" aria-hidden />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end lg:gap-3">
          <label>
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#5C5346]/72">
              {copy.searchOperationLabel}
            </span>
            <select
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              className={`${INPUT_CLASS} cursor-pointer px-3.5`}
            >
              <option value="">{copy.searchOperationAny}</option>
              <option value="venta">{copy.searchOperationSale}</option>
              <option value="renta">{copy.searchOperationRent}</option>
            </select>
          </label>
          <label>
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#5C5346]/72">
              {copy.searchPropertyLabel}
            </span>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className={`${INPUT_CLASS} cursor-pointer px-3.5`}
            >
              <option value="">{copy.searchPropertyPlaceholder}</option>
              <option value="casa">{copy.searchPropertyHouse}</option>
              <option value="departamento">{copy.searchPropertyApartment}</option>
              <option value="terreno">{copy.searchPropertyLand}</option>
              <option value="comercial">{copy.searchPropertyCommercial}</option>
            </select>
          </label>
          <label className="sm:col-span-2 lg:col-span-1">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#5C5346]/72">
              {copy.searchCityLabel}
            </span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={copy.searchCityPlaceholder}
              autoComplete="address-level2"
              className={`${INPUT_CLASS} px-3.5`}
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-1">
            <button type="submit" className={BTN_PRIMARY + " w-full"}>
              {copy.searchSubmit}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

type BandVariant = "spotlight" | "neutral" | "private" | "business";

const BAND_SKIN: Record<BandVariant, string> = {
  spotlight:
    "rounded-[1.35rem] border border-[#C9B46A]/22 bg-gradient-to-br from-[#FFFCF7]/95 via-[#FDFBF7]/90 to-[#F4EFE6]/45 p-5 shadow-[0_22px_60px_-36px_rgba(42,36,22,0.28)] ring-1 ring-[#C9B46A]/[0.07] sm:p-7",
  neutral:
    "rounded-[1.35rem] border border-[#E8DFD0]/55 bg-[#FDFBF7]/35 p-5 shadow-[0_12px_40px_-28px_rgba(42,36,22,0.14)] sm:p-7",
  private:
    "rounded-[1.35rem] border border-[#E8DFD0]/80 bg-gradient-to-b from-[#FAF7F2]/90 to-[#F4EFE6]/35 p-5 shadow-[0_14px_44px_-30px_rgba(42,36,22,0.18)] sm:p-7",
  business:
    "rounded-[1.35rem] border border-[#C9B46A]/28 bg-gradient-to-b from-[#FFF9F0]/85 to-[#F4EFE6]/40 p-5 shadow-[0_20px_56px_-34px_rgba(42,36,22,0.24)] ring-1 ring-[#C9B46A]/[0.1] sm:p-7",
};

function ListingBand({
  id,
  title,
  subtitle,
  listings,
  withLang,
  variant,
  copy,
}: {
  id: string;
  title: string;
  subtitle?: string;
  listings: typeof brLandingRecientes;
  withLang: (path: string) => string;
  variant: BandVariant;
  copy: BrLandingCopy;
}) {
  const sellerLabels = { privado: copy.sellerPrivado, negocio: copy.sellerNegocio };
  return (
    <section className="mt-14 sm:mt-16" aria-labelledby={id}>
      <div className={BAND_SKIN[variant]}>
        <BandHeader id={id} title={title} subtitle={subtitle} accent={variant === "spotlight" || variant === "business" ? "gold" : "neutral"} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 [&_article]:rounded-[1.12rem] [&_article]:border-[#E8DFD0]/90 [&_article]:shadow-[0_14px_44px_-18px_rgba(42,36,22,0.22)] [&_article]:ring-1 [&_article]:ring-[#C9B46A]/[0.07] [&_article]:transition [&_article]:duration-300 [&_article]:hover:border-[#C9B46A]/30 [&_article]:hover:shadow-[0_18px_48px_-16px_rgba(42,36,22,0.26)]">
          {listings.map((listing) => (
            <BienesRaicesNegocioCard key={listing.id} listing={listing} sellerKindLabels={sellerLabels} />
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={withLang(BR_RESULTS)} className={BTN_SECONDARY}>
            {copy.bandMoreInResults}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function BienesRaicesLandingView() {
  const searchParams = useSearchParams();
  const lang = (searchParams?.get("lang") === "en" ? "en" : "es") as Lang;
  const copy = useMemo(() => getBrLandingCopy(lang), [lang]);

  const withLang = useMemo(() => {
    return (path: string) => appendLangToPath(path, lang);
  }, [lang]);

  const mapCopy = useMemo(
    () => ({
      softView: copy.mapSoftView,
      location: copy.mapLocation,
      area: copy.mapArea,
      zoom: copy.mapZoom,
      hint: copy.mapHint,
      ariaCluster: copy.mapAriaCluster,
    }),
    [copy]
  );

  const sellerLabels = useMemo(
    () => ({ privado: copy.sellerPrivado, negocio: copy.sellerNegocio }),
    [copy]
  );

  return (
    <BienesRaicesResultsShell>
      <div className="min-w-0 overflow-x-hidden">
        <nav className="mb-7 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5C5346]">
          <Link href={withLang("/clasificados")} className="transition hover:text-[#B8954A]">
            {copy.navClasificados}
          </Link>
          <span className="text-[#C9B46A]/90" aria-hidden>
            /
          </span>
          <span className="text-[#1E1810]">{copy.navBreadcrumbCurrent}</span>
        </nav>

        <header className="relative mb-2 overflow-hidden rounded-[1.75rem] border border-white/40 shadow-[0_28px_80px_-40px_rgba(42,36,22,0.42)]">
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-[center_30%] opacity-[0.14] mix-blend-multiply"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2000&q=75&auto=format&fit=crop)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#dfe9f4]/35 via-[#f3ebe0]/50 to-[#f4efe6]/65"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FDFBF7]/93 via-[#F7F1E8]/88 to-[#F4EFE6]/82"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/25 to-transparent" aria-hidden />

          <div className="relative z-10 px-4 pb-10 pt-8 sm:px-7 sm:pb-11 sm:pt-9">
            <div className="flex flex-col gap-9 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
              <div className="max-w-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8A6F3A]">{copy.categoryEyebrow}</p>
                <h1 className="mt-3 font-serif text-[2.15rem] font-semibold leading-[1.1] tracking-tight text-[#1E1810] sm:text-[2.65rem] sm:leading-[1.08]">
                  {copy.pageTitle}
                </h1>
                <p className="mt-4 max-w-prose text-base leading-[1.65] text-[#4a433c]/92 sm:text-lg">{copy.heroSubtitle}</p>
              </div>
              <div className="flex w-full min-w-0 flex-col gap-3 sm:max-w-md lg:mt-1 lg:w-auto lg:shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5C5346]/72">{copy.publishEyebrow}</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link href={withLang(BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY)} className={BTN_SECONDARY}>
                    {copy.publishPrivado}
                  </Link>
                  <Link href={withLang(BR_PUBLICAR_NEGOCIOS_PUBLIC_ENTRY)} className={BTN_PRIMARY}>
                    {copy.publishNegocio}
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <LandingSearchForm withLang={withLang} copy={copy} />
            </div>
          </div>
        </header>

        <div className="mx-auto mt-3 h-px max-w-3xl bg-gradient-to-r from-transparent via-[#E8DFD0]/70 to-transparent" aria-hidden />

        <section className="mt-10 sm:mt-11" aria-labelledby="br-quick-chips">
          <h2 id="br-quick-chips" className="sr-only">
            {copy.quickFiltersHeading}
          </h2>
          <div className="flex flex-wrap gap-2.5">
            {BR_LANDING_QUICK_CHIPS.map((chip) => (
              <Link
                key={chip.id}
                href={withLang(buildBrResultsUrl(chip.params))}
                className="group/chip inline-flex items-center rounded-full border border-[#E8DFD0]/85 bg-gradient-to-b from-[#FFFCF7] to-[#F5EFE6]/85 px-4 py-2.5 text-[13px] font-semibold text-[#3D3630] shadow-[0_6px_20px_-10px_rgba(42,36,22,0.22)] ring-1 ring-[#C9B46A]/[0.06] transition hover:border-[#C9B46A]/45 hover:shadow-[0_10px_26px_-12px_rgba(194,84,45,0.18)] hover:ring-[#C9B46A]/22 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9B46A]/45"
              >
                {copy.chipLabel[chip.id]}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 sm:mt-16" aria-labelledby="br-featured-hero">
          <BandHeader
            id="br-featured-hero"
            title={copy.featuredTitle}
            subtitle={copy.featuredSubtitle}
            accent="gold"
          />
          <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
            <div className="min-w-0 lg:col-span-7 xl:col-span-8">
              <BienesRaicesNegocioFeaturedCard
                listing={brLandingFeaturedHero}
                titleAsLink={false}
                sellerKindLabels={sellerLabels}
                className="rounded-[1.35rem] ring-1 ring-[#C9B46A]/12 shadow-[0_22px_64px_-24px_rgba(42,36,22,0.32)] hover:shadow-[0_28px_72px_-22px_rgba(42,36,22,0.36)]"
              />
            </div>
            <div className="hidden min-h-0 lg:col-span-5 lg:block xl:col-span-4">
              <BienesRaicesMapPreview copy={mapCopy} />
            </div>
          </div>
          <div className="mt-5 lg:hidden">
            <BienesRaicesMapPreview copy={mapCopy} />
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={withLang(buildBrResultsUrl({ operationType: "venta", city: "Monterrey" }))} className={BTN_PRIMARY}>
              {copy.featuredCtaProperties}
            </Link>
            <Link href={withLang(BR_RESULTS)} className={BTN_SECONDARY}>
              {copy.featuredCtaExplore}
            </Link>
          </div>
        </section>

        <ListingBand
          id="br-band-destacadas"
          title={copy.sectionDestacadasTitle}
          subtitle={copy.sectionDestacadasSubtitle}
          listings={brLandingDestacadas}
          withLang={withLang}
          variant="spotlight"
          copy={copy}
        />

        <ListingBand
          id="br-band-recientes"
          title={copy.sectionRecientesTitle}
          subtitle={copy.sectionRecientesSubtitle}
          listings={brLandingRecientes}
          withLang={withLang}
          variant="neutral"
          copy={copy}
        />

        <ListingBand
          id="br-band-privado"
          title={copy.sectionPrivadoTitle}
          subtitle={copy.sectionPrivadoSubtitle}
          listings={brLandingPrivado}
          withLang={withLang}
          variant="private"
          copy={copy}
        />

        <ListingBand
          id="br-band-negocios"
          title={copy.sectionNegociosTitle}
          subtitle={copy.sectionNegociosSubtitle}
          listings={brLandingNegocios}
          withLang={withLang}
          variant="business"
          copy={copy}
        />

        <section className="mt-16 sm:mt-20">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-[#E8DFD0]/70 bg-gradient-to-br from-[#FFFCF7] via-[#F9F3EA] to-[#eef3f9]/50 p-6 shadow-[0_24px_64px_-36px_rgba(42,36,22,0.35)] ring-1 ring-[#C9B46A]/[0.12] sm:p-11">
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#dfe9f4]/40 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-[#f0e0c8]/35 blur-3xl"
              aria-hidden
            />
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#1E1810] sm:text-[1.85rem]">
                {copy.footerTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#5C5346]/88 sm:text-[0.95rem]">{copy.footerBody}</p>
              <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link href={withLang(BR_RESULTS)} className={BTN_PRIMARY}>
                  {copy.footerCtaExploreAll}
                </Link>
                <Link href={withLang(BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY)} className={BTN_SECONDARY}>
                  {copy.footerCtaPublish}
                </Link>
              </div>
              <p className="mt-9 text-xs leading-relaxed text-[#5C5346]/72">{copy.footerTrustLine}</p>
            </div>
          </div>
        </section>
      </div>
    </BienesRaicesResultsShell>
  );
}
