"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RentasCompactSearchCanvas } from "@/app/clasificados/rentas/components/RentasCompactSearchCanvas";
import { RentasFiltersDrawer } from "@/app/clasificados/rentas/components/RentasFiltersDrawer";
import { useRentasLandingLang } from "@/app/(site)/clasificados/rentas/hooks/useRentasLandingLang";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import { RentasLandingHeroGateway } from "@/app/clasificados/rentas/landing/RentasLandingHeroGateway";
import { RentasLandingIntentTiles } from "@/app/clasificados/rentas/landing/RentasLandingIntentTiles";
import { RentasLandingShortcutSections } from "@/app/clasificados/rentas/landing/RentasLandingShortcutSections";
import { RentasLandingShell } from "@/app/clasificados/rentas/landing/RentasLandingShell";
import { RentasLandingVisibilityStrip } from "@/app/clasificados/rentas/landing/RentasLandingVisibilityStrip";
import {
  RENTAS_QUERY_AMUEBLADO,
  RENTAS_QUERY_BRANCH,
  RENTAS_QUERY_CITY,
  RENTAS_QUERY_COUNTRY,
  RENTAS_QUERY_MASCOTAS,
  RENTAS_QUERY_PRECIO,
  RENTAS_QUERY_Q,
  RENTAS_QUERY_RECS,
  RENTAS_QUERY_RENT_MAX,
  RENTAS_QUERY_RENT_MIN,
  RENTAS_QUERY_ROOM_BATH,
  RENTAS_QUERY_ROOM_KITCHEN,
  RENTAS_QUERY_STATE,
  RENTAS_QUERY_SUBTYPE,
  RENTAS_QUERY_ZIP,
} from "@/app/clasificados/rentas/shared/rentasResultsQueryKeys";
import { RENTAS_PUBLICAR_PRIVADO, RENTAS_RESULTS } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { buildRentasResultsUrl } from "@/app/clasificados/rentas/shared/utils/rentasResultsRoutes";
import { withRentasLandingLang } from "@/app/(site)/clasificados/rentas/rentasLandingLang";

export type RentasLandingHubProps = {
  initialLiveListings: RentasPublicListing[];
  includeDemoPool: boolean;
};

export function RentasLandingHub(_props: RentasLandingHubProps) {
  const router = useRouter();
  const { lang, routeLang, copy } = useRentasLandingLang();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("CA");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("United States");
  const [spaceType, setSpaceType] = useState("");
  const [priceBand, setPriceBand] = useState("");
  const [beds, setBeds] = useState("");
  const [rentMinDraft, setRentMinDraft] = useState("");
  const [rentMaxDraft, setRentMaxDraft] = useState("");
  const [roomBathDraft, setRoomBathDraft] = useState("");
  const [roomKitchenDraft, setRoomKitchenDraft] = useState("");
  const [branchDraft, setBranchDraft] = useState("");
  const [amuebladoDraft, setAmuebladoDraft] = useState(false);
  const [mascotasDraft, setMascotasDraft] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const runSearch = useCallback(() => {
    const extra: Record<string, string | undefined> = {};
    if (query.trim()) extra[RENTAS_QUERY_Q] = query.trim();
    if (spaceType) extra[RENTAS_QUERY_SUBTYPE] = spaceType;
    if (priceBand) extra[RENTAS_QUERY_PRECIO] = priceBand;
    if (beds) extra[RENTAS_QUERY_RECS] = beds;
    if (city.trim()) extra[RENTAS_QUERY_CITY] = city.trim();
    if (state.trim()) extra[RENTAS_QUERY_STATE] = state.trim();
    if (zip.trim()) extra[RENTAS_QUERY_ZIP] = zip.trim();
    if (country.trim() && country.trim().toLowerCase() !== "united states") extra[RENTAS_QUERY_COUNTRY] = country.trim();
    const rMin = rentMinDraft.replace(/\D/g, "");
    const rMax = rentMaxDraft.replace(/\D/g, "");
    if (rMin) extra[RENTAS_QUERY_RENT_MIN] = rMin;
    if (rMax) extra[RENTAS_QUERY_RENT_MAX] = rMax;
    if (roomBathDraft) extra[RENTAS_QUERY_ROOM_BATH] = roomBathDraft;
    if (roomKitchenDraft) extra[RENTAS_QUERY_ROOM_KITCHEN] = roomKitchenDraft;
    if (branchDraft === "privado" || branchDraft === "negocio") extra[RENTAS_QUERY_BRANCH] = branchDraft;
    if (amuebladoDraft) extra[RENTAS_QUERY_AMUEBLADO] = "1";
    if (mascotasDraft) extra[RENTAS_QUERY_MASCOTAS] = "1";
    extra.lang = routeLang;
    router.push(buildRentasResultsUrl(extra));
  }, [
    amuebladoDraft,
    beds,
    branchDraft,
    city,
    country,
    mascotasDraft,
    priceBand,
    query,
    rentMaxDraft,
    rentMinDraft,
    roomBathDraft,
    roomKitchenDraft,
    routeLang,
    router,
    spaceType,
    state,
    zip,
  ]);

  const clearLandingFilters = useCallback(() => {
    setSpaceType("");
    setPriceBand("");
    setBeds("");
    setRentMinDraft("");
    setRentMaxDraft("");
    setRoomBathDraft("");
    setRoomKitchenDraft("");
    setBranchDraft("");
    setAmuebladoDraft(false);
    setMascotasDraft(false);
  }, []);

  const resultsBase = useMemo(() => withRentasLandingLang(RENTAS_RESULTS, routeLang), [routeLang]);
  const publishHref = withRentasLandingLang(RENTAS_PUBLICAR_PRIVADO, routeLang);

  const filtersLabel = lang === "es" ? "Filtros" : "Filters";
  const searchLabel = lang === "es" ? "Buscar" : "Search";

  return (
    <RentasLandingShell>
      <div className="flex flex-col gap-0">
        <RentasLandingHeroGateway
          lang={lang}
          title={copy.title}
          intro={copy.intro}
          introSecondary={copy.introSecondary}
          publishHref={publishHref}
          publishLabel={lang === "es" ? "Publicar renta" : "Post a rental"}
          searchSlot={
            <RentasCompactSearchCanvas
              layout="landing"
              lang={lang}
              query={query}
              city={city}
              state={state}
              zip={zip}
              country={country}
              onQuery={setQuery}
              onCity={setCity}
              onState={setState}
              onZip={setZip}
              onCountry={setCountry}
              onSearch={runSearch}
              onOpenFilters={() => setFiltersOpen(true)}
              browseAllHref={resultsBase}
              searchButtonLabel={searchLabel}
              filtersButtonLabel={filtersLabel}
            />
          }
        />

        <RentasLandingIntentTiles
          lang={lang}
          routeLang={routeLang}
          headingEs={copy.gateway.spaceTypeHeadingEs}
          headingEn={copy.gateway.spaceTypeHeadingEn}
        />

        <RentasLandingShortcutSections
          lang={lang}
          routeLang={routeLang}
          budgetHeadingEs={copy.gateway.budgetHeadingEs}
          budgetHeadingEn={copy.gateway.budgetHeadingEn}
          practicalHeadingEs={copy.gateway.practicalHeadingEs}
          practicalHeadingEn={copy.gateway.practicalHeadingEn}
        />

        <div className="mt-5 sm:mt-6">
          <RentasLandingVisibilityStrip lang={lang} />
        </div>
      </div>

      <RentasFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={runSearch}
        onClear={clearLandingFilters}
        lang={lang}
        copy={copy}
        variant="landing"
        spaceType={spaceType}
        onSpaceType={setSpaceType}
        priceBand={priceBand}
        onPriceBand={setPriceBand}
        beds={beds}
        onBeds={setBeds}
        cityDraft={city}
        onCityDraft={setCity}
        stateDraft={state}
        onStateDraft={setState}
        zipDraft={zip}
        onZipDraft={setZip}
        countryDraft={country}
        onCountryDraft={setCountry}
        bathsMinDraft=""
        onBathsMinDraft={() => {}}
        halfBathsMinDraft=""
        onHalfBathsMinDraft={() => {}}
        rentMinDraft={rentMinDraft}
        onRentMinDraft={setRentMinDraft}
        rentMaxDraft={rentMaxDraft}
        onRentMaxDraft={setRentMaxDraft}
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
        roomBathDraft={roomBathDraft}
        onRoomBathDraft={setRoomBathDraft}
        roomKitchenDraft={roomKitchenDraft}
        onRoomKitchenDraft={setRoomKitchenDraft}
        branchDraft={branchDraft}
        onBranchDraft={setBranchDraft}
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
