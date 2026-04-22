/**
 * Filter / chip identifiers for BR Negocio results (client state).
 * Canonical `ciudad` values: `brCanonicalNorCalCity` + `BR_URL_QUERY_CIUDAD` in `shared/brNorCalCity`.
 */

export type BrPrimaryChipId =
  | "casas"
  | "departamentos"
  | "venta"
  | "renta"
  | "comerciales"
  | "terrenos";

/** Secondary row chips — only facets persisted at publish (`Leonix:*` / badges not used as filters). */
export type BrSecondaryChipId = "piscina" | "mascotas";
