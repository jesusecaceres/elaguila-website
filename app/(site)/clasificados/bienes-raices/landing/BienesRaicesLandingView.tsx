"use client";

import Link from "next/link";
import { CategoryStandardLandingBlock } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsChrome";
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
import { BienesRaicesResultsShell } from "@/app/clasificados/bienes-raices/resultados/components/BienesRaicesResultsShell";
import { BienesRaicesCompactSearchCanvas } from "@/app/clasificados/bienes-raices/components/BienesRaicesCompactSearchCanvas";
import { BienesRaicesResultsFilterDrawer } from "@/app/clasificados/bienes-raices/resultados/components/BienesRaicesResultsFilterDrawer";
import { BR_LANDING_QUICK_CHIPS } from "./bienesRaicesLandingSample";
import { buildBrLandingInventorySections } from "./buildBrLandingInventorySections";
import { buildBrDemoListingPool } from "../lib/brDemoListingPool";
import { brShouldMergeDemoInventoryWithLive } from "../lib/brPublicInventoryMode";
import { fetchBrPublishedListingsForBrowse } from "../lib/fetchBrPublishedListingsBrowser";
import type { BrNegocioListing } from "../resultados/cards/listingTypes";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import { getBrLandingCopy } from "./bienesRaicesLandingCopy";
import { getBrResultsCopy } from "../resultados/bienesRaicesResultsCopy";
import {
  BR_BTN_SECONDARY,
  BR_CHIP,
} from "../shared/bienesRaicesLeonixPublicUi";
import {
  categoryStandardDescription,
  categoryStandardTitle,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";

export function BienesRaicesLandingView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const routeLang = normalizeLang(searchParams?.get("lang"));
  const lang = navCopyLang(routeLang) as Lang;
  const copy = useMemo(() => getBrLandingCopy(lang), [lang]);
  const mergeDemo = useMemo(() => brShouldMergeDemoInventoryWithLive(), []);

  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
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
      zip: zip.trim() || undefined,
      propertyType: propertyType || undefined,
    });
    router.push(withLang(path));
  }, [city, operationType, propertyType, q, router, withLang, zip]);

  const drawerParsed = useMemo(
    () => ({
      lang,
      q: q.trim(),
      city: city.trim(),
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
    [city, lang, operationType, propertyType, q, zip]
  );

  const onDrawerPatch = useCallback((patch: Record<string, string | null>) => {
    if ("operationType" in patch) setOperationType((patch.operationType as "" | "venta" | "renta") ?? "");
    if ("propertyType" in patch) setPropertyType(patch.propertyType ?? "");
    if ("city" in patch) setCity(patch.city ?? "");
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

  return (
    <BienesRaicesResultsShell>
      <div className="min-w-0 overflow-x-hidden pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <nav className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5C5346]">
          <Link href={withLang("/clasificados")} className="transition hover:text-[#7A1E2C]">
            {copy.navClasificados}
          </Link>
          <span className="text-[#C9A84A]/90" aria-hidden>
            /
          </span>
          <span className="text-[#1F241C]">{copy.navBreadcrumbCurrent}</span>
        </nav>

        {liveErr ? (
          <p className="mb-4 rounded-lg border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-xs text-amber-950" role="status">
            {lang === "es" ? "Aviso — inventario no disponible:" : "Notice — inventory unavailable:"} {liveErr}
          </p>
        ) : null}

        <CategoryStandardLandingBlock
          category="bienes-raices"
          lang={lang}
          title={categoryStandardTitle("bienes-raices", lang)}
          description={categoryStandardDescription("bienes-raices", lang)}
          searchAction={withLang(BR_RESULTS)}
          searchPlaceholder=""
          publishHref={withLang(BR_PUBLICAR_NEGOCIOS_PUBLIC_ENTRY)}
          browseHref={withLang(BR_RESULTS)}
          publishLabel={copy.publishNegocio}
          browseLabel={lang === "es" ? "Ver todos los anuncios" : "View all listings"}
          suppressVisibilityCta
          searchChips={
            <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
              {BR_LANDING_QUICK_CHIPS.slice(0, 8).map((chip) => (
                <Link key={chip.id} href={withLang(buildBrResultsUrl(chip.params))} className={BR_CHIP}>
                  {copy.chipLabel[chip.id]}
                </Link>
              ))}
            </div>
          }
          searchSlot={
            <div className="w-full min-w-0 space-y-2">
              <p className="text-[11px] font-medium text-[#556B3E]">{catalogLine}</p>
              <BienesRaicesCompactSearchCanvas
                lang={lang}
                query={q}
                city={city}
                zip={zip}
                onQuery={setQ}
                onCity={setCity}
                onZip={setZip}
                onSearch={runSearch}
                onOpenFilters={() => setFiltersOpen(true)}
                searchButtonLabel={searchLabel}
                filtersButtonLabel={filtersLabel}
              />
            </div>
          }
          belowHero={
            <Link href={withLang(BR_PUBLICAR_PRIVADO_PUBLIC_ENTRY)} className={`${BR_BTN_SECONDARY} mt-2 inline-flex`}>
              {copy.publishPrivado}
            </Link>
          }
        />

        {recientes.length > 0 ? (
          <section className="mt-8" aria-labelledby="br-latest-heading">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 id="br-latest-heading" className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">
                {copy.sectionRecientesTitle}
              </h2>
              <Link href={withLang(BR_RESULTS)} className={BR_CHIP}>
                {copy.bandMoreInResults}
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recientes.map((listing) => (
                <BienesRaicesNegocioCard key={listing.id} listing={listing} sellerKindLabels={sellerLabels} lang={lang} />
              ))}
            </div>
          </section>
        ) : bandsLoading ? (
          <p className="mt-6 text-center text-sm text-[#5C5346]">{copy.inventoryLoading}</p>
        ) : (
          <p className="mt-6 rounded-lg border border-[#D6C7AD]/80 bg-[#FFFDF7] px-4 py-6 text-center text-sm text-[#5C5346]">
            {copy.inventoryEmptyBody}
          </p>
        )}
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
        }}
      />
    </BienesRaicesResultsShell>
  );
}
