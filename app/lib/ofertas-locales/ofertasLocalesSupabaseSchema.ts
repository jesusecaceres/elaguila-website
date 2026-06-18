/** Production Supabase migration required for Ofertas Locales AI scan (Gate OL-7B). */
export const OFERTAS_LOCALES_AI_PRODUCTION_MIGRATION =
  "20260616130000_ofertas_locales_ai_production_bootstrap.sql" as const;

export const OFERTAS_LOCALES_AI_REQUIRED_TABLES = [
  "ofertas_locales",
  "oferta_local_scan_jobs",
  "oferta_local_items",
] as const;

export type OfertasLocalesAiTableProbeResult = {
  table: string;
  ok: boolean;
  code: string | null;
  message: string | null;
  hint: string | null;
};

export type OfertasLocalesAiTableProbeSummary = {
  ok: boolean;
  tables: OfertasLocalesAiTableProbeResult[];
  failedTables: string[];
};

/** OL-7E route marker for production diagnostics. */
export const OFERTAS_LOCALES_AI_SCAN_PREP_ROUTE_VERSION = "ol7e-scan-prep-v1" as const;

export function parseSupabaseProjectRefFromUrl(url: string | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function getSupabaseUrlHost(url: string | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    return new URL(url.trim()).host;
  } catch {
    return null;
  }
}

/**
 * True only when a TABLE/RELATION is missing — not when a COLUMN is missing.
 * Broad "does not exist" matching caused false migration blockers (OL-7E).
 */
export function isSupabaseSchemaCacheMissingTableError(
  message: string | undefined,
  code?: string | null
): boolean {
  const m = (message ?? "").toLowerCase();
  const c = (code ?? "").toUpperCase();

  if (c === "42703") return false;
  if (m.includes("column") && m.includes("does not exist")) return false;
  if (m.includes("undefined column")) return false;

  if (m.includes("could not find the table")) return true;
  if (m.includes("schema cache") && (m.includes("table") || m.includes("relation"))) return true;
  if (c === "42P01" || c === "PGRST205") return true;
  if (m.includes("relation") && m.includes("does not exist") && !m.includes("column")) return true;

  return false;
}

export function isSupabaseMissingColumnError(message: string | undefined, code?: string | null): boolean {
  const m = (message ?? "").toLowerCase();
  const c = (code ?? "").toUpperCase();
  return c === "42703" || (m.includes("column") && m.includes("does not exist"));
}

export function sanitizeSupabaseErrorMessage(message: string | undefined): string | null {
  if (!message?.trim()) return null;
  return message
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted]")
    .slice(0, 500);
}

export function ofertasLocalesAiSchemaMissingDetail(tableHint?: string): string {
  const table = tableHint?.trim() || "ofertas_locales";
  return (
    `Database table public.${table} is missing in production. ` +
    `Apply Supabase migration ${OFERTAS_LOCALES_AI_PRODUCTION_MIGRATION} ` +
    `(and ensure ${OFERTAS_LOCALES_AI_REQUIRED_TABLES.join(", ")} exist) before AI scan will work. ` +
    `Vercel deploy alone is not sufficient.`
  );
}

type SupabaseProbeClient = {
  from: (table: string) => {
    select: (columns: string) => {
      limit: (n: number) => PromiseLike<{ error: { message?: string; code?: string; hint?: string } | null }>;
    };
  };
};

export async function probeOfertasLocalesAiTables(
  supabase: SupabaseProbeClient
): Promise<OfertasLocalesAiTableProbeSummary> {
  const tables: OfertasLocalesAiTableProbeResult[] = [];

  for (const table of OFERTAS_LOCALES_AI_REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select("id").limit(1);
    tables.push({
      table,
      ok: !error,
      code: error?.code ?? null,
      message: sanitizeSupabaseErrorMessage(error?.message),
      hint: error?.hint ? sanitizeSupabaseErrorMessage(error.hint) : null,
    });
  }

  const failedTables = tables.filter((t) => !t.ok).map((t) => t.table);
  return { ok: failedTables.length === 0, tables, failedTables };
}

export function schemaProbeFailureResponse(
  probe: OfertasLocalesAiTableProbeSummary,
  supabaseUrl?: string
): { error: string; detail: string; tableProbes: OfertasLocalesAiTableProbeResult[]; supabaseHost: string | null; supabaseProjectRef: string | null } {
  const missingTables = probe.tables.filter(
    (t) => !t.ok && isSupabaseSchemaCacheMissingTableError(t.message ?? undefined, t.code)
  );

  if (missingTables.length > 0) {
    const first = missingTables[0];
    return {
      error: "schema_not_applied",
      detail: ofertasLocalesAiSchemaMissingDetail(first.table),
      tableProbes: probe.tables,
      supabaseHost: getSupabaseUrlHost(supabaseUrl),
      supabaseProjectRef: parseSupabaseProjectRefFromUrl(supabaseUrl),
    };
  }

  const firstFail = probe.tables.find((t) => !t.ok);
  return {
    error: "schema_probe_failed",
    detail:
      firstFail?.message ??
      `Table probe failed for: ${probe.failedTables.join(", ")}`,
    tableProbes: probe.tables,
    supabaseHost: getSupabaseUrlHost(supabaseUrl),
    supabaseProjectRef: parseSupabaseProjectRefFromUrl(supabaseUrl),
  };
}
