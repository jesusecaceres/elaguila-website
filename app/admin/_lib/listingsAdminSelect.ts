import type { SupabaseClient } from "@supabase/supabase-js";

/** Columns for Clasificados admin queue — includes JSON used by En Venta visibility helpers. */
export const LISTINGS_ADMIN_SELECT_WITH_DETAIL_PAIRS =
  "id, title, description, city, category, price, is_free, status, owner_id, created_at, images, detail_pairs, boost_expires, is_published";

/** Same row shape minus `detail_pairs` when the live DB predates that migration. */
export const LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_PAIRS =
  "id, title, description, city, category, price, is_free, status, owner_id, created_at, images, boost_expires, is_published";

function shouldRetrySelectWithoutDetailPairs(err: { message?: string; code?: string } | null): boolean {
  if (!err?.message) return false;
  const m = err.message.toLowerCase();
  return m.includes("detail_pairs");
}

export type ListingsAdminFetchResult<T> = {
  data: T[] | null;
  error: { message: string; code?: string } | null;
  /** False when we fell back to a select without `detail_pairs`. Apply `supabase/migrations/20250316200000_listings_detail_pairs.sql` (or later ensure migration) on production. */
  detailPairsAvailable: boolean;
};

/**
 * Load listings for admin moderation. If `detail_pairs` is missing in Postgres, retries without it so the page still loads.
 */
export async function fetchListingsForAdminWorkspace(
  supabase: SupabaseClient
): Promise<ListingsAdminFetchResult<Record<string, unknown>>> {
  const first = await supabase
    .from("listings")
    .select(LISTINGS_ADMIN_SELECT_WITH_DETAIL_PAIRS)
    .order("created_at", { ascending: false })
    .limit(300);

  if (!first.error) {
    return { data: (first.data as Record<string, unknown>[]) ?? [], error: null, detailPairsAvailable: true };
  }

  if (shouldRetrySelectWithoutDetailPairs(first.error)) {
    const second = await supabase
      .from("listings")
      .select(LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_PAIRS)
      .order("created_at", { ascending: false })
      .limit(300);

    if (second.error) {
      return {
        data: null,
        error: { message: second.error.message, code: second.error.code },
        detailPairsAvailable: false,
      };
    }

    return {
      data: (second.data as Record<string, unknown>[]) ?? [],
      error: null,
      detailPairsAvailable: false,
    };
  }

  return {
    data: null,
    error: { message: first.error.message, code: first.error.code },
    detailPairsAvailable: true,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s.trim());
}

/** Exported for admin UI (owner fragment, etc.). */
export function isUuidString(s: string): boolean {
  return isUuid(s);
}

function escapeIlike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export type ListingsAdminWorkspaceFilters = {
  /** Lowercased trimmed search across title, city, id, owner_id (substring). */
  q?: string;
  category?: string;
  status?: string;
  /** Owner id fragment — full UUID uses SQL eq; partial matched in memory after fetch. */
  ownerFrag?: string;
  limit?: number;
};

function mergeById(rows: Record<string, unknown>[], cap: number): Record<string, unknown>[] {
  const seen = new Set<string>();
  const out: Record<string, unknown>[] = [];
  for (const r of rows) {
    const id = String((r as { id?: string }).id ?? "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(r);
    if (out.length >= cap) break;
  }
  return out;
}

/**
 * Server-side filters: category, status, UUID owner, text search on title/city/id/owner_id.
 * Partial `ownerFrag` and `detail_pairs` BR filters are applied by the caller after fetch.
 */
export async function fetchListingsForAdminWorkspaceFiltered(
  supabase: SupabaseClient,
  filters: ListingsAdminWorkspaceFilters
): Promise<ListingsAdminFetchResult<Record<string, unknown>>> {
  const limit = Math.min(Math.max(filters.limit ?? 300, 1), 500);
  const cat = (filters.category ?? "").trim();
  const status = (filters.status ?? "").trim();
  const ownerFrag = (filters.ownerFrag ?? "").trim().toLowerCase();
  const qRaw = (filters.q ?? "").trim().toLowerCase();
  const safeQ = escapeIlike(qRaw);

  const buildQuery = (cols: string, qMode: "none" | "text_uuid" | "owner_like") => {
    let qb = supabase.from("listings").select(cols).order("created_at", { ascending: false }).limit(limit);
    if (cat) qb = qb.eq("category", cat);
    if (status) qb = qb.eq("status", status);
    if (ownerFrag && isUuid(ownerFrag)) {
      qb = qb.eq("owner_id", ownerFrag);
    }
    if (qRaw) {
      if (qMode === "text_uuid") {
        const parts = [`title.ilike.%${safeQ}%`, `city.ilike.%${safeQ}%`];
        if (!isUuid(qRaw)) {
          parts.push(`description.ilike.%${safeQ}%`);
        }
        if (isUuid(qRaw)) {
          parts.push(`id.eq.${qRaw}`);
          parts.push(`owner_id.eq.${qRaw}`);
        }
        qb = qb.or(parts.join(","));
      } else if (qMode === "owner_like") {
        qb = qb.filter("owner_id", "like", `%${qRaw}%`);
      }
    }
    return qb;
  };

  const run = async (
    cols: string
  ): Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }> => {
    if (!qRaw || isUuid(qRaw)) {
      const res = await buildQuery(cols, qRaw ? "text_uuid" : "none");
      return {
        data: (res.data as unknown as Record<string, unknown>[]) ?? null,
        error: res.error ? { message: res.error.message } : null,
      };
    }

    const [a, b] = await Promise.all([
      buildQuery(cols, "text_uuid"),
      buildQuery(cols, "owner_like"),
    ]);

    let merged: Record<string, unknown>[] = [];
    if (!a.error && a.data?.length) merged = merged.concat(a.data as unknown as Record<string, unknown>[]);
    if (!b.error && b.data?.length) merged = merged.concat(b.data as unknown as Record<string, unknown>[]);
    if (a.error && b.error) {
      return { data: null, error: { message: a.error.message } };
    }
    merged.sort((x, y) => {
      const tx = new Date(String((x as { created_at?: string }).created_at ?? 0)).getTime();
      const ty = new Date(String((y as { created_at?: string }).created_at ?? 0)).getTime();
      return ty - tx;
    });
    return { data: mergeById(merged, limit), error: null };
  };

  const first = await run(LISTINGS_ADMIN_SELECT_WITH_DETAIL_PAIRS);
  if (!first.error) {
    return { data: first.data ?? [], error: null, detailPairsAvailable: true };
  }

  if (shouldRetrySelectWithoutDetailPairs({ message: first.error.message })) {
    const second = await run(LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_PAIRS);
    if (second.error) {
      return { data: null, error: { message: second.error.message }, detailPairsAvailable: false };
    }
    return { data: second.data ?? [], error: null, detailPairsAvailable: false };
  }

  return { data: null, error: first.error, detailPairsAvailable: true };
}

/** Same matching rules as the legacy in-memory search (substring on id / owner). */
export function listingRowMatchesAdminQuery(
  row: {
    id: string;
    title?: string | null;
    city?: string | null;
    owner_id?: string | null;
    description?: string | null;
  },
  qLower: string
): boolean {
  if (!qLower) return true;
  const id = row.id.toLowerCase();
  const title = (row.title ?? "").toLowerCase();
  const city = (row.city ?? "").toLowerCase();
  const oid = (row.owner_id ?? "").toLowerCase();
  const desc = (row.description ?? "").toLowerCase();
  return (
    id.includes(qLower) ||
    title.includes(qLower) ||
    city.includes(qLower) ||
    oid.includes(qLower) ||
    desc.includes(qLower)
  );
}

/** Distinct category values for filter dropdown (bounded scan). */
export async function fetchListingCategoriesDistinct(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.from("listings").select("category").limit(2000);
  if (error) return [];
  const set = new Set<string>();
  for (const row of data ?? []) {
    const c = (row as { category?: string | null }).category;
    if (c && String(c).trim()) set.add(String(c).trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
