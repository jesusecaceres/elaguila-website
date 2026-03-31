"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BR_PREVIEW_NEGOCIO,
  BR_PUBLICAR_HUB,
} from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import type { BrPrimaryChipId, BrSecondaryChipId } from "./search/filterTypes";

const PRIMARY_IDS: BrPrimaryChipId[] = ["casas", "departamentos", "venta", "renta", "comerciales", "terrenos"];
const SECONDARY_IDS: BrSecondaryChipId[] = [
  "piscina",
  "mascotas",
  "nuevo_desarrollo",
  "open_house",
  "reducida",
  "tour_virtual",
  "planos",
  "financiamiento",
  "segundo_agente",
];

function parsePrimaryFromSearch(raw: string | null): Set<BrPrimaryChipId> | null {
  if (!raw?.trim()) return null;
  const next = new Set<BrPrimaryChipId>();
  for (const part of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    if ((PRIMARY_IDS as readonly string[]).includes(part)) next.add(part as BrPrimaryChipId);
  }
  return next.size ? next : null;
}

function parseSecondaryFromSearch(raw: string | null): Set<BrSecondaryChipId> | null {
  if (!raw?.trim()) return null;
  const next = new Set<BrSecondaryChipId>();
  for (const part of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    if ((SECONDARY_IDS as readonly string[]).includes(part)) next.add(part as BrSecondaryChipId);
  }
  return next.size ? next : null;
}
import { brNegocioFeaturedListing, brNegocioGridListings, BR_NEGOCIO_DEMO_TOTAL } from "./demoData";
import { BienesRaicesNegocioCard } from "./cards/BienesRaicesNegocioCard";
import { BienesRaicesCategoryNav } from "./components/BienesRaicesCategoryNav";
import { BienesRaicesFeaturedSection } from "./components/BienesRaicesFeaturedSection";
import { BienesRaicesFilterChips } from "./components/BienesRaicesFilterChips";
import { BienesRaicesResultsHeader } from "./components/BienesRaicesResultsHeader";
import { BienesRaicesResultsShell } from "./components/BienesRaicesResultsShell";
import { BienesRaicesResultsTopBar } from "./components/BienesRaicesResultsTopBar";
import { BienesRaicesSearchBar } from "./components/BienesRaicesSearchBar";

export function BienesRaicesNegocioResultsClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceBand, setPriceBand] = useState("");
  const [beds, setBeds] = useState("");
  const [primary, setPrimary] = useState<Set<BrPrimaryChipId>>(() => new Set(["comerciales"]));
  const [secondary, setSecondary] = useState<Set<BrSecondaryChipId>>(() => new Set());
  const [sort, setSort] = useState("reciente");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showMap, setShowMap] = useState(false);

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
    const primaryParsed = parsePrimaryFromSearch(searchParams.get("primary"));
    if (primaryParsed) setPrimary(primaryParsed);
    const secondaryParsed = parseSecondaryFromSearch(searchParams.get("secondary"));
    if (secondaryParsed) setSecondary(secondaryParsed);
  }, [searchParams]);

  const togglePrimary = (id: BrPrimaryChipId) => {
    setPrimary((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSecondary = (id: BrSecondaryChipId) => {
    setSecondary((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const displayedListings = useMemo(() => {
    if (view === "list") {
      return brNegocioGridListings.map((l) => ({ ...l, layout: "horizontal" as const }));
    }
    return brNegocioGridListings;
  }, [view]);

  return (
    <BienesRaicesResultsShell>
      <BienesRaicesResultsTopBar />
      <BienesRaicesCategoryNav />

      <div className="max-w-3xl">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#1E1810] sm:text-[2.75rem] sm:leading-tight">
          Bienes Raíces
        </h1>
        <p className="mt-2 text-base text-[#5C5346]/90 sm:text-lg">Encuentra propiedades con claridad y confianza.</p>
      </div>

      <div className="mt-8 max-w-5xl">
        <BienesRaicesSearchBar
          query={query}
          onQuery={setQuery}
          propertyType={propertyType}
          onPropertyType={setPropertyType}
          priceBand={priceBand}
          onPriceBand={setPriceBand}
          beds={beds}
          onBeds={setBeds}
        />
        <BienesRaicesFilterChips
          primary={primary}
          secondary={secondary}
          onTogglePrimary={togglePrimary}
          onToggleSecondary={toggleSecondary}
        />
      </div>

      <BienesRaicesResultsHeader
        showingFrom={1}
        showingTo={20}
        total={BR_NEGOCIO_DEMO_TOTAL}
        sort={sort}
        onSort={setSort}
        view={view}
        onView={setView}
        mapOn={showMap}
        onMapOn={setShowMap}
      />

      <BienesRaicesFeaturedSection listing={brNegocioFeaturedListing} showMap={showMap} />

      <section className="mt-14" aria-labelledby="br-more-heading">
        <h2 id="br-more-heading" className="font-serif text-xl font-semibold text-[#1E1810] sm:text-2xl">
          Más resultados en Guadalajara, Jalisco
        </h2>
        {view === "list" ? (
          <div className="mt-6 flex flex-col gap-5">
            {displayedListings.map((listing) => (
              <BienesRaicesNegocioCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-6">
            {displayedListings.map((listing) => (
              <div
                key={listing.id}
                className={
                  listing.layout === "horizontal" ? "sm:col-span-2 xl:col-span-3" : "sm:col-span-1 xl:col-span-2"
                }
              >
                <BienesRaicesNegocioCard listing={listing} />
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="mt-16 border-t border-[#E8DFD0]/70 pt-8 text-center">
        <p className="text-sm text-[#5C5346]/85">
          Comunidad Leonix · Anuncios moderados · Contacto directo
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm font-semibold">
          <Link
            href={BR_PUBLICAR_HUB}
            className="rounded-lg text-[#B8954A] underline decoration-[#C9B46A]/50 underline-offset-4 hover:text-[#8A6F3A]"
          >
            Publicar anuncio
          </Link>
          <span className="text-[#E8DFD0]" aria-hidden>
            ·
          </span>
          <Link
            href={BR_PREVIEW_NEGOCIO}
            className="rounded-lg text-[#5C5346] underline decoration-[#C9B46A]/40 underline-offset-4 hover:text-[#1E1810]"
          >
            Vista previa Negocio
          </Link>
        </div>
      </footer>
    </BienesRaicesResultsShell>
  );
}
