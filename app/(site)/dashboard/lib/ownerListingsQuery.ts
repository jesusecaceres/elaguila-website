/**
 * Owner listing fetch with tiered SELECT — mirrors admin pattern when optional columns differ by environment.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { missingListingsColumnName, stripSelectColumn } from "@/app/clasificados/lib/listingsSelectShrink";
import { isListingUuid } from "@/app/lib/listingSaveDbKey";

/**
 * Gate I.4.1 — `views` deliberately excluded: the production `listings` table has no such
 * column (confirmed PostgREST 42703, "column listings.views does not exist"). The dashboard's
 * displayed view count already comes from `aggregateListingAnalyticsEvents`
 * (`resolveViews()` in `mis-anuncios/page.tsx` takes `Math.max(analyticsViews, row.views ?? 0)`,
 * so a always-0/never-present `views` field here changes nothing visible) — requesting it only
 * ever bought a guaranteed failed round trip before the tiered retry stripped it back out.
 */
const CORE =
  "id,leonix_ad_id,title,price,city,zip,status,created_at,category,seller_type,images,detail_pairs,republished_at,republish_count,original_price,current_price,price_last_updated,is_published";

/** Extra columns when present (tiered fallback on unknown columns). */
const WITH_BR_INVENTORY = `${CORE}, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role`;
const WITH_OPTIONAL_META = `${WITH_BR_INVENTORY}, updated_at, published_at, business_name, expires_at`;
const WITH_TIMESTAMPS = `${WITH_BR_INVENTORY}, updated_at, published_at`;

export type OwnerListingFetchMeta = {
  optionalMetaAvailable: boolean;
  /** False when republish columns are missing in the connected `listings` schema. */
  republishColsAvailable: boolean;
};

/**
 * Gate 2A — session-scoped capability cache around the tiered SELECT above.
 *
 * The tier/column definitions, the missing-column detection, and the stripping loop above
 * are all unchanged. This cache only remembers the exact column string that last succeeded
 * for `public.listings` in this browser session, so repeat page loads (owner navigating away
 * and back, refreshing, switching category tabs) can skip straight to the working shape
 * instead of re-discovering it via failed round trips every time. It is intentionally NOT
 * persisted to localStorage (schema drift across a deploy should be re-discovered on the next
 * new session, not remembered forever) and is safe to no-op in any non-browser/SSR context —
 * it degrades to "always rediscover", never to "always fail".
 */
let cachedWorkingListingsSelect: string | null = null;

function readCachedListingsSelect(): string | null {
  if (cachedWorkingListingsSelect) return cachedWorkingListingsSelect;
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  try {
    return window.sessionStorage.getItem("lx_owner_listings_select_v1") || null;
  } catch {
    return null;
  }
}

function writeCachedListingsSelect(cols: string): void {
  cachedWorkingListingsSelect = cols;
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem("lx_owner_listings_select_v1", cols);
  } catch {
    /* ignore — cache is a best-effort shortcut, never required for correctness */
  }
}

function clearCachedListingsSelect(): void {
  cachedWorkingListingsSelect = null;
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem("lx_owner_listings_select_v1");
  } catch {
    /* ignore */
  }
}

export async function fetchOwnerListingsForDashboard(
  sb: SupabaseClient,
  ownerId: string,
): Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null; meta: OwnerListingFetchMeta }> {
  const tiers: Array<{ cols: string; rich: boolean }> = [
    { cols: WITH_OPTIONAL_META, rich: true },
    { cols: WITH_TIMESTAMPS, rich: true },
    { cols: CORE, rich: false },
  ];

  // Try the previously-successful shape first, if this session has already discovered one.
  // A cache hit skips the full tiered fallback entirely; a cache miss/failure falls straight
  // through to the existing, unmodified discovery loop below — the cache never hides a real
  // schema failure, it only shortcuts a *known-good* shape.
  const cachedCols = readCachedListingsSelect();
  if (cachedCols) {
    const res = await sb.from("listings").select(cachedCols).eq("owner_id", ownerId).order("created_at", { ascending: false });
    if (!res.error) {
      const rich = cachedCols === WITH_OPTIONAL_META || cachedCols === WITH_TIMESTAMPS;
      return {
        data: (res.data as unknown as Record<string, unknown>[]) ?? [],
        error: null,
        meta: {
          optionalMetaAvailable: rich,
          republishColsAvailable: cachedCols.split(",").some((s) => s.trim() === "republished_at"),
        },
      };
    }
    // Cached shape no longer works (e.g. schema changed mid-session) — drop it and fall back
    // to full discovery below, exactly as if there had been no cache at all.
    clearCachedListingsSelect();
  }

  let lastErr: { message: string } | null = null;
  for (const tier of tiers) {
    let cols = tier.cols;
    let republishColsAvailable = cols.split(",").some((s) => s.trim() === "republished_at");
    for (let attempt = 0; attempt < 32; attempt++) {
      const res = await sb.from("listings").select(cols).eq("owner_id", ownerId).order("created_at", { ascending: false });
      if (!res.error) {
        writeCachedListingsSelect(cols);
        return {
          data: (res.data as unknown as Record<string, unknown>[]) ?? [],
          error: null,
          meta: { optionalMetaAvailable: tier.rich, republishColsAvailable },
        };
      }
      lastErr = { message: res.error.message };
      const bad = missingListingsColumnName(res.error);
      if (!bad) break;
      const next = stripSelectColumn(cols, bad);
      if (next === cols) break;
      cols = next;
      if (bad === "republished_at" || bad === "republish_count") republishColsAvailable = false;
    }
  }

  return {
    data: null,
    error: lastErr,
    meta: { optionalMetaAvailable: false, republishColsAvailable: true },
  };
}

/**
 * Owner-safe single listing fetch for workspace / analytics (matches edit-route owner filter).
 * Resolves internal UUID or Leonix ad id; strips missing columns like dashboard list fetch.
 */
export async function fetchOwnerListingForWorkspace(
  sb: SupabaseClient,
  ownerId: string,
  idOrLeonixId: string,
): Promise<{ row: Record<string, unknown> | null; error: { message: string } | null }> {
  const key = idOrLeonixId.trim();
  if (!key) return { row: null, error: null };

  const tiers = [
    { cols: WITH_OPTIONAL_META },
    { cols: WITH_TIMESTAMPS },
    { cols: CORE },
  ];

  const tryFetch = async (column: "id" | "leonix_ad_id", value: string) => {
    for (const tier of tiers) {
      let cols = tier.cols;
      for (let attempt = 0; attempt < 32; attempt++) {
        const res = await sb
          .from("listings")
          .select(cols)
          .eq("owner_id", ownerId)
          .eq(column, value)
          .maybeSingle();
        if (!res.error && res.data) {
          return res.data as unknown as Record<string, unknown>;
        }
        if (res.error) {
          const bad = missingListingsColumnName(res.error);
          if (!bad) return null;
          const next = stripSelectColumn(cols, bad);
          if (next === cols) break;
          cols = next;
          continue;
        }
        return null;
      }
    }
    return null;
  };

  let row: Record<string, unknown> | null = null;
  if (isListingUuid(key)) {
    row = await tryFetch("id", key);
  }
  if (!row) {
    row = await tryFetch("leonix_ad_id", key);
  }
  if (!row && !isListingUuid(key)) {
    row = await tryFetch("id", key);
  }

  return { row, error: null };
}

/** Normalize row for UI — all fields optional for forward compatibility */
export function mapOwnerListingRow(r: Record<string, unknown>) {
  return {
    id: String(r.id ?? ""),
    leonix_ad_id: (() => {
      const v = r.leonix_ad_id;
      return typeof v === "string" && v.trim() ? v.trim() : null;
    })(),
    title: (r.title as string | null | undefined) ?? null,
    price: r.price ?? null,
    city: (r.city as string | null | undefined) ?? null,
    zip: (r.zip as string | null | undefined) ?? null,
    status: (r.status as string | null | undefined) ?? null,
    created_at: (r.created_at as string | null | undefined) ?? null,
    updated_at: (r.updated_at as string | null | undefined) ?? null,
    published_at: (r.published_at as string | null | undefined) ?? null,
    expires_at: (r.expires_at as string | null | undefined) ?? null,
    category: (r.category as string | null | undefined) ?? null,
    seller_type: (r.seller_type as string | null | undefined) ?? null,
    business_name: (r.business_name as string | null | undefined) ?? null,
    images: r.images ?? null,
    detail_pairs: r.detail_pairs ?? null,
    republished_at: (r.republished_at as string | null | undefined) ?? null,
    republish_count: typeof r.republish_count === "number" ? r.republish_count : null,
    views: typeof r.views === "number" ? r.views : null,
    original_price: r.original_price ?? null,
    current_price: r.current_price ?? null,
    price_last_updated: (r.price_last_updated as string | null | undefined) ?? null,
    is_published: typeof r.is_published === "boolean" ? r.is_published : (r.is_published as boolean | null) ?? null,
    br_inventory_group_id: (r.br_inventory_group_id as string | null | undefined) ?? null,
    br_inventory_parent_listing_id: (r.br_inventory_parent_listing_id as string | null | undefined) ?? null,
    inventory_role: (r.inventory_role as string | null | undefined) ?? null,
  };
}
