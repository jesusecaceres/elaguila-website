/**
 * Canonical machine keys in `listings.detail_pairs` for Rentas discovery + admin tooling.
 * Human-readable rows still come from preview VM builders; these pairs are stable for parsers/filters.
 */

import type { RentasNegocioFormState } from "@/app/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import type { RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";

export const RENTAS_DP_DEPOSIT_USD = "Leonix:rent:deposit_usd";
export const RENTAS_DP_LEASE_TERM = "Leonix:rent:lease_term_code";
export const RENTAS_DP_AVAILABILITY = "Leonix:rent:availability_note";
export const RENTAS_DP_SERVICES_INCLUDED = "Leonix:rent:services_included";
export const RENTAS_DP_REQUIREMENTS = "Leonix:rent:requirements";
export const RENTAS_DP_FURNISHED_CODE = "Leonix:rent:furnished_code";
export const RENTAS_DP_PETS_CODE = "Leonix:rent:pets_code";
export const RENTAS_DP_BUSINESS_LICENSE = "Leonix:rent:business:license";
export const RENTAS_DP_BUSINESS_WEBSITE = "Leonix:rent:business:website";
export const RENTAS_DP_BUSINESS_SOCIAL = "Leonix:rent:business:social";
/** `disponible` | `pendiente` | `bajo_contrato` | `rentado` — Rentas availability lifecycle (not DB moderation status). */
export const RENTAS_DP_LISTING_STATUS = "Leonix:rent:listing_status";
export const RENTAS_DP_MAP_URL = "Leonix:rent:map_url";
/** External video URL only (never data: URLs). */
export const RENTAS_DP_VIDEO_URL = "Leonix:rent:video_url";
export const RENTAS_DP_HALF_BATHS_COUNT = "Leonix:rent:half_baths_count";

type RentasPersistCommon = Pick<
  RentasPrivadoFormState,
  "deposito" | "plazoContrato" | "disponibilidad" | "amueblado" | "mascotas" | "serviciosIncluidos" | "requisitos"
>;

function push(out: Array<{ label: string; value: string }>, label: string, value: string) {
  const v = value.trim();
  if (!label.trim() || !v) return;
  out.push({ label, value: v });
}

function digitsUsd(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

function mergeRentasCommonMachinePairs(
  state: RentasPersistCommon,
  base: Array<{ label: string; value: string }>,
): Array<{ label: string; value: string }> {
  const out = [...base];
  const dep = digitsUsd(state.deposito);
  if (dep) push(out, RENTAS_DP_DEPOSIT_USD, dep);
  if (state.plazoContrato) push(out, RENTAS_DP_LEASE_TERM, state.plazoContrato);
  push(out, RENTAS_DP_AVAILABILITY, state.disponibilidad);
  if (state.amueblado) push(out, RENTAS_DP_FURNISHED_CODE, state.amueblado);
  if (state.mascotas) push(out, RENTAS_DP_PETS_CODE, state.mascotas);
  push(out, RENTAS_DP_SERVICES_INCLUDED, state.serviciosIncluidos);
  push(out, RENTAS_DP_REQUIREMENTS, state.requisitos);
  return out;
}

export function mergeRentasPrivadoMachinePairs(
  state: RentasPrivadoFormState,
  base: Array<{ label: string; value: string }>,
): Array<{ label: string; value: string }> {
  const out = mergeRentasCommonMachinePairs(state, base);
  if (state.estadoAnuncio) push(out, RENTAS_DP_LISTING_STATUS, state.estadoAnuncio);
  push(out, RENTAS_DP_MAP_URL, state.enlaceMapa);
  const vid = String(state.media.videoUrl ?? "").trim();
  if (vid && /^https?:\/\//i.test(vid)) push(out, RENTAS_DP_VIDEO_URL, vid);
  const half = parseInt(String(state.residencial.mediosBanos ?? "").replace(/\D/g, ""), 10);
  if (Number.isFinite(half) && half > 0) push(out, RENTAS_DP_HALF_BATHS_COUNT, String(half));
  return out;
}

export function mergeRentasNegocioMachinePairs(
  state: RentasNegocioFormState,
  base: Array<{ label: string; value: string }>,
): Array<{ label: string; value: string }> {
  const out = mergeRentasCommonMachinePairs(state, base);
  if (state.estadoAnuncio) push(out, RENTAS_DP_LISTING_STATUS, state.estadoAnuncio);
  push(out, RENTAS_DP_MAP_URL, state.enlaceMapa);
  const vid = String(state.media.videoUrl ?? "").trim();
  if (vid && /^https?:\/\//i.test(vid)) push(out, RENTAS_DP_VIDEO_URL, vid);
  const half = parseInt(String(state.residencial.mediosBanos ?? "").replace(/\D/g, ""), 10);
  if (Number.isFinite(half) && half > 0) push(out, RENTAS_DP_HALF_BATHS_COUNT, String(half));
  push(out, RENTAS_DP_BUSINESS_LICENSE, state.negocioLicencia);
  push(out, RENTAS_DP_BUSINESS_WEBSITE, state.negocioSitioWeb);
  push(out, RENTAS_DP_BUSINESS_SOCIAL, state.negocioRedes);
  return out;
}
