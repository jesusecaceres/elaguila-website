/**
 * Structural hooks for the next publish/payment phase — not live listing state.
 * Preview routes remain draft-only; results/detail URLs are separate surfaces.
 */

import { BR_PREVIEW_NEGOCIO, BR_PREVIEW_PRIVADO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { RENTAS_PREVIEW_NEGOCIO, RENTAS_PREVIEW_PRIVADO } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

/**
 * Draft preview URLs (session-backed). Do not use for SEO, sitemap, or “live” analytics.
 * Public listing/detail URLs are added when publish goes server-side.
 */
export const LEONIX_CLASIFICADOS_PREVIEW_ROUTES = {
  bienesRaicesNegocio: BR_PREVIEW_NEGOCIO,
  bienesRaicesPrivado: BR_PREVIEW_PRIVADO,
  rentasNegocio: RENTAS_PREVIEW_NEGOCIO,
  rentasPrivado: RENTAS_PREVIEW_PRIVADO,
} as const;

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
