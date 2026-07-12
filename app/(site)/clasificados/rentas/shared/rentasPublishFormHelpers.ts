/**
 * Shared formatting + address helpers for Rentas Privado/Negocio publish flows.
 */

export type RentasServicioIncluidoId =
  | "agua"
  | "luz"
  | "gas"
  | "internet"
  | "mantenimiento"
  | "basura"
  | "estacionamiento"
  | "lavanderia"
  | "aire_acondicionado"
  | "seguridad"
  | "piscina"
  | "otro";

export const RENTAS_SERVICIOS_INCLUIDOS_DEFS: readonly {
  id: Exclude<RentasServicioIncluidoId, "otro">;
  label: string;
  emoji: string;
}[] = [
  { id: "agua", label: "Agua", emoji: "💧" },
  { id: "luz", label: "Luz", emoji: "💡" },
  { id: "gas", label: "Gas", emoji: "🔥" },
  { id: "internet", label: "Internet", emoji: "🌐" },
  { id: "mantenimiento", label: "Mantenimiento", emoji: "🧹" },
  { id: "basura", label: "Basura", emoji: "🗑️" },
  { id: "estacionamiento", label: "Estacionamiento", emoji: "🚗" },
  { id: "lavanderia", label: "Lavandería", emoji: "🧺" },
  { id: "aire_acondicionado", label: "Aire acondicionado", emoji: "❄️" },
  { id: "seguridad", label: "Seguridad", emoji: "🛡️" },
  { id: "piscina", label: "Piscina", emoji: "🏊" },
] as const;

// === GLOBAL LOCATION HELPERS ===

export const RENTAS_DEFAULT_COUNTRY = "United States";

export const RENTAS_COUNTRY_SUGGESTIONS = [
  "United States",
  "Mexico",
  "Canada",
  "Guatemala",
  "El Salvador",
  "Honduras",
  "Nicaragua",
  "Costa Rica",
  "Colombia",
  "Spain",
  "Argentina",
  "Chile",
  "Peru",
  "Brazil",
  "United Kingdom",
  "France",
  "Germany",
  "Italy",
] as const;

export const RENTAS_US_STATE_OPTIONS = [
  "",
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
] as const;

/** Full U.S. state / territory names keyed by two-letter code (suggestions only). */
export const RENTAS_US_STATE_LABELS: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

export const RENTAS_US_STATE_DATALIST_OPTIONS = RENTAS_US_STATE_OPTIONS.filter(Boolean).map((code) => ({
  code,
  label: RENTAS_US_STATE_LABELS[code] ? `${code} — ${RENTAS_US_STATE_LABELS[code]}` : code,
}));

function trim(s: unknown): string {
  if (s == null) return "";
  return typeof s === "string" ? s.trim() : String(s).trim();
}

export function isRentasUsCountry(country: string): boolean {
  const c = trim(country).toLowerCase();
  return c === "us" || c === "usa" || c === "u.s." || c === "u.s.a." || c === "united states";
}

/** Accept U.S. state codes, full names, or preserve manual region text. */
export function resolveRentasUsStateInput(raw: string): string {
  const t = trim(raw);
  if (!t) return "";
  const upper = t.toUpperCase();
  if ((RENTAS_US_STATE_OPTIONS as readonly string[]).includes(upper)) return upper;
  const byName = Object.entries(RENTAS_US_STATE_LABELS).find(
    ([, name]) => name.toLowerCase() === t.toLowerCase(),
  );
  if (byName) return byName[0];
  if (t.length === 2) return upper;
  return t;
}

/** Flexible postal code formatting: accepts any format, trims whitespace. For U.S., keeps digits only up to 10. */
export function formatRentasPostalCode(postal: string, country: string): string {
  const p = trim(postal);
  if (!p) return "";
  if (isRentasUsCountry(country)) {
    const digits = p.replace(/\D/g, "").slice(0, 10);
    if (digits.length >= 5) return digits;
    return p;
  }
  return p;
}

/** Normalize country input; default to United States if empty. */
export function normalizeRentasCountry(raw: string): string {
  const t = trim(raw);
  return t || RENTAS_DEFAULT_COUNTRY;
}

const SERVICIO_LABEL = new Map(
  RENTAS_SERVICIOS_INCLUIDOS_DEFS.map((d) => [d.id, d.label] as const),
);

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function rentasDisponibilidadIsIsoDate(raw: string): boolean {
  return ISO_DATE_RE.test(trim(raw));
}

/** Spanish long date for ISO YYYY-MM-DD; otherwise returns trimmed legacy text. */
export function formatRentasDisponibilidadDisplay(raw: string): string {
  const t = trim(raw);
  if (!t) return "";
  if (!rentasDisponibilidadIsIsoDate(t)) return t;
  const [y, m, d] = t.split("-").map((x) => Number(x));
  if (!y || !m || !d) return t;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(dt.getTime())) return t;
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(dt);
  } catch {
    return t;
  }
}

/** Same pattern as renta mensual helper in publish forms: formatted USD + “/ mes”. */
export function formatRentasMensualAnuncioPreview(digitsRaw: string): string {
  const d = String(digitsRaw ?? "").replace(/\D/g, "");
  if (!d) return "";
  const n = Number(d);
  if (!Number.isFinite(n) || n <= 0) return "";
  const cur = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  return `${cur} / mes`;
}

export function formatRentasDepositUsdPreview(digitsRaw: string): string {
  const d = String(digitsRaw ?? "").replace(/\D/g, "");
  if (!d) return "";
  const n = Number(d);
  if (!Number.isFinite(n) || n <= 0) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/** Plain large numbers with thousands separators (sqft, counts, etc.). Preserves decimals (e.g. 2.5 baths). */
export function formatRentasPlainNumberPreview(digitsRaw: string): string {
  const t = trim(digitsRaw);
  if (!t) return "";
  const c = t.replace(/,/g, "");
  if (/^\d+\.\d+$/.test(c)) {
    const [intPart, frac] = c.split(".");
    const n = Number(intPart);
    if (!Number.isFinite(n) || n <= 0) return t;
    const pretty = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
    return `${pretty}.${frac}`;
  }
  const d = c.replace(/\D/g, "");
  if (!d) return "";
  const n = Number(d);
  if (!Number.isFinite(n) || n <= 0) return "";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

/** Preview / public display for square-foot fields. */
export function formatRentasSqftPreview(digitsRaw: string): string {
  const pretty = formatRentasPlainNumberPreview(digitsRaw);
  return pretty ? `${pretty} ft²` : "";
}

/** Normalize persisted or legacy size strings for cards/detail (keeps non-numeric text). */
export function formatRentasSizeDisplayForPublic(raw: string): string {
  const t = trim(raw);
  if (!t || t === "—") return t;
  const ftMatch = t.match(/^([\d,.\s]+)\s*(ft²|ft2|sq\.?\s*ft)?$/i);
  if (ftMatch) {
    const formatted = formatRentasSqftPreview(ftMatch[1]!);
    return formatted || t;
  }
  const digitsOnly = t.replace(/\D/g, "");
  if (digitsOnly && /^\d+$/.test(t.replace(/,/g, "").replace(/\s/g, ""))) {
    return formatRentasPlainNumberPreview(t) || t;
  }
  return t;
}

function appendRentasMapSegment(line: string, part: string): string {
  const p = trim(part);
  if (!p) return line;
  const low = line.toLowerCase();
  if (low.includes(p.toLowerCase())) return line;
  return line ? `${line}, ${p}` : p;
}

/** Primary street line: single field first, then legacy número+calle, then referencia. */
export function buildRentasStreetLine(parts: {
  direccionLinea1?: string;
  direccionLinea2?: string;
  direccionNumero: string;
  direccionCalle: string;
  ubicacionLinea: string;
}): string {
  const line = trim(parts.direccionLinea1);
  const line2 = trim(parts.direccionLinea2);
  if (line) return [line, line2].filter(Boolean).join(", ");
  const num = trim(parts.direccionNumero);
  const calle = trim(parts.direccionCalle);
  const legacy = trim(parts.ubicacionLinea);
  const structured = [num, calle].filter(Boolean).join(" ").trim();
  return structured || legacy;
}

/** Código postal US: hasta 5 dígitos. DEPRECATED: Use formatRentasPostalCode for flexible postal codes. */
export function coerceRentasPostalDigits5(raw: string): string {
  return String(raw ?? "")
    .replace(/\D/g, "")
    .slice(0, 5);
}

/** Hero / summary: «Dirección, Ciudad, Estado CP, País» (sin zona; la zona va aparte). */
export function buildRentasAssembledAddressLine(parts: {
  direccionLinea1?: string;
  direccionLinea2?: string;
  direccionNumero: string;
  direccionCalle: string;
  ubicacionLinea: string;
  ciudad: string;
  direccionEstado: string;
  direccionCodigoPostal: string;
  direccionPais: string;
}): string {
  const line1 = buildRentasStreetLine(parts);
  const city = trim(parts.ciudad);
  const st = trim(parts.direccionEstado);
  const zip = formatRentasPostalCode(parts.direccionCodigoPostal, parts.direccionPais);
  const country = normalizeRentasCountry(parts.direccionPais);
  const stZip = [st, zip].filter(Boolean).join(" ").trim();
  const cityStZip = [city, stZip].filter(Boolean).join(", ");
  const withCountry = [cityStZip, country].filter(Boolean).join(", ");
  return [line1, withCountry].filter(Boolean).join(", ");
}

export function buildRentasCityStatePostalLine(parts: {
  ciudad: string;
  direccionEstado: string;
  direccionCodigoPostal: string;
  direccionPais: string;
}): string {
  const city = trim(parts.ciudad);
  const st = trim(parts.direccionEstado);
  const zip = formatRentasPostalCode(parts.direccionCodigoPostal, parts.direccionPais);
  const country = normalizeRentasCountry(parts.direccionPais);
  const stZip = [st, zip].filter(Boolean).join(" ").trim();
  const cityStZip = [city, stZip].filter(Boolean).join(", ");
  if (isRentasUsCountry(country)) return cityStZip;
  return [cityStZip, country].filter(Boolean).join(", ");
}

/** Query string for Google Maps search (no API key). */
export function buildRentasGoogleMapsSearchQuery(parts: {
  direccionLinea1?: string;
  direccionLinea2?: string;
  direccionNumero: string;
  direccionCalle: string;
  ubicacionLinea: string;
  direccionCruceCercano?: string;
  mostrarDireccionExacta?: boolean;
  zonaVecindario: string;
  ciudad: string;
  direccionEstado: string;
  direccionCodigoPostal: string;
  direccionPais: string;
}): string | null {
  const exactOk = parts.mostrarDireccionExacta === true;
  const cross = trim(parts.direccionCruceCercano);
  const street = exactOk ? buildRentasStreetLine(parts) : "";
  const city = trim(parts.ciudad);
  const st = trim(parts.direccionEstado);
  const zip = formatRentasPostalCode(parts.direccionCodigoPostal, parts.direccionPais);
  const country = normalizeRentasCountry(parts.direccionPais);
  const zona = trim(parts.zonaVecindario);
  const cityStZip = [city, [st, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  let q = exactOk ? street : cross;
  q = appendRentasMapSegment(q, cityStZip);
  q = appendRentasMapSegment(q, zona);
  if (!isRentasUsCountry(country)) {
    q = appendRentasMapSegment(q, country);
  }
  return q.trim() || null;
}

export function rentasGoogleMapsUrlFromQuery(query: string | null): string | null {
  const q = trim(query);
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Ordered unique labels + single custom “Otro” line when applicable (no duplicate otro). */
export function formatRentasServiciosIncluidosList(parts: {
  serviciosIncluidosKeys: readonly RentasServicioIncluidoId[];
  serviciosIncluidosOtro: string;
  serviciosIncluidosLegacy: string;
}): string[] {
  const keys = [...parts.serviciosIncluidosKeys];
  const otroText = trim(parts.serviciosIncluidosOtro);
  const labels: string[] = [];
  for (const k of keys) {
    if (k === "otro") continue;
    const lb = SERVICIO_LABEL.get(k);
    if (lb) labels.push(lb);
  }
  if (keys.includes("otro") && otroText) labels.push(otroText);
  if (labels.length) return [...new Set(labels)];
  const leg = trim(parts.serviciosIncluidosLegacy);
  return leg ? [leg] : [];
}

export function formatRentasServiciosIncluidosOutput(parts: {
  serviciosIncluidosKeys: readonly RentasServicioIncluidoId[];
  serviciosIncluidosOtro: string;
  serviciosIncluidosLegacy: string;
}): string {
  const list = formatRentasServiciosIncluidosList(parts);
  if (list.length) return list.join(", ");
  return "";
}

/** Readable multiline block for detail / preview (no emoji). */
export function formatRentasServiciosIncluidosOutputMultiline(parts: {
  serviciosIncluidosKeys: readonly RentasServicioIncluidoId[];
  serviciosIncluidosOtro: string;
  serviciosIncluidosLegacy: string;
}): string {
  const list = formatRentasServiciosIncluidosList(parts);
  if (!list.length) return "";
  return list.map((line) => `• ${line}`).join("\n");
}

/**
 * Order gallery sources for Supabase upload: cover (primary) first, then remaining photos
 * in capture order — matches preview hero + browse card when `primaryImageIndex` ≠ 0.
 */
export function orderedRentasGallerySourcesForPublish(urls: readonly string[], primaryImageIndex: number): string[] {
  const u = urls
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter((x) => x.length > 0);
  const n = u.length;
  if (n === 0) return [];
  const pi = Math.min(Math.max(0, Math.round(primaryImageIndex) || 0), n - 1);
  if (pi === 0) return [...u];
  return [...u.slice(pi), ...u.slice(0, pi)];
}
