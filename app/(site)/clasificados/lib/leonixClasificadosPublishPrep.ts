/**
 * Structural hooks for the next publish/payment phase — not live listing state.
 * Preview routes remain draft-only; results/detail URLs are separate surfaces.
 */

export type LeonixClasificadosBrRentasBranch =
  | "bienes_raices_negocio"
  | "bienes_raices_privado"
  | "rentas_negocio"
  | "rentas_privado";

/** Intended lifecycle for a listing record once server publish exists (tomorrow’s tie-off). */
export type LeonixListingLifecycleState =
  | "draft"
  | "ready_for_publish"
  | "published"
  | "unpublished"
  | "removed";

/** Filter-facing dimensions derived from applications (results system consumes later). */
export type LeonixPropertyFilterDimensions = {
  saleVsRent: "sale" | "rent";
  /** NorCal-oriented free text today; structured IDs later */
  locationText: string;
  /** Whole USD for sale; monthly USD for rent */
  priceOrRentUsd: number | null;
  categoriaPropiedad: "residencial" | "comercial" | "terreno_lote";
  recamaras?: number | null;
  banos?: number | null;
  lotSqft?: number | null;
  interiorSqft?: number | null;
  commercialUsoHint?: string | null;
};
