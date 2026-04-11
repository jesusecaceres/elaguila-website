"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiHeart, FiHome, FiLayers, FiMap, FiUsers } from "react-icons/fi";
import { BR_NEGOCIO_Q_PROPIEDAD } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { RentasSearchBar } from "@/app/clasificados/rentas/components/RentasSearchBar";
import {
  getRentasLandingDestacadas,
  getRentasLandingNegocios,
  getRentasLandingPrivado,
  getRentasLandingRecientes,
  rentasLandingFeaturedListing,
} from "@/app/clasificados/rentas/data/rentasPublicData";
import { useRentasLandingLang } from "@/app/clasificados/rentas/hooks/useRentasLandingLang";
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

export function RentasLandingHub() {
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

  const destacadas = useMemo(() => getRentasLandingDestacadas(), []);
  const recientes = useMemo(() => getRentasLandingRecientes(), []);
  const negocios = useMemo(() => getRentasLandingNegocios(), []);
  const privadoRows = useMemo(() => getRentasLandingPrivado(), []);

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

  return (
    <RentasLandingShell>
      <RentasLandingHero>
        <div className={rentasLandingHeroPanelClass}>
          <RentasLandingCategoryHeader copy={copy} lang={lang} />
        </div>

        <div className="w-full min-w-0 max-w-[min(100%,1280px)]">
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

      <RentasLandingFeatured copy={copy} lang={lang} primary={rentasLandingFeaturedListing} supporting={supportingListing} />

      <RentasLandingSectionBand
        id="rentas-landing-destacadas"
        title={copy.sections.destacadas.title}
        description={copy.sections.destacadas.description}
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
        description={copy.sections.recientes.description}
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
