/** Viajes-local public date display — never surface raw ISO in UI when parseable. */

export type ViajesPublicDateLang = "es" | "en";

function parseYmd(s: string): Date | null {
  const t = s.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const d = new Date(`${t}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmt(d: Date, lang: ViajesPublicDateLang): string {
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Format a single date-ish token; leave non-ISO human text unchanged. */
export function formatViajesPublicDateToken(raw: string, lang: ViajesPublicDateLang = "es"): string {
  const t = raw.trim();
  if (!t) return "";
  if (/nan|undefined|null/i.test(t)) return "";
  const d = parseYmd(t);
  return d ? fmt(d, lang) : t;
}

export function formatViajesPublicDateRange(input: {
  startDate?: string;
  endDate?: string;
  note?: string;
  legacyFechas?: string;
  lang?: ViajesPublicDateLang;
}): string {
  const lang = input.lang ?? "es";
  const start = formatViajesPublicDateToken(input.startDate ?? "", lang);
  const end = formatViajesPublicDateToken(input.endDate ?? "", lang);
  const note = (input.note ?? "").trim();
  const legacy = (input.legacyFechas ?? "").trim();

  const range =
    start && end && start !== end
      ? `${start} – ${end}`
      : start || end || "";

  return [range, note, legacy].filter(Boolean).join(" · ");
}
