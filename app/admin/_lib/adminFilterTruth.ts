/**
 * ADMIN FILTER / LIMIT TRUTH (2026-09 final Admin functional normalization — Gate 3).
 *
 * Pure helpers (no I/O, no React, client-safe) shared by every Admin category page so that
 *   - a list that stopped at its row limit or at a bounded application-level scan SAYS so
 *     (never "these are all the matches" when they are not),
 *   - the operating summary says it covers the WHOLE category (not the filtered list) and marks a
 *     scan-capped metric as a lower bound,
 *   - free text placed inside a PostgREST `or(...)` filter cannot break the filter grammar
 *     (a comma / parenthesis in a search term used to turn the whole query into an error).
 *
 * Doctrine: Admin reports; it never fabricates. A capped scan is shown as capped.
 */
import type { AdminLang } from "./adminI18nCookie";

/**
 * Quote a value for use INSIDE a PostgREST `or(col.op.value,...)` string. `pattern` is the final value the
 * database should see (for `ilike`, already LIKE-escaped and wrapped in `%`). Reserved characters
 * (`,` `(` `)` `.` `:`) are legal inside a double-quoted PostgREST value; `\` and `"` are escaped.
 */
export function pgrstQuote(pattern: string): string {
  return `"${String(pattern ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** A jsonb array containment literal for `detail_pairs` (`[{label, value}]` — the shape the publisher writes). */
export function detailPairContainsLiteral(label: string, value: string): string {
  return JSON.stringify([{ label, value }]);
}

export type AdminListTruncationInput = {
  /** Rows actually rendered. */
  shown: number;
  /** The row limit the operator asked for (Rows selector). */
  limit: number;
  /** True when a bounded application-level scan stopped at its cap before finding `limit` matches. */
  scanCapped?: boolean;
  /** Raw rows the bounded scan read (for the disclosure text). */
  scanned?: number | null;
  /** True when some search sources could not be read (partial results). */
  partialSources?: readonly string[] | null;
  /** True when the data function reports it stopped early (per-source cap, etc.). */
  truncated?: boolean;
};

export type AdminListTruncationNote = {
  kind: "limit_reached" | "scan_capped" | "partial_sources";
  text: string;
};

const COPY = {
  en: {
    limitReached: (n: number, limit: number) =>
      `Showing the first ${n} matching rows (limit ${limit}). More rows may match — narrow the filters or raise Rows.`,
    scanCapped: (scanned: number | null | undefined, limit: number) =>
      `Search window exhausted: ${typeof scanned === "number" ? scanned.toLocaleString("en-US") : "the maximum number of"} rows were scanned without finding ${limit} matches. ` +
      `Older matching rows may exist and are NOT shown — narrow the filters (search, status, owner, Leonix Ad ID).`,
    partial: (sources: readonly string[]) =>
      `Some search sources could not be read (${sources.join(", ")}). The list may be missing matches.`,
    summaryScopeAll: "Counts cover the whole category. The filters below change the list, not these numbers.",
    summaryScopeFiltered:
      "Counts cover the whole category — NOT the filtered list below. Active filters only narrow the list.",
    summaryLowerBound: "≥ marks a lower bound: the count scan hit its cap, so the real number can be higher.",
    lowerBoundTitle: "Lower bound — the count scan reached its cap before reading every row.",
    summaryLane: (lane: string, filtersActive: boolean) =>
      `Counts cover the selected lane (${lane}) — not the whole category${filtersActive ? " and NOT the filtered list below" : ""}.`,
  },
  es: {
    limitReached: (n: number, limit: number) =>
      `Mostrando las primeras ${n} filas que coinciden (límite ${limit}). Puede haber más — acota los filtros o sube Filas.`,
    scanCapped: (scanned: number | null | undefined, limit: number) =>
      `Ventana de búsqueda agotada: se revisaron ${typeof scanned === "number" ? scanned.toLocaleString("en-US") : "el máximo de"} filas sin encontrar ${limit} coincidencias. ` +
      `Pueden existir filas más antiguas que NO se muestran — acota los filtros (búsqueda, estado, dueño, ID de anuncio Leonix).`,
    partial: (sources: readonly string[]) =>
      `No se pudieron leer algunas fuentes de búsqueda (${sources.join(", ")}). Puede faltar alguna coincidencia.`,
    summaryScopeAll: "Los conteos cubren toda la categoría. Los filtros de abajo cambian la lista, no estos números.",
    summaryScopeFiltered:
      "Los conteos cubren toda la categoría — NO la lista filtrada de abajo. Los filtros activos solo acotan la lista.",
    summaryLowerBound: "≥ marca un mínimo: el conteo llegó a su tope de lectura, así que el valor real puede ser mayor.",
    lowerBoundTitle: "Mínimo — el conteo llegó a su tope antes de leer todas las filas.",
    summaryLane: (lane: string, filtersActive: boolean) =>
      `Los conteos cubren el carril seleccionado (${lane}) — no toda la categoría${filtersActive ? " ni la lista filtrada de abajo" : ""}.`,
  },
} as const;

/**
 * Pure: the honest notes a list must show. Empty array = nothing to disclose.
 *  - `scan_capped`   (the bounded scan stopped early — strongest statement, an empty list is NOT proof of absence)
 *  - `limit_reached` (the list is exactly as long as the requested limit, so more rows may match)
 *  - `partial_sources`
 */
export function describeAdminListTruncation(lang: AdminLang, input: AdminListTruncationInput): AdminListTruncationNote[] {
  const c = COPY[lang === "es" ? "es" : "en"];
  const notes: AdminListTruncationNote[] = [];
  if (input.scanCapped) {
    notes.push({ kind: "scan_capped", text: c.scanCapped(input.scanned, input.limit) });
  } else if ((input.limit > 0 && input.shown >= input.limit) || input.truncated) {
    notes.push({ kind: "limit_reached", text: c.limitReached(input.shown, input.limit) });
  }
  if (input.partialSources && input.partialSources.length > 0) {
    notes.push({ kind: "partial_sources", text: c.partial(input.partialSources) });
  }
  return notes;
}

export function adminSummaryScopeText(lang: AdminLang, filtersActive: boolean, laneLabel?: string | null): string {
  const c = COPY[lang === "es" ? "es" : "en"];
  if (laneLabel) return c.summaryLane(laneLabel, filtersActive);
  return filtersActive ? c.summaryScopeFiltered : c.summaryScopeAll;
}

export function adminSummaryLowerBoundText(lang: AdminLang): string {
  return COPY[lang === "es" ? "es" : "en"].summaryLowerBound;
}

export function adminLowerBoundTitle(lang: AdminLang): string {
  return COPY[lang === "es" ? "es" : "en"].lowerBoundTitle;
}

/** True when any list filter (search / status / owner / Leonix Ad ID / lane / category-specific) is active. */
export function adminAnyFilterActive(
  sp: Record<string, string | string[] | undefined> | undefined,
  names: readonly string[] = ["q", "status", "owner", "owner_user_id", "leonix_ad_id", "lane", "slug", "id"],
): boolean {
  for (const n of names) {
    const raw = sp?.[n];
    const v = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
    if (String(v ?? "").trim()) return true;
  }
  return false;
}
