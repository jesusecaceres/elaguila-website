/**
 * Leonix bilingual discovery — Bienes Raíces (Negocio + shared BR results) adapter, WAVE 4 (2026-09-24).
 *
 * Canonical basis (ids BR ALREADY persists on `BrNegocioListing`):
 *   propertyType  resultsPropertyKind (`Leonix:results_property_kind`), else categoriaPropiedad
 *   operation     operationLabel ("Renta" → rent, anything else → sale — same rule as `listingOperation`)
 * Commercial / land sub-type codes are not catalogued (they stay searchable through metaLines text).
 * Literals / owner text are exactly the fields the old `q` blob searched. No translation call.
 */
import type { BrNegocioListing } from "@/app/(site)/clasificados/bienes-raices/resultados/cards/listingTypes";
import { createCatalogDiscoveryAdapter, filterRowsByCatalogDiscoveryKeyword } from "../catalogDiscovery";
import type { CanonicalConceptRef } from "../canonicalTaxonomyAdapter";
import {
  REAL_ESTATE_CONCEPT_CATALOG,
  RE_KIND,
  RE_OP_RENT,
  RE_OP_SALE,
  realEstateConceptIdForCategoria,
  realEstateConceptIdForResultsKind,
} from "./realEstateDiscoveryCatalog";

/** Mirrors `effectiveBrResultsPropertyKind` (kept local: importing brResultsFilters would be circular). */
function brPropertyKind(l: BrNegocioListing): string {
  if (l.resultsPropertyKind) return l.resultsPropertyKind;
  if (l.categoriaPropiedad === "terreno_lote") return "terreno";
  if (l.categoriaPropiedad === "comercial") return "comercial";
  return "casa";
}

export const brDiscoveryAdapter = createCatalogDiscoveryAdapter<BrNegocioListing>({
  category: "bienes-raices",
  catalog: REAL_ESTATE_CONCEPT_CATALOG,
  rowConcepts(l) {
    const out: CanonicalConceptRef[] = [
      { kind: RE_KIND.operation, id: l.operationLabel === "Renta" ? RE_OP_RENT : RE_OP_SALE },
    ];
    const add = (id: string | null) => {
      if (id && !out.some((r) => r.kind === RE_KIND.propertyType && r.id === id)) {
        out.push({ kind: RE_KIND.propertyType, id });
      }
    };
    add(realEstateConceptIdForResultsKind(brPropertyKind(l)));
    add(realEstateConceptIdForCategoria(l.categoriaPropiedad));
    return out;
  },
  rowLiterals: (l) => [
    l.title,
    l.addressLine,
    l.beds,
    l.baths,
    l.sqft,
    l.operationLabel,
    l.advertiser?.name,
    l.advertiser?.subtitle,
    ...(l.metaLines ?? []),
  ],
  rowCustomText: (l) => [l.searchBlob],
});

/** Keyword (`q`) filter only — every other BR facet stays in `filterBrListings`. */
export function filterBrRowsByKeyword(rows: BrNegocioListing[], rawQ: string | undefined): BrNegocioListing[] {
  return filterRowsByCatalogDiscoveryKeyword(brDiscoveryAdapter, rows, rawQ);
}
