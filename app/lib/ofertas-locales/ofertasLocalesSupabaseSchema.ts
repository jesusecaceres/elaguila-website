/** Production Supabase migration required for Ofertas Locales AI scan (Gate OL-7B). */
export const OFERTAS_LOCALES_AI_PRODUCTION_MIGRATION =
  "20260616130000_ofertas_locales_ai_production_bootstrap.sql" as const;

export const OFERTAS_LOCALES_AI_REQUIRED_TABLES = [
  "ofertas_locales",
  "oferta_local_scan_jobs",
  "oferta_local_items",
] as const;

export function isSupabaseSchemaCacheMissingTableError(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("could not find the table") ||
    m.includes("does not exist") ||
    m.includes("schema cache")
  );
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
