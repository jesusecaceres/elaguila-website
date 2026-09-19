import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { scanPagedRows } from "@/app/admin/_lib/adminPagedScan";

import type { ViajesStagedLane, ViajesStagedListingRow, ViajesStagedLifecycleStatus } from "./viajesStagedListingTypes";
import { slugifyViajesListingBase } from "./viajesSlugUtils";
import { adminQueueNormalizeLeonixAdId } from "@/app/admin/_lib/adminAdSearch";

export async function allocateUniqueViajesStagedSlug(baseTitle: string): Promise<string> {
  if (!isSupabaseAdminConfigured()) {
    return `${slugifyViajesListingBase(baseTitle)}-${Date.now().toString(36)}`;
  }
  const supabase = getAdminSupabase();
  let candidate = slugifyViajesListingBase(baseTitle);
  for (let i = 0; i < 60; i++) {
    const { data } = await supabase.from("viajes_staged_listings").select("slug").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = i === 0 ? `${slugifyViajesListingBase(baseTitle)}-2` : `${slugifyViajesListingBase(baseTitle)}-${i + 2}`;
  }
  return `${slugifyViajesListingBase(baseTitle)}-${Date.now().toString(36)}`;
}

export async function fetchApprovedViajesStagedRows(): Promise<ViajesStagedListingRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("viajes_staged_listings")
    .select("*")
    .eq("lifecycle_status", "approved")
    .eq("is_public", true)
    .order("republish_sort_at", { ascending: false, nullsFirst: true });
  if (error || !data) return [];
  return data as ViajesStagedListingRow[];
}

export async function fetchViajesStagedRowBySlugPublic(slug: string): Promise<ViajesStagedListingRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("viajes_staged_listings")
    .select("*")
    .eq("slug", slug)
    .eq("lifecycle_status", "approved")
    .eq("is_public", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as ViajesStagedListingRow;
}

export async function fetchAllViajesStagedForAdmin(): Promise<ViajesStagedListingRow[]> {
  return fetchViajesStagedAdminQueue({ limit: 500 });
}

const VIAJES_ADMIN_QUEUE_SELECT =
  "id, slug, title, lifecycle_status, is_public, admin_promoted, leonix_verified, leonix_ad_id, owner_user_id, published_at, updated_at, republish_override, republish_count";

export type ViajesAdminQueueFilters = {
  limit?: number;
  scope?: "live";
  /**
   * Admin search (Leonix Ad ID / title / slug / id substring, case-insensitive). 2026-09 closeout 2 — applied
   * BEFORE the row limit (windowed scan), so an older match is not hidden behind newer non-matches.
   */
  q?: string;
  /**
   * Exact `lifecycle_status` (Admin filter bar Status). 2026-09 final normalization (Gate 3): a SQL predicate,
   * AND-ed with `scope` / `q` / owner / Leonix Ad ID and applied BEFORE the row limit (it used to narrow in memory
   * after the window was read).
   */
  status?: string;
  /** Full owner user UUID (SQL). A partial owner fragment is not expressible in SQL — the page narrows it in memory. */
  owner_user_id?: string;
  /** Leonix Ad ID: complete id -> case-insensitive exact, fragment -> contains (SQL, before the limit). */
  leonix_ad_id?: string;
};

export type ViajesAdminQueueResult = {
  rows: ViajesStagedListingRow[];
  /** Read failure (the array form swallows it into []; this form reports it so the page renders an ERROR, not an empty list). */
  error: string | null;
  /** True when the bounded scan hit its cap before finding `limit` matches — older matches may be missing. */
  scanCapped: boolean;
  /** Raw rows the scan read. */
  scanned: number;
};

/** Pure: same substring rule the Travel Admin page used to apply after the limit. */
export function viajesStagedRowMatchesAdminSearch(
  row: Pick<ViajesStagedListingRow, "id" | "slug" | "title" | "leonix_ad_id">,
  qRaw: string,
): boolean {
  const n = qRaw.trim().toLowerCase();
  if (!n) return true;
  if ((row.leonix_ad_id ?? "").toLowerCase().includes(n)) return true;
  if ((row.title ?? "").toLowerCase().includes(n)) return true;
  if ((row.slug ?? "").toLowerCase().includes(n)) return true;
  if ((row.id ?? "").toLowerCase().includes(n)) return true;
  return false;
}

const VIAJES_ADMIN_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function viajesEscapeLike(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Admin workspace queue — bounded select, optional live scope at SQL level, status / owner / Leonix Ad ID as SQL
 * predicates, optional search (`q`, in the bounded windowed scan) before the limit. Reports a read failure and a
 * scan cap instead of returning [] silently.
 */
export async function fetchViajesStagedAdminQueueDetailed(
  opts: ViajesAdminQueueFilters = {},
): Promise<ViajesAdminQueueResult> {
  if (!isSupabaseAdminConfigured()) {
    return { rows: [], error: "supabase_admin_not_configured", scanCapped: false, scanned: 0 };
  }
  const supabase = getAdminSupabase();
  const cap = Math.min(Math.max(Math.floor(opts.limit ?? 100), 1), 500);
  const search = opts.q?.trim() ?? "";
  const statusFilter = opts.status?.trim().toLowerCase() ?? "";
  const ownerFilter = opts.owner_user_id?.trim() ?? "";
  const leonixFilter = opts.leonix_ad_id?.trim() ?? "";
  if (ownerFilter && !VIAJES_ADMIN_UUID_RE.test(ownerFilter)) {
    return { rows: [], error: "owner must be a full user UUID", scanCapped: false, scanned: 0 };
  }

  const scan = (orderColumn: "republish_sort_at" | "updated_at") =>
    scanPagedRows<ViajesStagedListingRow>({
      limit: cap,
      fetchPage: async (from, to) => {
        let q = supabase
          .from("viajes_staged_listings")
          .select(VIAJES_ADMIN_QUEUE_SELECT)
          .order(orderColumn, orderColumn === "republish_sort_at" ? { ascending: false, nullsFirst: true } : { ascending: false })
          .order("id", { ascending: false })
          .range(from, to);
        if (opts.scope === "live") {
          q = q.eq("lifecycle_status", "approved").eq("is_public", true);
        }
        if (statusFilter) q = q.eq("lifecycle_status", statusFilter);
        if (ownerFilter) q = q.eq("owner_user_id", ownerFilter);
        if (leonixFilter) {
          const norm = adminQueueNormalizeLeonixAdId(leonixFilter);
          q = q.ilike("leonix_ad_id", norm ? viajesEscapeLike(norm) : `%${viajesEscapeLike(leonixFilter)}%`);
        }
        const { data, error } = await q;
        return {
          data: (data as unknown as ViajesStagedListingRow[] | null) ?? null,
          error: error ? { message: error.message } : null,
        };
      },
      accept: search ? (rows) => rows.filter((r) => viajesStagedRowMatchesAdminSearch(r, search)) : undefined,
      getId: (r) => r.id,
    });

  const first = await scan("republish_sort_at");
  if (!first.error) return { rows: first.rows, error: null, scanCapped: first.capped, scanned: first.scanned };

  // CMD-004 / DATA-QUERY-001 schema-drift fallback: `republish_sort_at` is defined
  // by migrations/20260509120000_classifieds_republish_capability.sql, but that
  // migration has not been applied to every environment's viajes_staged_listings
  // table yet. Only fall back for THIS specific, recognized condition — a missing-
  // column error on this exact column — never for any other query failure (network,
  // RLS/permission, invalid query, etc). Those are REPORTED (the page renders an error) and logged, never
  // turned into "no rows to review".
  if (!first.error.includes("republish_sort_at")) {
    console.error("fetchViajesStagedAdminQueue: unexpected query error (not the known schema-drift column)", first.error);
    return { rows: [], error: first.error, scanCapped: false, scanned: first.scanned };
  }
  const fallback = await scan("updated_at");
  if (fallback.error) {
    console.error("fetchViajesStagedAdminQueue: schema-drift fallback query itself failed", fallback.error);
    return { rows: [], error: fallback.error, scanCapped: false, scanned: fallback.scanned };
  }
  return { rows: fallback.rows, error: null, scanCapped: fallback.capped, scanned: fallback.scanned };
}

/** Array form (errors swallowed -> []) kept for the global search / dashboard callers. The Admin page uses the Detailed form. */
export async function fetchViajesStagedAdminQueue(
  opts: ViajesAdminQueueFilters = {},
): Promise<ViajesStagedListingRow[]> {
  const res = await fetchViajesStagedAdminQueueDetailed(opts);
  return res.error ? [] : res.rows;
}

export async function updateViajesStagedListingModeration(input: {
  id: string;
  lifecycle_status: ViajesStagedLifecycleStatus;
  is_public: boolean;
  review_notes?: string | null;
  moderation_reason?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "not_configured" };
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    lifecycle_status: input.lifecycle_status,
    is_public: input.is_public,
    updated_at: now,
    reviewed_at: now,
  };
  if (input.review_notes !== undefined) patch.review_notes = input.review_notes;
  if (input.moderation_reason !== undefined) patch.moderation_reason = input.moderation_reason;
  if (input.lifecycle_status === "approved" && input.is_public) {
    patch.published_at = now;
  }
  if (input.lifecycle_status === "unpublished" || input.lifecycle_status === "rejected" || input.lifecycle_status === "expired") {
    patch.is_public = false;
  }
  const { data: updated, error } = await supabase.from("viajes_staged_listings").update(patch).eq("id", input.id).select("id");
  if (error) return { ok: false, error: error.message };
  // Gate I.13A — a zero-row match must never be reported as success.
  if (!updated || updated.length === 0) return { ok: false, error: "listing_not_found" };
  return { ok: true };
}

export async function countViajesStagedByStatuses(statuses: ViajesStagedLifecycleStatus[]): Promise<number> {
  if (!isSupabaseAdminConfigured()) return 0;
  const supabase = getAdminSupabase();
  const { count, error } = await supabase
    .from("viajes_staged_listings")
    .select("id", { count: "exact", head: true })
    .in("lifecycle_status", statuses);
  if (error || count == null) return 0;
  return count;
}

export type ViajesStagedInsertInput = {
  slug: string;
  lane: ViajesStagedLane;
  /** Required — submit API enforces authenticated owner; DB migration enforces NOT NULL. */
  owner_user_id: string;
  title: string;
  listing_json: Record<string, unknown>;
  hero_image_url: string | null;
  lang: "es" | "en";
  submitter_name: string | null;
  submitter_email: string | null;
  submitter_phone: string | null;
  business_profile_slug?: string | null;
};

export async function insertViajesStagedListing(row: ViajesStagedInsertInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "not_configured" };
  if (!row.owner_user_id?.trim()) return { ok: false, error: "owner_required" };
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("viajes_staged_listings")
    .insert({
      slug: row.slug,
      lane: row.lane,
      owner_user_id: row.owner_user_id,
      title: row.title,
      listing_json: row.listing_json,
      hero_image_url: row.hero_image_url,
      lang: row.lang,
      submitter_name: row.submitter_name,
      submitter_email: row.submitter_email,
      submitter_phone: row.submitter_phone,
      business_profile_slug: row.business_profile_slug ?? null,
      lifecycle_status: "submitted",
      is_public: false,
      submitted_at: now,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  return { ok: true, id: (data as { id: string }).id };
}

export async function fetchViajesStagedRowById(id: string): Promise<ViajesStagedListingRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("viajes_staged_listings").select("*").eq("id", id.trim()).maybeSingle();
  if (error || !data) return null;
  return data as ViajesStagedListingRow;
}

export async function updateViajesStagedListingOwnerRevision(input: {
  id: string;
  owner_user_id: string;
  title: string;
  listing_json: Record<string, unknown>;
  hero_image_url: string | null;
  lang: "es" | "en";
  submitter_name: string | null;
  submitter_email: string | null;
  submitter_phone: string | null;
  /** When resubmitting after review */
  lifecycle_status: ViajesStagedLifecycleStatus;
  is_public: boolean;
}): Promise<{ ok: boolean; error?: string; slug?: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "not_configured" };
  const existing = await fetchViajesStagedRowById(input.id);
  if (!existing || existing.owner_user_id !== input.owner_user_id) return { ok: false, error: "forbidden" };
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("viajes_staged_listings")
    .update({
      title: input.title,
      listing_json: input.listing_json,
      hero_image_url: input.hero_image_url,
      lang: input.lang,
      submitter_name: input.submitter_name,
      submitter_email: input.submitter_email,
      submitter_phone: input.submitter_phone,
      lifecycle_status: input.lifecycle_status,
      is_public: input.is_public,
      submitted_at: input.lifecycle_status === "submitted" ? now : existing.submitted_at,
      updated_at: now,
    })
    .eq("id", input.id)
    .eq("owner_user_id", input.owner_user_id)
    .select("id");
  if (error) return { ok: false, error: error.message };
  // Gate I.13A — a zero-row match (row changed owner/id between the read above and this
  // write) must never be reported as success; also narrows the write itself by owner_user_id
  // rather than relying solely on the prior read for authorization.
  if (!updated || updated.length === 0) return { ok: false, error: "forbidden" };
  return { ok: true, slug: existing.slug };
}

/** Owner queue again — does not touch moderation review timestamps the same way as admin actions. */
export async function ownerResubmitViajesStagedListing(id: string, owner_user_id: string): Promise<{ ok: boolean; error?: string; slug?: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "not_configured" };
  const existing = await fetchViajesStagedRowById(id);
  if (!existing || existing.owner_user_id !== owner_user_id) return { ok: false, error: "forbidden" };
  const allowed: ViajesStagedLifecycleStatus[] = ["changes_requested", "rejected", "draft", "unpublished"];
  if (!allowed.includes(existing.lifecycle_status)) return { ok: false, error: "invalid_state" };
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("viajes_staged_listings")
    .update({
      lifecycle_status: "submitted",
      is_public: false,
      submitted_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .eq("owner_user_id", owner_user_id)
    .select("id");
  if (error) return { ok: false, error: error.message };
  // Gate I.13A — a zero-row match must never be reported as success; also narrows the
  // write itself by owner_user_id rather than relying solely on the prior read.
  if (!updated || updated.length === 0) return { ok: false, error: "forbidden" };
  return { ok: true, slug: existing.slug };
}
