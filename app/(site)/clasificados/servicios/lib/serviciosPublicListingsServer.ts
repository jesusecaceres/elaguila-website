import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";
import {
  getServiciosDevPublishRowBySlug,
  listServiciosDevPublishRows,
} from "./serviciosDevPublishPersistence";
import { getServiciosReviewAggregatesForSlugs } from "./serviciosOpsTablesServer";
import { SERVICIOS_LISTING_STATUS_PUBLISHED } from "./serviciosListingLifecycle";

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
    let q = supabase.from("servicios_public_listings").select(LISTING_SELECT).eq("slug", slug);
    if (visibility === "published_only") {
      q = q.eq("listing_status", SERVICIOS_LISTING_STATUS_PUBLISHED);
    } else if (visibility === "slug_page") {
      q = q.in("listing_status", [...SLUG_PAGE_STATUSES]);
    }
    const { data, error } = await q.maybeSingle();
    if (error || !data) return null;
    const row = data as ServiciosPublicListingRow;
    return {
      ...row,
      listing_status: typeof row.listing_status === "string" ? row.listing_status : "published",
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
  const db = await listServiciosPublicListingsFromDb(limit);
  const dev = listServiciosDevPublishRows();
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
