import "server-only";

import {
  adminQueueExtractServiciosSlugFromUrl,
  adminQueueIsUuid,
} from "@/app/admin/_lib/adminAdSearch";
import { fetchProfileIdsMatchingAdminQueueSearch } from "@/app/lib/supabase/adminQueueProfileSearch";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";
import {
  getServiciosDevPublishRowBySlug,
  isServiciosDevPublishPersistenceEnabled,
  listServiciosDevPublishRows,
} from "./serviciosDevPublishPersistence";
import { getServiciosReviewAggregatesForSlugs } from "./serviciosOpsTablesServer";
import {
  compareServiciosPublicDiscoveryNewestFirst,
  serviciosLikeCountAliasKeys,
  serviciosNetLikeCountForPublicRow,
  SERVICIOS_PUBLIC_LISTING_SELECT,
} from "./serviciosPublicListingSort";
import {
  SERVICIOS_LISTING_STATUS_PUBLISHED,
} from "./serviciosListingLifecycle";

/** Admin workspace `select()` — includes `leonix_ad_id` for ops search + display. */
const SERVICIOS_ADMIN_QUEUE_SELECT =
  "id, slug, leonix_ad_id, business_name, city, published_at, updated_at, profile_json, leonix_verified, listing_status, internal_group, owner_user_id, moderation_notes";

function normalizeServiciosListingStatus(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return SERVICIOS_LISTING_STATUS_PUBLISHED;
  return raw.trim().toLowerCase();
}

function mapDbRowToServiciosPublicListingRow(r: ServiciosPublicListingRow): ServiciosPublicListingRow {
  const listing_status = normalizeServiciosListingStatus(r.listing_status);
  const published_at =
    typeof r.published_at === "string" && r.published_at.trim() ? r.published_at : new Date(0).toISOString();
  const updated_at =
    typeof r.updated_at === "string" && r.updated_at.trim() ? r.updated_at.trim() : published_at;
  const leonix_ad_id =
    typeof r.leonix_ad_id === "string" && r.leonix_ad_id.trim() ? r.leonix_ad_id.trim() : null;
  const id = typeof r.id === "string" && r.id.trim() ? r.id.trim() : undefined;
  return {
    ...r,
    published_at,
    updated_at,
    listing_status,
    owner_user_id: r.owner_user_id ?? null,
    leonix_ad_id,
    id,
  };
}

export type ServiciosPublicListingRow = {
  /** Row UUID — engagement fallback when `leonix_ad_id` unavailable in edge cases. */
  id?: string | null;
  slug: string;
  business_name: string;
  city: string;
  published_at: string;
  /** Present on `servicios_public_listings` baseline; used for discovery ordering with `published_at`. */
  updated_at?: string;
  /** Optional when DB adds republish migrations — not selected in minimal public read. */
  republished_at?: string | null;
  profile_json: ServiciosBusinessProfile;
  leonix_verified: boolean;
  /** Matches `BusinessTypePreset.internalGroup` — for future filters */
  internal_group: string | null;
  /** See `serviciosListingLifecycle.ts` */
  listing_status: string;
  /** Auth user id of provider (nullable legacy) */
  owner_user_id?: string | null;
  /** Directory ad id (`SERV-YYYY-NNNNNN`) when migration applied; engagement primary key. */
  leonix_ad_id?: string | null;
  /** Approved DB reviews aggregate (optional; discovery + ranking) */
  review_rating_avg?: number | null;
  review_rating_count?: number | null;
  /** Row counts in `user_liked_listings` (alias rollup across leonix_ad_id + id + slug keys). */
  public_like_net_count?: number;
};

/** DB reads for publish/admin — any lifecycle row by slug. */
export type ServiciosListingSlugDbVisibility = "published_only" | "slug_page" | "all";

const SLUG_PAGE_STATUSES = ["published", "paused_unpublished", "pending_review", "rejected", "suspended"] as const;

/** Count rows in `user_liked_listings` per `listing_id` (authoritative public like count when analytics lags). */
export async function fetchServiciosUserLikedCountsByKeys(listingKeys: string[]): Promise<Map<string, number>> {
  const keys = [...new Set(listingKeys.map((k) => k.trim()).filter(Boolean))];
  const out = new Map<string, number>();
  for (const k of keys) out.set(k, 0);
  if (keys.length === 0 || !isSupabaseAdminConfigured()) return out;
  try {
    const supabase = getAdminSupabase();
    const chunkSize = 120;
    for (let i = 0; i < keys.length; i += chunkSize) {
      const chunk = keys.slice(i, i + chunkSize);
      const { data, error } = await supabase.from("user_liked_listings").select("listing_id").in("listing_id", chunk);
      if (error) continue;
      for (const row of data ?? []) {
        const lid = String((row as { listing_id?: string }).listing_id ?? "").trim();
        if (lid && out.has(lid)) out.set(lid, (out.get(lid) ?? 0) + 1);
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

/** Batch public like counts from `user_liked_listings` only (same `listing_id` keys as Like button). */
export async function fetchServiciosNetLikeCountsByEngagementKeys(listingKeys: string[]): Promise<Map<string, number>> {
  return fetchServiciosUserLikedCountsByKeys(listingKeys);
}

/** Row counts in `saved_listings` per `listing_id` (same key model as likes). */
export async function fetchServiciosUserSavedCountsByKeys(listingKeys: string[]): Promise<Map<string, number>> {
  const keys = [...new Set(listingKeys.map((k) => k.trim()).filter(Boolean))];
  const out = new Map<string, number>();
  for (const k of keys) out.set(k, 0);
  if (keys.length === 0 || !isSupabaseAdminConfigured()) return out;
  try {
    const supabase = getAdminSupabase();
    const chunkSize = 120;
    for (let i = 0; i < keys.length; i += chunkSize) {
      const chunk = keys.slice(i, i + chunkSize);
      const { data, error } = await supabase.from("saved_listings").select("listing_id").in("listing_id", chunk);
      if (error) continue;
      for (const row of data ?? []) {
        const lid = String((row as { listing_id?: string }).listing_id ?? "").trim();
        if (lid && out.has(lid)) out.set(lid, (out.get(lid) ?? 0) + 1);
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

export async function listServiciosPublicListingsFromDb(limit = 48): Promise<ServiciosPublicListingRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    /** Fetch enough rows to sort by discovery timestamp in-process (avoids `republish_sort_at` / missing columns). */
    const fetchCap = Math.min(800, Math.max(limit * 4, 120));
    const { data, error } = await supabase
      .from("servicios_public_listings")
      .select(SERVICIOS_PUBLIC_LISTING_SELECT)
      .ilike("listing_status", SERVICIOS_LISTING_STATUS_PUBLISHED)
      .limit(fetchCap);
    if (error || !data) return [];
    return (data as ServiciosPublicListingRow[])
      .map((r) => mapDbRowToServiciosPublicListingRow(r))
      .filter((r) => r.listing_status === SERVICIOS_LISTING_STATUS_PUBLISHED)
      .sort(compareServiciosPublicDiscoveryNewestFirst)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function getServiciosPublicListingBySlugFromDb(
  slug: string,
  opts?: { visibility?: ServiciosListingSlugDbVisibility },
): Promise<ServiciosPublicListingRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const visibility = opts?.visibility ?? "published_only";
  try {
    const supabase = getAdminSupabase();
    /** Fetch by slug only; apply lifecycle filters in code (avoids PostgREST `.in()` edge cases on some projects). */
    const { data, error } = await supabase
      .from("servicios_public_listings")
      .select(SERVICIOS_PUBLIC_LISTING_SELECT)
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    const row = mapDbRowToServiciosPublicListingRow(data as ServiciosPublicListingRow);
    const listingStatus = row.listing_status;
    if (visibility === "published_only") {
      if (listingStatus !== SERVICIOS_LISTING_STATUS_PUBLISHED) return null;
    } else if (visibility === "slug_page") {
      if (!(SLUG_PAGE_STATUSES as readonly string[]).includes(listingStatus)) return null;
    }
    return row;
  } catch {
    return null;
  }
}

export async function listServiciosPublicListingsForOwner(ownerUserId: string, limit = 80): Promise<ServiciosPublicListingRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("servicios_public_listings")
      .select(SERVICIOS_PUBLIC_LISTING_SELECT)
      .eq("owner_user_id", ownerUserId)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as ServiciosPublicListingRow[]).map((r) => mapDbRowToServiciosPublicListingRow(r));
  } catch {
    return [];
  }
}

/**
 * Supabase published rows + optional dev-workspace file (`serviciosDevPublishPersistence`) for local testing.
 * DB row wins when the same slug exists in both.
 */
export async function listServiciosPublicListingsForDiscovery(limit = 48): Promise<ServiciosPublicListingRow[]> {
  const dev = listServiciosDevPublishRows();
  /**
   * When dev rows exist, fetch extra DB rows before merge so a freshly published dev listing
   * is not pushed out of the merged `limit` window by a full DB page (same ordering as results).
   */
  const dbFetchLimit =
    dev.length > 0 && isServiciosDevPublishPersistenceEnabled()
      ? Math.min(800, limit + Math.min(dev.length * 4, 200))
      : limit;
  const db = await listServiciosPublicListingsFromDb(dbFetchLimit);
  const dbSlugs = new Set(db.map((r) => r.slug));
  const merged = [...db];
  for (const r of dev) {
    if (!dbSlugs.has(r.slug)) merged.push(r);
  }
  merged.sort(compareServiciosPublicDiscoveryNewestFirst);
  const slice = merged.slice(0, limit);
  const likeQueryKeys = new Set<string>();
  for (const r of slice) {
    for (const k of serviciosLikeCountAliasKeys(r)) likeQueryKeys.add(k);
  }
  const [agg, likeMap] = await Promise.all([
    getServiciosReviewAggregatesForSlugs(slice.map((r) => r.slug)),
    fetchServiciosNetLikeCountsByEngagementKeys([...likeQueryKeys]),
  ]);
  return slice.map((r) => {
    const a = agg.get(r.slug);
    const likes = serviciosNetLikeCountForPublicRow(r, likeMap);
    const base: ServiciosPublicListingRow =
      a != null
        ? { ...r, review_rating_avg: a.avg, review_rating_count: a.count }
        : { ...r, review_rating_avg: null, review_rating_count: null };
    return likes > 0 ? { ...base, public_like_net_count: likes } : base;
  });
}

export async function getServiciosPublicListingBySlugForDiscovery(slug: string): Promise<ServiciosPublicListingRow | null> {
  const fromDb = await getServiciosPublicListingBySlugFromDb(slug, { visibility: "slug_page" });
  if (fromDb) return fromDb;
  return getServiciosDevPublishRowBySlug(slug);
}

export type ServiciosPublicListingAdminDbRow = {
  id: string;
  slug: string;
  business_name: string;
  city: string;
  published_at: string;
  updated_at: string | null;
  leonix_verified: boolean;
  listing_status: string | null;
  internal_group: string | null;
  owner_user_id: string | null;
  moderation_notes: string | null;
  profile_json: unknown;
  leonix_ad_id?: string | null;
  promoted?: boolean;
  republished_at?: string | null;
  republish_count?: number | null;
  republish_override?: boolean | null;
};

function mergeServiciosAdminRows(rows: ServiciosPublicListingAdminDbRow[], cap: number): ServiciosPublicListingAdminDbRow[] {
  const seen = new Set<string>();
  const out: ServiciosPublicListingAdminDbRow[] = [];
  for (const r of rows) {
    if (!r.id || seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
    if (out.length >= cap) break;
  }
  return out;
}

function escapeIlikeServicios(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export type ServiciosAdminQueueFilters = {
  limit?: number;
  q?: string;
  slug?: string;
  id?: string;
  leonix_ad_id?: string;
  owner_user_id?: string;
};

/**
 * Admin workspace queue for `servicios_public_listings` with Phase 4 search (q, slug, id, owner, optional leonix_ad_id).
 */
export async function listServiciosPublicListingsAdminQueueFromDb(
  opts: ServiciosAdminQueueFilters = {},
): Promise<{ rows: ServiciosPublicListingAdminDbRow[]; fullSchema: boolean; unavailable: boolean }> {
  if (!isSupabaseAdminConfigured()) return { rows: [], fullSchema: true, unavailable: true };
  const limit = Math.min(Math.max(opts.limit ?? 500, 1), 800);
  const slug = opts.slug?.trim();
  const id = opts.id?.trim();
  const owner = opts.owner_user_id?.trim();
  const leonixParam = opts.leonix_ad_id?.trim();
  const qRaw = opts.q?.trim() ?? "";
  const supabase = getAdminSupabase();
  const qb = () => supabase.from("servicios_public_listings").select(SERVICIOS_ADMIN_QUEUE_SELECT);

  try {
    if (slug || id || owner || leonixParam) {
      let rowQuery = qb();
      if (slug) rowQuery = rowQuery.eq("slug", slug);
      if (id) rowQuery = rowQuery.eq("id", id);
      if (owner) rowQuery = rowQuery.eq("owner_user_id", owner);
      if (leonixParam) rowQuery = rowQuery.eq("leonix_ad_id", leonixParam);
      const { data, error } = await rowQuery.order("updated_at", { ascending: false }).limit(limit);
      if (error) {
        if (/column|does not exist|schema cache/i.test(error.message)) return { rows: [], fullSchema: false, unavailable: true };
        return { rows: [], fullSchema: true, unavailable: true };
      }
      const rows = (data ?? []) as ServiciosPublicListingAdminDbRow[];
      return { rows, fullSchema: true, unavailable: false };
    }

    if (qRaw) {
      const q = qRaw;
      const qLower = q.toLowerCase();

      if (adminQueueIsUuid(q)) {
        const { data, error } = await qb().or(`id.eq.${q},owner_user_id.eq.${q}`).limit(50);
        if (!error && data?.length) return { rows: data as ServiciosPublicListingAdminDbRow[], fullSchema: true, unavailable: false };
      }

      const fromUrl = adminQueueExtractServiciosSlugFromUrl(q);
      if (fromUrl) {
        const { data, error } = await qb().eq("slug", fromUrl).limit(20);
        if (!error && data?.length) return { rows: data as ServiciosPublicListingAdminDbRow[], fullSchema: true, unavailable: false };
      }

      const { data: bySlug, error: slugErr } = await qb().eq("slug", qLower).limit(20);
      if (!slugErr && bySlug?.length) return { rows: bySlug as ServiciosPublicListingAdminDbRow[], fullSchema: true, unavailable: false };

      const term = `%${escapeIlikeServicios(qLower)}%`;
      const [nameRes, slugRes] = await Promise.all([
        qb().ilike("business_name", term).order("updated_at", { ascending: false }).limit(80),
        qb().ilike("slug", term).order("updated_at", { ascending: false }).limit(80),
      ]);
      let merged = mergeServiciosAdminRows(
        [...((nameRes.data ?? []) as ServiciosPublicListingAdminDbRow[]), ...((slugRes.data ?? []) as ServiciosPublicListingAdminDbRow[])],
        limit,
      );
      const profileIds = await fetchProfileIdsMatchingAdminQueueSearch(supabase, qRaw);
      if (profileIds.length > 0) {
        const { data: profRows } = await qb().in("owner_user_id", profileIds).order("updated_at", { ascending: false }).limit(limit);
        if (profRows?.length) {
          merged = mergeServiciosAdminRows([...merged, ...(profRows as ServiciosPublicListingAdminDbRow[])], limit);
        }
      }
      if (merged.length) return { rows: merged, fullSchema: true, unavailable: false };
      if (profileIds.length > 0) {
        const { data: profOnly } = await qb().in("owner_user_id", profileIds).order("updated_at", { ascending: false }).limit(limit);
        if (profOnly?.length) return { rows: profOnly as ServiciosPublicListingAdminDbRow[], fullSchema: true, unavailable: false };
      }
      return { rows: [], fullSchema: true, unavailable: false };
    }

    const { data, error } = await qb().order("updated_at", { ascending: false }).limit(limit);
    if (error) {
      if (/column|does not exist|schema cache/i.test(error.message)) {
        const leg = await supabase
          .from("servicios_public_listings")
          .select("id, slug, business_name, city, published_at, leonix_verified")
          .order("published_at", { ascending: false })
          .limit(limit);
        if (leg.error) return { rows: [], fullSchema: false, unavailable: true };
        return {
          rows: (leg.data ?? []).map((r) => ({
            ...(r as ServiciosPublicListingAdminDbRow),
            updated_at: null,
            listing_status: null,
            internal_group: null,
            owner_user_id: null,
            moderation_notes: null,
            profile_json: null,
          })),
          fullSchema: false,
          unavailable: false,
        };
      }
      return { rows: [], fullSchema: true, unavailable: true };
    }
    return { rows: (data ?? []) as ServiciosPublicListingAdminDbRow[], fullSchema: true, unavailable: false };
  } catch {
    return { rows: [], fullSchema: false, unavailable: true };
  }
}
