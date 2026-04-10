"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  parseBrNegocioPropiedadParam,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { RentasSearchBar } from "@/app/clasificados/rentas/components/RentasSearchBar";
import { BienesRaicesResultsShell } from "@/app/clasificados/bienes-raices/resultados/components/BienesRaicesResultsShell";
import { BienesRaicesResultsHeader } from "@/app/clasificados/bienes-raices/resultados/components/BienesRaicesResultsHeader";
import {
  RENTAS_QUERY_AMUEBLADO,
  RENTAS_QUERY_MASCOTAS,
  RENTAS_QUERY_PRECIO,
  RENTAS_QUERY_RENT_MAX,
  RENTAS_QUERY_RENT_MIN,
} from "@/app/clasificados/rentas/shared/rentasResultsQueryKeys";
import {
  RENTAS_LANDING,
  RENTAS_PUBLICAR_NEGOCIO,
  RENTAS_PUBLICAR_PRIVADO,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import { RentasResultCard } from "./cards/RentasResultCard";
import { RentasPropiedadFilterChips } from "./components/RentasPropiedadFilterChips";
import { RentasResultsTopBar } from "./components/RentasResultsTopBar";
import {
  rentasResultsFeatured,
  rentasResultsGridDemo,
  RENTAS_RESULTS_DEMO_TOTAL,
  type RentasResultsDemoListing,
} from "./rentasResultsDemoData";

function rentDemoMonthlyNumber(rentDisplay: string): number {
  const n = Number(String(rentDisplay).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function listingBedsNumeric(beds: string): number | null {
  if (beds === "—" || beds.trim() === "") return 0;
  const n = Number(String(beds).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Demo-only: monthly precio band from landing search (`precio`). */
function precioBandMatches(rentDisplay: string, band: string): boolean {
  if (!band) return true;
  const n = rentDemoMonthlyNumber(rentDisplay);
  if (band === "r0-15k") return n > 0 && n <= 15000;
  if (band === "r15-25k") return n > 15000 && n <= 25000;
  if (band === "r25-40k") return n > 25000 && n <= 40000;
  if (band === "r40-60k") return n > 40000 && n <= 60000;
  if (band === "r60k+") return n > 60000;
  return true;
}

function categoryLabelEs(c: BrNegocioCategoriaPropiedad): string {
  if (c === "residencial") return "Residencial";
  if (c === "comercial") return "Comercial";
  return "Terreno / lote";
}

/** Category-owned results for `/clasificados/rentas/results` — separado de vista previa y del detalle vivo. */
export function RentasResultsClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceBand, setPriceBand] = useState("");
  const [beds, setBeds] = useState("");
  const [branchFilter, setBranchFilter] = useState<"all" | "privado" | "negocio">("all");
  const [sort, setSort] = useState("reciente");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showMap, setShowMap] = useState(false);
  const [propiedadFilter, setPropiedadFilter] = useState<BrNegocioCategoriaPropiedad | null>(null);

  useEffect(() => {
    if (!searchParams) return;
    const q = searchParams.get("q");
    if (q != null) setQuery(q);
    const tipo = searchParams.get("tipo");
    if (tipo != null) setPropertyType(tipo);
    const precio = searchParams.get("precio");
    if (precio != null) setPriceBand(precio);
    const recs = searchParams.get("recs");
    if (recs != null) setBeds(recs);
    const br = searchParams.get("branch");
    if (br === "privado" || br === "negocio") setBranchFilter(br);
    const prop = parseBrNegocioPropiedadParam(searchParams.get(BR_NEGOCIO_Q_PROPIEDAD));
    setPropiedadFilter(prop);
  }, [searchParams]);

  const filteredListings = useMemo(() => {
    let rows = [...rentasResultsGridDemo];
    if (propiedadFilter) rows = rows.filter((l) => l.categoriaPropiedad === propiedadFilter);
    if (branchFilter !== "all") rows = rows.filter((l) => l.branch === branchFilter);
    const q = query.trim().toLowerCase();
    if (q) rows = rows.filter((l) => l.title.toLowerCase().includes(q) || l.addressLine.toLowerCase().includes(q));

    const sp = searchParams;
    const precioBand = sp?.get(RENTAS_QUERY_PRECIO) ?? "";
    if (precioBand) rows = rows.filter((l) => precioBandMatches(l.rentDisplay, precioBand));

    const recs = sp?.get("recs") ?? "";
    if (recs) {
      const minBeds = recs === "4" ? 4 : Number(recs);
      if (Number.isFinite(minBeds)) {
        rows = rows.filter((l) => {
          const bn = listingBedsNumeric(l.beds);
          if (bn === null) return false;
          return bn >= minBeds;
        });
      }
    }

    const amuebladoOn = sp?.get(RENTAS_QUERY_AMUEBLADO) === "1";
    if (amuebladoOn) rows = rows.filter((l) => l.amueblado === true);

    const mascotasOn = sp?.get(RENTAS_QUERY_MASCOTAS) === "1";
    if (mascotasOn) rows = rows.filter((l) => l.mascotasPermitidas === true);

    const rMinRaw = sp?.get(RENTAS_QUERY_RENT_MIN);
    const rMaxRaw = sp?.get(RENTAS_QUERY_RENT_MAX);
    const rMin = rMinRaw != null && rMinRaw !== "" ? Number(rMinRaw) : null;
    const rMax = rMaxRaw != null && rMaxRaw !== "" ? Number(rMaxRaw) : null;
    if (rMin !== null && Number.isFinite(rMin)) {
      rows = rows.filter((l) => rentDemoMonthlyNumber(l.rentDisplay) >= rMin);
    }
    if (rMax !== null && Number.isFinite(rMax)) {
      rows = rows.filter((l) => rentDemoMonthlyNumber(l.rentDisplay) <= rMax);
    }

    if (sort === "precio_asc") rows.sort((a, b) => rentDemoMonthlyNumber(a.rentDisplay) - rentDemoMonthlyNumber(b.rentDisplay));
    if (sort === "precio_desc") rows.sort((a, b) => rentDemoMonthlyNumber(b.rentDisplay) - rentDemoMonthlyNumber(a.rentDisplay));
    return rows;
  }, [branchFilter, propiedadFilter, query, searchParams, sort]);

  const featuredListing = useMemo((): RentasResultsDemoListing | null => {
    if (!filteredListings.length) return null;
    if (propiedadFilter && rentasResultsFeatured.categoriaPropiedad !== propiedadFilter) {
      const promoted = filteredListings.find((l) => l.promoted);
      return promoted ?? filteredListings[0];
    }
    if (branchFilter === "privado" && rentasResultsFeatured.branch !== "privado") {
      return filteredListings[0];
    }
    if (branchFilter === "negocio" && rentasResultsFeatured.branch !== "negocio") {
      return filteredListings[0];
    }
    return rentasResultsFeatured;
  }, [filteredListings, propiedadFilter, branchFilter]);

  const displayedListings = useMemo(() => {
    if (view === "list") return filteredListings.map((l) => ({ ...l, layout: "horizontal" as const }));
    return filteredListings.map((l) => ({ ...l, layout: l.layout ?? ("vertical" as const) }));
  }, [filteredListings, view]);

  const totalLabel =
    propiedadFilter || branchFilter !== "all" || query.trim() ? filteredListings.length : RENTAS_RESULTS_DEMO_TOTAL;
  const showingTo = displayedListings.length ? Math.min(20, displayedListings.length) : 0;

  return (
    <BienesRaicesResultsShell>
      <RentasResultsTopBar />

      <div className="max-w-3xl">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#1E1810] sm:text-[2.75rem] sm:leading-tight">
          Rentas
        </h1>
        <p className="mt-2 text-base text-[#5C5346]/90 sm:text-lg">
          Resultados de renta (demo). No es vista previa de publicación:{" "}
          <Link href="/clasificados/rentas/preview/privado" className="font-semibold text-[#B8954A] underline">
            Privado
          </Link>{" "}
          /{" "}
          <Link href="/clasificados/rentas/preview/negocio" className="font-semibold text-[#B8954A] underline">
            Negocio
          </Link>
          .
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={RENTAS_PUBLICAR_PRIVADO}
          className="rounded-full border border-[#C9B46A]/50 bg-[#2A2620] px-4 py-2 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1E1810]"
        >
          Publicar — Privado
        </Link>
        <Link
          href={RENTAS_PUBLICAR_NEGOCIO}
          className="rounded-full border border-[#E8DFD0] bg-[#FDFBF7] px-4 py-2 text-sm font-bold text-[#1E1810] hover:border-[#C9B46A]/45"
        >
          Publicar — Negocio
        </Link>
      </div>

      <div className="mt-8 max-w-5xl">
        <RentasSearchBar
          query={query}
          onQuery={setQuery}
          propertyType={propertyType}
          onPropertyType={setPropertyType}
          priceBand={priceBand}
          onPriceBand={setPriceBand}
          beds={beds}
          onBeds={setBeds}
          searchPlaceholder="Buscar en Bienes Raíces…"
        />
        <RentasPropiedadFilterChips active={propiedadFilter} />
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="w-full text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75">Rama</span>
          {(
            [
              { id: "all" as const, label: "Todas" },
              { id: "privado" as const, label: "Privado" },
              { id: "negocio" as const, label: "Negocio" },
            ] as const
          ).map((opt) => {
            const isOn = branchFilter === opt.id;
            const sp = new URLSearchParams(searchParams?.toString() ?? "");
            if (opt.id === "all") sp.delete("branch");
            else sp.set("branch", opt.id);
            const href = sp.toString() ? `/clasificados/rentas/results?${sp.toString()}` : "/clasificados/rentas/results";
            return (
              <Link
                key={opt.id}
                href={href}
                scroll={false}
                className={
                  "rounded-full border px-3 py-1.5 text-xs font-semibold sm:text-sm " +
                  (isOn
                    ? "border-[#C9B46A]/70 bg-[#2A2620] text-[#FAF7F2]"
                    : "border-[#E8DFD0] bg-white/90 text-[#3D3630] hover:border-[#C9B46A]/45")
                }
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
      </div>

      <BienesRaicesResultsHeader
        showingFrom={displayedListings.length ? 1 : 0}
        showingTo={showingTo}
        total={totalLabel}
        sort={sort}
        onSort={setSort}
        view={view}
        onView={setView}
        mapOn={showMap}
        onMapOn={setShowMap}
      />

      {featuredListing ? (
        <section className="mt-8" aria-labelledby="rentas-feat-heading">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h2 id="rentas-feat-heading" className="font-serif text-lg font-semibold text-[#1E1810] sm:text-xl">
              Destacado (demo)
            </h2>
            {propiedadFilter ? (
              <p className="text-xs text-[#5C5346]/75">{categoryLabelEs(propiedadFilter)}</p>
            ) : null}
          </div>
          <RentasResultCard listing={{ ...featuredListing, layout: "horizontal" }} />
        </section>
      ) : (
        <p className="mt-8 rounded-2xl border border-dashed border-[#E8DFD0] bg-[#FDFBF7]/80 p-6 text-center text-sm text-[#5C5346]">
          Sin destacado en esta vista.
        </p>
      )}

      <section className="mt-12" aria-labelledby="rentas-grid-heading">
        <h2 id="rentas-grid-heading" className="font-serif text-xl font-semibold text-[#1E1810] sm:text-2xl">
          Más rentas
        </h2>
        {displayedListings.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-[#E8DFD0] bg-[#FDFBF7]/90 p-6 text-center text-sm text-[#5C5346]">
            Sin coincidencias.{" "}
            <Link href="/clasificados/rentas/results" className="font-semibold text-[#B8954A] underline">
              Limpiar filtros (demo)
            </Link>
          </p>
        ) : view === "list" ? (
          <div className="mt-6 flex flex-col gap-5">
            {displayedListings.map((l) => (
              <RentasResultCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {displayedListings.map((l) => (
              <RentasResultCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      <footer className="mt-14 border-t border-[#E8DFD0]/70 pt-8 text-center text-sm text-[#5C5346]/85">
        <Link href={RENTAS_LANDING} className="font-semibold text-[#B8954A] underline">
          Volver al hub Rentas
        </Link>
      </footer>
    </BienesRaicesResultsShell>
  );
}
