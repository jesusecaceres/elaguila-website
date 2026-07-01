"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiHeart, FiHome, FiLayers, FiMap, FiUsers } from "react-icons/fi";
import { BR_NEGOCIO_Q_PROPIEDAD } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { RentasCompactSearchCanvas } from "@/app/clasificados/rentas/components/RentasCompactSearchCanvas";
import { RentasFiltersDrawer } from "@/app/clasificados/rentas/components/RentasFiltersDrawer";
import { selectRentasLandingRecientes } from "@/app/clasificados/rentas/data/rentasSectionSelectors";
import { useRentasLandingLang } from "@/app/(site)/clasificados/rentas/hooks/useRentasLandingLang";
import { useRentasPublicBrowseInventory } from "@/app/clasificados/rentas/hooks/useRentasPublicBrowseInventory";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import { RentasLandingCard } from "@/app/clasificados/rentas/landing/RentasLandingCard";
import { CategoryStandardLandingBlock } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsChrome";
import {
  categoryStandardDescription,
  categoryStandardTitle,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { RentasLandingQuickChips } from "@/app/clasificados/rentas/landing/RentasLandingQuickChips";
import { RentasLandingShell } from "@/app/clasificados/rentas/landing/RentasLandingShell";
import { CategoryVisibilityCta } from "@/app/(site)/clasificados/components/categoryStandard/CategoryVisibilityCta";
import {
  RENTAS_QUERY_AMUEBLADO,
  RENTAS_QUERY_BRANCH,
  RENTAS_QUERY_CITY,
  RENTAS_QUERY_MASCOTAS,
  RENTAS_QUERY_PRECIO,
  RENTAS_QUERY_Q,
  RENTAS_QUERY_RECS,
  RENTAS_QUERY_STATE,
  RENTAS_QUERY_TIPO,
  RENTAS_QUERY_ZIP,
} from "@/app/clasificados/rentas/shared/rentasResultsQueryKeys";
import { RENTAS_PUBLICAR_PRIVADO, RENTAS_RESULTS } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { buildRentasResultsUrl } from "@/app/clasificados/rentas/shared/utils/rentasResultsRoutes";
import { withRentasLandingLang } from "@/app/(site)/clasificados/rentas/rentasLandingLang";
import { rentasSectionHeaderActionClass } from "@/app/clasificados/rentas/rentasLandingTheme";

export type RentasLandingHubProps = {
  initialLiveListings: RentasPublicListing[];
  includeDemoPool: boolean;
};

export function RentasLandingHub({ initialLiveListings, includeDemoPool }: RentasLandingHubProps) {
  const router = useRouter();
  const { lang, routeLang, copy } = useRentasLandingLang();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceBand, setPriceBand] = useState("");
  const [beds, setBeds] = useState("");
  const [amuebladoDraft, setAmuebladoDraft] = useState(false);
  const [mascotasDraft, setMascotasDraft] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const runSearch = useCallback(() => {
    const extra: Record<string, string | undefined> = {};
    if (query.trim()) extra[RENTAS_QUERY_Q] = query.trim();
    if (propertyType) extra[RENTAS_QUERY_TIPO] = propertyType;
    if (priceBand) extra[RENTAS_QUERY_PRECIO] = priceBand;
    if (beds) extra[RENTAS_QUERY_RECS] = beds;
    if (city.trim()) extra[RENTAS_QUERY_CITY] = city.trim();
    if (state.trim()) extra[RENTAS_QUERY_STATE] = state.trim();
    if (zip.trim()) extra[RENTAS_QUERY_ZIP] = zip.trim();
    if (amuebladoDraft) extra[RENTAS_QUERY_AMUEBLADO] = "1";
    if (mascotasDraft) extra[RENTAS_QUERY_MASCOTAS] = "1";
    extra.lang = routeLang;
    router.push(buildRentasResultsUrl(extra));
  }, [amuebladoDraft, beds, city, mascotasDraft, priceBand, propertyType, query, routeLang, router, state, zip]);

  const clearLandingFilters = useCallback(() => {
    setPropertyType("");
    setPriceBand("");
    setBeds("");
    setAmuebladoDraft(false);
    setMascotasDraft(false);
  }, []);

  const { mergedPool, staged: stagedFromDb, loading: inventoryLoading, error: inventoryError } = useRentasPublicBrowseInventory({
    initialLiveListings,
    lang,
    includeDemoPool,
  });

  const recientes = useMemo(() => selectRentasLandingRecientes(mergedPool).slice(0, 6), [mergedPool]);

  const { chipsProperty, chipsSeller, chipsDetails } = useMemo(() => {
    const b = (extra: Record<string, string>) => buildRentasResultsUrl({ ...extra, lang: routeLang });
    const qe = copy.quickExplore;
    return {
      chipsProperty: [
        { label: qe.chipResidencial, href: b({ [BR_NEGOCIO_Q_PROPIEDAD]: "residencial" }), Icon: FiHome },
        { label: qe.chipComercial, href: b({ [BR_NEGOCIO_Q_PROPIEDAD]: "comercial" }), Icon: FiLayers },
        { label: qe.chipTerreno, href: b({ [BR_NEGOCIO_Q_PROPIEDAD]: "terreno_lote" }), Icon: FiMap },
      ],
      chipsSeller: [
        { label: qe.chipPrivado, href: b({ [RENTAS_QUERY_BRANCH]: "privado" }), Icon: FiUsers },
        { label: qe.chipNegocio, href: b({ [RENTAS_QUERY_BRANCH]: "negocio" }), Icon: FiLayers },
      ],
      chipsDetails: [
        { label: qe.chipAmueblado, href: b({ [RENTAS_QUERY_AMUEBLADO]: "1" }), Icon: FiHome },
        { label: qe.chipMascotas, href: b({ [RENTAS_QUERY_MASCOTAS]: "1" }), Icon: FiHeart },
        { label: qe.chipRecs2, href: b({ [RENTAS_QUERY_RECS]: "2" }), Icon: FiHome },
      ],
    };
  }, [copy.quickExplore, routeLang]);

  const resultsBase = useMemo(() => withRentasLandingLang(RENTAS_RESULTS, routeLang), [routeLang]);
  const publishHref = withRentasLandingLang(RENTAS_PUBLICAR_PRIVADO, routeLang);

  const catalogLine = useMemo(() => {
    if (inventoryLoading) return lang === "es" ? "Cargando inventario…" : "Loading inventory…";
    if (inventoryError) return lang === "es" ? "Inventario no disponible" : "Inventory unavailable";
    if (includeDemoPool && stagedFromDb.length > 0) {
      return lang === "es"
        ? `Demo: ${stagedFromDb.length} en vivo + ejemplos`
        : `Demo: ${stagedFromDb.length} live + samples`;
    }
    if (stagedFromDb.length > 0) {
      return lang === "es"
        ? `${stagedFromDb.length} renta(s) publicada(s)`
        : `${stagedFromDb.length} published rental(s)`;
    }
    return lang === "es" ? "Sin rentas publicadas aún" : "No published rentals yet";
  }, [includeDemoPool, inventoryError, inventoryLoading, lang, stagedFromDb.length]);

  const filtersLabel = lang === "es" ? "Filtros" : "Filters";
  const searchLabel = lang === "es" ? "Buscar" : "Search";

  return (
    <RentasLandingShell>
      <CategoryStandardLandingBlock
        category="rentas"
        lang={lang}
        title={categoryStandardTitle("rentas", lang)}
        description={categoryStandardDescription("rentas", lang)}
        searchAction={buildCategoryResultsUrl("rentas", routeLang as "es" | "en")}
        searchPlaceholder=""
        publishHref={publishHref}
        browseHref={resultsBase}
        publishLabel={lang === "es" ? "Publicar renta" : "Post a rental"}
        browseLabel={lang === "es" ? "Ver todos los anuncios" : "View all listings"}
        suppressVisibilityCta
        searchSlot={
          <div className="w-full min-w-0 space-y-2">
            <p className="text-[11px] font-medium text-[#556B3E]">{catalogLine}</p>
            <RentasCompactSearchCanvas
              lang={lang}
              query={query}
              city={city}
              state={state}
              zip={zip}
              onQuery={setQuery}
              onCity={setCity}
              onState={setState}
              onZip={setZip}
              onSearch={runSearch}
              onOpenFilters={() => setFiltersOpen(true)}
              searchButtonLabel={searchLabel}
              filtersButtonLabel={filtersLabel}
            />
            <RentasLandingQuickChips
              copy={copy.quickExplore}
              chipsProperty={chipsProperty}
              chipsSeller={chipsSeller}
              chipsDetails={chipsDetails}
            />
          </div>
        }
      />

      {recientes.length > 0 ? (
        <section className="mt-8" aria-labelledby="rentas-latest-heading">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="rentas-latest-heading" className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">
              {copy.sections.recientes.title}
            </h2>
            <Link href={resultsBase} className={rentasSectionHeaderActionClass}>
              {copy.sections.recientes.action}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recientes.map((l) => (
              <RentasLandingCard key={`rec-${l.id}`} listing={l} copy={copy} lang={lang} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-6 sm:mt-8">
        <CategoryVisibilityCta lang={lang} category="rentas" surface="landing" compact />
      </div>

      <RentasFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={runSearch}
        onClear={clearLandingFilters}
        lang={lang}
        copy={copy}
        variant="landing"
        propertyType={propertyType}
        onPropertyType={setPropertyType}
        priceBand={priceBand}
        onPriceBand={setPriceBand}
        beds={beds}
        onBeds={setBeds}
        cityDraft={city}
        onCityDraft={setCity}
        zipDraft={zip}
        onZipDraft={setZip}
        bathsMinDraft=""
        onBathsMinDraft={() => {}}
        halfBathsMinDraft=""
        onHalfBathsMinDraft={() => {}}
        rentMinDraft=""
        onRentMinDraft={() => {}}
        rentMaxDraft=""
        onRentMaxDraft={() => {}}
        depositMinDraft=""
        onDepositMinDraft={() => {}}
        depositMaxDraft=""
        onDepositMaxDraft={() => {}}
        leaseDraft=""
        onLeaseDraft={() => {}}
        estadoDraft=""
        onEstadoDraft={() => {}}
        parkingMinDraft=""
        onParkingMinDraft={() => {}}
        sqftMinDraft=""
        onSqftMinDraft={() => {}}
        sqftMaxDraft=""
        onSqftMaxDraft={() => {}}
        amuebladoDraft={amuebladoDraft}
        onAmuebladoDraft={setAmuebladoDraft}
        mascotasDraft={mascotasDraft}
        onMascotasDraft={setMascotasDraft}
        highlightKeysDraft={[]}
        onHighlightKeysDraft={() => {}}
        poolDraft={false}
        onPoolDraft={() => {}}
        kindDraft=""
        onKindDraft={() => {}}
        subtypeDraft=""
        onSubtypeDraft={() => {}}
        priceOptions={copy.priceOptions}
      />
    </RentasLandingShell>
  );
}
