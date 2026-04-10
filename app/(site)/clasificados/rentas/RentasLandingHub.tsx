"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RentasSearchBar } from "@/app/clasificados/rentas/components/RentasSearchBar";
import {
  getRentasLandingDestacadas,
  getRentasLandingNegocios,
  getRentasLandingPrivado,
  getRentasLandingRecientes,
  rentasLandingFeaturedListing,
} from "@/app/clasificados/rentas/data/rentasLandingSampleData";
import { RentasLandingCard } from "@/app/clasificados/rentas/landing/RentasLandingCard";
import { RentasLandingCategoryHeader } from "@/app/clasificados/rentas/landing/RentasLandingCategoryHeader";
import { RentasLandingFeatured } from "@/app/clasificados/rentas/landing/RentasLandingFeatured";
import { RentasLandingQuickChips } from "@/app/clasificados/rentas/landing/RentasLandingQuickChips";
import { RentasLandingSectionBand } from "@/app/clasificados/rentas/landing/RentasLandingSectionBand";
import { RentasLandingShell } from "@/app/clasificados/rentas/landing/RentasLandingShell";
import { RentasLandingTrustFooter } from "@/app/clasificados/rentas/landing/RentasLandingTrustFooter";
import {
  RENTAS_QUERY_PRECIO,
  RENTAS_QUERY_Q,
  RENTAS_QUERY_RECS,
  RENTAS_QUERY_TIPO,
} from "@/app/clasificados/rentas/shared/rentasResultsQueryKeys";
import { RENTAS_RESULTS } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { buildRentasResultsUrl } from "@/app/clasificados/rentas/shared/utils/rentasResultsRoutes";

export function RentasLandingHub() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceBand, setPriceBand] = useState("");
  const [beds, setBeds] = useState("");

  const runSearch = useCallback(() => {
    const extra: Record<string, string | undefined> = {};
    if (query.trim()) extra[RENTAS_QUERY_Q] = query.trim();
    if (propertyType) extra[RENTAS_QUERY_TIPO] = propertyType;
    if (priceBand) extra[RENTAS_QUERY_PRECIO] = priceBand;
    if (beds) extra[RENTAS_QUERY_RECS] = beds;
    router.push(buildRentasResultsUrl(extra));
  }, [beds, priceBand, propertyType, query, router]);

  const destacadas = useMemo(() => getRentasLandingDestacadas(), []);
  const recientes = useMemo(() => getRentasLandingRecientes(), []);
  const negocios = useMemo(() => getRentasLandingNegocios(), []);
  const privadoRows = useMemo(() => getRentasLandingPrivado(), []);

  const supportingListing = useMemo(() => privadoRows[0] ?? null, [privadoRows]);

  return (
    <RentasLandingShell>
      <RentasLandingCategoryHeader />

      <div className="mt-10 max-w-[1200px]">
        <RentasSearchBar
          query={query}
          onQuery={setQuery}
          propertyType={propertyType}
          onPropertyType={setPropertyType}
          priceBand={priceBand}
          onPriceBand={setPriceBand}
          beds={beds}
          onBeds={setBeds}
          onSearch={runSearch}
          searchPlaceholder="Buscar en Bienes Raíces…"
        />
        <p className="mt-3 text-center text-sm text-[#5C5346]/80 sm:text-left">
          <Link
            href={RENTAS_RESULTS}
            className="font-semibold text-[#B8954A] underline decoration-[#C9B46A]/45 underline-offset-4"
          >
            Ver resultados sin filtros
          </Link>
        </p>
      </div>

      <RentasLandingQuickChips />

      <RentasLandingFeatured primary={rentasLandingFeaturedListing} supporting={supportingListing} />

      <RentasLandingSectionBand
        id="rentas-landing-destacadas"
        title="Destacadas"
        description="Anuncios con mayor visibilidad en esta demo."
        action={
          <Link
            href={RENTAS_RESULTS}
            className="text-sm font-semibold text-[#B8954A] underline decoration-[#C9B46A]/45 underline-offset-4"
          >
            Ver resultados
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {destacadas.map((l) => (
            <RentasLandingCard key={l.id} listing={l} />
          ))}
        </div>
      </RentasLandingSectionBand>

      <RentasLandingSectionBand
        id="rentas-landing-recientes"
        title="Recientes"
        description="Orden demo por referencia reciente."
        action={
          <Link
            href={buildRentasResultsUrl()}
            className="text-sm font-semibold text-[#B8954A] underline decoration-[#C9B46A]/45 underline-offset-4"
          >
            Ver todo
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {recientes.map((l) => (
            <RentasLandingCard key={`rec-${l.id}`} listing={l} />
          ))}
        </div>
      </RentasLandingSectionBand>

      <RentasLandingSectionBand
        id="rentas-landing-negocios"
        title="Negocios"
        description="Inventario de cuentas comerciales — visibilidad fuerte sin ocultar particulares."
        action={
          <Link
            href={buildRentasResultsUrl({ branch: "negocio" })}
            className="text-sm font-semibold text-[#B8954A] underline decoration-[#C9B46A]/45 underline-offset-4"
          >
            Solo negocio
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {negocios.map((l) => (
            <RentasLandingCard key={`neg-${l.id}`} listing={l} layout="horizontal" />
          ))}
        </div>
      </RentasLandingSectionBand>

      <RentasLandingSectionBand
        id="rentas-landing-privado"
        title="Desde particulares"
        description="Rentas publicadas por personas en el mismo ecosistema."
        action={
          <Link
            href={buildRentasResultsUrl({ branch: "privado" })}
            className="text-sm font-semibold text-[#B8954A] underline decoration-[#C9B46A]/45 underline-offset-4"
          >
            Solo privado
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {privadoRows.map((l) => (
            <RentasLandingCard key={`pv-${l.id}`} listing={l} layout="horizontal" />
          ))}
        </div>
      </RentasLandingSectionBand>

      <RentasLandingTrustFooter />
    </RentasLandingShell>
  );
}
