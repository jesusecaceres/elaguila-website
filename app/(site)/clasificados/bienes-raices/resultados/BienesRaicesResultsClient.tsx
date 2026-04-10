"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BR_PUBLICAR_HUB, BR_RESULTS } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import {
  BR_NEGOCIO_Q_PROPIEDAD,
  parseBrNegocioPropiedadParam,
  type BrNegocioCategoriaPropiedad,
} from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type { BrPrimaryChipId, BrSecondaryChipId } from "./search/filterTypes";
import { brNegocioFeaturedListing, brNegocioGridListings, BR_NEGOCIO_DEMO_TOTAL } from "./demoData";
import type { BrNegocioListing } from "./cards/listingTypes";
import { BienesRaicesNegocioCard } from "./cards/BienesRaicesNegocioCard";
import { BienesRaicesCategoryNav } from "./components/BienesRaicesCategoryNav";
import { BienesRaicesFeaturedSection } from "./components/BienesRaicesFeaturedSection";
import { BienesRaicesFilterChips } from "./components/BienesRaicesFilterChips";
import { BienesRaicesPropiedadFilterChips } from "./components/BienesRaicesPropiedadFilterChips";
import { BienesRaicesResultsHeader } from "./components/BienesRaicesResultsHeader";
import { BienesRaicesResultsShell } from "./components/BienesRaicesResultsShell";
import { BienesRaicesResultsTopBar } from "./components/BienesRaicesResultsTopBar";
import { BienesRaicesSearchBar } from "./components/BienesRaicesSearchBar";

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

function brDemoPriceNumber(price: string): number {
  const n = Number(String(price).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function listingOperation(listing: BrNegocioListing): "venta" | "renta" {
  if (listing.operationLabel === "Renta") return "renta";
  return "venta";
}

function listingMatchesPrimaryChips(listing: BrNegocioListing, primary: Set<BrPrimaryChipId>): boolean {
  if (primary.size === 0) return true;
  const op = listingOperation(listing);
  const wantsVenta = primary.has("venta");
  const wantsRenta = primary.has("renta");
  if (wantsVenta && !wantsRenta && op !== "venta") return false;
  if (wantsRenta && !wantsVenta && op !== "renta") return false;
  for (const id of primary) {
    if (id === "venta" || id === "renta") continue;
    if (id === "comerciales") {
      if (!(listing.categoriaPropiedad === "comercial" || listing.badges.includes("comercial"))) return false;
    } else if (id === "terrenos") {
      if (listing.categoriaPropiedad !== "terreno_lote") return false;
    } else if (id === "casas" || id === "departamentos") {
      if (listing.categoriaPropiedad !== "residencial") return false;
    }
  }
  return true;
}

function pickFeaturedForFilter(
  filtered: BrNegocioListing[],
  fallback: BrNegocioListing
): BrNegocioListing | null {
  if (!filtered.length) return null;
  const promoted = filtered.find((l) => l.badges.includes("promocionada"));
  if (promoted) return promoted;
  if (filtered.some((l) => l.id === fallback.id)) return fallback;
  return filtered[0];
}

/** Category-owned results UI for `/clasificados/bienes-raices/resultados` (demo grid; `propiedad` = residencial|comercial|terreno_lote). */
export function BienesRaicesResultsClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceBand, setPriceBand] = useState("");
  const [beds, setBeds] = useState("");
  const [primary, setPrimary] = useState<Set<BrPrimaryChipId>>(() => new Set());
  const [secondary, setSecondary] = useState<Set<BrSecondaryChipId>>(() => new Set());
  const [sort, setSort] = useState("reciente");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showMap, setShowMap] = useState(false);
  const [propiedadFilter, setPropiedadFilter] = useState<BrNegocioCategoriaPropiedad | null>(null);

  useEffect(() => {
    if (!searchParams) return;
    const q = searchParams.get("q");
    const city = searchParams.get("city");
    if (q != null && q !== "") setQuery(q);
    else if (city != null && city !== "") setQuery(city);

    const tipo = searchParams.get("tipo");
    const propertyTypeParam = searchParams.get("propertyType");
    if (tipo != null && tipo !== "") setPropertyType(tipo);
    else if (propertyTypeParam === "casa") setPropertyType("casa");
    else if (propertyTypeParam === "departamento") setPropertyType("depto");
    else if (propertyTypeParam === "terreno") setPropertyType("terreno");
    else if (propertyTypeParam === "comercial") setPropertyType("comercial");

    const precio = searchParams.get("precio");
    if (precio != null) setPriceBand(precio);
    const recs = searchParams.get("recs");
    if (recs != null) setBeds(recs);
    const bedsParam = searchParams.get("beds");
    if (bedsParam != null && bedsParam !== "") setBeds(bedsParam);

    const primaryParsed = parsePrimaryFromSearch(searchParams.get("primary"));
    if (primaryParsed) setPrimary(primaryParsed);

    const op = searchParams.get("operationType");
    if (op === "venta" || op === "renta") {
      setPrimary((prev) => {
        const next = new Set(prev);
        if (op === "venta") next.add("venta");
        if (op === "renta") next.add("renta");
        return next;
      });
    }

    const pt = propertyTypeParam ?? tipo;
    if (pt === "casa" || pt === "departamento" || pt === "terreno" || pt === "comercial" || pt === "depto") {
      setPrimary((prev) => {
        const next = new Set(prev);
        const map: Record<string, BrPrimaryChipId> = {
          casa: "casas",
          departamento: "departamentos",
          depto: "departamentos",
          terreno: "terrenos",
          comercial: "comerciales",
        };
        const chip = map[pt];
        if (chip) next.add(chip);
        return next;
      });
    }

    const secondaryParsed = parseSecondaryFromSearch(searchParams.get("secondary"));
    if (secondaryParsed) setSecondary(secondaryParsed);

    const prop = parseBrNegocioPropiedadParam(searchParams.get(BR_NEGOCIO_Q_PROPIEDAD));
    setPropiedadFilter(prop);
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

  const filteredListings = useMemo(() => {
    let rows = brNegocioGridListings.filter((l) => listingMatchesPrimaryChips(l, primary));
    if (propiedadFilter) rows = rows.filter((l) => l.categoriaPropiedad === propiedadFilter);
    if (secondary.has("reducida")) rows = rows.filter((l) => l.badges.includes("reducida"));
    if (secondary.has("open_house")) rows = rows.filter((l) => l.openHouse || l.badges.includes("open_house"));
    if (secondary.has("tour_virtual")) rows = rows.filter((l) => l.badges.includes("tour_virtual"));
    if (secondary.has("nuevo_desarrollo")) rows = rows.filter((l) => l.badges.includes("nuevo"));
    if (secondary.has("planos")) rows = rows.filter((l) => l.badges.includes("planos"));
    if (secondary.has("piscina")) {
      rows = rows.filter(
        (l) =>
          l.title.toLowerCase().includes("piscina") ||
          l.metaLines?.some((m) => {
            const x = m.toLowerCase();
            return x.includes("piscina") || x.includes("alberca");
          })
      );
    }
    if (secondary.has("mascotas")) {
      rows = rows.filter((l) => l.metaLines?.some((m) => m.toLowerCase().includes("mascota")));
    }

    const sellerType = searchParams?.get("sellerType");
    if (sellerType === "privado" || sellerType === "negocio") {
      rows = rows.filter((l) => {
        const sk = l.sellerKind ?? (l.badges.includes("negocio") ? "negocio" : "privado");
        return sk === sellerType;
      });
    }

    if (searchParams?.get("pool") === "true") {
      rows = rows.filter(
        (l) =>
          l.title.toLowerCase().includes("piscina") ||
          l.metaLines?.some((m) => {
            const x = m.toLowerCase();
            return x.includes("piscina") || x.includes("alberca");
          })
      );
    }
    if (searchParams?.get("pets") === "true") {
      rows = rows.filter((l) => l.metaLines?.some((m) => m.toLowerCase().includes("mascota")));
    }
    if (searchParams?.get("furnished") === "true") {
      rows = rows.filter((l) => l.metaLines?.some((m) => m.toLowerCase().includes("amueblado")));
    }

    const q = query.trim().toLowerCase();
    if (q) rows = rows.filter((l) => l.title.toLowerCase().includes(q) || l.addressLine.toLowerCase().includes(q));
    const sorted = [...rows];
    if (sort === "precio_asc") sorted.sort((a, b) => brDemoPriceNumber(a.price) - brDemoPriceNumber(b.price));
    if (sort === "precio_desc") sorted.sort((a, b) => brDemoPriceNumber(b.price) - brDemoPriceNumber(a.price));
    return sorted;
  }, [primary, propiedadFilter, secondary, query, sort, searchParams]);

  const featuredListing = useMemo(
    () => pickFeaturedForFilter(filteredListings, brNegocioFeaturedListing),
    [filteredListings]
  );

  const displayedListings = useMemo(() => {
    if (view === "list") {
      return filteredListings.map((l) => ({ ...l, layout: "horizontal" as const }));
    }
    return filteredListings;
  }, [filteredListings, view]);

  const totalLabel = propiedadFilter || primary.size || query.trim() ? filteredListings.length : BR_NEGOCIO_DEMO_TOTAL;
  const showingTo = displayedListings.length ? Math.min(20, displayedListings.length) : 0;

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
        <BienesRaicesPropiedadFilterChips active={propiedadFilter} />
        <BienesRaicesFilterChips
          primary={primary}
          secondary={secondary}
          onTogglePrimary={togglePrimary}
          onToggleSecondary={toggleSecondary}
        />
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

      <BienesRaicesFeaturedSection listing={featuredListing} showMap={showMap} />

      <section className="mt-14" aria-labelledby="br-more-heading">
        <h2 id="br-more-heading" className="font-serif text-xl font-semibold text-[#1E1810] sm:text-2xl">
          Más resultados en Guadalajara, Jalisco
        </h2>
        {displayedListings.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-[#E8DFD0] bg-[#FDFBF7]/90 p-6 text-center text-sm text-[#5C5346]">
            Sin coincidencias en esta combinación.{" "}
            <Link href={BR_RESULTS} className="font-semibold text-[#B8954A] underline">
              Ver todas (demo)
            </Link>
          </p>
        ) : view === "list" ? (
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
          Comunidad Leonix · Anuncios moderados · Contacto directo · Listado demo (venta) separado de{" "}
          <Link href="/clasificados/bienes-raices/preview/privado" className="font-semibold text-[#B8954A] underline">
            vista previa Privado
          </Link>
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm font-semibold">
          <Link
            href={BR_PUBLICAR_HUB}
            className="rounded-lg text-[#B8954A] underline decoration-[#C9B46A]/50 underline-offset-4 hover:text-[#8A6F3A]"
          >
            Publicar anuncio
          </Link>
        </div>
      </footer>
    </BienesRaicesResultsShell>
  );
}
