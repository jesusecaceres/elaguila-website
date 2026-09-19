import "server-only";

import { adminQueueNormalizeLeonixAdId } from "@/app/admin/_lib/adminAdSearch";
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
  package_entitlement_tier?: string | null;
  entitlement_starts_at?: string | null;
  entitlement_ends_at?: string | null;
  entitlement_digital_placement_priority?: number | null;
  entitlement_print_placement_type?: string | null;
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
  /**
   * Exact `status` (closeout 2 round 2). Applied in SQL through the shared query builder, so it
   * narrows BEFORE the row limit on every search path (default, q, and the exact-field path).
   */
  status?: string;
  /** `live` — only publicly published rows (status=published). */
  scope?: "live";
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

export type RestaurantesAdminListOutcome =
  | { ok: true; rows: RestaurantesPublicListingDbRow[]; /** Some search sources failed (rows may be incomplete). */ warning: string | null }
  | { ok: false; rows: []; error: string };

function restauranteUpdatedMs(r: RestaurantesPublicListingDbRow): number {
  const t = r.updated_at ? new Date(r.updated_at).getTime() : NaN;
  return Number.isFinite(t) ? t : 0;
}

/**
 * Admin workspace (service role): all statuses, optional queue filters. Reports a read failure as an ERROR
 * (never an empty list).
 *
 * FILTER SEMANTICS (2026-09 final normalization, Gate 3): `slug`, `id`, `leonix_ad_id`, `owner_user_id`,
 * `status` and `scope` are AND-ed into EVERY query (the shared `qb()` builder), and `q` is a free-text
 * search on top of them — so q + an exact filter is an INTERSECTION, never "the exact filter silently wins".
 * Every predicate runs in SQL BEFORE `.limit(limit)`; each search source reads up to `limit` rows, the merge is
 * ordered newest-first and cut at `limit`.
 */
export async function tryListRestaurantesPublicListingsAdminFromDb(
  opts: RestaurantesAdminQueueFilters = {},
): Promise<RestaurantesAdminListOutcome> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, rows: [], error: "Supabase admin client is not configured (missing URL or service role key)." };
  }
  const limit = Math.min(Math.max(opts.limit ?? 400, 1), 800);
  const slug = opts.slug?.trim();
  const id = opts.id?.trim();
  const leonixAd = opts.leonix_ad_id?.trim();
  const owner = opts.owner_user_id?.trim();
  const qRaw = opts.q?.trim();
  const statusFilter = opts.status?.trim().toLowerCase() ?? "";
  // id / owner_user_id are uuid columns: an .eq on free text makes the WHOLE query error. Say so.
  if (id && !UUID_RE.test(id)) return { ok: false, rows: [], error: "id must be a full UUID" };
  if (owner && !UUID_RE.test(owner)) return { ok: false, rows: [], error: "owner must be a full user UUID" };

  try {
    const supabase = getAdminSupabase();
    /** scope + status + EVERY exact filter — so every path below intersects with them. */
    const qb = () => {
      let q = supabase.from("restaurantes_public_listings").select(LIST_SELECT);
      if (opts.scope === "live") q = q.eq("status", "published");
      if (statusFilter) q = q.eq("status", statusFilter);
      if (slug) q = q.eq("slug", slug);
      if (id) q = q.eq("id", id);
      if (owner) q = q.eq("owner_user_id", owner);
      if (leonixAd) {
        // A complete Leonix Ad ID is an exact (normalized) match; a fragment is a contains match.
        const normLeonixAd = adminQueueNormalizeLeonixAdId(leonixAd);
        q = normLeonixAd
          ? q.eq("leonix_ad_id", normLeonixAd)
          : q.ilike("leonix_ad_id", `%${escapeIlike(leonixAd)}%`);
      }
      return q;
    };

    if (!qRaw) {
      const { data, error } = await qb().order("updated_at", { ascending: false }).limit(limit);
      if (error || !data) return { ok: false, rows: [], error: error?.message || "read failed" };
      return { ok: true, rows: data as RestaurantesPublicListingDbRow[], warning: null };
    }

    const q = qRaw;
    const qLower = q.toLowerCase();
    let firstError: string | null = null;
    const track = (res: { error?: { message: string } | null }) => {
      if (res.error && !firstError) firstError = res.error.message;
    };
    const hit = (res: { data: unknown; error?: { message: string } | null }): RestaurantesPublicListingDbRow[] | null => {
      track(res);
      const rows = res.data as RestaurantesPublicListingDbRow[] | null;
      return !res.error && rows?.length ? rows : null;
    };

    // Identity shortcuts (a pasted Ad ID / UUID / slug / URL resolves that row). qb() carries the exact
    // filters, so a shortcut hit is still INTERSECTED with them.
    if (/^REST-\d{4}-\d{6}$/i.test(q)) {
      const rows = hit(await qb().eq("leonix_ad_id", q.toUpperCase()).limit(20));
      if (rows) return { ok: true, rows, warning: null };
    }
    if (UUID_RE.test(q)) {
      const rows = hit(await qb().or(`id.eq.${q},owner_user_id.eq.${q}`).limit(50));
      if (rows) return { ok: true, rows, warning: null };
    }
    const fromUrl = slugFromRestaurantPublicUrl(q);
    if (fromUrl) {
      const rows = hit(await qb().eq("slug", fromUrl).limit(20));
      if (rows) return { ok: true, rows, warning: null };
    }
    {
      const rows = hit(await qb().eq("slug", qLower).limit(20));
      if (rows) return { ok: true, rows, warning: null };
    }

    const term = `%${escapeIlike(qLower)}%`;
    const textResults = await Promise.all([
      qb().ilike("business_name", term).order("updated_at", { ascending: false }).limit(limit),
      qb().ilike("slug", term).order("updated_at", { ascending: false }).limit(limit),
      qb().ilike("summary_short", term).order("updated_at", { ascending: false }).limit(limit),
      qb().ilike("city_canonical", term).order("updated_at", { ascending: false }).limit(limit),
      qb().ilike("primary_cuisine", term).order("updated_at", { ascending: false }).limit(limit),
      qb().ilike("secondary_cuisine", term).order("updated_at", { ascending: false }).limit(limit),
      qb().ilike("leonix_ad_id", term).order("updated_at", { ascending: false }).limit(limit),
    ]);
    let failedSources = 0;
    let collected: RestaurantesPublicListingDbRow[] = [];
    for (const res of textResults) {
      track(res);
      if (res.error) failedSources += 1;
      else collected = collected.concat((res.data ?? []) as RestaurantesPublicListingDbRow[]);
    }
    let totalSources = textResults.length;

    // Owner-profile search (name / e-mail) merges with the text hits (it used to run only when nothing else matched).
    const profileIds = await fetchProfileIdsMatchingAdminQueueSearch(supabase, qRaw);
    if (profileIds.length > 0) {
      totalSources += 1;
      const byProf = await qb().in("owner_user_id", profileIds).order("updated_at", { ascending: false }).limit(limit);
      track(byProf);
      if (byProf.error) failedSources += 1;
      else collected = collected.concat((byProf.data ?? []) as RestaurantesPublicListingDbRow[]);
    }

    if (collected.length === 0 && failedSources > 0 && failedSources === totalSources) {
      return { ok: false, rows: [], error: firstError ?? "read failed" };
    }
    const merged = mergeRestaurantRowsById(
      [...collected].sort((a, b) => restauranteUpdatedMs(b) - restauranteUpdatedMs(a)),
      limit,
    );
    return {
      ok: true,
      rows: merged,
      warning: failedSources > 0 ? `${failedSources} of ${totalSources} sources` : null,
    };
  } catch (e) {
    return { ok: false, rows: [], error: e instanceof Error ? e.message : String(e) };
  }
}

/** Array form (errors swallowed -> []) kept for the global search / audit callers. The Admin page uses the outcome form. */
export async function listRestaurantesPublicListingsAdminFromDb(
  opts: RestaurantesAdminQueueFilters = {},
): Promise<RestaurantesPublicListingDbRow[]> {
  const out = await tryListRestaurantesPublicListingsAdminFromDb(opts);
  return out.ok ? out.rows : [];
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
