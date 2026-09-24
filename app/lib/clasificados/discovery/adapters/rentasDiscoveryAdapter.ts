/**
 * Leonix bilingual discovery — Rentas adapter, WAVE 4 (2026-09-24).
 *
 * Canonical basis (ids Rentas ALREADY persists on `RentasPublicListing`):
 *   propertyType  rentalTypeCode (`RENTAS_TIPO_DE_RENTA_IDS`), resultsPropertyKind, categoriaPropiedad
 *   operation     always "rent" (every Rentas row is a rental)
 * Literals / owner text are the exact fields the old `textMatchesListing` searched, kept in their
 * original language. No translation call, no server-only, no fetch.
 */
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import { createCatalogDiscoveryAdapter, filterRowsByCatalogDiscoveryKeyword } from "../catalogDiscovery";
import type { CanonicalConceptRef } from "../canonicalTaxonomyAdapter";
import {
  REAL_ESTATE_CONCEPT_CATALOG,
  RE_KIND,
  RE_OP_RENT,
  realEstateConceptIdForCategoria,
  realEstateConceptIdForResultsKind,
} from "./realEstateDiscoveryCatalog";

const RENTAL_TYPE_IDS = new Set(
  REAL_ESTATE_CONCEPT_CATALOG.filter((c) => c.kind === RE_KIND.propertyType).map((c) => c.id),
);

export const rentasDiscoveryAdapter = createCatalogDiscoveryAdapter<RentasPublicListing>({
  category: "rentas",
  catalog: REAL_ESTATE_CONCEPT_CATALOG,
  rowConcepts(l) {
    const out: CanonicalConceptRef[] = [{ kind: RE_KIND.operation, id: RE_OP_RENT }];
    const add = (id: string | null) => {
      if (id && !out.some((r) => r.kind === RE_KIND.propertyType && r.id === id)) {
        out.push({ kind: RE_KIND.propertyType, id });
      }
    };
    const tipo = (l.rentalTypeCode ?? "").trim();
    if (RENTAL_TYPE_IDS.has(tipo)) add(tipo);
    add(realEstateConceptIdForResultsKind(l.resultsPropertyKind));
    add(realEstateConceptIdForCategoria(l.categoriaPropiedad));
    return out;
  },
  rowLiterals: (l) => [
    l.title,
    l.addressLine,
    l.city,
    l.postalCode,
    l.stateRegion,
    l.businessMarca,
    l.businessAgentName,
    l.businessSocial,
    l.propertySubtype,
    l.leaseTermCode,
    (l.highlightSlugs ?? []).join(" "),
    l.resultsPropertyKind,
  ],
  rowCustomText: (l) => [
    l.description?.es,
    l.description?.en,
    l.requirements,
    l.servicesIncluded,
    l.availabilityNote,
    l.businessDescription,
  ],
});

/** Keyword (`q`) filter only — every other Rentas facet stays in `filterRentasPublicListings`. */
export function filterRentasRowsByKeyword(rows: RentasPublicListing[], rawQ: string | undefined): RentasPublicListing[] {
  return filterRowsByCatalogDiscoveryKeyword(rentasDiscoveryAdapter, rows, rawQ);
}
