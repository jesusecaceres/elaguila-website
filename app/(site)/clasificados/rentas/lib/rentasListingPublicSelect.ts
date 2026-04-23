/**
 * Public Rentas reads from `listings`. Some deployments never applied
 * `20250312000000_listings_engagement_boost.sql`; PostgREST errors if `boost_expires` is selected but absent.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const RENTAS_LISTING_PUBLIC_ROW_BASE =
  "id, title, description, city, zip, category, price, is_free, detail_pairs, seller_type, business_name, business_meta, status, is_published, created_at, images, contact_phone, contact_email";

export const RENTAS_LISTING_PUBLIC_ROW_WITH_BOOST = `${RENTAS_LISTING_PUBLIC_ROW_BASE}, boost_expires`;

function missingListingsColumnName(err: { message?: string } | null | undefined): string | null {
  const msg = err?.message ?? "";
  const schemaCache = msg.match(/Could not find the '(\w+)' column of 'listings'/i);
  if (schemaCache?.[1]) return schemaCache[1];
  const pg = msg.match(/column listings\.(\w+) does not exist/i);
  if (pg?.[1]) return pg[1];
  return null;
}

function stripSelectColumn(selectList: string, column: string): string {
  return selectList
    .split(",")
    .map((s) => s.trim())
    .filter((c) => c.length > 0 && c !== column)
    .join(", ");
}

const BROWSE_LIMIT = 5000;

export async function queryRentasBrowseListings(supabase: SupabaseClient): Promise<{
  data: unknown[] | null;
  error: { message: string } | null;
}> {
  /** RLS enforces active/published for anon; avoid `.eq(status)` / `is_published` filters here so partially migrated DBs without those columns do not fail the whole query. */
  const run = (cols: string) =>
    supabase.from("listings").select(cols).eq("category", "rentas").order("created_at", { ascending: false }).limit(BROWSE_LIMIT);

  let cols = RENTAS_LISTING_PUBLIC_ROW_WITH_BOOST;
  for (let i = 0; i < 32; i++) {
    const res = await run(cols);
    if (!res.error) {
      return { data: res.data as unknown[] | null, error: null };
    }
    const bad = missingListingsColumnName(res.error);
    if (bad) {
      const next = stripSelectColumn(cols, bad);
      if (next === cols) {
        return { data: null, error: { message: res.error.message } };
      }
      cols = next;
      continue;
    }
    return { data: null, error: { message: res.error.message } };
  }
  return { data: null, error: { message: "queryRentasBrowseListings: max select shrink retries" } };
}

export async function queryRentasListingById(
  supabase: SupabaseClient,
  id: string,
): Promise<{ data: unknown | null; error: { message: string } | null }> {
  const run = (cols: string) =>
    supabase.from("listings").select(cols).eq("id", id).eq("category", "rentas").maybeSingle();

  let cols = RENTAS_LISTING_PUBLIC_ROW_WITH_BOOST;
  for (let i = 0; i < 32; i++) {
    const res = await run(cols);
    if (!res.error) {
      return { data: res.data as unknown | null, error: null };
    }
    const bad = missingListingsColumnName(res.error);
    if (bad) {
      const next = stripSelectColumn(cols, bad);
      if (next === cols) {
        return { data: null, error: { message: res.error.message } };
      }
      cols = next;
      continue;
    }
    return { data: null, error: { message: res.error.message } };
  }
  return { data: null, error: { message: "queryRentasListingById: max select shrink retries" } };
}
