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
import { overlayActiveEntitlementsForServiciosResults } from "./serviciosEntitlementOverlay";
import {
  compareServiciosPublicDiscoveryNewestFirst,
  serviciosLikeCountAliasKeys,
  serviciosNetLikeCountForPublicRow,
  serviciosSavedCountForPublicRow,
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
  // Gate 4 (Servicios Paid-Publish Blocker repair, 2026-09-17): a pending/unpublished row has no
  // real published_at. This must stay null (truthful "—"/"Not published" in the UI) — it must never
  // fall back to `new Date(0).toISOString()`, which renders as Dec 31, 1969 in US Pacific time.
  const published_at =
    typeof r.published_at === "string" && r.published_at.trim() ? r.published_at.trim() : null;
  const updated_at =
    typeof r.updated_at === "string" && r.updated_at.trim() ? r.updated_at.trim() : published_at ?? undefined;
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
  /** Null for pending/unpublished rows (Gate 4, 2026-09-17) — never a fake epoch fallback. */
  published_at: string | null;
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
  /** Row counts in `saved_listings` (same `listing_id` alias rollup as likes). */
  public_save_count?: number;
  /** Row counts in `leonix_endorsement_votes`, keyed strictly by this row's own `id` (never an alias). */
  public_endorsement_count?: number;
  /** Merged from active `listing_package_entitlements` on server reads (C5B). */
  package_entitlement_tier?: string | null;
  entitlement_starts_at?: string | null;
  entitlement_ends_at?: string | null;
  /** Public-safe magazine placement sort key (G2A.5 / G2B). */
  entitlement_digital_placement_priority?: number | null;
  entitlement_print_placement_type?: string | null;
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

/** Row counts in `leonix_endorsement_votes` per canonical `servicios_public_listings.id` — unlike
 * likes/saves, endorsement target_id is strictly the row UUID (the toggle RPC enforces this via a
 * real FK into servicios_public_listings), never a leonix_ad_id/slug alias. */
export async function fetchServiciosEndorsementCountsByListingIds(ids: string[]): Promise<Map<string, number>> {
  const keys = [...new Set(ids.map((k) => k.trim()).filter(Boolean))];
  const out = new Map<string, number>();
  for (const k of keys) out.set(k, 0);
  if (keys.length === 0 || !isSupabaseAdminConfigured()) return out;
  try {
    const supabase = getAdminSupabase();
    const chunkSize = 120;
    for (let i = 0; i < keys.length; i += chunkSize) {
      const chunk = keys.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from("leonix_endorsement_votes")
        .select("target_id")
        .eq("target_type", "servicios_profile")
        .in("target_id", chunk);
      if (error) continue;
      for (const row of data ?? []) {
        const tid = String((row as { target_id?: string }).target_id ?? "").trim();
        if (tid && out.has(tid)) out.set(tid, (out.get(tid) ?? 0) + 1);
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
    // Gate 14 (Servicios Final Consolidated Lifecycle Execution, 2026-09-18) — this `.limit()` had
    // no `.order()` before it, so which rows land in the truncated set was not deterministic once
    // total published rows exceed `fetchCap`: Postgres/PostgREST give no ordering guarantee for an
    // unordered LIMIT, so the same query could silently drop a different arbitrary subset of real
    // published listings on different requests. Ordered on the always-present `published_at`
    // column (the owner's own suggested canonical ordering) purely to make the DB-level truncation
    // deterministic — the existing in-process `compareServiciosPublicDiscoveryNewestFirst` sort
    // below remains the actual final discovery order, and any paid-priority/entitlement ranking
    // applied further downstream by callers (e.g. the results page) is untouched. Deliberately NOT
    // `republish_sort_at` here — Gate 13 explicitly keeps that column unwired from ranking in this
    // pass.
    const { data, error } = await supabase
      .from("servicios_public_listings")
      .select(SERVICIOS_PUBLIC_LISTING_SELECT)
      .ilike("listing_status", SERVICIOS_LISTING_STATUS_PUBLISHED)
      .order("published_at", { ascending: false, nullsFirst: false })
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

/**
 * Gate SERVICIOS-1 — canonical-id read for the publish/republish boundary.
 *
 * The row's own UUID is the durable persistence identity: unlike the slug it never changes when
 * the owner renames the business, so an edit-save can always find and UPDATE the real published
 * row instead of allocating a fresh slug and INSERTing a duplicate. Visibility defaults to "all"
 * because the caller (publish route) must be able to see `pending_payment` / `paused_unpublished`
 * rows it owns, not only public ones.
 */
export async function getServiciosPublicListingByIdFromDb(
  id: string,
  opts?: { visibility?: ServiciosListingSlugDbVisibility },
): Promise<ServiciosPublicListingRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const trimmed = (id ?? "").trim();
  if (!trimmed) return null;
  const visibility = opts?.visibility ?? "all";
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("servicios_public_listings")
      .select(SERVICIOS_PUBLIC_LISTING_SELECT)
      .eq("id", trimmed)
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
 * Raw Supabase published rows + dev workspace file — WITHOUT entitlement overlay.
 * Use when the caller will apply entitlement overlay at a later pipeline stage
 * (e.g. results page applies overlay after filtering for efficiency).
 */
export async function listServiciosPublicListingsRaw(limit = 48): Promise<ServiciosPublicListingRow[]> {
  const dev = listServiciosDevPublishRows();
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
  const endorsementIds = slice.map((r) => (r.id ?? "").trim()).filter(Boolean);
  const [agg, likeMap, saveMap, endorsementMap] = await Promise.all([
    getServiciosReviewAggregatesForSlugs(slice.map((r) => r.slug)),
    fetchServiciosNetLikeCountsByEngagementKeys([...likeQueryKeys]),
    fetchServiciosUserSavedCountsByKeys([...likeQueryKeys]),
    fetchServiciosEndorsementCountsByListingIds(endorsementIds),
  ]);
  return slice.map((r) => {
    const a = agg.get(r.slug);
    const likes = serviciosNetLikeCountForPublicRow(r, likeMap);
    const saves = serviciosSavedCountForPublicRow(r, saveMap);
    const endorsements = endorsementMap.get((r.id ?? "").trim()) ?? 0;
    const base: ServiciosPublicListingRow =
      a != null
        ? { ...r, review_rating_avg: a.avg, review_rating_count: a.count }
        : { ...r, review_rating_avg: null, review_rating_count: null };
    let out = likes > 0 ? { ...base, public_like_net_count: likes } : base;
    out = saves > 0 ? { ...out, public_save_count: saves } : out;
    out = endorsements > 0 ? { ...out, public_endorsement_count: endorsements } : out;
    return out;
  });
}

/**
 * Supabase published rows + optional dev-workspace file + active entitlement overlay.
 * Used by landing page and callers that don't apply their own overlay step.
 *
 * Gate G2A: Results page uses `listServiciosPublicListingsRaw` + explicit overlay
 * after filtering for correct pipeline order and efficiency.
 */
export async function listServiciosPublicListingsForDiscovery(limit = 48): Promise<ServiciosPublicListingRow[]> {
  const rows = await listServiciosPublicListingsRaw(limit);
  return overlayActiveEntitlementsForServiciosResults(rows);
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
  /**
   * Exact `listing_status` (closeout 2 round 2). Applied in SQL through the shared query builder, so it
   * narrows BEFORE the row limit on every search path (default, q, and the exact-field path).
   */
  status?: string;
  /** `live` — only publicly published rows (listing_status=published). */
  scope?: "live";
};

function serviciosUpdatedMs(r: ServiciosPublicListingAdminDbRow): number {
  const t = r.updated_at ? new Date(r.updated_at).getTime() : NaN;
  return Number.isFinite(t) ? t : 0;
}

const SERVICIOS_ADMIN_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Admin workspace queue for `servicios_public_listings` with Phase 4 search (q, slug, id, owner, optional leonix_ad_id).
 *
 * FILTER SEMANTICS (2026-09 final normalization, Gate 3): `slug`, `id`, `leonix_ad_id`, `owner_user_id`, `status`
 * and `scope` are AND-ed into EVERY query (the shared `qb()` builder) and `q` is a free-text search on top of them,
 * so q + an exact filter is an INTERSECTION — previously the exact-field path returned early and silently dropped q.
 * Every predicate runs in SQL BEFORE `.limit(limit)`; each search source reads up to `limit` rows (was a fixed 80,
 * which hid matches when a source had more), the merge is ordered newest-first and cut at `limit`.
 * A failed read is reported (`unavailable` + `readError`), never returned as an empty list; if only SOME search
 * sources fail the rows come back with `readWarning`.
 */
export async function listServiciosPublicListingsAdminQueueFromDb(
  opts: ServiciosAdminQueueFilters = {},
): Promise<{
  rows: ServiciosPublicListingAdminDbRow[];
  fullSchema: boolean;
  unavailable: boolean;
  readError?: string | null;
  /** Some search sources could not be read: rows are returned but may be incomplete. */
  readWarning?: string | null;
}> {
  if (!isSupabaseAdminConfigured()) {
    return { rows: [], fullSchema: true, unavailable: true, readError: "Supabase admin not configured (service role)." };
  }
  const limit = Math.min(Math.max(opts.limit ?? 500, 1), 800);
  const slug = opts.slug?.trim();
  const id = opts.id?.trim();
  const owner = opts.owner_user_id?.trim();
  const leonixParam = opts.leonix_ad_id?.trim();
  const qRaw = opts.q?.trim() ?? "";
  const statusFilter = opts.status?.trim().toLowerCase() ?? "";
  const hasExact = Boolean(slug || id || owner || leonixParam);
  // id / owner_user_id are uuid columns: an .eq on free text makes the WHOLE query error. Say so.
  if (id && !SERVICIOS_ADMIN_UUID_RE.test(id)) return { rows: [], fullSchema: true, unavailable: true, readError: "id must be a full UUID" };
  if (owner && !SERVICIOS_ADMIN_UUID_RE.test(owner)) return { rows: [], fullSchema: true, unavailable: true, readError: "owner must be a full user UUID" };
  const supabase = getAdminSupabase();
  /** scope + status + EVERY exact filter — so every path below intersects with them. */
  const qb = () => {
    let q = supabase.from("servicios_public_listings").select(SERVICIOS_ADMIN_QUEUE_SELECT);
    if (opts.scope === "live") q = q.eq("listing_status", "published");
    if (statusFilter) q = q.eq("listing_status", statusFilter);
    if (slug) q = q.eq("slug", slug);
    if (id) q = q.eq("id", id);
    if (owner) q = q.eq("owner_user_id", owner);
    if (leonixParam) {
      // A complete Leonix Ad ID is an exact (normalized) match; a fragment is a contains match — both in SQL.
      const normLeonixParam = adminQueueNormalizeLeonixAdId(leonixParam);
      q = normLeonixParam
        ? q.eq("leonix_ad_id", normLeonixParam)
        : q.ilike("leonix_ad_id", `%${escapeIlikeServicios(leonixParam)}%`);
    }
    return q;
  };
  const columnMissing = (message: string) => /column|does not exist|schema cache/i.test(message);

  try {
    if (!qRaw) {
      const { data, error } = await qb().order("updated_at", { ascending: false }).limit(limit);
      if (!error) return { rows: (data ?? []) as ServiciosPublicListingAdminDbRow[], fullSchema: true, unavailable: false };
      if (columnMissing(error.message)) {
        if (hasExact) {
          return { rows: [], fullSchema: false, unavailable: true, readError: "Column missing on servicios_public_listings." };
        }
        // Reduced-schema mode has no listing_status to filter on — never return unfiltered rows for a status / live
        // filter, and never present that as an empty result: report it.
        if (statusFilter || opts.scope === "live") {
          return {
            rows: [],
            fullSchema: false,
            unavailable: true,
            readError: "Reduced schema: the listing_status column is missing, so status / Live cannot be read. Apply the Servicios migrations.",
          };
        }
        const leg = await supabase
          .from("servicios_public_listings")
          .select("id, slug, business_name, city, published_at, leonix_verified")
          .order("published_at", { ascending: false })
          .limit(limit);
        if (leg.error) return { rows: [], fullSchema: false, unavailable: true, readError: "Table servicios_public_listings missing or unreadable." };
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
      return { rows: [], fullSchema: true, unavailable: true, readError: "Service role read failed." };
    }

    const q = qRaw;
    const qLower = q.toLowerCase();
    let firstError: string | null = null;
    const track = (res: { error?: { message: string } | null }) => {
      if (res.error && !firstError) firstError = res.error.message;
    };
    const hit = (res: { data: unknown; error?: { message: string } | null }): ServiciosPublicListingAdminDbRow[] | null => {
      track(res);
      const rows = res.data as ServiciosPublicListingAdminDbRow[] | null;
      return !res.error && rows?.length ? rows : null;
    };
    const okRows = (rows: ServiciosPublicListingAdminDbRow[]) => ({ rows, fullSchema: true, unavailable: false });

    // Identity shortcuts (a pasted UUID / Ad ID / slug / URL resolves that row). qb() carries the exact
    // filters, so a shortcut hit is still INTERSECTED with them.
    if (adminQueueIsUuid(q)) {
      const rows = hit(await qb().or(`id.eq.${q},owner_user_id.eq.${q}`).limit(50));
      if (rows) return okRows(rows);
    }
    const normLeonixQ = adminQueueNormalizeLeonixAdId(q);
    if (normLeonixQ) {
      const rows = hit(await qb().eq("leonix_ad_id", normLeonixQ).limit(20));
      if (rows) return okRows(rows);
    }
    const fromUrl = adminQueueExtractServiciosSlugFromUrl(q);
    if (fromUrl) {
      const rows = hit(await qb().eq("slug", fromUrl).limit(20));
      if (rows) return okRows(rows);
    }
    {
      const rows = hit(await qb().eq("slug", qLower).limit(20));
      if (rows) return okRows(rows);
    }

    const term = `%${escapeIlikeServicios(qLower)}%`;
    const textResults = await Promise.all([
      qb().ilike("business_name", term).order("updated_at", { ascending: false }).limit(limit),
      qb().ilike("slug", term).order("updated_at", { ascending: false }).limit(limit),
      qb().ilike("leonix_ad_id", term).order("updated_at", { ascending: false }).limit(limit),
    ]);
    let failedSources = 0;
    let collected: ServiciosPublicListingAdminDbRow[] = [];
    for (const res of textResults) {
      track(res);
      if (res.error) failedSources += 1;
      else collected = collected.concat((res.data ?? []) as ServiciosPublicListingAdminDbRow[]);
    }
    let totalSources = textResults.length;

    const profileIds = await fetchProfileIdsMatchingAdminQueueSearch(supabase, qRaw);
    if (profileIds.length > 0) {
      totalSources += 1;
      const profRes = await qb().in("owner_user_id", profileIds).order("updated_at", { ascending: false }).limit(limit);
      track(profRes);
      if (profRes.error) failedSources += 1;
      else collected = collected.concat((profRes.data ?? []) as ServiciosPublicListingAdminDbRow[]);
    }

    if (collected.length === 0 && failedSources > 0 && failedSources === totalSources) {
      const message = firstError ?? "";
      return {
        rows: [],
        fullSchema: !columnMissing(message),
        unavailable: true,
        readError: columnMissing(message) ? "Column missing on servicios_public_listings." : "Service role read failed.",
      };
    }
    const merged = mergeServiciosAdminRows(
      [...collected].sort((a, b) => serviciosUpdatedMs(b) - serviciosUpdatedMs(a)),
      limit,
    );
    return {
      rows: merged,
      fullSchema: true,
      unavailable: false,
      readWarning: failedSources > 0 ? `${failedSources} of ${totalSources} sources` : null,
    };
  } catch {
    return { rows: [], fullSchema: false, unavailable: true, readError: "Service role read failed." };
  }
}
