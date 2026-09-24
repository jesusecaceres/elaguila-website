/**
 * Leonix bilingual discovery — Autos (dealer + private public results) adapter, WAVE 4 (2026-09-24).
 *
 * Canonical basis (values Autos ALREADY persists on `AutosPublicListing`):
 *   condition   new | used | certified                          (exact id)
 *   sellerType  dealer | private                                (exact id)
 *   bodyStyle   stored as a display string ("Sedán", "SUV", "Pickup", "Truck", ...) — recovered to a
 *               language-neutral id by EXACT catalog phrase (same recovery Servicios uses for quick facts)
 *   fuelType    same recovery ("Gasoline", "Gasolina premium", "Hybrid", "Electric", ...)
 *   transmission same recovery ("Automatic", "Automática", "Manual", ...)
 * Makes, models, years, VIN / stock and city are language-neutral literals. The dealer / private words the
 * old matcher injected ("dealer negocio concesionario business" / "private privado particular") are now
 * aliases of the sellerType concept. No translation call, no server-only, no fetch.
 */
import type { AutosPublicListing } from "@/app/(site)/clasificados/autos/data/autosPublicSampleTypes";
import {
  catalogKeywordMatcher,
  createCatalogDiscoveryAdapter,
  type CatalogConcept,
} from "../catalogDiscovery";
import type { CanonicalConceptRef } from "../canonicalTaxonomyAdapter";

export const AUTOS_CONCEPT_KIND = {
  bodyStyle: "bodyStyle",
  condition: "condition",
  sellerType: "sellerType",
  fuelType: "fuelType",
  transmission: "transmission",
} as const;

const c = (
  kind: string,
  id: string,
  es: string,
  en: string,
  aliases: readonly string[] = [],
  expandTerms = true,
): CatalogConcept => ({ kind, id, es, en, aliases, expandTerms });

export const AUTOS_CONCEPT_CATALOG: readonly CatalogConcept[] = [
  c(AUTOS_CONCEPT_KIND.bodyStyle, "sedan", "Sedán", "Sedan", ["sedanes", "saloon", "4 puertas", "4 door"]),
  c(AUTOS_CONCEPT_KIND.bodyStyle, "suv", "SUV", "SUV", ["camioneta", "camionetas", "crossover", "todoterreno", "sport utility"]),
  c(AUTOS_CONCEPT_KIND.bodyStyle, "pickup", "Camioneta pickup", "Pickup truck", ["pickup", "pick up", "pick-up", "truck", "trucks", "troca", "trocas", "camioneta", "camionetas", "camion", "camioneta de carga"]),
  c(AUTOS_CONCEPT_KIND.bodyStyle, "coupe", "Cupé", "Coupe", ["coupe", "cupe", "coupé", "2 puertas", "2 door"]),
  c(AUTOS_CONCEPT_KIND.bodyStyle, "hatchback", "Hatchback", "Hatchback", ["hatch", "compacto", "compact"]),
  c(AUTOS_CONCEPT_KIND.bodyStyle, "minivan", "Minivan", "Minivan", ["van", "vans", "minivans", "furgoneta", "familiar"]),
  c(AUTOS_CONCEPT_KIND.bodyStyle, "convertible", "Convertible", "Convertible", ["descapotable", "cabriolet", "roadster"]),
  c(AUTOS_CONCEPT_KIND.bodyStyle, "wagon", "Station wagon", "Wagon", ["wagon", "station wagon", "familiar"]),
  c(AUTOS_CONCEPT_KIND.condition, "new", "Nuevo", "New", ["nuevo", "nueva", "new", "0 millas", "brand new"], false),
  c(AUTOS_CONCEPT_KIND.condition, "used", "Usado", "Used", ["usado", "usada", "used", "pre-owned", "preowned", "pre owned", "segunda mano"], false),
  c(AUTOS_CONCEPT_KIND.condition, "certified", "Certificado", "Certified", ["certificado", "certified", "cpo", "certified pre-owned"], false),
  c(AUTOS_CONCEPT_KIND.sellerType, "dealer", "Concesionario / negocio", "Dealer / business", ["dealer", "dealers", "dealership", "negocio", "concesionario", "concesionaria", "business", "agencia"], false),
  c(AUTOS_CONCEPT_KIND.sellerType, "private", "Particular / privado", "Private seller", ["private", "privado", "particular", "private seller", "by owner", "dueño"], false),
  c(AUTOS_CONCEPT_KIND.fuelType, "gasoline", "Gasolina", "Gasoline", ["gasoline", "gasolina", "gas", "gasolina premium", "premium gasoline", "petrol"], false),
  c(AUTOS_CONCEPT_KIND.fuelType, "diesel", "Diésel", "Diesel", ["diesel", "diésel"], false),
  c(AUTOS_CONCEPT_KIND.fuelType, "electric", "Eléctrico", "Electric", ["electric", "electrico", "eléctrico", "ev"], false),
  c(AUTOS_CONCEPT_KIND.fuelType, "hybrid", "Híbrido", "Hybrid", ["hybrid", "hibrido", "híbrido", "plug-in hybrid", "phev"], false),
  c(AUTOS_CONCEPT_KIND.transmission, "automatic", "Automática", "Automatic", ["automatic", "automatica", "automático", "automatico"], false),
  c(AUTOS_CONCEPT_KIND.transmission, "manual", "Manual", "Manual", ["manual", "standard", "estandar", "estándar", "stick shift"], false),
];

/** Body-style values are stored as display strings; recover only by exact, kind-scoped catalog phrase. */
function bodyStyleId(resolve: (kind: string, v: string | null | undefined) => string | null, raw: string | null | undefined): string | null {
  const exactPickup = ["pickup", "truck", "pick up", "pick-up"];
  const n = (raw ?? "").trim().toLowerCase();
  if (exactPickup.includes(n)) return "pickup";
  if (n === "camioneta" || n === "camionetas") return "suv";
  return resolve(AUTOS_CONCEPT_KIND.bodyStyle, raw);
}

export const autosDiscoveryAdapter = createCatalogDiscoveryAdapter<AutosPublicListing>({
  category: "autos",
  catalog: AUTOS_CONCEPT_CATALOG,
  rowConcepts(row, resolve) {
    const out: CanonicalConceptRef[] = [];
    const add = (kind: string, id: string | null) => {
      if (id && !out.some((r) => r.kind === kind && r.id === id)) out.push({ kind, id });
    };
    add(AUTOS_CONCEPT_KIND.bodyStyle, bodyStyleId(resolve, row.bodyStyle));
    add(AUTOS_CONCEPT_KIND.condition, resolve(AUTOS_CONCEPT_KIND.condition, row.condition));
    add(AUTOS_CONCEPT_KIND.sellerType, resolve(AUTOS_CONCEPT_KIND.sellerType, row.sellerType));
    // "Gasolina premium" / "Gasoline" etc.: exact phrase first, then leading-word recovery.
    add(
      AUTOS_CONCEPT_KIND.fuelType,
      resolve(AUTOS_CONCEPT_KIND.fuelType, row.fuelType) ??
        resolve(AUTOS_CONCEPT_KIND.fuelType, (row.fuelType ?? "").trim().split(/\s+/)[0]),
    );
    add(AUTOS_CONCEPT_KIND.transmission, resolve(AUTOS_CONCEPT_KIND.transmission, row.transmission));
    return out;
  },
  rowLiterals: (row) => [
    row.make,
    row.model,
    String(row.year),
    row.trim,
    row.vehicleTitle,
    String(row.price),
    String(row.mileage),
    row.bodyStyle,
    row.transmission,
    row.drivetrain,
    row.fuelType,
    row.exteriorColor,
    row.interiorColor,
    row.titleStatus,
    row.city,
    row.state,
    row.zip,
    row.country,
    row.dealerName,
    row.privateSellerLabel,
    row.sellerType,
  ],
  rowCustomText: (row) => [row.searchableBlurb],
});

/** Keyword (`q`) matcher only — every other Autos facet stays in `applyAutosPublicFilters`. Compile once per call. */
export function autosKeywordMatcher(rawQ: string): (row: AutosPublicListing) => boolean {
  return catalogKeywordMatcher(autosDiscoveryAdapter, rawQ);
}
