import type { SupabaseClient } from "@supabase/supabase-js";

import { adminQueueNormalizeLeonixAdId } from "@/app/admin/_lib/adminAdSearch";
import { listingsRowIsPublicLive } from "@/app/admin/_lib/classifiedsRepublishCapability";
import { parseLeonixListingContract } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { fetchProfileIdsMatchingAdminQueueSearch } from "@/app/lib/supabase/adminQueueProfileSearch";

const LISTINGS_ADMIN_CORE =
  "id, leonix_ad_id, title, description, city, category, price, is_free, status, owner_id, created_at, images, seller_type, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role";

const LISTINGS_REPUBLISH = ", republished_at, republish_count, republish_override";

/** Columns for Clasificados admin queue — includes JSON used by En Venta visibility helpers. */
export const LISTINGS_ADMIN_SELECT_WITH_DETAIL_PAIRS =
  `${LISTINGS_ADMIN_CORE}, detail_pairs, is_published${LISTINGS_REPUBLISH}`;

/** `detail_pairs` when republish columns are not yet migrated. */
export const LISTINGS_ADMIN_SELECT_WITH_DETAIL_NO_REPUBLISH = `${LISTINGS_ADMIN_CORE}, detail_pairs, is_published`;

/** Same row shape minus `detail_pairs` when the live DB predates that migration. */
export const LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_PAIRS = `${LISTINGS_ADMIN_CORE}, is_published${LISTINGS_REPUBLISH}`;

export const LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_NO_REPUBLISH = `${LISTINGS_ADMIN_CORE}, is_published`;

/** Neither optional column group — minimal admin queue. */
export const LISTINGS_ADMIN_SELECT_MINIMAL = `${LISTINGS_ADMIN_CORE}, is_published`;

/** Staff moderation flags (`20260508140000_classifieds_admin_ops_columns.sql`). */
const LISTINGS_OPS_COLS = ", leonix_verified, admin_promoted";

export const LISTINGS_ADMIN_SELECT_WITH_DETAIL_PAIRS_OPS =
  LISTINGS_ADMIN_SELECT_WITH_DETAIL_PAIRS + LISTINGS_OPS_COLS;
export const LISTINGS_ADMIN_SELECT_WITH_DETAIL_NO_REPUBLISH_OPS =
  LISTINGS_ADMIN_SELECT_WITH_DETAIL_NO_REPUBLISH + LISTINGS_OPS_COLS;
export const LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_PAIRS_OPS =
  LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_PAIRS + LISTINGS_OPS_COLS;
export const LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_NO_REPUBLISH_OPS =
  LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_NO_REPUBLISH + LISTINGS_OPS_COLS;
export const LISTINGS_ADMIN_SELECT_MINIMAL_OPS = LISTINGS_ADMIN_SELECT_MINIMAL + LISTINGS_OPS_COLS;

export type ListingsAdminFetchResult<T> = {
  data: T[] | null;
  error: { message: string; code?: string } | null;
  /** False when we fell back to a select without `detail_pairs`. Apply `supabase/migrations/20250316200000_listings_detail_pairs.sql` (or later ensure migration) on production. */
  detailPairsAvailable: boolean;
  /** False when we fell back to a select without republish columns. Apply `20260509120000_classifieds_republish_capability.sql`. */
  republishColsAvailable: boolean;
};

const ADMIN_LISTING_SELECT_TIERS: Array<{
  cols: string;
  detailPairsAvailable: boolean;
  republishColsAvailable: boolean;
}> = [
  { cols: LISTINGS_ADMIN_SELECT_WITH_DETAIL_PAIRS_OPS, detailPairsAvailable: true, republishColsAvailable: true },
  { cols: LISTINGS_ADMIN_SELECT_WITH_DETAIL_NO_REPUBLISH_OPS, detailPairsAvailable: true, republishColsAvailable: false },
  { cols: LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_PAIRS_OPS, detailPairsAvailable: false, republishColsAvailable: true },
  { cols: LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_NO_REPUBLISH_OPS, detailPairsAvailable: false, republishColsAvailable: false },
  { cols: LISTINGS_ADMIN_SELECT_MINIMAL_OPS, detailPairsAvailable: false, republishColsAvailable: false },
  { cols: LISTINGS_ADMIN_SELECT_WITH_DETAIL_PAIRS, detailPairsAvailable: true, republishColsAvailable: true },
  { cols: LISTINGS_ADMIN_SELECT_WITH_DETAIL_NO_REPUBLISH, detailPairsAvailable: true, republishColsAvailable: false },
  { cols: LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_PAIRS, detailPairsAvailable: false, republishColsAvailable: true },
  { cols: LISTINGS_ADMIN_SELECT_WITHOUT_DETAIL_NO_REPUBLISH, detailPairsAvailable: false, republishColsAvailable: false },
  { cols: LISTINGS_ADMIN_SELECT_MINIMAL, detailPairsAvailable: false, republishColsAvailable: false },
];

/**
 * Load listings for admin moderation. Retries with fewer optional columns if `detail_pairs` and/or republish columns are missing.
 */
export async function fetchListingsForAdminWorkspace(
  supabase: SupabaseClient,
): Promise<ListingsAdminFetchResult<Record<string, unknown>>> {
  let lastErr: { message: string; code?: string } | null = null;

  for (const tier of ADMIN_LISTING_SELECT_TIERS) {
    const res = await supabase
      .from("listings")
      .select(tier.cols)
      .order("created_at", { ascending: false })
      .limit(300);

    if (!res.error) {
      return {
        data: (res.data as unknown as Record<string, unknown>[]) ?? [],
        error: null,
        detailPairsAvailable: tier.detailPairsAvailable,
        republishColsAvailable: tier.republishColsAvailable,
      };
    }
    lastErr = { message: res.error.message, code: res.error.code };
  }

  return {
    data: null,
    error: lastErr,
    detailPairsAvailable: true,
    republishColsAvailable: true,
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
  /** Trimmed search (preserve case for UUID / Leonix-style ids). */
  q?: string;
  category?: string;
  status?: string;
  /** Owner id fragment — full UUID uses SQL eq; partial matched in memory after fetch. */
  ownerFrag?: string;
  limit?: number;
  /**
   * `live` — only rows that are publicly live (published + active, not removed).
   * Omit — full category operational queue (default).
   */
  scope?: "live";
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
  filters: ListingsAdminWorkspaceFilters,
): Promise<ListingsAdminFetchResult<Record<string, unknown>>> {
  const limit = Math.min(Math.max(filters.limit ?? 300, 1), 500);
  const cat = (filters.category ?? "").trim();
  const status = (filters.status ?? "").trim();
  const ownerFrag = (filters.ownerFrag ?? "").trim().toLowerCase();
  const qInput = (filters.q ?? "").trim();
  const qLower = qInput.toLowerCase();
  const safeQ = escapeIlike(qLower);

  /**
   * Category / status values in `listings` are not guaranteed to match registry casing (e.g. `Rentas` vs `rentas`).
   * Use case-insensitive `ilike` without wildcards so the filter stays an exact string match.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PostgREST builder chain (or/filter/in) is wider than a narrow helper type.
  const applyNonCategoryListingFilters = (qb: any): any => {
    let q = qb;
    if (status) q = q.ilike("status", escapeIlike(status));
    if (ownerFrag && isUuid(ownerFrag)) {
      q = q.eq("owner_id", ownerFrag);
    }
    return q;
  };

  const applyListingFilters = (qb: any): any => {
    let q = qb;
    if (cat) q = q.ilike("category", escapeIlike(cat));
    return applyNonCategoryListingFilters(q);
  };

  const buildQuery = (cols: string, qMode: "none" | "text_uuid" | "owner_like") => {
    let qb = applyListingFilters(
      supabase.from("listings").select(cols).order("created_at", { ascending: false }).limit(limit),
    );
    if (qLower) {
      if (qMode === "text_uuid") {
        const parts = [`title.ilike.%${safeQ}%`, `city.ilike.%${safeQ}%`];
        if (!isUuid(qInput)) {
          parts.push(`description.ilike.%${safeQ}%`);
          parts.push(`leonix_ad_id.ilike.%${safeQ}%`);
        }
        if (isUuid(qInput)) {
          parts.push(`id.eq.${qInput}`);
          parts.push(`owner_id.eq.${qInput}`);
        }
        qb = qb.or(parts.join(","));
      } else if (qMode === "owner_like") {
        qb = qb.filter("owner_id", "ilike", `%${qLower}%`);
      }
    }
    return qb;
  };

  const run = async (
    cols: string,
    detailPairsAvailable: boolean,
  ): Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }> => {
    let merged: Record<string, unknown>[] = [];

    if (!qLower) {
      const res = await buildQuery(cols, "none");
      if (res.error) return { data: null, error: { message: res.error.message } };
      merged = (res.data as unknown as Record<string, unknown>[]) ?? [];
    } else if (isUuid(qInput)) {
      const res = await buildQuery(cols, "text_uuid");
      if (res.error) return { data: null, error: { message: res.error.message } };
      merged = (res.data as unknown as Record<string, unknown>[]) ?? [];
    } else {
      const [a, b] = await Promise.all([buildQuery(cols, "text_uuid"), buildQuery(cols, "owner_like")]);
      if (a.error && b.error) {
        return { data: null, error: { message: a.error.message } };
      }
      if (!a.error && a.data?.length) merged = merged.concat(a.data as unknown as Record<string, unknown>[]);
      if (!b.error && b.data?.length) merged = merged.concat(b.data as unknown as Record<string, unknown>[]);
      merged.sort((x, y) => {
        const tx = new Date(String((x as { created_at?: string }).created_at ?? 0)).getTime();
        const ty = new Date(String((y as { created_at?: string }).created_at ?? 0)).getTime();
        return ty - tx;
      });
    }

    const normLeonix = adminQueueNormalizeLeonixAdId(qInput);
    if (normLeonix) {
      const lxb = applyListingFilters(
        supabase
          .from("listings")
          .select(cols)
          .eq("leonix_ad_id", normLeonix)
          .order("created_at", { ascending: false })
          .limit(limit),
      );
      const lx = await lxb;
      if (!lx.error && lx.data?.length) {
        merged = merged.concat(lx.data as unknown as Record<string, unknown>[]);
      }
    }

    if (qInput.length >= 2) {
      const profileIds = await fetchProfileIdsMatchingAdminQueueSearch(supabase, qInput);
      if (profileIds.length > 0) {
        const pb = applyListingFilters(
          supabase
            .from("listings")
            .select(cols)
            .in("owner_id", profileIds)
            .order("created_at", { ascending: false })
            .limit(limit),
        );
        const pr = await pb;
        if (!pr.error && pr.data?.length) {
          merged = merged.concat(pr.data as unknown as Record<string, unknown>[]);
        }
      }
    }

    /**
     * Rentas queue: primary rows use `listings.category` ~ rentas; some rent inventory is filed under
     * `category=bienes-raices` with `detail_pairs` → Leonix:operation = rent (see `leonixRealEstateListingContract`).
     * When there is no text search, merge those rent-operation rows so the admin queue matches public Rentas.
     */
    if (cat.toLowerCase() === "rentas" && !qLower && detailPairsAvailable) {
      let brQ = supabase
        .from("listings")
        .select(cols)
        .ilike("category", escapeIlike("bienes-raices"))
        .order("created_at", { ascending: false })
        .limit(limit);
      brQ = applyNonCategoryListingFilters(brQ);
      const brRes = await brQ;
      if (!brRes.error && brRes.data?.length) {
        const rentOnly = (brRes.data as unknown as Record<string, unknown>[]).filter(
          (r) => parseLeonixListingContract((r as { detail_pairs?: unknown }).detail_pairs).operation === "rent",
        );
        merged = merged.concat(rentOnly);
      }
    }

    merged.sort((x, y) => {
      const tx = new Date(String((x as { created_at?: string }).created_at ?? 0)).getTime();
      const ty = new Date(String((y as { created_at?: string }).created_at ?? 0)).getTime();
      return ty - tx;
    });

    if (filters.scope === "live") {
      merged = merged.filter((r) => listingsRowIsPublicLive(r as Record<string, unknown>));
    }

    return { data: mergeById(merged, limit), error: null };
  };

  let lastErr: { message: string } | null = null;

  for (const tier of ADMIN_LISTING_SELECT_TIERS) {
    const result = await run(tier.cols, tier.detailPairsAvailable);
    if (!result.error) {
      return {
        data: result.data ?? [],
        error: null,
        detailPairsAvailable: tier.detailPairsAvailable,
        republishColsAvailable: tier.republishColsAvailable,
      };
    }
    lastErr = result.error;
  }

  return {
    data: null,
    error: lastErr,
    detailPairsAvailable: true,
    republishColsAvailable: true,
  };
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
  qLower: string,
): boolean {
  if (!qLower) return true;
  const id = row.id.toLowerCase();
  const title = (row.title ?? "").toLowerCase();
  const city = (row.city ?? "").toLowerCase();
  const oid = (row.owner_id ?? "").toLowerCase();
  const desc = (row.description ?? "").toLowerCase();
  const lx = String((row as { leonix_ad_id?: string | null }).leonix_ad_id ?? "")
    .trim()
    .toLowerCase();
  return (
    id.includes(qLower) ||
    title.includes(qLower) ||
    city.includes(qLower) ||
    oid.includes(qLower) ||
    desc.includes(qLower) ||
    (lx.length > 0 && lx.includes(qLower))
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
