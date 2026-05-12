import "server-only";

import { fetchProfileIdsMatchingAdminQueueSearch } from "@/app/lib/supabase/adminQueueProfileSearch";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export { isSupabaseAdminConfigured };

/** Row shape returned from Supabase (snake_case). */
export type RestaurantesPublicListingDbRow = {
  id: string;
  slug: string;
  /** Stable public Leonix ad code (`REST-YYYY-000001`); present once migration `20260505140000` is applied. */
  leonix_ad_id?: string | null;
  owner_user_id: string | null;
  draft_listing_id: string | null;
  status: string;
  package_tier: string | null;
  leonix_verified: boolean;
  promoted: boolean;
  published_at: string;
  updated_at: string;
  business_name: string;
  city_canonical: string;
  zip_code: string | null;
  neighborhood: string | null;
  primary_cuisine: string | null;
  secondary_cuisine: string | null;
  business_type: string | null;
  price_level: string | null;
  service_modes: unknown;
  moving_vendor: boolean;
  home_based_business: boolean;
  food_truck: boolean;
  pop_up: boolean;
  highlights: unknown;
  summary_short: string | null;
  hero_image_url: string | null;
  external_rating_value: number | null;
  external_review_count: number | null;
  listing_json: unknown;
  republished_at?: string | null;
  republish_count?: number | null;
  republish_override?: boolean | null;
};

const LIST_SELECT =
  "id, slug, leonix_ad_id, owner_user_id, draft_listing_id, status, package_tier, leonix_verified, promoted, published_at, updated_at, republished_at, republish_count, republish_override, business_name, city_canonical, zip_code, neighborhood, primary_cuisine, secondary_cuisine, business_type, price_level, service_modes, moving_vendor, home_based_business, food_truck, pop_up, highlights, summary_short, hero_image_url, external_rating_value, external_review_count, listing_json";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function escapeIlike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function slugFromRestaurantPublicUrl(input: string): string | null {
  const m = input.trim().match(/\/clasificados\/restaurantes\/([^/?#]+)/i);
  return m?.[1] ? decodeURIComponent(m[1]).trim() || null : null;
}

function mergeRestaurantRowsById(rows: RestaurantesPublicListingDbRow[], cap: number): RestaurantesPublicListingDbRow[] {
  const seen = new Set<string>();
  const out: RestaurantesPublicListingDbRow[] = [];
  for (const r of rows) {
    if (!r.id || seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
    if (out.length >= cap) break;
  }
  return out;
}

export type RestaurantesAdminQueueFilters = {
  limit?: number;
  q?: string;
  slug?: string;
  id?: string;
  leonix_ad_id?: string;
  owner_user_id?: string;
};

export type ListRestaurantesPublicListingsOutcome =
  | { ok: true; rows: RestaurantesPublicListingDbRow[] }
  | { ok: false; rows: []; error: string };

/**
 * Published rows for discovery surfaces. Orders by `updated_at` (baseline column) so reads succeed even when
 * optional migrations (e.g. generated `republish_sort_at`) are not present — admin queue uses the same fallback.
 */
export async function tryListRestaurantesPublicListingsFromDb(limit = 200): Promise<ListRestaurantesPublicListingsOutcome> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, rows: [], error: "Supabase admin client is not configured (missing URL or service role key)." };
  }
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("restaurantes_public_listings")
      .select(LIST_SELECT)
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) {
      return { ok: false, rows: [], error: error.message || String(error) };
    }
    if (!data) return { ok: true, rows: [] };
    return { ok: true, rows: data as RestaurantesPublicListingDbRow[] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, rows: [], error: msg };
  }
}

export async function listRestaurantesPublicListingsFromDb(limit = 200): Promise<RestaurantesPublicListingDbRow[]> {
  const out = await tryListRestaurantesPublicListingsFromDb(limit);
  return out.ok ? out.rows : [];
}

export async function listPromotedRestaurantesPublicListingsFromDb(limit = 8): Promise<RestaurantesPublicListingDbRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("restaurantes_public_listings")
      .select(LIST_SELECT)
      .eq("status", "published")
      .eq("promoted", true)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as RestaurantesPublicListingDbRow[];
  } catch {
    return [];
  }
}

export async function countRestaurantesPublicListingsFromDb(): Promise<number> {
  if (!isSupabaseAdminConfigured()) return 0;
  try {
    const supabase = getAdminSupabase();
    const { count, error } = await supabase
      .from("restaurantes_public_listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");
    if (error) return 0;
    return typeof count === "number" ? count : 0;
  } catch {
    return 0;
  }
}

export async function getRestaurantePublicListingBySlugFromDb(slug: string): Promise<RestaurantesPublicListingDbRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const s = slug.trim();
  if (!s) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("restaurantes_public_listings")
      .select(LIST_SELECT)
      .eq("slug", s)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return null;
    return data as RestaurantesPublicListingDbRow;
  } catch {
    return null;
  }
}

/**
 * Admin workspace (service role): all statuses, optional queue filters.
 * Supports `q`, `slug`, `id`, `leonix_ad_id`, `owner_user_id` (combined as AND when multiple set).
 */
export async function listRestaurantesPublicListingsAdminFromDb(
  opts: RestaurantesAdminQueueFilters = {},
): Promise<RestaurantesPublicListingDbRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const limit = Math.min(Math.max(opts.limit ?? 400, 1), 800);
  const slug = opts.slug?.trim();
  const id = opts.id?.trim();
  const leonixAd = opts.leonix_ad_id?.trim();
  const owner = opts.owner_user_id?.trim();
  const qRaw = opts.q?.trim();

  try {
    const supabase = getAdminSupabase();
    const qb = () => supabase.from("restaurantes_public_listings").select(LIST_SELECT);

    if (slug || id || leonixAd || owner) {
      let rowQuery = qb();
      if (slug) rowQuery = rowQuery.eq("slug", slug);
      if (id) rowQuery = rowQuery.eq("id", id);
      if (leonixAd) rowQuery = rowQuery.eq("leonix_ad_id", leonixAd.toUpperCase());
      if (owner) rowQuery = rowQuery.eq("owner_user_id", owner);
      const { data, error } = await rowQuery.order("updated_at", { ascending: false }).limit(limit);
      if (error || !data) return [];
      return data as RestaurantesPublicListingDbRow[];
    }

    if (qRaw) {
      const q = qRaw;
      const qLower = q.toLowerCase();

      if (/^REST-\d{4}-\d{6}$/i.test(q)) {
        const { data, error } = await qb().eq("leonix_ad_id", q.toUpperCase()).limit(20);
        if (!error && data?.length) return data as RestaurantesPublicListingDbRow[];
      }

      if (UUID_RE.test(q)) {
        const { data, error } = await qb().or(`id.eq.${q},owner_user_id.eq.${q}`).limit(50);
        if (!error && data?.length) return data as RestaurantesPublicListingDbRow[];
      }

      const fromUrl = slugFromRestaurantPublicUrl(q);
      if (fromUrl) {
        const { data, error } = await qb().eq("slug", fromUrl).limit(20);
        if (!error && data?.length) return data as RestaurantesPublicListingDbRow[];
      }

      const { data: bySlug, error: slugErr } = await qb().eq("slug", qLower).limit(20);
      if (!slugErr && bySlug?.length) return bySlug as RestaurantesPublicListingDbRow[];

      const term = `%${escapeIlike(qLower)}%`;
      const [nameRes, slugRes, summaryRes, cityRes, primCuisineRes, secCuisineRes, leonixRes] = await Promise.all([
        qb().ilike("business_name", term).order("updated_at", { ascending: false }).limit(80),
        qb().ilike("slug", term).order("updated_at", { ascending: false }).limit(80),
        qb().ilike("summary_short", term).order("updated_at", { ascending: false }).limit(80),
        qb().ilike("city_canonical", term).order("updated_at", { ascending: false }).limit(80),
        qb().ilike("primary_cuisine", term).order("updated_at", { ascending: false }).limit(80),
        qb().ilike("secondary_cuisine", term).order("updated_at", { ascending: false }).limit(80),
        qb().ilike("leonix_ad_id", term).order("updated_at", { ascending: false }).limit(80),
      ]);
      const merged = mergeRestaurantRowsById(
        [
          ...((nameRes.data ?? []) as RestaurantesPublicListingDbRow[]),
          ...((slugRes.data ?? []) as RestaurantesPublicListingDbRow[]),
          ...((summaryRes.data ?? []) as RestaurantesPublicListingDbRow[]),
          ...((cityRes.data ?? []) as RestaurantesPublicListingDbRow[]),
          ...((primCuisineRes.data ?? []) as RestaurantesPublicListingDbRow[]),
          ...((secCuisineRes.data ?? []) as RestaurantesPublicListingDbRow[]),
          ...((leonixRes.data ?? []) as RestaurantesPublicListingDbRow[]),
        ],
        100,
      );
      if (merged.length) return merged;

      const profileIds = await fetchProfileIdsMatchingAdminQueueSearch(supabase, qRaw);
      if (profileIds.length > 0) {
        const { data: byProf, error: pErr } = await qb()
          .in("owner_user_id", profileIds)
          .order("updated_at", { ascending: false })
          .limit(limit);
        if (!pErr && byProf?.length) return byProf as RestaurantesPublicListingDbRow[];
      }

      return [];
    }

    const { data, error } = await qb().order("updated_at", { ascending: false }).limit(limit);
    if (error || !data) return [];
    return data as RestaurantesPublicListingDbRow[];
  } catch {
    return [];
  }
}

/** Service role: rows for a specific owner (admin diagnostics). */
export async function listRestaurantesPublicListingsByOwnerIdFromDb(
  ownerUserId: string,
  limit = 100,
): Promise<RestaurantesPublicListingDbRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const id = ownerUserId.trim();
  if (!id) return [];
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("restaurantes_public_listings")
      .select(LIST_SELECT)
      .eq("owner_user_id", id)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as RestaurantesPublicListingDbRow[];
  } catch {
    return [];
  }
}
