import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type { BrNegocioListing } from "../cards/listingTypes";
import type { BrPrimaryChipId, BrSecondaryChipId } from "../search/filterTypes";
import type { BrResultsParsedState } from "./brResultsUrlState";

const PRIMARY_IDS: BrPrimaryChipId[] = [
  "casas",
  "departamentos",
  "venta",
  "renta",
  "comerciales",
  "terrenos",
];

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

export function brDemoPriceNumber(price: string): number {
  const n = Number(String(price).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function listingOperation(listing: BrNegocioListing): "venta" | "renta" {
  if (listing.operationLabel === "Renta") return "renta";
  return "venta";
}

function parsePrimaryFromString(raw: string): Set<BrPrimaryChipId> {
  const next = new Set<BrPrimaryChipId>();
  if (!raw.trim()) return next;
  for (const part of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    if ((PRIMARY_IDS as readonly string[]).includes(part)) next.add(part as BrPrimaryChipId);
  }
  return next;
}

function parseSecondaryFromString(raw: string): Set<BrSecondaryChipId> {
  const next = new Set<BrSecondaryChipId>();
  if (!raw.trim()) return next;
  for (const part of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
    if ((SECONDARY_IDS as readonly string[]).includes(part)) next.add(part as BrSecondaryChipId);
  }
  return next;
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
    } else if (id === "casas") {
      if (listing.categoriaPropiedad !== "residencial") return false;
      const t = listing.title.toLowerCase();
      if (t.includes("departamento") || t.includes("depto")) return false;
    } else if (id === "departamentos") {
      if (listing.categoriaPropiedad !== "residencial") return false;
      const t = listing.title.toLowerCase();
      if (!(t.includes("departamento") || t.includes("depto"))) return false;
    }
  }
  return true;
}

function listingHasPool(listing: BrNegocioListing): boolean {
  const title = listing.title.toLowerCase();
  if (title.includes("piscina") || title.includes("alberca")) return true;
  return Boolean(
    listing.metaLines?.some((m) => {
      const x = m.toLowerCase();
      return x.includes("piscina") || x.includes("alberca");
    })
  );
}

function listingHasPets(listing: BrNegocioListing): boolean {
  return Boolean(listing.metaLines?.some((m) => m.toLowerCase().includes("mascota")));
}

function listingHasFurnished(listing: BrNegocioListing): boolean {
  return Boolean(listing.metaLines?.some((m) => m.toLowerCase().includes("amueblado")));
}

function parseBedBathCount(raw: string): number | null {
  if (raw === "—" || raw.trim() === "") return null;
  const n = Number(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function legacyPrecioBounds(precio: string): { min?: number; max?: number } {
  switch (precio) {
    case "0-250k":
      return { min: 0, max: 250_000 };
    case "250-500k":
      return { min: 250_000, max: 500_000 };
    case "500k-1m":
      return { min: 500_000, max: 1_000_000 };
    case "1m+":
      return { min: 1_000_000, max: undefined };
    default:
      return {};
  }
}

function mapPropertyTypeToFilter(pt: string): ((l: BrNegocioListing) => boolean) | null {
  if (!pt) return null;
  if (pt === "terreno") return (l) => l.categoriaPropiedad === "terreno_lote";
  if (pt === "comercial") return (l) => l.categoriaPropiedad === "comercial";
  if (pt === "casa")
    return (l) =>
      l.categoriaPropiedad === "residencial" &&
      !l.title.toLowerCase().includes("departamento") &&
      !l.title.toLowerCase().includes("depto");
  if (pt === "departamento")
    return (l) =>
      l.categoriaPropiedad === "residencial" &&
      (l.title.toLowerCase().includes("departamento") || l.title.toLowerCase().includes("depto"));
  return null;
}

export function getSellerKind(listing: BrNegocioListing): "privado" | "negocio" {
  if (listing.sellerKind) return listing.sellerKind;
  return listing.badges.includes("negocio") ? "negocio" : "privado";
}

function isNegocioListing(listing: BrNegocioListing): boolean {
  return getSellerKind(listing) === "negocio" || listing.badges.includes("negocio");
}

/** Spotlight score: promoted Negocios first (demo / future placement hook). */
export function spotlightScore(listing: BrNegocioListing): number {
  let s = 0;
  if (listing.badges.includes("promocionada")) s += 100;
  if (listing.badges.includes("destacada")) s += 50;
  if (listing.badges.includes("negocio")) s += 15;
  if (listing.badges.includes("nuevo")) s += 5;
  return s;
}

export function pickNegociosSpotlight(filtered: BrNegocioListing[], max = 3): BrNegocioListing[] {
  const neg = filtered.filter(isNegocioListing);
  return [...neg].sort((a, b) => spotlightScore(b) - spotlightScore(a)).slice(0, max);
}

export function filterBrListings(
  listings: BrNegocioListing[],
  state: BrResultsParsedState,
  propiedadFilter: BrNegocioCategoriaPropiedad | null
): BrNegocioListing[] {
  const primary = parsePrimaryFromString(state.primary);
  const secondary = parseSecondaryFromString(state.secondary);

  if (state.operationType === "venta" || state.operationType === "renta") {
    if (state.operationType === "venta") {
      primary.add("venta");
    } else {
      primary.add("renta");
    }
  }

  const pt = state.propertyType;
  if (pt === "casa") primary.add("casas");
  if (pt === "departamento") primary.add("departamentos");
  if (pt === "terreno") primary.add("terrenos");
  if (pt === "comercial") primary.add("comerciales");

  let rows = listings.filter((l) => listingMatchesPrimaryChips(l, primary));

  const ptFn = mapPropertyTypeToFilter(pt);
  if (ptFn) rows = rows.filter(ptFn);

  if (propiedadFilter) rows = rows.filter((l) => l.categoriaPropiedad === propiedadFilter);

  if (secondary.has("reducida")) rows = rows.filter((l) => l.badges.includes("reducida"));
  if (secondary.has("open_house")) rows = rows.filter((l) => l.openHouse || l.badges.includes("open_house"));
  if (secondary.has("tour_virtual")) rows = rows.filter((l) => l.badges.includes("tour_virtual"));
  if (secondary.has("nuevo_desarrollo")) rows = rows.filter((l) => l.badges.includes("nuevo"));
  if (secondary.has("planos")) rows = rows.filter((l) => l.badges.includes("planos"));
  if (secondary.has("piscina")) rows = rows.filter(listingHasPool);
  if (secondary.has("mascotas")) rows = rows.filter(listingHasPets);

  if (state.sellerType === "privado" || state.sellerType === "negocio") {
    rows = rows.filter((l) => getSellerKind(l) === state.sellerType);
  }

  if (state.pool === "true") rows = rows.filter(listingHasPool);
  if (state.pets === "true") rows = rows.filter(listingHasPets);
  if (state.furnished === "true") rows = rows.filter(listingHasFurnished);

  const q = state.q.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (l) => l.title.toLowerCase().includes(q) || l.addressLine.toLowerCase().includes(q)
    );
  }

  const city = state.city.trim().toLowerCase();
  if (city) {
    rows = rows.filter((l) => l.addressLine.toLowerCase().includes(city));
  }

  let minP = state.priceMin ? Number(state.priceMin) : undefined;
  let maxP = state.priceMax ? Number(state.priceMax) : undefined;
  if ((!Number.isFinite(minP ?? NaN) || state.priceMin === "") && (!Number.isFinite(maxP ?? NaN) || state.priceMax === "")) {
    const legacy = legacyPrecioBounds(state.precio);
    if (legacy.min != null) minP = legacy.min;
    if (legacy.max != null) maxP = legacy.max;
  }
  if (minP != null && Number.isFinite(minP)) {
    rows = rows.filter((l) => brDemoPriceNumber(l.price) >= minP!);
  }
  if (maxP != null && Number.isFinite(maxP)) {
    rows = rows.filter((l) => brDemoPriceNumber(l.price) <= maxP!);
  }

  const minBeds = state.beds ? Number(state.beds) : NaN;
  if (Number.isFinite(minBeds) && minBeds > 0) {
    rows = rows.filter((l) => {
      const n = parseBedBathCount(l.beds);
      return n != null && n >= minBeds;
    });
  }

  const minBaths = state.baths ? Number(state.baths) : NaN;
  if (Number.isFinite(minBaths) && minBaths > 0) {
    rows = rows.filter((l) => {
      const n = parseBedBathCount(l.baths);
      return n != null && n >= minBaths;
    });
  }

  const sorted = [...rows];
  const sort = state.sort || "reciente";
  if (sort === "precio_asc") sorted.sort((a, b) => brDemoPriceNumber(a.price) - brDemoPriceNumber(b.price));
  else if (sort === "precio_desc") sorted.sort((a, b) => brDemoPriceNumber(b.price) - brDemoPriceNumber(a.price));

  return sorted;
}

export function paginateListings<T>(listings: T[], pageStr: string, pageSize: number): { page: number; slice: T[]; total: number } {
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const total = listings.length;
  const start = (page - 1) * pageSize;
  const slice = listings.slice(start, start + pageSize);
  return { page, slice, total };
}
