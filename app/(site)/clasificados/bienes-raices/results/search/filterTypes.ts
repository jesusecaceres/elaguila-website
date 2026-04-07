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

export type BrSecondaryChipId =
  | "piscina"
  | "mascotas"
  | "nuevo_desarrollo"
  | "open_house"
  | "reducida"
  | "tour_virtual"
  | "planos"
  | "financiamiento"
  | "segundo_agente";
