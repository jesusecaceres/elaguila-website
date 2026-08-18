/**
 * Saved Search 02 — server-side owner-scoped CRUD, category-agnostic (works for Autos today;
 * Bienes Raíces/Rentas reuse this unchanged once their adapters exist).
 *
 * Follows this repo's established owner-scoped-table convention (route handler resolves
 * `ownerId` via `getBearerUserId`, then uses the service-role admin client with every query
 * explicitly scoped to that id — see `app/api/ofertas-locales/owner/**`,
 * `app/api/verified-intro-discount/phone/request/route.ts`) rather than the separate
 * pure-browser-client + RLS-only pattern `saved_listings` (favorites) uses. RLS on
 * `saved_searches` (`auth.uid() = user_id`, from `20260817120000_saved_searches_v1_reconcile.sql`)
 * still applies as defense-in-depth — it just isn't the only thing enforcing ownership here,
 * because the admin client bypasses it; every function below stamps/filters `user_id` itself.
 *
 * Ownership is always the caller-supplied `ownerId` (an auth user UUID resolved server-side by
 * the route handler) — never an email, and never a value read from the request body.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildSavedSearchFingerprint, canonicalizeSavedSearch } from "./savedSearchCanonicalize";
import type { SavedSearchNormalizedInput, SavedSearchRow } from "./savedSearchTypes";

const TABLE = "saved_searches";

type SavedSearchDbRow = {
  id: string;
  category: string;
  city: string;
  min_price: number | null;
  max_price: number | null;
  filter_payload: Record<string, unknown> | null;
  fingerprint: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function rowFromDb(row: SavedSearchDbRow): SavedSearchRow {
  return {
    id: row.id,
    category: row.category,
    city: row.city,
    minPrice: row.min_price,
    maxPrice: row.max_price,
    filterPayload: row.filter_payload ?? {},
    fingerprint: row.fingerprint,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Owner's own saved searches, optionally narrowed to one category. Newest first. */
export async function listSavedSearchesForOwner(
  sb: SupabaseClient,
  ownerId: string,
  opts?: { category?: string; activeOnly?: boolean },
): Promise<SavedSearchRow[]> {
  let query = sb
    .from(TABLE)
    .select("id, category, city, min_price, max_price, filter_payload, fingerprint, is_active, created_at, updated_at")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: false });
  if (opts?.category) query = query.eq("category", opts.category);
  if (opts?.activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error || !data) return [];
  return (data as SavedSearchDbRow[]).map(rowFromDb);
}

export async function getSavedSearchForOwner(
  sb: SupabaseClient,
  ownerId: string,
  id: string,
): Promise<SavedSearchRow | null> {
  const { data, error } = await sb
    .from(TABLE)
    .select("id, category, city, min_price, max_price, filter_payload, fingerprint, is_active, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", ownerId)
    .maybeSingle();
  if (error || !data) return null;
  return rowFromDb(data as SavedSearchDbRow);
}

export type SaveSavedSearchResult =
  | { ok: true; row: SavedSearchRow; created: boolean; reactivated: boolean }
  | { ok: false; error: string };

/**
 * Create (or dedup) a saved search for this owner. Never produces a duplicate for the same
 * (owner, category, normalized-search) — enforced first here, then again by the database's own
 * `saved_searches_owner_category_fingerprint_uidx` unique index as the real backstop.
 *
 * - Identical ACTIVE row already exists → return it, no insert (`created: false`).
 * - Identical INACTIVE row already exists → reactivate it, no insert (`created: false`,
 *   `reactivated: true`).
 * - No match → insert a new row (`created: true`).
 */
export async function createOrReactivateSavedSearch(
  sb: SupabaseClient,
  ownerId: string,
  input: SavedSearchNormalizedInput,
): Promise<SaveSavedSearchResult> {
  const canonical = canonicalizeSavedSearch(input);
  if (!canonical.category.trim()) {
    return { ok: false, error: "category_required" };
  }
  const fingerprint = buildSavedSearchFingerprint(canonical);

  const { data: existing, error: findError } = await sb
    .from(TABLE)
    .select("id, category, city, min_price, max_price, filter_payload, fingerprint, is_active, created_at, updated_at")
    .eq("user_id", ownerId)
    .eq("category", canonical.category)
    .eq("fingerprint", fingerprint)
    .maybeSingle();
  if (findError) return { ok: false, error: findError.message };

  if (existing) {
    const row = existing as SavedSearchDbRow;
    if (row.is_active) {
      return { ok: true, row: rowFromDb(row), created: false, reactivated: false };
    }
    const { data: reactivated, error: reactivateError } = await sb
      .from(TABLE)
      .update({ is_active: true })
      .eq("id", row.id)
      .eq("user_id", ownerId)
      .select("id, category, city, min_price, max_price, filter_payload, fingerprint, is_active, created_at, updated_at")
      .single();
    if (reactivateError || !reactivated) return { ok: false, error: reactivateError?.message ?? "reactivate_failed" };
    return { ok: true, row: rowFromDb(reactivated as SavedSearchDbRow), created: false, reactivated: true };
  }

  const { data: inserted, error: insertError } = await sb
    .from(TABLE)
    .insert({
      user_id: ownerId,
      category: canonical.category,
      city: canonical.city,
      min_price: canonical.minPrice,
      max_price: canonical.maxPrice,
      filter_payload: canonical.filterPayload,
      fingerprint,
    })
    .select("id, category, city, min_price, max_price, filter_payload, fingerprint, is_active, created_at, updated_at")
    .single();
  if (insertError || !inserted) {
    // 23505 = unique_violation: a concurrent request won the dedup race between our SELECT and
    // INSERT above. Never swallow a genuine error — only treat this exact race as recoverable.
    if (insertError && (insertError as { code?: string }).code === "23505") {
      const retry = await getExistingByFingerprint(sb, ownerId, canonical.category, fingerprint);
      if (retry) return { ok: true, row: retry, created: false, reactivated: false };
    }
    return { ok: false, error: insertError?.message ?? "insert_failed" };
  }
  return { ok: true, row: rowFromDb(inserted as SavedSearchDbRow), created: true, reactivated: false };
}

async function getExistingByFingerprint(
  sb: SupabaseClient,
  ownerId: string,
  category: string,
  fingerprint: string,
): Promise<SavedSearchRow | null> {
  const { data } = await sb
    .from(TABLE)
    .select("id, category, city, min_price, max_price, filter_payload, fingerprint, is_active, created_at, updated_at")
    .eq("user_id", ownerId)
    .eq("category", category)
    .eq("fingerprint", fingerprint)
    .maybeSingle();
  return data ? rowFromDb(data as SavedSearchDbRow) : null;
}

export type UpdateSavedSearchResult =
  | { ok: true; row: SavedSearchRow }
  | { ok: false; error: string };

/** Replace an existing saved search's criteria (re-canonicalized, fingerprint recomputed). Fails
 * with `"duplicate"` rather than corrupting data if the new criteria collide with a DIFFERENT
 * saved search this owner already has — never silently merges two distinct rows. */
export async function updateSavedSearchForOwner(
  sb: SupabaseClient,
  ownerId: string,
  id: string,
  input: SavedSearchNormalizedInput,
): Promise<UpdateSavedSearchResult> {
  const canonical = canonicalizeSavedSearch(input);
  if (!canonical.category.trim()) return { ok: false, error: "category_required" };
  const fingerprint = buildSavedSearchFingerprint(canonical);

  const { data, error } = await sb
    .from(TABLE)
    .update({
      category: canonical.category,
      city: canonical.city,
      min_price: canonical.minPrice,
      max_price: canonical.maxPrice,
      filter_payload: canonical.filterPayload,
      fingerprint,
    })
    .eq("id", id)
    .eq("user_id", ownerId)
    .select("id, category, city, min_price, max_price, filter_payload, fingerprint, is_active, created_at, updated_at")
    .single();
  if (error) {
    if ((error as { code?: string }).code === "23505") return { ok: false, error: "duplicate" };
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true, row: rowFromDb(data as SavedSearchDbRow) };
}

/** Pause (is_active = false) without deleting — the saved search and its criteria are preserved. */
export async function deactivateSavedSearchForOwner(sb: SupabaseClient, ownerId: string, id: string): Promise<boolean> {
  const { error } = await sb.from(TABLE).update({ is_active: false }).eq("id", id).eq("user_id", ownerId);
  return !error;
}

/** Resume matching for a paused saved search. */
export async function reactivateSavedSearchForOwner(sb: SupabaseClient, ownerId: string, id: string): Promise<boolean> {
  const { error } = await sb.from(TABLE).update({ is_active: true }).eq("id", id).eq("user_id", ownerId);
  return !error;
}

/** Hard delete — the owner explicitly asked to remove this saved search entirely. */
export async function deleteSavedSearchForOwner(sb: SupabaseClient, ownerId: string, id: string): Promise<boolean> {
  const { error } = await sb.from(TABLE).delete().eq("id", id).eq("user_id", ownerId);
  return !error;
}
