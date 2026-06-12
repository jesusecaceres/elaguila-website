/**
 * Ofertas Locales formatting helpers — pure, dependency-light.
 */

/** Strip to digits for US phone / WhatsApp input normalization. */
export function normalizeOfertaLocalPhoneInput(raw: string): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

/** Display US phone as (xxx) xxx-xxxx while typing. */
export function formatOfertaLocalPhoneDisplay(raw: string): string {
  const d = normalizeOfertaLocalPhoneInput(raw).slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Normalize US ZIP to 5 digits; returns empty if invalid length. */
export function normalizeOfertaLocalZipInput(raw: string): string {
  const digits = String(raw ?? "").replace(/\D/g, "").slice(0, 5);
  return digits;
}

/** Normalize US state to uppercase 2-letter code while typing. */
export function normalizeOfertaLocalStateInput(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2);
}

/** Safe Google Maps search URL from location fields — no Routes API. */
export function buildOfertaLocalGoogleMapsSearchUrl(parts: {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}): string {
  const query = [parts.address, parts.city, parts.state, parts.zipCode]
    .map((p) => String(p ?? "").trim())
    .filter(Boolean);
  if (query.length === 0) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.join(", "))}`;
}

/** Normalize http(s) URL; returns empty string if invalid. */
export function normalizeOfertaLocalUrlInput(raw: string | undefined): string {
  const t = String(raw ?? "").trim();
  if (!t) return "";
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^\/+/, "")}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.href;
  } catch {
    return "";
  }
}

/** Lowercase, collapse whitespace, strip diacritics for search indexing. */
export function normalizeOfertaLocalSearchText(raw: string): string {
  return String(raw ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Format a numeric amount as USD price text; returns empty for invalid input. */
export function formatOfertaLocalPriceText(amount: number | null | undefined, unit?: string): string {
  if (amount == null || !Number.isFinite(amount) || amount < 0) return "";
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  const u = String(unit ?? "").trim();
  return u ? `${formatted} / ${u}` : formatted;
}

function parseIsoDateOnly(value: string): Date | null {
  const t = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const d = new Date(`${t}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function todayUtcDateOnly(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
}

/** True when validUntil is before today (UTC date-only comparison). */
export function isOfertaLocalExpired(validUntil: string, now: Date = new Date()): boolean {
  const end = parseIsoDateOnly(validUntil);
  if (!end) return false;
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12)
  );
  return end.getTime() < today.getTime();
}

/** True when today falls within [validFrom, validUntil] inclusive (UTC date-only). */
export function isOfertaLocalActiveByDates(
  validFrom: string,
  validUntil: string,
  now: Date = new Date()
): boolean {
  const start = parseIsoDateOnly(validFrom);
  const end = parseIsoDateOnly(validUntil);
  if (!start || !end) return false;
  const today = todayUtcDateOnly();
  return start.getTime() <= today.getTime() && today.getTime() <= end.getTime();
}
