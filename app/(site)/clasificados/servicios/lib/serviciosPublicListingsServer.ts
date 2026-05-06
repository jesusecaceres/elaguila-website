import "server-only";

import {
  adminQueueExtractServiciosSlugFromUrl,
  adminQueueIsUuid,
  adminQueueNormalizeLeonixAdId,
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
import { SERVICIOS_LISTING_STATUS_PUBLISHED } from "./serviciosListingLifecycle";

/** Keep aligned with migrations present on all envs; omit columns not yet applied on older DBs (breaks PostgREST `.select()`). */
const LISTING_SELECT =
  "slug, business_name, city, published_at, profile_json, leonix_verified, internal_group, listing_status, owner_user_id";

export type ServiciosPublicListingRow = {
  slug: string;
  business_name: string;
  city: string;
  published_at: string;
  profile_json: ServiciosBusinessProfile;
  leonix_verified: boolean;
  /** Matches `BusinessTypePreset.internalGroup` — for future filters */
  internal_group: string | null;
  /** See `serviciosListingLifecycle.ts` */
  listing_status: string;
  /** Auth user id of provider (nullable legacy) */
  owner_user_id?: string | null;
  /** Approved DB reviews aggregate (optional; discovery + ranking) */
  review_rating_avg?: number | null;
  review_rating_count?: number | null;
};

/** DB reads for publish/admin — any lifecycle row by slug. */
export type ServiciosListingSlugDbVisibility = "published_only" | "slug_page" | "all";

const SLUG_PAGE_STATUSES = ["published", "paused_unpublished", "pending_review", "rejected", "suspended"] as const;

export async function listServiciosPublicListingsFromDb(limit = 48): Promise<ServiciosPublicListingRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("servicios_public_listings")
      .select(LISTING_SELECT)
      .eq("listing_status", SERVICIOS_LISTING_STATUS_PUBLISHED)
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((r) => ({
      ...r,
      listing_status: typeof (r as ServiciosPublicListingRow).listing_status === "string" ? (r as ServiciosPublicListingRow).listing_status : "published",
      owner_user_id: (r as ServiciosPublicListingRow).owner_user_id ?? null,
    })) as ServiciosPublicListingRow[];
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
    const { data, error } = await supabase.from("servicios_public_listings").select(LISTING_SELECT).eq("slug", slug).maybeSingle();
    if (error || !data) return null;
    const row = data as ServiciosPublicListingRow;
    const listingStatus = typeof row.listing_status === "string" ? row.listing_status : "published";
    if (visibility === "published_only") {
      if (listingStatus !== SERVICIOS_LISTING_STATUS_PUBLISHED) return null;
    } else if (visibility === "slug_page") {
      if (!(SLUG_PAGE_STATUSES as readonly string[]).includes(listingStatus)) return null;
    }
    return {
      ...row,
      listing_status: listingStatus,
      owner_user_id: row.owner_user_id ?? null,
    };
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
      .select(LISTING_SELECT)
      .eq("owner_user_id", ownerUserId)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((r) => ({
      ...r,
      listing_status: typeof (r as ServiciosPublicListingRow).listing_status === "string" ? (r as ServiciosPublicListingRow).listing_status : "published",
      owner_user_id: (r as ServiciosPublicListingRow).owner_user_id ?? null,
    })) as ServiciosPublicListingRow[];
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
  merged.sort((a, b) => {
    if (a.published_at < b.published_at) return 1;
    if (a.published_at > b.published_at) return -1;
    return a.slug.localeCompare(b.slug);
  });
  const slice = merged.slice(0, limit);
  const agg = await getServiciosReviewAggregatesForSlugs(slice.map((r) => r.slug));
  return slice.map((r) => {
    const a = agg.get(r.slug);
    if (!a) return { ...r, review_rating_avg: null, review_rating_count: null };
    return { ...r, review_rating_avg: a.avg, review_rating_count: a.count };
  });
}

export async function getServiciosPublicListingBySlugForDiscovery(slug: string): Promise<ServiciosPublicListingRow | null> {
  const fromDb = await getServiciosPublicListingBySlugFromDb(slug, { visibility: "slug_page" });
  if (fromDb) return fromDb;
  return getServiciosDevPublishRowBySlug(slug);
}

const SERVICIOS_ADMIN_QUEUE_SELECT =
  "id, slug, business_name, city, published_at, updated_at, leonix_verified, listing_status, internal_group, owner_user_id, moderation_notes, profile_json";

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
    if (slug || id || owner) {
      let rowQuery = qb();
      if (slug) rowQuery = rowQuery.eq("slug", slug);
      if (id) rowQuery = rowQuery.eq("id", id);
      if (owner) rowQuery = rowQuery.eq("owner_user_id", owner);
      const { data, error } = await rowQuery.order("updated_at", { ascending: false }).limit(limit);
      if (error) {
        if (/column|does not exist|schema cache/i.test(error.message)) return { rows: [], fullSchema: false, unavailable: true };
        return { rows: [], fullSchema: true, unavailable: true };
      }
      let rows = (data ?? []) as ServiciosPublicListingAdminDbRow[];
      if (leonixParam) {
        const lx = adminQueueNormalizeLeonixAdId(leonixParam) ?? leonixParam.toUpperCase();
        const lxRes = await supabase
          .from("servicios_public_listings")
          .select(SERVICIOS_ADMIN_QUEUE_SELECT)
          .eq("leonix_ad_id", lx)
          .limit(limit);
        if (!lxRes.error && lxRes.data?.length) {
          rows = mergeServiciosAdminRows([...rows, ...(lxRes.data as ServiciosPublicListingAdminDbRow[])], limit);
        }
      }
      return { rows, fullSchema: true, unavailable: false };
    }

    if (leonixParam) {
      const lx = adminQueueNormalizeLeonixAdId(leonixParam) ?? leonixParam.toUpperCase();
      const { data, error } = await supabase
        .from("servicios_public_listings")
        .select(SERVICIOS_ADMIN_QUEUE_SELECT)
        .eq("leonix_ad_id", lx)
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (!error && data?.length) return { rows: data as ServiciosPublicListingAdminDbRow[], fullSchema: true, unavailable: false };
    }

    if (qRaw) {
      const q = qRaw;
      const qLower = q.toLowerCase();

      if (adminQueueIsUuid(q)) {
        const { data, error } = await qb().or(`id.eq.${q},owner_user_id.eq.${q}`).limit(50);
        if (!error && data?.length) return { rows: data as ServiciosPublicListingAdminDbRow[], fullSchema: true, unavailable: false };
      }

      const normLx = adminQueueNormalizeLeonixAdId(q);
      if (normLx) {
        const { data, error } = await qb().eq("leonix_ad_id", normLx).limit(30);
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
