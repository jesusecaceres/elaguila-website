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

const SERVICIO_LABEL = new Map(
  RENTAS_SERVICIOS_INCLUIDOS_DEFS.map((d) => [d.id, d.label] as const),
);

function trim(s: unknown): string {
  if (s == null) return "";
  return typeof s === "string" ? s.trim() : String(s).trim();
}

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

/** Código postal US: hasta 5 dígitos. */
export function coerceRentasPostalDigits5(raw: string): string {
  return String(raw ?? "")
    .replace(/\D/g, "")
    .slice(0, 5);
}

/** Hero / summary: «Dirección, Ciudad, Estado CP» (sin zona; la zona va aparte). */
export function buildRentasAssembledAddressLine(parts: {
  direccionLinea1?: string;
  direccionLinea2?: string;
  direccionNumero: string;
  direccionCalle: string;
  ubicacionLinea: string;
  ciudad: string;
  direccionEstado: string;
  direccionCodigoPostal: string;
}): string {
  const line1 = buildRentasStreetLine(parts);
  const city = trim(parts.ciudad);
  const st = trim(parts.direccionEstado);
  const zip = coerceRentasPostalDigits5(parts.direccionCodigoPostal);
  const stZip = [st, zip].filter(Boolean).join(" ").trim();
  const tail = [city, stZip].filter(Boolean).join(", ");
  return [line1, tail].filter(Boolean).join(", ");
}

export function buildRentasCityStateZipLine(parts: {
  ciudad: string;
  direccionEstado: string;
  direccionCodigoPostal: string;
}): string {
  const city = trim(parts.ciudad);
  const st = trim(parts.direccionEstado);
  const zip = coerceRentasPostalDigits5(parts.direccionCodigoPostal);
  const stZip = [st, zip].filter(Boolean).join(" ").trim();
  return [city, stZip].filter(Boolean).join(", ");
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
}): string | null {
  const exactOk = parts.mostrarDireccionExacta === true;
  const cross = trim(parts.direccionCruceCercano);
  const line1 = exactOk ? buildRentasStreetLine(parts) : "";
  const city = trim(parts.ciudad);
  const st = trim(parts.direccionEstado);
  const zip = coerceRentasPostalDigits5(parts.direccionCodigoPostal);
  const zona = trim(parts.zonaVecindario);
  const cityStZip = [city, [st, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const primary = exactOk ? line1 : cross;
  const q = [primary, cityStZip, zona].filter(Boolean).join(", ");
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
