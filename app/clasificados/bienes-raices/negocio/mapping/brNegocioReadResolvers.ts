/**
 * BR negocio: pure read-time resolvers for alias/fallback chains.
 * Mirrors existing behavior exactly — no canonical renaming here.
 */

import { buildNegocioRedesPayload } from "@/app/clasificados/bienes-raices/negocio/utils/brNegocioContactHelpers";

type Lang = "es" | "en";

/** Same as getDetailPairs BR negocio block for business name row. */
export function resolveBrNegocioBusinessNameForPairs(details: Record<string, string>): string {
  return (details.negocioNombre ?? "").trim() || (details.enVentaBusinessName ?? "").trim();
}

/** Same as buildBrNegocioListingData businessRail.name (no enVentaBusinessName fallback). */
export function resolveBrNegocioBusinessNameForRail(details: Record<string, string>, lang: Lang): string {
  return (details.negocioNombre ?? "").trim() || (lang === "es" ? "Negocio" : "Business");
}

/** Same as getDetailPairs BR negocio block for agent row. */
export function resolveBrNegocioAgentForPairs(details: Record<string, string>): string {
  return (details.negocioAgente ?? "").trim() || (details.enVentaAgentName ?? "").trim();
}

/** Same as buildBrNegocioListingData businessRail.agent (no enVentaAgentName fallback). */
export function resolveBrNegocioAgentForRail(details: Record<string, string>): string {
  return (details.negocioAgente ?? "").trim();
}

/** Same as formatBrNegocioAddressLine in publicar/[category]/page.tsx */
export function resolveBrNegocioAddressDisplayLine(details: Record<string, string>, cityDisplay: string): string {
  const num = (details.brNegocioStreetNumber ?? "").trim();
  const st = (details.brNegocioStreet ?? "").trim();
  const streetPart = [num, st].filter(Boolean).join(" ");
  const c = (cityDisplay ?? "").trim();
  const state = (details.brNegocioState ?? "").trim();
  const zip = (details.brNegocioZip ?? "").trim();
  const stateZip = [state, zip].filter(Boolean).join(" ");
  const parts: string[] = [];
  if (streetPart) parts.push(streetPart);
  if (c) parts.push(c);
  if (stateZip) parts.push(stateZip);
  if (parts.length) return parts.join(", ");
  return (details.enVentaAddress ?? "").trim() || (details.direccionPropiedad ?? "").trim();
}

/** Same as buildStructuredFactsFromDetails address line (street-only + legacy fallbacks). */
export function resolveBrNegocioAddressStructuredFactsLine(details: Record<string, string>): string {
  return (
    [details.brNegocioStreetNumber, details.brNegocioStreet].filter(Boolean).join(" ").trim() ||
    (details.enVentaAddress ?? "").trim() ||
    (details.direccionPropiedad ?? "").trim()
  );
}

/** Same as getDetailPairs BR block: enVentaVirtualTourUrl first, then negocioRecorridoVirtual. */
export function resolveBrNegocioVirtualTourForPairs(details: Record<string, string>): string {
  return (details.enVentaVirtualTourUrl ?? details.negocioRecorridoVirtual ?? "").trim();
}

/** Same as businessRail.virtualTourUrl: negocioRecorridoVirtual first, then enVentaVirtualTourUrl; empty → null */
export function resolveBrNegocioVirtualTourForRail(details: Record<string, string>): string | null {
  const v = (details.negocioRecorridoVirtual ?? details.enVentaVirtualTourUrl ?? "").trim();
  return v || null;
}

/** Same as mapper rawSocialsPreview: merged per-platform URLs, then legacy negocioRedes string. */
export function resolveBrNegocioSocialPayload(details: Record<string, string>): string {
  const mergedRedes = buildNegocioRedesPayload(details as Record<string, string | undefined>);
  return mergedRedes.trim() || (details.negocioRedes ?? "").trim();
}
