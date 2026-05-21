/**
 * Rentas Gate 12E — showings / tours (machine pairs + preview/live cards).
 */

import { readLeonixDetailPairValue } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { normalizeLeonixHttpsUrl } from "@/app/clasificados/lib/leonixContactSocialNormalize";
import type { BienesRaicesPreviewFact } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";

export const RENTAS_DP_SHOW_EXACT_ADDRESS = "Leonix:rent:show_exact_address";
export const RENTAS_DP_SHOWING_BY_APPOINTMENT = "Leonix:rent:showing_by_appointment";
export const RENTAS_DP_SHOWING_AVAILABILITY = "Leonix:rent:showing_availability";
export const RENTAS_DP_SHOWING_INSTRUCTIONS = "Leonix:rent:showing_instructions";
export const RENTAS_DP_VIRTUAL_TOUR_URL = "Leonix:rent:virtual_tour_url";

export type RentasShowingFormSlice = {
  showingByAppointment: boolean;
  showingAvailability: string;
  showingInstructions: string;
  virtualTourUrl: string;
};

export type RentasShowingMachineRead = {
  showingByAppointment: boolean;
  showingAvailability: string | null;
  showingInstructions: string | null;
  virtualTourUrl: string | null;
};

function trim(s: unknown): string {
  return typeof s === "string" ? s.trim() : "";
}

function row(label: string, value: string): BienesRaicesPreviewFact | null {
  const v = trim(value);
  if (!v) return null;
  return { label, value: v };
}

export function emptyRentasShowingSlice(): RentasShowingFormSlice {
  return {
    showingByAppointment: false,
    showingAvailability: "",
    showingInstructions: "",
    virtualTourUrl: "",
  };
}

export function rentasShowExactAddressFromDetailPairs(detailPairs: unknown): boolean {
  const v = (readLeonixDetailPairValue(detailPairs, RENTAS_DP_SHOW_EXACT_ADDRESS) ?? "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "si" || v === "sí";
}

export function parseRentasShowingFromDetailPairs(detailPairs: unknown): RentasShowingMachineRead {
  const apptRaw = (readLeonixDetailPairValue(detailPairs, RENTAS_DP_SHOWING_BY_APPOINTMENT) ?? "").trim().toLowerCase();
  const appt = apptRaw === "true" || apptRaw === "1" || apptRaw === "yes" || apptRaw === "si" || apptRaw === "sí";
  const availability = readLeonixDetailPairValue(detailPairs, RENTAS_DP_SHOWING_AVAILABILITY);
  const instructions = readLeonixDetailPairValue(detailPairs, RENTAS_DP_SHOWING_INSTRUCTIONS);
  const tour = normalizeLeonixHttpsUrl(readLeonixDetailPairValue(detailPairs, RENTAS_DP_VIRTUAL_TOUR_URL));
  return {
    showingByAppointment: appt,
    showingAvailability: availability,
    showingInstructions: instructions,
    virtualTourUrl: tour,
  };
}

export function rentasShowingSectionHasContent(slice: RentasShowingFormSlice | RentasShowingMachineRead): boolean {
  if (slice.showingByAppointment) return true;
  if (trim(slice.showingAvailability)) return true;
  if (trim(slice.showingInstructions)) return true;
  const vt = "virtualTourUrl" in slice ? normalizeLeonixHttpsUrl(slice.virtualTourUrl) : null;
  return Boolean(vt);
}

export function mergeRentasShowingMachinePairs(
  slice: RentasShowingFormSlice & { mostrarDireccionExacta?: boolean },
  base: Array<{ label: string; value: string }>,
): Array<{ label: string; value: string }> {
  const out = [...base];
  const push = (label: string, value: string) => {
    const v = value.trim();
    if (!label.trim() || !v) return;
    out.push({ label, value: v });
  };
  push(RENTAS_DP_SHOW_EXACT_ADDRESS, slice.mostrarDireccionExacta === true ? "true" : "false");
  if (slice.showingByAppointment) push(RENTAS_DP_SHOWING_BY_APPOINTMENT, "true");
  push(RENTAS_DP_SHOWING_AVAILABILITY, slice.showingAvailability);
  push(RENTAS_DP_SHOWING_INSTRUCTIONS, slice.showingInstructions);
  const tour = normalizeLeonixHttpsUrl(slice.virtualTourUrl);
  if (tour) push(RENTAS_DP_VIRTUAL_TOUR_URL, tour);
  return out;
}

export function buildRentasShowingPreviewCard(
  slice: RentasShowingFormSlice | RentasShowingMachineRead,
  lang: "es" | "en",
): { title: string; rows: BienesRaicesPreviewFact[]; virtualTourUrl: string | null } | null {
  if (!rentasShowingSectionHasContent(slice)) return null;
  const L = (es: string, en: string) => (lang === "es" ? es : en);
  const rows: BienesRaicesPreviewFact[] = [];
  const pushRow = (label: string, value: string) => {
    const r = row(label, value);
    if (r) rows.push(r);
  };
  if (slice.showingByAppointment) {
    pushRow(L("Visitas con cita", "Showings by appointment"), L("Sí", "Yes"));
  }
  if (trim(slice.showingAvailability)) {
    pushRow(L("Disponibilidad para visitas", "Showing availability"), trim(slice.showingAvailability));
  }
  if (trim(slice.showingInstructions)) {
    pushRow(L("Instrucciones para visitas", "Showing instructions"), trim(slice.showingInstructions));
  }
  const vt = normalizeLeonixHttpsUrl("virtualTourUrl" in slice ? slice.virtualTourUrl : null);
  if (!rows.length && !vt) return null;
  return {
    title: L("Visitas y recorridos", "Showings and tours"),
    rows,
    virtualTourUrl: vt,
  };
}

export function buildRentasLiveShowingCard(
  detailPairs: unknown,
  lang: "es" | "en",
): { title: string; rows: BienesRaicesPreviewFact[]; virtualTourUrl: string | null } | null {
  return buildRentasShowingPreviewCard(parseRentasShowingFromDetailPairs(detailPairs), lang);
}
