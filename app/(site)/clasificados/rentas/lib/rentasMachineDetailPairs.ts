/**
 * Canonical machine keys in `listings.detail_pairs` for Rentas discovery + admin tooling.
 * Human-readable rows still come from preview VM builders; these pairs are stable for parsers/filters.
 */

import type { RentasNegocioFormState } from "@/app/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import type { RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import {
  buildRentasGoogleMapsSearchQuery,
  formatRentasDisponibilidadDisplay,
  formatRentasServiciosIncluidosOutput,
  rentasGoogleMapsUrlFromQuery,
} from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";

function digitsOnly15(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "").slice(0, 15);
}

export const RENTAS_DP_DEPOSIT_USD = "Leonix:rent:deposit_usd";
export const RENTAS_DP_LEASE_TERM = "Leonix:rent:lease_term_code";
export const RENTAS_DP_LEASE_TERM_CUSTOM = "Leonix:rent:lease_term_custom";
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
export const RENTAS_DP_RENTAL_TYPE_CODE = "Leonix:rent:rental_type_code";
export const RENTAS_DP_RENTAL_TYPE_CUSTOM = "Leonix:rent:rental_type_custom";
export const RENTAS_DP_LEASE_CONDITIONS = "Leonix:rent:lease_conditions";
export const RENTAS_DP_ROOM_BATH_KIND = "Leonix:rent:room:bath_kind";
export const RENTAS_DP_ROOM_KITCHEN_KIND = "Leonix:rent:room:kitchen_kind";
export const RENTAS_DP_ROOM_MAX_OCC = "Leonix:rent:room:max_occupants";
export const RENTAS_DP_STORAGE_ACCESS_24H = "Leonix:rent:storage:access_24h";
export const RENTAS_DP_STORAGE_SECURITY = "Leonix:rent:storage:security";
/** Dígitos US (10) para SMS; distinto de `contact_phone` cuando el usuario separa SMS. */
export const RENTAS_DP_CONTACT_SMS_DIGITS = "Leonix:rent:contact_sms_digits";
/** Dígitos para `https://wa.me/...` cuando el anunciante publicó WhatsApp. */
export const RENTAS_DP_CONTACT_WHATSAPP_DIGITS = "Leonix:rent:contact_whatsapp_digits";

type RentasPersistCommon = Pick<
  RentasPrivadoFormState,
  | "deposito"
  | "plazoContrato"
  | "plazoContratoOtro"
  | "disponibilidad"
  | "amueblado"
  | "mascotas"
  | "serviciosIncluidosKeys"
  | "serviciosIncluidosOtro"
  | "serviciosIncluidosLegacy"
  | "requisitos"
  | "tipoDeRenta"
  | "tipoDeRentaOtro"
  | "condicionesAlquiler"
  | "rentasEspacioTipoBano"
  | "rentasEspacioTipoCocina"
  | "rentasEspacioMaxOcupantes"
  | "rentasAlmacenAcceso24h"
  | "rentasAlmacenSeguridad"
>;

type RentasMapQueryState = Pick<
  RentasPrivadoFormState,
  | "direccionLinea1"
  | "direccionNumero"
  | "direccionCalle"
  | "ubicacionLinea"
  | "zonaVecindario"
  | "ciudad"
  | "direccionEstado"
  | "direccionCodigoPostal"
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
  state: RentasPersistCommon & RentasMapQueryState,
  base: Array<{ label: string; value: string }>,
): Array<{ label: string; value: string }> {
  const out = [...base];
  const dep = digitsUsd(state.deposito);
  if (dep) push(out, RENTAS_DP_DEPOSIT_USD, dep);
  if (state.plazoContrato === "otro") {
    push(out, RENTAS_DP_LEASE_TERM, "otro");
    push(out, RENTAS_DP_LEASE_TERM_CUSTOM, state.plazoContratoOtro);
  } else if (state.plazoContrato) {
    push(out, RENTAS_DP_LEASE_TERM, state.plazoContrato);
  }
  push(out, RENTAS_DP_AVAILABILITY, formatRentasDisponibilidadDisplay(state.disponibilidad));
  if (state.amueblado) push(out, RENTAS_DP_FURNISHED_CODE, state.amueblado);
  if (state.mascotas) push(out, RENTAS_DP_PETS_CODE, state.mascotas);
  push(out, RENTAS_DP_SERVICES_INCLUDED, formatRentasServiciosIncluidosOutput(state));
  push(out, RENTAS_DP_REQUIREMENTS, state.requisitos);
  if (state.tipoDeRenta) push(out, RENTAS_DP_RENTAL_TYPE_CODE, state.tipoDeRenta);
  if (state.tipoDeRenta === "otro") push(out, RENTAS_DP_RENTAL_TYPE_CUSTOM, state.tipoDeRentaOtro);
  push(out, RENTAS_DP_LEASE_CONDITIONS, state.condicionesAlquiler);
  if (state.rentasEspacioTipoBano) push(out, RENTAS_DP_ROOM_BATH_KIND, state.rentasEspacioTipoBano);
  if (state.rentasEspacioTipoCocina) push(out, RENTAS_DP_ROOM_KITCHEN_KIND, state.rentasEspacioTipoCocina);
  const occ = String(state.rentasEspacioMaxOcupantes ?? "").replace(/\D/g, "");
  if (occ) push(out, RENTAS_DP_ROOM_MAX_OCC, occ);
  if (state.rentasAlmacenAcceso24h === "si" || state.rentasAlmacenAcceso24h === "no") {
    push(out, RENTAS_DP_STORAGE_ACCESS_24H, state.rentasAlmacenAcceso24h);
  }
  if (state.rentasAlmacenSeguridad === "si" || state.rentasAlmacenSeguridad === "no") {
    push(out, RENTAS_DP_STORAGE_SECURITY, state.rentasAlmacenSeguridad);
  }
  return out;
}

export function mergeRentasPrivadoMachinePairs(
  state: RentasPrivadoFormState,
  base: Array<{ label: string; value: string }>,
): Array<{ label: string; value: string }> {
  const out = mergeRentasCommonMachinePairs(state, base);
  if (state.estadoAnuncio) push(out, RENTAS_DP_LISTING_STATUS, state.estadoAnuncio);
  const mapAuto = rentasGoogleMapsUrlFromQuery(buildRentasGoogleMapsSearchQuery(state));
  if (mapAuto) push(out, RENTAS_DP_MAP_URL, mapAuto);
  const vid = String(state.media.videoUrl ?? "").trim();
  if (vid && /^https?:\/\//i.test(vid)) push(out, RENTAS_DP_VIDEO_URL, vid);
  const half = parseInt(String(state.residencial.mediosBanos ?? "").replace(/\D/g, ""), 10);
  if (Number.isFinite(half) && half > 0) push(out, RENTAS_DP_HALF_BATHS_COUNT, String(half));
  const sms = digitsOnly15(state.seller.mensajesTexto ?? "");
  if (sms.length >= 10) push(out, RENTAS_DP_CONTACT_SMS_DIGITS, sms);
  return out;
}

export function mergeRentasNegocioMachinePairs(
  state: RentasNegocioFormState,
  base: Array<{ label: string; value: string }>,
): Array<{ label: string; value: string }> {
  const out = mergeRentasCommonMachinePairs(state, base);
  if (state.estadoAnuncio) push(out, RENTAS_DP_LISTING_STATUS, state.estadoAnuncio);
  const mapAuto = rentasGoogleMapsUrlFromQuery(buildRentasGoogleMapsSearchQuery(state));
  if (mapAuto) push(out, RENTAS_DP_MAP_URL, mapAuto);
  const vid = String(state.media.videoUrl ?? "").trim();
  if (vid && /^https?:\/\//i.test(vid)) push(out, RENTAS_DP_VIDEO_URL, vid);
  const half = parseInt(String(state.residencial.mediosBanos ?? "").replace(/\D/g, ""), 10);
  if (Number.isFinite(half) && half > 0) push(out, RENTAS_DP_HALF_BATHS_COUNT, String(half));
  push(out, RENTAS_DP_BUSINESS_LICENSE, state.negocioLicencia);
  push(out, RENTAS_DP_BUSINESS_WEBSITE, state.negocioSitioWeb);
  push(out, RENTAS_DP_BUSINESS_SOCIAL, state.negocioRedes);
  const smsN = digitsOnly15(state.negocioMensajesTexto ?? "");
  if (smsN.length >= 10) push(out, RENTAS_DP_CONTACT_SMS_DIGITS, smsN);
  const waN = digitsOnly15(state.negocioWhatsapp ?? "");
  if (waN.length >= 10) push(out, RENTAS_DP_CONTACT_WHATSAPP_DIGITS, waN);
  return out;
}
