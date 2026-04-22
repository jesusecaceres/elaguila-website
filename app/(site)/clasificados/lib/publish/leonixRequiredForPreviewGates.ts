/**
 * Required-for-preview gates: minimum fields so BR/Rentas shells render without looking broken.
 * Does not imply publish/payment readiness.
 */

import type { BienesRaicesNegocioFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";
import type { BienesRaicesPrivadoFormState } from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import type { RentasNegocioFormState } from "@/app/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import type { RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";

export type LeonixPreviewGateResult = { ok: true } | { ok: false; message: string };

function trim(s: string): string {
  return String(s ?? "").trim();
}

/** BR Privado — título, precio, ubicación, foto hero, identidad + contacto mínimo. */
export function gateBienesRaicesPrivadoPreview(state: BienesRaicesPrivadoFormState): LeonixPreviewGateResult {
  if (!trim(state.titulo)) return { ok: false, message: "Agrega un título del anuncio." };
  if (!trim(state.precio)) return { ok: false, message: "Indica el precio (USD)." };
  if (!trim(state.ciudad) && !trim(state.ubicacionLinea)) {
    return { ok: false, message: "Indica ciudad o una línea de ubicación." };
  }
  if (!state.media.photoDataUrls.length) return { ok: false, message: "Sube al menos una foto (portada)." };
  if (!trim(state.seller.nombre)) return { ok: false, message: "Indica tu nombre o cómo aparecerás como particular." };
  const hasContact =
    trim(state.seller.telefono) || trim(state.seller.whatsapp) || trim(state.seller.correo);
  if (!hasContact) return { ok: false, message: "Agrega al menos un medio de contacto (teléfono, WhatsApp o correo)." };
  if (state.petsAllowed !== "yes" && state.petsAllowed !== "no") {
    return { ok: false, message: "Indica si se permiten mascotas (sí / no) en la propiedad." };
  }
  return { ok: true };
}

/** Rentas Privado — mismo criterio que BR Privado (shell compartido). */
export function gateRentasPrivadoPreview(state: RentasPrivadoFormState): LeonixPreviewGateResult {
  if (!trim(state.titulo)) return { ok: false, message: "Agrega un título del anuncio." };
  if (!trim(state.rentaMensual)) return { ok: false, message: "Indica la renta mensual." };
  if (!trim(state.ciudad) && !trim(state.ubicacionLinea)) {
    return { ok: false, message: "Indica ciudad o una línea de ubicación." };
  }
  if (!state.media.photoDataUrls.length) return { ok: false, message: "Sube al menos una foto (portada)." };
  if (!trim(state.seller.nombre)) return { ok: false, message: "Indica tu nombre o cómo aparecerás como particular." };
  const hasContact =
    trim(state.seller.telefono) || trim(state.seller.whatsapp) || trim(state.seller.correo);
  if (!hasContact) return { ok: false, message: "Agrega al menos un medio de contacto (teléfono, WhatsApp o correo)." };
  return { ok: true };
}

/** Rentas Negocio (mapea a shell Negocio) — identidad mínima + renta + ubicación + foto. */
export function gateRentasNegocioPreview(state: RentasNegocioFormState): LeonixPreviewGateResult {
  if (!trim(state.titulo)) return { ok: false, message: "Agrega un título del anuncio." };
  if (!trim(state.rentaMensual)) return { ok: false, message: "Indica la renta mensual." };
  if (!trim(state.ciudad) && !trim(state.ubicacionLinea)) {
    return { ok: false, message: "Indica ciudad o dirección de referencia." };
  }
  if (!state.media.photoDataUrls.length) return { ok: false, message: "Sube al menos una foto del inmueble." };
  if (!trim(state.negocioNombre)) return { ok: false, message: "Indica el nombre del negocio o equipo que aparecerá en el anuncio." };
  return { ok: true };
}

/** BR Negocio — datos principales + al menos una foto; tipo anunciante y publicación definidos. */
export function gateBienesRaicesNegocioPreview(state: BienesRaicesNegocioFormState): LeonixPreviewGateResult {
  if (!trim(state.advertiserType)) return { ok: false, message: "Elige el tipo de anunciante." };
  if (!trim(state.publicationType)) return { ok: false, message: "Elige el tipo de publicación." };
  if (!trim(state.titulo)) return { ok: false, message: "Agrega un título del anuncio." };
  if (!trim(state.precio)) return { ok: false, message: "Indica el precio." };
  if (!trim(state.ciudad) && !trim(state.direccion)) {
    return { ok: false, message: "Indica ciudad o dirección de referencia." };
  }
  const photos = (state.media?.photoUrls ?? []).map((u) => trim(u)).filter(Boolean);
  if (photos.length === 0) return { ok: false, message: "Sube al menos una foto (portada)." };
  if (state.petsAllowed !== "yes" && state.petsAllowed !== "no") {
    return { ok: false, message: "Indica si se permiten mascotas (sí / no) en la propiedad." };
  }
  return { ok: true };
}
