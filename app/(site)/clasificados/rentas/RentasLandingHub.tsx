"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiHeart, FiHome, FiLayers, FiMap, FiUsers } from "react-icons/fi";
import { BR_NEGOCIO_Q_PROPIEDAD } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { RentasSearchBar } from "@/app/clasificados/rentas/components/RentasSearchBar";
import { rentasLandingFeaturedListing } from "@/app/clasificados/rentas/data/rentasLandingSampleData";
import {
  selectRentasLandingDestacadas,
  selectRentasLandingNegocios,
  selectRentasLandingPrivado,
  selectRentasLandingRecientes,
} from "@/app/clasificados/rentas/data/rentasSectionSelectors";
import { useRentasLandingLang } from "@/app/clasificados/rentas/hooks/useRentasLandingLang";
import { useRentasPublicBrowseInventory } from "@/app/clasificados/rentas/hooks/useRentasPublicBrowseInventory";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import { RentasLandingCard } from "@/app/clasificados/rentas/landing/RentasLandingCard";
import { RentasLandingCategoryHeader } from "@/app/clasificados/rentas/landing/RentasLandingCategoryHeader";
import { RentasLandingFeatured } from "@/app/clasificados/rentas/landing/RentasLandingFeatured";
import { RentasLandingHero } from "@/app/clasificados/rentas/landing/RentasLandingHero";
import { RentasLandingQuickChips } from "@/app/clasificados/rentas/landing/RentasLandingQuickChips";
import { RentasLandingSectionBand } from "@/app/clasificados/rentas/landing/RentasLandingSectionBand";
import { RentasLandingShell } from "@/app/clasificados/rentas/landing/RentasLandingShell";
import { RentasLandingTrustFooter } from "@/app/clasificados/rentas/landing/RentasLandingTrustFooter";
import {
  RENTAS_QUERY_AMUEBLADO,
  RENTAS_QUERY_BRANCH,
  RENTAS_QUERY_CITY,
  RENTAS_QUERY_MASCOTAS,
  RENTAS_QUERY_PRECIO,
  RENTAS_QUERY_Q,
  RENTAS_QUERY_RECS,
  RENTAS_QUERY_TIPO,
  RENTAS_QUERY_ZIP,
} from "@/app/clasificados/rentas/shared/rentasResultsQueryKeys";
import { splitLocationIntent } from "@/app/clasificados/rentas/shared/rentasBrowseContract";
import { RENTAS_RESULTS } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { buildRentasResultsUrl } from "@/app/clasificados/rentas/shared/utils/rentasResultsRoutes";
import { withRentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { rentasLandingHeroPanelClass, rentasSectionHeaderActionClass } from "@/app/clasificados/rentas/rentasLandingTheme";

export type RentasLandingHubProps = {
  initialLiveListings: RentasPublicListing[];
  includeDemoPool: boolean;
};

export function RentasLandingHub({ initialLiveListings, includeDemoPool }: RentasLandingHubProps) {
  const router = useRouter();
  const { lang, copy } = useRentasLandingLang();
  const [query, setQuery] = useState("");
  const [locationLine, setLocationLine] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceBand, setPriceBand] = useState("");
  const [beds, setBeds] = useState("");

  const runSearch = useCallback(() => {
    const extra: Record<string, string | undefined> = {};
    if (query.trim()) extra[RENTAS_QUERY_Q] = query.trim();
    if (propertyType) extra[RENTAS_QUERY_TIPO] = propertyType;
    if (priceBand) extra[RENTAS_QUERY_PRECIO] = priceBand;
    if (beds) extra[RENTAS_QUERY_RECS] = beds;
    const loc = splitLocationIntent(locationLine);
    if (loc.city) extra[RENTAS_QUERY_CITY] = loc.city;
    if (loc.zip) extra[RENTAS_QUERY_ZIP] = loc.zip;
    extra.lang = lang;
    router.push(buildRentasResultsUrl(extra));
  }, [beds, lang, locationLine, priceBand, propertyType, query, router]);

  const { mergedPool, staged: stagedFromDb, loading: inventoryLoading, error: inventoryError } = useRentasPublicBrowseInventory({
    initialLiveListings,
    lang,
    includeDemoPool,
  });

  const destacadas = useMemo(() => selectRentasLandingDestacadas(mergedPool), [mergedPool]);
  const recientes = useMemo(() => selectRentasLandingRecientes(mergedPool), [mergedPool]);
  const negocios = useMemo(() => selectRentasLandingNegocios(mergedPool), [mergedPool]);
  const privadoRows = useMemo(() => selectRentasLandingPrivado(mergedPool), [mergedPool]);

  const primaryFeatured = useMemo(() => {
    if (destacadas[0]) return destacadas[0];
    if (includeDemoPool) return rentasLandingFeaturedListing;
    return null;
  }, [destacadas, includeDemoPool]);
  const supportingListing = useMemo(() => privadoRows[0] ?? null, [privadoRows]);

  const { chipsProperty, chipsSeller, chipsDetails } = useMemo(() => {
    const b = (extra: Record<string, string>) => buildRentasResultsUrl({ ...extra, lang });
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
  }, [copy.quickExplore, lang]);

  const resultsBase = useMemo(() => withRentasLandingLang(RENTAS_RESULTS, lang), [lang]);

  const destacadasDescription = useMemo(() => {
    if (includeDemoPool) return copy.sections.destacadas.description;
    return lang === "es"
      ? "Anuncios con mayor visibilidad: ventana de visibilidad destacada activa, plan promocional en datos, o señales orgánicas elegibles — sin pagar por un ranking oculto fuera del producto."
      : "Higher-visibility listings: an active featured-visibility window, a promotional plan in data, or eligible organic signals — no hidden pay-to-rank outside the product.";
  }, [copy.sections.destacadas.description, includeDemoPool, lang]);

  const recientesDescription = useMemo(() => {
    if (includeDemoPool) return copy.sections.recientes.description;
    return lang === "es"
      ? "Orden por fecha de publicación, alternando particulares y negocios para equilibrio en portada."
      : "Ordered by publish time, interleaving private and business listings for a balanced homepage.";
  }, [copy.sections.recientes.description, includeDemoPool, lang]);

  return (
    <RentasLandingShell>
      <RentasLandingHero>
        <div className={rentasLandingHeroPanelClass}>
          <RentasLandingCategoryHeader copy={copy} lang={lang} />
        </div>

        <div className="w-full min-w-0 max-w-[min(100%,1280px)]">
          {includeDemoPool ? (
            stagedFromDb.length > 0 ? (
              <p className="mb-3 rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-center text-xs font-medium text-amber-950 sm:text-left">
                {lang === "es"
                  ? `Modo demostración (solo no producción): ${stagedFromDb.length} anuncio(s) en vivo + ejemplos (RENTAS_INCLUDE_DEMO_POOL=1).`
                  : `Non-production demo mode: ${stagedFromDb.length} live listing(s) plus samples (RENTAS_INCLUDE_DEMO_POOL=1).`}
              </p>
            ) : null
          ) : stagedFromDb.length > 0 ? (
            <p className="mb-3 rounded-xl border border-[#2C5F2D]/25 bg-[#F4FAF2]/95 px-3 py-2 text-center text-xs font-medium text-[#1E3D1F] sm:text-left">
              {lang === "es"
                ? `Catálogo en vivo: ${stagedFromDb.length} anuncio(s) publicado(s).`
                : `Live catalog: ${stagedFromDb.length} published listing(s).`}
            </p>
          ) : (
            <p className="mb-3 text-center text-xs text-[#5C5346] sm:text-left">
              {lang === "es"
                ? "Aún no hay rentas publicadas en catálogo. Publica desde Privado o Negocio."
                : "No published rentals in the catalog yet. Publish from Private or Business."}
            </p>
          )}
          {inventoryError ? (
            <p className="mb-3 text-center text-xs text-amber-900 sm:text-left" role="status">
              {lang === "es" ? "Aviso: inventario publicado no disponible (" : "Note: published inventory unavailable ("}
              {inventoryError}
              {lang === "es" ? ")." : ")."}
            </p>
          ) : null}
          {inventoryLoading ? (
            <p className="mb-3 text-center text-[11px] text-[#5B7C99] sm:text-left">
              {lang === "es" ? "Cargando inventario publicado…" : "Loading published inventory…"}
            </p>
          ) : null}
          <RentasSearchBar
            query={query}
            onQuery={setQuery}
            location={locationLine}
            onLocation={setLocationLine}
            propertyType={propertyType}
            onPropertyType={setPropertyType}
            priceBand={priceBand}
            onPriceBand={setPriceBand}
            beds={beds}
            onBeds={setBeds}
            onSearch={runSearch}
            copy={copy.search}
            priceOptions={copy.priceOptions}
          />
          <p className="mt-4 flex justify-center sm:justify-start">
            <Link href={resultsBase} className={rentasSectionHeaderActionClass}>
              {copy.searchHelperLink}
            </Link>
          </p>
        </div>
      </RentasLandingHero>

      <RentasLandingQuickChips
        copy={copy.quickExplore}
        chipsProperty={chipsProperty}
        chipsSeller={chipsSeller}
        chipsDetails={chipsDetails}
      />

      {primaryFeatured ? (
        <RentasLandingFeatured copy={copy} lang={lang} primary={primaryFeatured} supporting={supportingListing} />
      ) : null}

      <RentasLandingSectionBand
        id="rentas-landing-destacadas"
        title={copy.sections.destacadas.title}
        description={destacadasDescription}
        action={
          <Link href={resultsBase} className={rentasSectionHeaderActionClass}>
            {copy.sections.destacadas.action}
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-8">
          {destacadas.map((l) => (
            <RentasLandingCard key={l.id} listing={l} copy={copy} lang={lang} />
          ))}
        </div>
      </RentasLandingSectionBand>

      <RentasLandingSectionBand
        id="rentas-landing-recientes"
        title={copy.sections.recientes.title}
        description={recientesDescription}
        action={
          <Link href={buildRentasResultsUrl({ lang })} className={rentasSectionHeaderActionClass}>
            {copy.sections.recientes.action}
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-8">
          {recientes.map((l) => (
            <RentasLandingCard key={`rec-${l.id}`} listing={l} copy={copy} lang={lang} />
          ))}
        </div>
      </RentasLandingSectionBand>

      <RentasLandingSectionBand
        id="rentas-landing-negocios"
        title={copy.sections.negocios.title}
        description={copy.sections.negocios.description}
        action={
          <Link href={buildRentasResultsUrl({ branch: "negocio", lang })} className={rentasSectionHeaderActionClass}>
            {copy.sections.negocios.action}
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2 lg:gap-8">
          {negocios.map((l) => (
            <RentasLandingCard key={`neg-${l.id}`} listing={l} layout="horizontal" copy={copy} lang={lang} />
          ))}
        </div>
      </RentasLandingSectionBand>

      <RentasLandingSectionBand
        id="rentas-landing-privado"
        title={copy.sections.privado.title}
        description={copy.sections.privado.description}
        action={
          <Link href={buildRentasResultsUrl({ branch: "privado", lang })} className={rentasSectionHeaderActionClass}>
            {copy.sections.privado.action}
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-8">
          {privadoRows.map((l) => (
            <RentasLandingCard key={`pv-${l.id}`} listing={l} layout="horizontal" copy={copy} lang={lang} />
          ))}
        </div>
      </RentasLandingSectionBand>

      <RentasLandingTrustFooter copy={copy} lang={lang} />
    </RentasLandingShell>
  );
}
