/**
 * Gate 12D — BR structured address, HOA/community, open house / showing (detail_pairs JSON v1).
 * City stays on `listings.city`; this payload is optional and backward-compatible.
 */

import type { BienesRaicesNegocioFormState } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState";
import type {
  BienesRaicesPrivadoFormState,
  BrPrivadoHoaFrequency,
  BrPrivadoTriBool,
} from "@/app/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState";
import {
  brGate12dHoaFormSliceHasContent,
  type BrGate12dHoaFormSlice,
} from "@/app/clasificados/lib/leonixBrGate12dHoaPreview";
import { googleMapsSearchUrl } from "@/app/(site)/publicar/community/shared/lib/communityContactCtas";
import { normalizeLeonixHttpsUrl } from "@/app/clasificados/lib/leonixContactSocialNormalize";
import {
  brShowExactAddressFromDetailPairs,
  parseLeonixListingContract,
  parseLeonixMachineFacetRead,
  readLeonixDetailPairValue,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { RENTAS_DP_MAP_URL } from "@/app/clasificados/rentas/lib/rentasMachineDetailPairs";
import { privacySafeLocation } from "@/app/clasificados/rentas/preview/shared/rentasPreviewResultCardListing";

export const LEONIX_DP_BR_GATE12D_V1 = "Leonix:br_gate12d_v1" as const;

export type BrGate12dTriBool = "yes" | "no" | "unknown";
export type BrGate12dHoaFrequency = "monthly" | "quarterly" | "yearly" | "unknown";

export type BrGate12dV1Payload = {
  v: 1;
  streetAddress?: string;
  unit?: string;
  state?: string;
  zip?: string;
  neighborhood?: string;
  hasHoa?: BrGate12dTriBool;
  hoaFee?: string;
  hoaFrequency?: BrGate12dHoaFrequency;
  hoaIncludes?: string;
  communityRules?: string;
  petRules?: string;
  rentalRestrictions?: string;
  shortTermRentalAllowed?: BrGate12dTriBool;
  parkingRules?: string;
  openHouseEnabled?: boolean;
  openHouseDate?: string;
  openHouseStartTime?: string;
  openHouseEndTime?: string;
  showingByAppointment?: boolean;
  showingInstructions?: string;
  virtualTourUrl?: string;
};

const DANGEROUS_SCHEME = /^(javascript|data|blob|file):/i;

export function isUnsafeUrlScheme(raw: string): boolean {
  const t = String(raw ?? "").trim();
  if (!t) return true;
  if (DANGEROUS_SCHEME.test(t)) return true;
  try {
    const u = new URL(t);
    return DANGEROUS_SCHEME.test(u.protocol);
  } catch {
    return false;
  }
}

/** Prefer user map URL only when it is a safe https maps link. */
export function sanitizeBrUserMapUrl(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s || isUnsafeUrlScheme(s)) return null;
  if (!/^https:\/\//i.test(s)) return null;
  try {
    const u = new URL(s);
    const h = u.hostname.toLowerCase();
    if (h === "maps.google.com" || h === "www.google.com" || h === "google.com" || h.endsWith(".google.com")) {
      return u.toString();
    }
    if (h === "goo.gl" || h.endsWith(".app.goo.gl")) return u.toString();
    return null;
  } catch {
    return null;
  }
}

function trim(s: unknown): string {
  return String(s ?? "").trim();
}

function appendIfNotContained(line: string, part: string): string {
  const p = part.trim();
  if (!p) return line;
  const low = line.toLowerCase();
  if (low.includes(p.toLowerCase())) return line;
  return line ? `${line}, ${p}` : p;
}

/** Deduped comma-joined address query for Google Maps (exact mode). */
export function composeBrExactMapQuery(args: {
  streetAddress: string;
  unit: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
}): string {
  const street = [trim(args.streetAddress), trim(args.unit)].filter(Boolean).join(" ");
  let line = street;
  line = appendIfNotContained(line, trim(args.neighborhood));
  line = appendIfNotContained(line, trim(args.city));
  line = appendIfNotContained(line, trim(args.state));
  line = appendIfNotContained(line, trim(args.zip));
  return line.trim();
}

export function composeBrApproximateMapQuery(args: {
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
}): string {
  let line = "";
  line = appendIfNotContained(line, trim(args.neighborhood));
  line = appendIfNotContained(line, trim(args.city));
  line = appendIfNotContained(line, trim(args.state));
  line = appendIfNotContained(line, trim(args.zip));
  return line.trim();
}

export function parseBrGate12dV1(detailPairs: unknown): BrGate12dV1Payload | null {
  const raw = readLeonixDetailPairValue(detailPairs, LEONIX_DP_BR_GATE12D_V1);
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Partial<BrGate12dV1Payload>;
    if (!o || o.v !== 1) return null;
    return o as BrGate12dV1Payload;
  } catch {
    return null;
  }
}

function nonEmptyPayload(p: BrGate12dV1Payload): boolean {
  const keys = Object.keys(p).filter((k) => k !== "v");
  for (const k of keys) {
    const v = (p as Record<string, unknown>)[k];
    if (typeof v === "boolean") {
      if (v) return true;
      continue;
    }
    if (typeof v === "string" && v.trim()) return true;
  }
  return false;
}

export function serializeBrGate12dV1Payload(p: BrGate12dV1Payload): string | null {
  if (!nonEmptyPayload(p)) return null;
  return JSON.stringify(p);
}

export function buildBrGate12dV1FromPrivadoState(s: BienesRaicesPrivadoFormState): BrGate12dV1Payload {
  const g = s.gate12d;
  const p: BrGate12dV1Payload = { v: 1 };
  const pushS = (k: keyof BrGate12dV1Payload, v: string) => {
    const t = v.trim();
    if (t) (p as Record<string, unknown>)[k] = t;
  };
  pushS("streetAddress", g.calleNumero);
  pushS("unit", g.unidad);
  pushS("state", g.estado);
  const zDigits = g.codigoPostal.replace(/\D/g, "").slice(0, 12);
  if (zDigits.length >= 5) pushS("zip", zDigits);
  pushS("neighborhood", g.colonia);
  if (g.hasHoa === "yes" || g.hasHoa === "no" || g.hasHoa === "unknown") p.hasHoa = g.hasHoa;
  pushS("hoaFee", g.hoaFee);
  if (g.hoaFrequency === "monthly" || g.hoaFrequency === "quarterly" || g.hoaFrequency === "yearly" || g.hoaFrequency === "unknown") {
    p.hoaFrequency = g.hoaFrequency;
  }
  pushS("hoaIncludes", g.hoaIncludes);
  pushS("communityRules", g.communityRules);
  const prManual = trim(g.petRules);
  if (prManual) pushS("petRules", prManual);
  else if (s.petsAllowed === "yes") pushS("petRules", "Se permiten mascotas (según declaración del anunciante).");
  else if (s.petsAllowed === "no") pushS("petRules", "No se permiten mascotas (según declaración del anunciante).");
  pushS("rentalRestrictions", g.rentalRestrictions);
  if (g.shortTermRentalAllowed === "yes" || g.shortTermRentalAllowed === "no" || g.shortTermRentalAllowed === "unknown") {
    p.shortTermRentalAllowed = g.shortTermRentalAllowed;
  }
  pushS("parkingRules", g.parkingRules);
  if (g.openHouseEnabled) p.openHouseEnabled = true;
  pushS("openHouseDate", g.openHouseDate);
  pushS("openHouseStartTime", g.openHouseStartTime);
  pushS("openHouseEndTime", g.openHouseEndTime);
  if (g.showingByAppointment) p.showingByAppointment = true;
  pushS("showingInstructions", g.showingInstructions);
  const tour = normalizeLeonixHttpsUrl(g.virtualTourUrl);
  if (tour) p.virtualTourUrl = tour;
  return p;
}

function coerceHoaTri(raw: string): BrGate12dTriBool | undefined {
  const t = raw.trim().toLowerCase();
  if (t === "si" || t === "sí" || t === "yes" || t === "true") return "yes";
  if (t === "no" || t === "false") return "no";
  if (t) return "unknown";
  return undefined;
}

function coerceFreq(raw: string): BrGate12dHoaFrequency | undefined {
  const t = raw.trim().toLowerCase();
  if (/mensual|month/i.test(t)) return "monthly";
  if (/trimest|quarter/i.test(t)) return "quarterly";
  if (/anual|year/i.test(t)) return "yearly";
  if (t) return "unknown";
  return undefined;
}

function coercePrivadoTriToGate12d(v: BrPrivadoTriBool): BrGate12dTriBool | undefined {
  if (v === "yes" || v === "no" || v === "unknown") return v;
  return undefined;
}

function coercePrivadoFreqToGate12d(v: BrPrivadoHoaFrequency): BrGate12dHoaFrequency | undefined {
  if (v === "monthly" || v === "quarterly" || v === "yearly" || v === "unknown") return v;
  return undefined;
}

function applyGate12dHoaSliceToPayload(p: BrGate12dV1Payload, g: BrGate12dHoaFormSlice): void {
  const pushS = (k: keyof BrGate12dV1Payload, v: string) => {
    const t = v.trim();
    if (t) (p as Record<string, unknown>)[k] = t;
  };
  const ho = coercePrivadoTriToGate12d(g.hasHoa);
  if (ho) p.hasHoa = ho;
  pushS("hoaFee", g.hoaFee);
  const fq = coercePrivadoFreqToGate12d(g.hoaFrequency);
  if (fq) p.hoaFrequency = fq;
  pushS("hoaIncludes", g.hoaIncludes);
  pushS("communityRules", g.communityRules);
  pushS("petRules", g.petRules);
  pushS("rentalRestrictions", g.rentalRestrictions);
  const st = coercePrivadoTriToGate12d(g.shortTermRentalAllowed);
  if (st) p.shortTermRentalAllowed = st;
  pushS("parkingRules", g.parkingRules);
}

/** Prefer `gate12d` HOA fields; fill from legacy negocio rows when slice is empty. */
export function resolveNegocioGate12dHoaSlice(s: BienesRaicesNegocioFormState): BrGate12dHoaFormSlice {
  const g = s.gate12d;
  if (brGate12dHoaFormSliceHasContent(g)) {
    return {
      hasHoa: g.hasHoa,
      hoaFee: g.hoaFee,
      hoaFrequency: g.hoaFrequency,
      hoaIncludes: g.hoaIncludes,
      communityRules: g.communityRules,
      petRules: g.petRules,
      rentalRestrictions: g.rentalRestrictions,
      shortTermRentalAllowed: g.shortTermRentalAllowed,
      parkingRules: g.parkingRules,
    };
  }
  const ch = s.deepDetails?.comunidadHoa ?? {};
  const legacyRules = [ch.seguridad, ch.gated].map(trim).filter(Boolean).join("\n");
  const ho = coerceHoaTri(s.hoaSiNo);
  return {
    hasHoa: ho ?? "",
    hoaFee: trim(s.cuotaHoa),
    hoaFrequency: (coerceFreq(ch.frecuencia ?? "") ?? "") as BrPrivadoHoaFrequency,
    hoaIncludes: trim(ch.amenidades),
    communityRules: legacyRules,
    petRules: "",
    rentalRestrictions: trim(s.deepDetails?.observacionesAgente?.restricciones),
    shortTermRentalAllowed: "",
    parkingRules: "",
  };
}

export function buildBrGate12dV1FromNegocioState(s: BienesRaicesNegocioFormState): BrGate12dV1Payload {
  const p: BrGate12dV1Payload = { v: 1 };
  const pushS = (k: keyof BrGate12dV1Payload, v: string) => {
    const t = v.trim();
    if (t) (p as Record<string, unknown>)[k] = t;
  };
  pushS("streetAddress", s.direccion);
  pushS("state", s.estado);
  pushS("zip", s.codigoPostal.replace(/\D/g, "").slice(0, 12));
  pushS("neighborhood", s.colonia);
  applyGate12dHoaSliceToPayload(p, resolveNegocioGate12dHoaSlice(s));
  if (s.cta.openHouseActivo) {
    p.openHouseEnabled = true;
    pushS("openHouseDate", s.cta.openHouseFecha);
    pushS("openHouseStartTime", s.cta.openHouseInicio);
    pushS("openHouseEndTime", s.cta.openHouseFin);
  }
  const showingNotes = [trim(s.cta.openHouseNotas), trim(s.deepDetails?.observacionesAgente?.instruccionesShowing)]
    .filter(Boolean)
    .join("\n\n");
  pushS("showingInstructions", showingNotes);
  const tour = normalizeLeonixHttpsUrl(s.media?.virtualTourUrl);
  if (tour) p.virtualTourUrl = tour;
  return p;
}

export function isBrBienesRaicesSaleListing(detailPairs: unknown): boolean {
  const lx = parseLeonixListingContract(detailPairs);
  if (lx.operation !== "sale") return false;
  return lx.branch === "bienes_raices_privado" || lx.branch === "bienes_raices_negocio";
}

type LiveRow = { label: string; value: string };

function firstRow(rows: LiveRow[], re: RegExp): string {
  for (const r of rows) {
    if (re.test(r.label.trim())) return r.value.trim();
  }
  return "";
}

/**
 * BR live detail / cards: privacy-safe display line + Google Maps href.
 * When `Leonix:br_gate12d_v1` exists it drives map query composition; otherwise legacy human rows.
 */
export function buildBrPublicLocationForLiveDetail(opts: {
  detailPairs: unknown;
  humanRows: LiveRow[];
  listingCity: string;
}): { display: string; mapsHref: string | null } {
  const { detailPairs, humanRows, listingCity } = opts;
  const city = trim(listingCity);
  const g = parseBrGate12dV1(detailPairs);
  const showExact = brShowExactAddressFromDetailPairs(detailPairs);
  const mf = parseLeonixMachineFacetRead(detailPairs);
  const postal = String(mf.postalCode ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);
  const cityStateZip = [city, postal].filter(Boolean).join(postal && city ? " · " : "");

  const ubicacion = firstRow(humanRows, /^ubicaci[oó]n$/i) || firstRow(humanRows, /^ubicacion$/i);
  const direccion = firstRow(humanRows, /^direcci[oó]n$/i) || firstRow(humanRows, /^direccion$/i);
  const zona =
    firstRow(humanRows, /zona\s+o\s+vecindario/i) ||
    firstRow(humanRows, /^colonia$/i) ||
    firstRow(humanRows, /^zona$/i) ||
    firstRow(humanRows, /vecindario/i);

  const mapPair = (readLeonixDetailPairValue(detailPairs, RENTAS_DP_MAP_URL) ?? "").trim();
  const safeUserMap = sanitizeBrUserMapUrl(mapPair);

  let mapsQuery = "";
  if (g) {
    const zip = trim(g.zip) || postal;
    const nb = trim(g.neighborhood) || zona;
    const st = trim(g.state);
    if (showExact) {
      mapsQuery = composeBrExactMapQuery({
        streetAddress: trim(g.streetAddress ?? ""),
        unit: trim(g.unit ?? ""),
        neighborhood: nb,
        city,
        state: st,
        zip,
      });
    } else {
      mapsQuery = composeBrApproximateMapQuery({
        neighborhood: nb,
        city,
        state: st,
        zip,
      });
    }
    if (!mapsQuery) mapsQuery = city;
  } else {
    mapsQuery = (
      showExact ? ubicacion || direccion || [zona, city].filter(Boolean).join(" · ") || city : [zona, city].filter(Boolean).join(" · ") || city
    ).trim();
  }

  const approxFallback = city;
  const fullFallback = ubicacion || direccion || city;
  const display = privacySafeLocation({
    cityStateZip: cityStateZip || city,
    colonia: g?.neighborhood?.trim() || zona,
    fallback: showExact ? fullFallback : approxFallback,
  });

  let mapsHref: string | null = null;
  if (safeUserMap) mapsHref = safeUserMap;
  else if (mapsQuery && !isUnsafeUrlScheme(mapsQuery)) {
    mapsHref = googleMapsSearchUrl(mapsQuery);
  }

  return { display, mapsHref };
}

export function brGate12dHoaSectionHasContent(g: BrGate12dV1Payload | null): boolean {
  if (!g) return false;
  return Boolean(
    g.hasHoa ||
      trim(g.hoaFee) ||
      g.hoaFrequency ||
      trim(g.hoaIncludes) ||
      trim(g.communityRules) ||
      trim(g.petRules) ||
      trim(g.rentalRestrictions) ||
      g.shortTermRentalAllowed ||
      trim(g.parkingRules),
  );
}

export function brGate12dOpenHouseSectionHasContent(g: BrGate12dV1Payload | null): boolean {
  if (!g) return false;
  return Boolean(
    g.openHouseEnabled ||
      trim(g.openHouseDate) ||
      trim(g.openHouseStartTime) ||
      trim(g.openHouseEndTime) ||
      g.showingByAppointment ||
      trim(g.showingInstructions) ||
      trim(g.virtualTourUrl),
  );
}

function liveFreqLabel(lang: "es" | "en", f: BrGate12dHoaFrequency | undefined): string {
  if (f === "monthly") return lang === "es" ? "Mensual" : "Monthly";
  if (f === "quarterly") return lang === "es" ? "Trimestral" : "Quarterly";
  if (f === "yearly") return lang === "es" ? "Anual" : "Yearly";
  return lang === "es" ? "No indicada" : "Unknown";
}

function liveHoaTriLabel(lang: "es" | "en", v: BrGate12dTriBool | undefined): string {
  if (v === "yes") return lang === "es" ? "Sí" : "Yes";
  if (v === "no") return lang === "es" ? "No" : "No";
  return lang === "es" ? "No indicado" : "Unknown";
}

export function buildBrLiveGate12dHoaCard(
  detailPairs: unknown,
  lang: "es" | "en",
): { title: string; rows: { label: string; value: string }[] } | null {
  const g = parseBrGate12dV1(detailPairs);
  if (!g || !brGate12dHoaSectionHasContent(g)) return null;
  const m = parseLeonixMachineFacetRead(detailPairs);
  const L = (es: string, en: string) => (lang === "es" ? es : en);
  const rows: { label: string; value: string }[] = [];
  const push = (label: string, value: string) => {
    const v = value.trim();
    if (!v) return;
    rows.push({ label, value: v });
  };
  if (g.hasHoa) push(L("¿Hay HOA?", "HOA?"), liveHoaTriLabel(lang, g.hasHoa));
  if (trim(g.hoaFee)) push(L("Cuota HOA", "HOA fee"), trim(g.hoaFee));
  if (g.hoaFrequency) push(L("Frecuencia", "Frequency"), liveFreqLabel(lang, g.hoaFrequency));
  if (trim(g.hoaIncludes)) push(L("La cuota incluye", "HOA includes"), trim(g.hoaIncludes));
  if (trim(g.communityRules)) push(L("Reglas de la comunidad", "Community rules"), trim(g.communityRules));
  const petRules =
    trim(g.petRules) ||
    (m.petsAllowed === true
      ? L("Se permiten mascotas (política publicada).", "Pets allowed (published policy).")
      : m.petsAllowed === false
        ? L("No se permiten mascotas (política publicada).", "Pets not allowed (published policy).")
        : "");
  if (petRules) push(L("Reglas sobre mascotas", "Pet rules"), petRules);
  if (trim(g.rentalRestrictions)) push(L("Restricciones de renta", "Rental restrictions"), trim(g.rentalRestrictions));
  if (g.shortTermRentalAllowed) push(L("Rentas vacacionales / corto plazo", "Short-term rentals"), liveHoaTriLabel(lang, g.shortTermRentalAllowed));
  if (trim(g.parkingRules)) push(L("Reglas de estacionamiento", "Parking rules"), trim(g.parkingRules));
  if (!rows.length) return null;
  return { title: L("HOA y comunidad", "HOA and community"), rows };
}

export function buildBrLiveGate12dOpenHouseCard(
  detailPairs: unknown,
  lang: "es" | "en",
): { title: string; rows: { label: string; value: string }[]; virtualTourUrl: string | null } | null {
  const g = parseBrGate12dV1(detailPairs);
  if (!g || !brGate12dOpenHouseSectionHasContent(g)) return null;
  const L = (es: string, en: string) => (lang === "es" ? es : en);
  const rows: { label: string; value: string }[] = [];
  const push = (label: string, value: string) => {
    const v = value.trim();
    if (!v) return;
    rows.push({ label, value: v });
  };
  if (g.openHouseEnabled) {
    push(L("Open house", "Open house"), L("Sí", "Yes"));
    if (trim(g.openHouseDate)) push(L("Fecha", "Date"), trim(g.openHouseDate));
    const tw = [trim(g.openHouseStartTime), trim(g.openHouseEndTime)].filter(Boolean).join(" – ");
    if (tw) push(L("Horario", "Hours"), tw);
  }
  if (g.showingByAppointment) push(L("Visitas con cita", "Showings by appointment"), L("Sí", "Yes"));
  if (trim(g.showingInstructions)) push(L("Instrucciones para visitas", "Showing instructions"), trim(g.showingInstructions));
  const vt = normalizeLeonixHttpsUrl(trim(g.virtualTourUrl));
  if (!rows.length && !vt) return null;
  return { title: L("Open house y visitas", "Open house and showings"), rows, virtualTourUrl: vt };
}
