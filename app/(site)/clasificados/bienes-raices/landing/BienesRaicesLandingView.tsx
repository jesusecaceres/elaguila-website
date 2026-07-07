"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { navCopyLang, normalizeLang, replaceLangInHref } from "@/app/lib/language";
import {
  BR_PUBLICAR_NEGOCIOS_PUBLIC_ENTRY,
  BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY,
  BR_RESULTS,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { buildBrResultsUrl } from "@/app/clasificados/bienes-raices/shared/constants/brResultsRoutes";
import { BienesRaicesNegocioCard } from "@/app/clasificados/bienes-raices/resultados/cards/BienesRaicesNegocioCard";
import { BienesRaicesCompactSearchCanvas } from "@/app/clasificados/bienes-raices/components/BienesRaicesCompactSearchCanvas";
import { BienesRaicesResultsFilterDrawer } from "@/app/clasificados/bienes-raices/resultados/components/BienesRaicesResultsFilterDrawer";
import { BienesRaicesLandingShell } from "./BienesRaicesLandingShell";
import { BienesRaicesLandingHeroGateway } from "./BienesRaicesLandingHeroGateway";
import { BienesRaicesLandingIntentTiles } from "./BienesRaicesLandingIntentTiles";
import { BienesRaicesLandingShortcutSections } from "./BienesRaicesLandingShortcutSections";
import { BienesRaicesLandingVisibilityStrip } from "./BienesRaicesLandingVisibilityStrip";
import { buildBrLandingInventorySections } from "./buildBrLandingInventorySections";
import { buildBrDemoListingPool } from "../lib/brDemoListingPool";
import { brShouldMergeDemoInventoryWithLive } from "../lib/brPublicInventoryMode";
import { fetchBrPublishedListingsForBrowse } from "../lib/fetchBrPublishedListingsBrowser";
import type { BrNegocioListing } from "../resultados/cards/listingTypes";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { getBrLandingCopy } from "./bienesRaicesLandingCopy";
import { getBrResultsCopy } from "../resultados/bienesRaicesResultsCopy";

export function BienesRaicesLandingView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const routeLang = normalizeLang(searchParams?.get("lang"));
  const lang = navCopyLang(routeLang) as Lang;
  const copy = useMemo(() => getBrLandingCopy(lang), [lang]);
  const mergeDemo = useMemo(() => brShouldMergeDemoInventoryWithLive(), []);

  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("CA");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("United States");
  const [operationType, setOperationType] = useState<"" | "venta" | "renta">("");
  const [propertyType, setPropertyType] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    if (!liveReady) return mergeDemo ? buildBrDemoListingPool() : [];
    if (mergeDemo) {
      const byId = new Map<string, BrNegocioListing>();
      for (const d of buildBrDemoListingPool()) byId.set(d.id, d);
      for (const L of livePool) byId.set(L.id, L);
      return Array.from(byId.values());
    }
    return livePool;
  }, [liveReady, livePool, mergeDemo]);

  const sections = useMemo(() => buildBrLandingInventorySections(basePool), [basePool]);
  const recientes = sections.recientes.slice(0, 6);
  const bandsLoading = !liveReady && !mergeDemo;

  const withLang = useMemo(() => (path: string) => replaceLangInHref(path, routeLang), [routeLang]);

  const runSearch = useCallback(() => {
    const rawCity = city.trim();
    const cityParam = rawCity ? getCanonicalCityName(rawCity) || rawCity : undefined;
    const path = buildBrResultsUrl({
      q: q.trim() || undefined,
      operationType: operationType || undefined,
      city: cityParam,
      state: state.trim() && state.trim() !== "CA" ? state.trim() : state.trim() || undefined,
      zip: zip.trim() || undefined,
      country: country.trim() && country.trim().toLowerCase() !== "united states" ? country.trim() : undefined,
      propertyType: propertyType || undefined,
    });
    router.push(withLang(path));
  }, [city, country, operationType, propertyType, q, router, state, withLang, zip]);

  const drawerParsed = useMemo(
    () => ({
      lang,
      q: q.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      zip: zip.trim(),
      operationType,
      propertyType,
      sellerType: "" as const,
      priceMin: "",
      priceMax: "",
      beds: "",
      baths: "",
      pets: "",
      furnished: "",
      pool: "",
      sort: "reciente",
      page: "1",
      primary: "",
      secondary: "",
      precio: "",
    }),
    [city, country, lang, operationType, propertyType, q, state, zip]
  );

  const onDrawerPatch = useCallback((patch: Record<string, string | null>) => {
    if ("operationType" in patch) setOperationType((patch.operationType as "" | "venta" | "renta") ?? "");
    if ("propertyType" in patch) setPropertyType(patch.propertyType ?? "");
    if ("city" in patch) setCity(patch.city ?? "");
    if ("state" in patch) setState(patch.state ?? "CA");
    if ("country" in patch) setCountry(patch.country ?? "United States");
    if ("zip" in patch) setZip(patch.zip ?? "");
    if ("q" in patch) setQ(patch.q ?? "");
  }, []);

  const filtersLabel = lang === "es" ? "Filtros" : "Filters";
  const searchLabel = lang === "es" ? "Buscar" : "Search";
  const sellerLabels = useMemo(() => ({ privado: copy.sellerPrivado, negocio: copy.sellerNegocio }), [copy]);

  const catalogLine = useMemo(() => {
    if (bandsLoading) return copy.inventoryLoading;
    if (liveErr) return lang === "es" ? "Inventario no disponible" : "Inventory unavailable";
    if (basePool.length > 0) {
      return lang === "es" ? `${basePool.length} propiedad(es) publicada(s)` : `${basePool.length} published listing(s)`;
    }
    return copy.inventoryEmptyTitle;
  }, [bandsLoading, basePool.length, copy, lang, liveErr]);

  const resultsCopy = useMemo(() => getBrResultsCopy(lang, { useDevInventoryCopy: mergeDemo }), [lang, mergeDemo]);

  const searchSlot = (
    <BienesRaicesCompactSearchCanvas
      lang={lang}
      query={q}
      city={city}
      state={state}
      zip={zip}
      country={country}
      onQuery={setQ}
      onCity={setCity}
      onState={setState}
      onZip={setZip}
      onCountry={setCountry}
      onSearch={runSearch}
      onOpenFilters={() => setFiltersOpen(true)}
      browseAllHref={withLang(BR_RESULTS)}
      searchButtonLabel={searchLabel}
      filtersButtonLabel={filtersLabel}
      layout="landing"
      publishHref={withLang(BR_PUBLICAR_NEGOCIOS_PUBLIC_ENTRY)}
      publishLabel={copy.publishNegocio}
    />
  );

  const tilesSlot = (
    <BienesRaicesLandingIntentTiles
      lang={lang}
      routeLang={routeLang}
      headingEs={copy.intentTilesHeadingEs}
      headingEn={copy.intentTilesHeadingEn}
      embedded
    />
  );

  return (
    <BienesRaicesLandingShell>
      <div className="min-w-0 overflow-x-hidden">
        {liveErr ? (
          <p className="mb-3 rounded-lg border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-xs text-amber-950" role="status">
            {lang === "es" ? "Aviso — inventario no disponible:" : "Notice — inventory unavailable:"} {liveErr}
          </p>
        ) : null}

        <BienesRaicesLandingHeroGateway
          lang={lang}
          title={copy.gatewayTitle}
          tagline={copy.gatewayTagline}
          intro={copy.gatewayIntro}
          introSecondary={copy.gatewayIntroSecondary}
          searchSlot={searchSlot}
          tilesSlot={tilesSlot}
        />

        <BienesRaicesLandingShortcutSections
          lang={lang}
          routeLang={routeLang}
          budgetHeadingEs={copy.budgetShortcutsHeadingEs}
          budgetHeadingEn={copy.budgetShortcutsHeadingEn}
          practicalHeadingEs={copy.practicalShortcutsHeadingEs}
          practicalHeadingEn={copy.practicalShortcutsHeadingEn}
        />

        <BienesRaicesLandingVisibilityStrip lang={lang} />

        {recientes.length > 0 ? (
          <section className="mt-6" aria-labelledby="br-latest-heading">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 id="br-latest-heading" className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">
                {copy.sectionRecientesTitle}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recientes.map((listing) => (
                <BienesRaicesNegocioCard key={listing.id} listing={listing} sellerKindLabels={sellerLabels} lang={lang} />
              ))}
            </div>
          </section>
        ) : bandsLoading ? (
          <p className="mt-4 text-center text-sm text-[#5C5346]">{copy.inventoryLoading}</p>
        ) : null}
      </div>

      <BienesRaicesResultsFilterDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        parsed={drawerParsed}
        copy={resultsCopy}
        lang={lang}
        onPatch={onDrawerPatch}
        onApply={runSearch}
        onClear={() => {
          setOperationType("");
          setPropertyType("");
          setCity("");
          setState("CA");
          setZip("");
          setCountry("United States");
        }}
      />
    </BienesRaicesLandingShell>
  );
}
