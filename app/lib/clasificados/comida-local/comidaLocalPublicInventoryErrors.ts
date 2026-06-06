/**
 * FOOD-L9B — Classify Comida Local public inventory DB errors for safe UI copy.
 * Technical messages are logged server-side only; never shown to customers raw.
 */

export type ComidaLocalInventoryFailureKind =
  | "unconfigured"
  | "table_missing"
  | "query_failed";

export type ComidaLocalInventoryFailure = {
  kind: ComidaLocalInventoryFailureKind;
  /** Raw provider/PostgREST message — server logs only. */
  technical: string;
};

/** Customer-safe copy (Spanish). */
export const COMIDA_LOCAL_RESULTS_UNAVAILABLE_MESSAGE_ES =
  "Resultados temporalmente no disponibles.";

export const COMIDA_LOCAL_RESULTS_EMPTY_MESSAGE_ES =
  "Aún no hay publicaciones de Comida Local.";

export const COMIDA_LOCAL_RESULTS_FILTER_EMPTY_MESSAGE_ES =
  "No hay fichas publicadas con estos filtros.";

const TABLE_MISSING_MARKERS = [
  "schema cache",
  "could not find the table",
  "does not exist",
  "not found",
  "pgrst205",
  "42p01",
] as const;

export function isComidaLocalTableMissingError(message: string): boolean {
  const m = message.trim().toLowerCase();
  if (!m) return false;
  if (!m.includes("comida_local_public_listings")) {
    return TABLE_MISSING_MARKERS.some((mark) => m.includes(mark)) && m.includes("comida");
  }
  return TABLE_MISSING_MARKERS.some((mark) => m.includes(mark));
}

export function classifyComidaLocalInventoryError(
  error: string
): ComidaLocalInventoryFailure {
  const technical = error.trim() || "unknown";
  if (technical === "supabase_unconfigured") {
    return { kind: "unconfigured", technical };
  }
  if (isComidaLocalTableMissingError(technical)) {
    return { kind: "table_missing", technical };
  }
  return { kind: "query_failed", technical };
}

export function customerMessageForComidaLocalInventoryFailure(
  failure: ComidaLocalInventoryFailure,
  lang: "es" | "en" = "es"
): string {
  if (lang === "en") {
    if (failure.kind === "unconfigured" || failure.kind === "table_missing") {
      return "Results are temporarily unavailable.";
    }
    return "Results are temporarily unavailable.";
  }
  if (failure.kind === "unconfigured") {
    return COMIDA_LOCAL_RESULTS_UNAVAILABLE_MESSAGE_ES;
  }
  return COMIDA_LOCAL_RESULTS_UNAVAILABLE_MESSAGE_ES;
}

/** Server-side diagnostic log — not returned to the client. */
export function logComidaLocalInventoryFailure(
  failure: ComidaLocalInventoryFailure,
  context: string
): void {
  console.error(`[comida-local/inventory] ${context}`, {
    kind: failure.kind,
    technical: failure.technical,
    table: "comida_local_public_listings",
  });
}
