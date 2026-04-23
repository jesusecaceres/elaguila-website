/**
 * PostgREST returns schema-cache errors when `select(...)` asks for columns
 * missing from `public.listings` (migrations not applied on a given DB).
 * Shrink the column list and retry — pattern from Rentas browse helpers.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export function missingListingsColumnName(err: { message?: string } | null | undefined): string | null {
  const msg = err?.message ?? "";
  const schemaCache = msg.match(/Could not find the '(\w+)' column of 'listings'/i);
  if (schemaCache?.[1]) return schemaCache[1];
  const pg = msg.match(/column listings\.(\w+) does not exist/i);
  if (pg?.[1]) return pg[1];
  const pg2 = msg.match(/column ["']?(\w+)["']? of relation ["']?listings["']? does not exist/i);
  if (pg2?.[1]) return pg2[1];
  return null;
}

export function stripSelectColumn(selectList: string, column: string): string {
  return selectList
    .split(",")
    .map((s) => s.trim())
    .filter((c) => c.length > 0 && c !== column)
    .join(", ");
}

/** Shared select-shrink loop for any `from("listings").select(cols)…` chain. */
export async function listingsQueryWithSelectShrink<TResult>(
  initialColumns: string,
  run: (columns: string) => Promise<{ data: TResult; error: { message: string } | null }>,
): Promise<{ data: TResult; error: { message: string } | null }> {
  let cols = initialColumns;
  for (let i = 0; i < 32; i++) {
    const res = await run(cols);
    if (!res.error) return res;
    const bad = missingListingsColumnName(res.error);
    if (bad) {
      const next = stripSelectColumn(cols, bad);
      if (next === cols) return { data: null as TResult, error: { message: res.error!.message } };
      cols = next;
      continue;
    }
    return { data: null as TResult, error: { message: res.error!.message } };
  }
  return { data: null as TResult, error: { message: "listingsQueryWithSelectShrink: max retries" } };
}

/** Browser/service insert: omit unknown columns when DB is behind migrations (Rentas / Leonix publish). */
export async function insertListingsRowResilient(
  supabase: SupabaseClient,
  row: Record<string, unknown>,
): Promise<{ data: { id: string } | null; error: { message: string; code?: string } | null }> {
  let payload: Record<string, unknown> = { ...row };
  for (let i = 0; i < 24; i++) {
    const { data, error } = await supabase.from("listings").insert(payload as never).select("id").single();
    if (!error) {
      const id = (data as { id?: string } | null)?.id;
      if (id) return { data: { id }, error: null };
      return { data: null, error: { message: "Insert succeeded but listings.id missing in response." } };
    }
    const col = missingListingsColumnName(error);
    if (col && Object.prototype.hasOwnProperty.call(payload, col)) {
      const next = { ...payload };
      delete next[col];
      payload = next;
      continue;
    }
    return { data: null, error: { message: error.message, code: error.code } };
  }
  return { data: null, error: { message: "insertListingsRowResilient: max retries" } };
}
