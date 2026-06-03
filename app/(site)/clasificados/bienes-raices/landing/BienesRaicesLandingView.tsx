"use client";

import Link from "next/link";
import { CategoryStandardLandingPage } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPage";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
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
import { BR_LANDING_QUICK_CHIPS } from "./bienesRaicesLandingSample";
import { buildBrLandingInventorySections } from "./buildBrLandingInventorySections";
import { buildBrDemoListingPool } from "../lib/brDemoListingPool";
import { brShouldMergeDemoInventoryWithLive } from "../lib/brPublicInventoryMode";
import { fetchBrPublishedListingsForBrowse } from "../lib/fetchBrPublishedListingsBrowser";
import type { BrNegocioListing } from "../resultados/cards/listingTypes";
import { BienesRaicesBrConsentStrip } from "@/app/clasificados/bienes-raices/components/BienesRaicesBrConsentStrip";
import { getBrLastCity, setBrLastCity } from "@/app/clasificados/bienes-raices/shared/brFirstPartyPrefs";
import {
  brLuxuryBtnPrimaryClass,
  brLuxuryBtnSecondaryClass,
} from "@/app/clasificados/bienes-raices/shared/brResultsTheme";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { getBrLandingCopy, type BrLandingCopy } from "./bienesRaicesLandingCopy";

const BTN_PRIMARY = "min-h-[50px] w-full min-w-0 px-7 py-3.5 text-center text-sm font-medium transition-all duration-200 border bg-[#D4A574] text-white border-[#D4A574] hover:bg-[#C19A6B] rounded-full sm:w-auto";

const BTN_SECONDARY = "min-h-[50px] w-full min-w-0 px-7 py-3.5 text-center text-sm font-medium transition-all duration-200 border bg-white text-[#1A1A1A] border-[#E5E5E5] hover:bg-[#FFFAF0] hover:border-[#D4A574] rounded-full sm:w-auto";

const INPUT_CLASS =
  "w-full min-h-[3.25rem] rounded-3xl border border-[#D4A574]/30 bg-[#FFFAF0] py-3 text-sm text-[#1A1A1A] shadow-[inset_0_2px_4px_rgba(212,165,116,0.04)] outline-none transition placeholder:text-[#7A7A7A]/36 focus:border-[#D4A574]/70 focus:bg-white focus:shadow-[inset_0_0_0_1px_rgba(212,165,116,0.25)] focus:ring-2 focus:ring-[#D4A574]/22";

function SectionHeading({
  id,
  title,
  subtitle,
  index,
  accent,
}: {
  id: string;
  title: string;
  subtitle?: string;
  index: string;
  accent: "gold" | "slate" | "ember";
}) {
  const idxColor =
    accent === "gold" ? "text-[#C9B46A]/45" : accent === "ember" ? "text-[#C2542D]/25" : "text-[#8B7355]/35";
  return (
    <div className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-4 sm:gap-6">
        <span
          className={`shrink-0 font-serif text-[clamp(2rem,5.5vw,3.25rem)] font-semibold leading-none ${idxColor}`}
          aria-hidden
        >
          {index}
        </span>
        <div className="min-w-0">
          {accent === "gold" ? (
            <span className="mb-2 inline-flex h-1 w-12 rounded-full bg-gradient-to-r from-[#C9B46A] to-[#E8D5A8]" aria-hidden />
          ) : accent === "ember" ? (
            <span className="mb-2 inline-flex h-1 w-12 rounded-full bg-gradient-to-r from-[#C2542D]/70 to-[#E8B88A]" aria-hidden />
          ) : (
            <span className="mb-2 inline-flex h-1 w-12 rounded-full bg-gradient-to-r from-[#B8A995] to-[#E8DFD0]" aria-hidden />
          )}
          <h2
            id={id}
            className="font-serif text-[1.65rem] font-semibold tracking-tight text-[#1E1810] sm:text-[1.85rem] sm:leading-snug"
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2.5 max-w-prose text-sm leading-relaxed text-[#5C5346]/88">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FeaturedHeading({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8 max-w-3xl">
      <div className="flex flex-wrap items-center gap-3">
        <span className="h-px min-w-[2.5rem] flex-1 max-w-[5rem] bg-gradient-to-r from-[#C9B46A] to-transparent sm:min-w-[3.5rem]" aria-hidden />
        <h2 id={id} className="font-serif text-[1.75rem] font-semibold tracking-tight text-[#1E1810] sm:text-[2rem]">
          {title}
        </h2>
      </div>
      {subtitle ? <p className="mt-3 text-sm leading-relaxed text-[#5C5346]/88 sm:text-[0.95rem]">{subtitle}</p> : null}
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

  useEffect(() => {
    const remembered = getBrLastCity();
    if (remembered) setCity(remembered);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCity = city.trim();
    const cityParam = rawCity ? getCanonicalCityName(rawCity) || rawCity : undefined;
    if (cityParam) setBrLastCity(cityParam);
    const path = buildBrResultsUrl({
      q: q.trim() || undefined,
      operationType: operationType || undefined,
      city: cityParam,
      propertyType: propertyType || undefined,
    });
    router.push(withLang(path));
  };

  return (
    <div className="relative">
      <p className="mb-4 px-1 text-center font-serif text-lg text-[#3D3630]/90 sm:px-0 sm:text-left sm:text-xl">{copy.searchModuleLead}</p>
      <form
        onSubmit={onSubmit}
        className="relative overflow-hidden rounded-[1.35rem] border border-white/65 bg-gradient-to-br from-white/94 via-[#FDFBF7]/97 to-[#f3ebe6]/88 shadow-[0_20px_64px_-32px_rgba(42,36,22,0.28)] ring-1 ring-[#C9B46A]/12 backdrop-blur-md"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#C2542D]/90 via-[#C9B46A] to-[#dfe9f4]/75" aria-hidden />
        <div className="p-5 sm:p-6 md:p-7">
          <label className="block min-w-0">
            <span className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#5C5346]/68">
              {copy.searchKeywordLabel}
            </span>
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-[1.15rem] w-[1.15rem] -translate-y-1/2 text-[#B8954A]" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={copy.searchKeywordPlaceholder}
                autoComplete="off"
                className={`${INPUT_CLASS} min-h-[3.5rem] py-3.5 pl-12 pr-4 text-base sm:text-[1.05rem]`}
              />
            </div>
          </label>

          <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-[#E8DFD0]/80 to-transparent" aria-hidden />

          <div className="grid grid-cols-1 items-stretch gap-3.5 sm:grid-cols-2 sm:items-end sm:gap-4 lg:grid-cols-4 lg:gap-4">
            <label className="min-w-0 sm:col-span-1">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#5C5346]/68">
                {copy.searchOperationLabel}
              </span>
              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value)}
                className={`${INPUT_CLASS} cursor-pointer px-4`}
              >
                <option value="">{copy.searchOperationAny}</option>
                <option value="venta">{copy.searchOperationSale}</option>
                <option value="renta">{copy.searchOperationRent}</option>
              </select>
            </label>
            <label className="min-w-0 sm:col-span-1">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#5C5346]/68">
                {copy.searchPropertyLabel}
              </span>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className={`${INPUT_CLASS} cursor-pointer px-4`}
              >
                <option value="">{copy.searchPropertyPlaceholder}</option>
                <option value="casa">{copy.searchPropertyHouse}</option>
                <option value="departamento">{copy.searchPropertyApartment}</option>
                <option value="terreno">{copy.searchPropertyLand}</option>
                <option value="comercial">{copy.searchPropertyCommercial}</option>
              </select>
            </label>
            <label className="min-w-0 sm:col-span-2 lg:col-span-1">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#5C5346]/68">
                {copy.searchCityLabel}
              </span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={copy.searchCityPlaceholder}
                autoComplete="address-level2"
                className={`${INPUT_CLASS} px-4`}
              />
            </label>
            <div className="min-w-0 sm:col-span-2 lg:col-span-1">
              <button type="submit" className={BTN_PRIMARY + " w-full shadow-[0_16px_40px_-14px_rgba(194,84,45,0.5)]"}>
                {copy.searchSubmit}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

type BandVariant = "spotlight" | "neutral" | "private" | "business";

const BAND_SKIN: Record<BandVariant, string> = {
  spotlight:
    "relative overflow-hidden rounded-[1.65rem] border border-[#C9B46A]/28 bg-gradient-to-br from-[#FFFCF7] via-[#FDFBF7]/95 to-[#f0e9dc]/90 p-6 shadow-[0_28px_72px_-40px_rgba(42,36,22,0.35)] ring-1 ring-[#C9B46A]/[0.12] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top_right,rgba(201,180,106,0.12),transparent_55%)] sm:p-8",
  neutral:
    "relative overflow-hidden rounded-[1.65rem] border border-[#E8DFD0]/65 bg-gradient-to-b from-[#FDFBF7]/80 to-[#F4EFE6]/45 p-6 shadow-[0_18px_52px_-36px_rgba(42,36,22,0.22)] sm:p-8",
  private:
    "relative overflow-hidden rounded-[1.65rem] border border-[#E8DFD0]/85 bg-gradient-to-br from-[#FAF7F2]/95 to-[#ebe4dc]/50 p-6 shadow-[0_20px_56px_-34px_rgba(42,36,22,0.26)] sm:p-8",
  business:
    "relative overflow-hidden rounded-[1.65rem] border border-[#C9B46A]/32 bg-gradient-to-b from-[#FFF9F0]/95 via-[#FDFBF7]/90 to-[#f4efe6]/55 p-6 shadow-[0_26px_68px_-38px_rgba(42,36,22,0.32)] ring-1 ring-[#C9B46A]/[0.14] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_bottom_left,rgba(223,233,244,0.35),transparent_60%)] sm:p-8",
};

const BAND_ACCENT: Record<BandVariant, "gold" | "slate" | "ember"> = {
  spotlight: "gold",
  neutral: "slate",
  private: "slate",
  business: "ember",
};

function ListingBand({
  id,
  title,
  subtitle,
  listings,
  withLang,
  variant,
  copy,
  sectionIndex,
  lang,
  inventoryLoading,
}: {
  id: string;
  title: string;
  subtitle?: string;
  listings: BrNegocioListing[];
  withLang: (path: string) => string;
  variant: BandVariant;
  copy: BrLandingCopy;
  sectionIndex: string;
  lang: Lang;
  /** When true, show loading line instead of cards (live-only mode before first fetch completes). */
  inventoryLoading: boolean;
}) {
  const sellerLabels = { privado: copy.sellerPrivado, negocio: copy.sellerNegocio };
  return (
    <section className="mt-16 sm:mt-[4.5rem]" aria-labelledby={id}>
      <div className={BAND_SKIN[variant]}>
        <div className="relative z-[1]">
          <SectionHeading
            id={id}
            title={title}
            subtitle={subtitle}
            index={sectionIndex}
            accent={BAND_ACCENT[variant]}
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 [&_article]:rounded-[1.2rem] [&_article]:border-[#E8DFD0]/88 [&_article]:shadow-[0_18px_52px_-22px_rgba(42,36,22,0.26)] [&_article]:ring-1 [&_article]:ring-[#C9B46A]/[0.09] [&_article]:transition [&_article]:duration-300 [&_article]:hover:-translate-y-1 [&_article]:hover:border-[#C9B46A]/38 [&_article]:hover:shadow-[0_26px_64px_-24px_rgba(42,36,22,0.32)]">
            {inventoryLoading ? (
              <p className="col-span-full rounded-2xl border border-[#E8DFD0]/80 bg-[#FDFBF7]/90 px-4 py-6 text-center text-sm text-[#5C5346]">
                {copy.inventoryLoading}
              </p>
            ) : listings.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-[#E8DFD0]/80 bg-[#FDFBF7]/90 px-4 py-8 text-center sm:px-8">
                <p className="font-semibold text-[#1E1810]">{copy.inventoryEmptyTitle}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#5C5346]/90">{copy.inventoryEmptyBody}</p>
              </div>
            ) : (
              listings.map((listing) => (
                <BienesRaicesNegocioCard
                  key={listing.id}
                  listing={listing}
                  sellerKindLabels={sellerLabels}
                  lang={lang}
                />
              ))
            )}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={withLang(BR_RESULTS)} className={BTN_SECONDARY}>
              {copy.bandMoreInResults}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BienesRaicesLandingView() {
  const searchParams = useSearchParams();
  const lang = (searchParams?.get("lang") === "en" ? "en" : "es") as Lang;
  const copy = useMemo(() => getBrLandingCopy(lang), [lang]);
  const mergeDemo = useMemo(() => brShouldMergeDemoInventoryWithLive(), []);
  const [livePool, setLivePool] = useState<BrNegocioListing[]>([]);
  const [liveErr, setLiveErr] = useState<string | null>(null);
  const [liveReady, setLiveReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const r = await fetchBrPublishedListingsForBrowse({ lang, limit: 60 });
      if (cancelled) return;
      setLivePool(r.listings);
      setLiveErr(r.error);
      setLiveReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const basePool = useMemo(() => {
    if (!liveReady) {
      return mergeDemo ? buildBrDemoListingPool() : [];
    }
    if (mergeDemo) {
      const byId = new Map<string, BrNegocioListing>();
      for (const d of buildBrDemoListingPool()) byId.set(d.id, d);
      for (const L of livePool) byId.set(L.id, L);
      return Array.from(byId.values());
    }
    return livePool;
  }, [liveReady, livePool, mergeDemo]);

  const sections = useMemo(() => buildBrLandingInventorySections(basePool), [basePool]);
  const bandsLoading = !liveReady && !mergeDemo;

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
      ariaCluster:
        basePool.length > 0
          ? lang === "es"
            ? `${Math.min(99, basePool.length)} anuncios en el inventario cargado · mapa ilustrativo. Acercar.`
            : `${Math.min(99, basePool.length)} listings in loaded inventory · illustrative map. Zoom in.`
          : copy.mapAriaCluster,
    }),
    [copy, basePool.length, lang]
  );

  const mapClusterCount = basePool.length > 0 ? basePool.length : null;

  const sellerLabels = useMemo(
    () => ({ privado: copy.sellerPrivado, negocio: copy.sellerNegocio }),
    [copy]
  );

  return (
    <BienesRaicesResultsShell>
      <div className="min-w-0 overflow-x-hidden">
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#5C5346]">
          <Link href={withLang("/clasificados")} className="transition hover:text-[#B8954A]">
            {copy.navClasificados}
          </Link>
          <span className="text-[#C9B46A]/90" aria-hidden>
            /
          </span>
          <span className="text-[#1E1810]">{copy.navBreadcrumbCurrent}</span>
        </nav>

        <BienesRaicesBrConsentStrip lang={lang} />

        {liveErr ? (
          <p
            className="mb-6 rounded-2xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            {lang === "es" ? "Aviso — inventario publicado no disponible:" : "Notice — published inventory unavailable:"}{" "}
            {liveErr}
          </p>
        ) : null}

        <CategoryStandardLandingPage
          category="bienes-raices"
          lang={lang}
          publishHref={withLang(BR_PUBLICAR_NEGOCIOS_PUBLIC_ENTRY)}
          browseHref={withLang(BR_RESULTS)}
          publishLabel={copy.publishNegocio}
          searchSlot={<LandingSearchForm withLang={withLang} copy={copy} />}
          belowHero={
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              <Link href={withLang(BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY)} className={BTN_SECONDARY + " sm:min-w-[12rem]"}>
                {copy.publishPrivado}
              </Link>
              <Link href={withLang(BR_PUBLICAR_NEGOCIOS_PUBLIC_ENTRY)} className={BTN_PRIMARY + " sm:min-w-[12rem]"}>
                {copy.publishNegocio}
              </Link>
            </div>
          }
          searchChips={
            <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
              {BR_LANDING_QUICK_CHIPS.map((chip) => (
                <Link
                  key={chip.id}
                  href={withLang(buildBrResultsUrl(chip.params))}
                  className="inline-flex min-h-[36px] shrink-0 snap-start items-center rounded-full border border-[#D6C7AD]/70 bg-[#FFFDF7] px-3 py-1.5 text-xs font-semibold text-[#2A4536] hover:border-[#7A1E2C]/40"
                >
                  {copy.chipLabel[chip.id]}
                </Link>
              ))}
            </div>
          }
        />

        <section className="mt-16 sm:mt-[4.5rem]" aria-labelledby="br-featured-hero">
          <div className="relative overflow-hidden rounded-[1.75rem] border-2 border-[#C9B46A]/35 bg-gradient-to-b from-[#FFF9F0]/95 via-[#FDFBF7] to-[#eef3f9]/25 p-5 shadow-[0_32px_90px_-40px_rgba(42,36,22,0.45)] ring-1 ring-[#C9B46A]/15 sm:rounded-[2rem] sm:p-8 lg:p-10">
            <div
              className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-[#dfe9f4]/45 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-[#f0dcc4]/35 blur-3xl"
              aria-hidden
            />
            <div className="relative z-[1]">
              <FeaturedHeading id="br-featured-hero" title={copy.featuredTitle} subtitle={copy.featuredSubtitle} />
              <div className="grid min-h-0 gap-7 lg:grid-cols-12 lg:items-stretch lg:gap-8">
                <div className="min-h-0 min-w-0 lg:col-span-7 xl:col-span-8">
                  {bandsLoading ? (
                    <div className="flex min-h-[280px] items-center justify-center rounded-[1.4rem] border border-[#E8DFD0]/80 bg-[#FDFBF7]/90 px-6 text-center text-sm text-[#5C5346]">
                      {copy.inventoryLoading}
                    </div>
                  ) : sections.featured ? (
                    <BienesRaicesNegocioFeaturedCard
                      listing={sections.featured}
                      titleAsLink={false}
                      sellerKindLabels={sellerLabels}
                      lang={lang}
                      className="rounded-[1.4rem] border-[#E8DFD0]/80 shadow-[0_28px_80px_-30px_rgba(42,36,22,0.4)] ring-2 ring-[#C9B46A]/15 hover:shadow-[0_36px_96px_-32px_rgba(42,36,22,0.45)]"
                    />
                  ) : (
                    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-[1.4rem] border border-[#E8DFD0]/80 bg-[#FDFBF7]/90 px-6 text-center">
                      <p className="font-serif text-lg font-semibold text-[#1E1810]">{copy.emptyFeaturedTitle}</p>
                      <p className="max-w-md text-sm leading-relaxed text-[#5C5346]/90">{copy.emptyFeaturedBody}</p>
                    </div>
                  )}
                </div>
                <div className="hidden min-h-0 min-w-0 lg:col-span-5 lg:flex xl:col-span-4">
                  <div className="flex min-h-0 w-full flex-1 flex-col">
                    <BienesRaicesMapPreview copy={mapCopy} clusterListingCount={mapClusterCount} />
                  </div>
                </div>
              </div>
              <div className="mt-6 min-w-0 lg:hidden">
                <BienesRaicesMapPreview copy={mapCopy} clusterListingCount={mapClusterCount} />
              </div>
              <div className="mt-8 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link href={withLang(buildBrResultsUrl({ operationType: "venta", city: "Monterrey" }))} className={BTN_PRIMARY}>
                  {copy.featuredCtaProperties}
                </Link>
                <Link href={withLang(BR_RESULTS)} className={BTN_SECONDARY}>
                  {copy.featuredCtaExplore}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <ListingBand
          id="br-band-destacadas"
          title={copy.sectionDestacadasTitle}
          subtitle={copy.sectionDestacadasSubtitle}
          listings={sections.destacadas}
          withLang={withLang}
          variant="spotlight"
          copy={copy}
          sectionIndex="01"
          lang={lang}
          inventoryLoading={bandsLoading}
        />

        <ListingBand
          id="br-band-recientes"
          title={copy.sectionRecientesTitle}
          subtitle={copy.sectionRecientesSubtitle}
          listings={sections.recientes}
          withLang={withLang}
          variant="neutral"
          copy={copy}
          sectionIndex="02"
          lang={lang}
          inventoryLoading={bandsLoading}
        />

        <ListingBand
          id="br-band-privado"
          title={copy.sectionPrivadoTitle}
          subtitle={copy.sectionPrivadoSubtitle}
          listings={sections.privado}
          withLang={withLang}
          variant="private"
          copy={copy}
          sectionIndex="03"
          lang={lang}
          inventoryLoading={bandsLoading}
        />

        <ListingBand
          id="br-band-negocios"
          title={copy.sectionNegociosTitle}
          subtitle={copy.sectionNegociosSubtitle}
          listings={sections.negocios}
          withLang={withLang}
          variant="business"
          copy={copy}
          sectionIndex="04"
          lang={lang}
          inventoryLoading={bandsLoading}
        />

        <section className="mt-16 sm:mt-24">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-[#E8DFD0]/65 bg-gradient-to-br from-[#FFFCF7] via-[#f3ebe4] to-[#e8f0f8]/55 p-7 shadow-[0_36px_100px_-44px_rgba(42,36,22,0.45)] ring-1 ring-[#C9B46A]/18 sm:rounded-[2rem] sm:p-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='%23c9b46a' fill-opacity='0.06'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40z'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#dfe9f4]/50 blur-3xl"
              aria-hidden
            />
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="font-serif text-[1.85rem] font-semibold tracking-tight text-[#1E1810] sm:text-[2.15rem]">
                {copy.footerTitle}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#5C5346]/88 sm:text-[1.02rem]">{copy.footerBody}</p>
              <div className="mt-10 flex w-full min-w-0 flex-col items-stretch justify-center gap-3 sm:mx-auto sm:max-w-2xl sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
                <Link href={withLang(BR_RESULTS)} className={BTN_PRIMARY + " w-full min-w-0 sm:w-auto sm:min-w-[12rem]"}>
                  {copy.footerCtaExploreAll}
                </Link>
                <Link
                  href={withLang(BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY)}
                  className={BTN_SECONDARY + " w-full min-w-0 sm:w-auto sm:min-w-[12rem]"}
                >
                  {copy.footerCtaPublish}
                </Link>
              </div>
              <p className="mt-10 text-xs leading-relaxed text-[#5C5346]/72">{copy.footerTrustLine}</p>
            </div>
          </div>
        </section>
      </div>
    </BienesRaicesResultsShell>
  );
}
