/**
 * Leonix Clasificados — Bienes Raíces filter / query contract (Phase 1 source of truth).
 *
 * Purpose:
 * - Single canonical vocabulary for URL params shared by landing handoff and resultados.
 * - Clear split: what the **landing** shows vs what **resultados** owns as full filter UI.
 * - Map every visible control to fields that can exist on a published listing (no decorative filters).
 *
 * Legacy aliases (`tipo`, `recs`, `precio`) remain supported in parsers for backward compatibility;
 * new links should prefer canonical keys below.
 */

import type { BrResultsQueryKey } from "./constants/brResultsRoutes";

// ─── Canonical URL keys (string values in query; empty = omit) ─────────────────

/** Core browse / filter keys implemented in `parseBrResultsUrl` + results UI. */
export const BR_CANONICAL_QUERY_KEYS: readonly BrCanonicalQueryKey[] = [
  "q",
  "city",
  "operationType",
  "propertyType",
  "sellerType",
  "priceMin",
  "priceMax",
  "beds",
  "baths",
  "pets",
  "furnished",
  "pool",
  "sort",
  "page",
];

export type BrCanonicalQueryKey = Extract<
  BrResultsQueryKey,
  | "q"
  | "city"
  | "operationType"
  | "propertyType"
  | "sellerType"
  | "priceMin"
  | "priceMax"
  | "beds"
  | "baths"
  | "pets"
  | "furnished"
  | "pool"
  | "sort"
  | "page"
>;

/** Reserved in `BrResultsQueryKey` for future publish-backed fields — do not add resultados UI until data exists. */
export const BR_RESERVED_QUERY_KEYS: readonly BrResultsQueryKey[] = ["zip", "parking"];

/** Demo / structural keys (not listing facets): category band, chip strings, legacy bands. */
export const BR_AUX_QUERY_KEYS = ["primary", "secondary", "propiedad", "precio", "tipo", "recs"] as const;

// ─── Landing vs resultados responsibility ─────────────────────────────────────

/**
 * **Landing** (`/clasificados/bienes-raices`): dominant controls only.
 * - Main search: `q`, `operationType`, `propertyType`, `city` + submit → resultados.
 * - Quick chips: shortcuts into resultados using the same canonical keys (no duplicate filter panel on landing).
 */
export const BR_LANDING_DOMINANT_KEYS = ["q", "operationType", "propertyType", "city"] as const;

/**
 * **Resultados** (`/clasificados/bienes-raices/resultados`): full narrowing UX.
 * - All canonical keys + aux keys as needed for demo grids.
 * - Desktop: filter panel; mobile: filter drawer + active summary (see mobile strategy).
 */
export const BR_RESULTS_FULL_FILTER_KEYS = [...BR_CANONICAL_QUERY_KEYS, ...BR_AUX_QUERY_KEYS] as const;

/** Future-facing: publish row fields implied by each canonical key (for CMS/backend alignment). */
export const BR_KEY_PUBLISH_FIELD_HINTS: Record<BrCanonicalQueryKey, string> = {
  q: "searchable title/address/keywords",
  city: "location.city or normalized city string",
  operationType: "listing.operation (venta | renta)",
  propertyType: "property.kind / categoria (casa, departamento, terreno, comercial, …)",
  sellerType: "seller.kind (privado | negocio)",
  priceMin: "price.amount lower bound (listing currency)",
  priceMax: "price.amount upper bound",
  beds: "attributes.bedrooms (min)",
  baths: "attributes.bathrooms (min)",
  pets: "attributes.petsAllowed (boolean)",
  furnished: "attributes.furnished (boolean)",
  pool: "attributes.pool (boolean)",
  sort: "server sort key",
  page: "pagination page",
};

// ─── Legacy aliases (parsers normalize; prefer canonical on new links) ─────────

export const BR_LEGACY_QUERY_ALIASES: Record<string, string> = {
  /** Old handoff / SEO — map to `propertyType` where applicable */
  tipo: "propertyType",
  /** Bedrooms hint — normalized to `beds` in `parseBrResultsUrl` */
  recs: "beds",
  /** Demo price band — mapped to numeric `priceMin`/`priceMax` when bounds absent */
  precio: "precio",
};

// ─── Landing quick chips (ids + canonical param payloads) ─────────────────────

/** Must match `BrLandingChipId` + `getBrLandingCopy().chipLabel` in landing copy. */
export const BR_LANDING_QUICK_CHIP_CONTRACT: ReadonlyArray<{
  id:
    | "sale"
    | "rent"
    | "house"
    | "apartment"
    | "land"
    | "private"
    | "business"
    | "pool"
    | "pets"
    | "furnished";
  /** Params merged into `buildBrResultsUrl` / handoff — keys must be canonical or legacy-supported. */
  params: Record<string, string>;
  note: string;
}> = [
  { id: "sale", params: { operationType: "venta" }, note: "Transaction filter" },
  { id: "rent", params: { operationType: "renta" }, note: "Transaction filter" },
  {
    id: "house",
    params: { propertyType: "casa" },
    note: "Structural type only; combine with Venta/Renta via search or extra navigation",
  },
  { id: "apartment", params: { propertyType: "departamento" }, note: "Structural type" },
  { id: "land", params: { propertyType: "terreno" }, note: "Structural type (terreno_lote in data)" },
  { id: "private", params: { sellerType: "privado" }, note: "Seller channel" },
  { id: "business", params: { sellerType: "negocio" }, note: "Seller channel" },
  { id: "pool", params: { pool: "true" }, note: "Boolean amenity on published listing" },
  { id: "pets", params: { pets: "true" }, note: "Boolean rule on published listing" },
  { id: "furnished", params: { furnished: "true" }, note: "Boolean attribute on published listing" },
];

// ─── Mobile filter strategy (resultados) ───────────────────────────────────────

/**
 * **Mobile:** Primary discovery stays readable; deep filters live in a dedicated drawer (`lg:hidden` trigger),
 * with URL as source of truth. Active filter chips + clear-all remain visible above the list.
 * **Desktop / tablet:** Inline filter panel (`hidden lg:block`) + same URL contract.
 */
export const BR_MOBILE_FILTER_STRATEGY_SUMMARY =
  "Resultados: URL-driven state; <lg uses filter drawer; ≥lg inline panel; no separate filter model.";

/** Publish / API backing for each visible filter — single source for launch audits (Phase 2+). */
export const BR_FILTER_PUBLISH_READINESS: Record<
  | "q"
  | "city"
  | "zip"
  | "operationType"
  | "propertyType"
  | "sellerType"
  | "priceMin"
  | "priceMax"
  | "beds"
  | "baths"
  | "pets"
  | "furnished"
  | "pool"
  | "sort"
  | "page"
  | "parking",
  "ready" | "reserved" | "deferred_demo"
> = {
  q: "ready",
  city: "ready",
  zip: "ready",
  operationType: "ready",
  propertyType: "ready",
  sellerType: "ready",
  priceMin: "ready",
  priceMax: "ready",
  beds: "ready",
  baths: "ready",
  pets: "ready",
  furnished: "ready",
  pool: "ready",
  sort: "ready",
  page: "ready",
  parking: "reserved",
};

/** Live rows: facet extraction for filters lives in `resultados/lib/brFacetFromDetailPairs.ts` + `mapBrListingRowToCard.ts`. */
