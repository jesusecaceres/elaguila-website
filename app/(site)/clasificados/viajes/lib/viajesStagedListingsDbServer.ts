import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

import type { ViajesIntakeV1 } from "./viajesIntakeTypes";
import { viajesIntakeClaimsBenefit, viajesIntakeProvisionalTitle } from "./viajesIntakeTypes";
import type {
  ViajesCommunityBenefitStatus,
  ViajesStagedLane,
  ViajesStagedListingRow,
  ViajesStagedLifecycleStatus,
} from "./viajesStagedListingTypes";
import { resolveViajesStagedApplicationStage } from "./viajesStagedListingTypes";
import { slugifyViajesListingBase } from "./viajesSlugUtils";

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

// Package 3 — widened from a named-column list to "*" for two proven reasons: (1) the admin
// moderation UI already rendered lane / submitter_* / submitted_at, which the old bounded
// select silently omitted (they displayed blank); (2) the Community Opportunity Intake panel
// needs listing_json, and the optional community_benefit_status column must never be NAMED in
// a select before its migration is applied (PostgREST errors on unknown columns; "*" returns
// whatever exists, so the code degrades safely). The row cap below stays — this is not an
// unbounded query.
const VIAJES_ADMIN_QUEUE_SELECT = "*";

export type ViajesAdminQueueFilters = {
  limit?: number;
  scope?: "live";
};

/** Admin workspace queue — bounded select, optional live scope at SQL level. */
export async function fetchViajesStagedAdminQueue(
  opts: ViajesAdminQueueFilters = {},
): Promise<ViajesStagedListingRow[]> {
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = getAdminSupabase();
  const cap = Math.min(Math.max(Math.floor(opts.limit ?? 100), 1), 500);
  let q = supabase
    .from("viajes_staged_listings")
    .select(VIAJES_ADMIN_QUEUE_SELECT)
    .order("republish_sort_at", { ascending: false, nullsFirst: true })
    .limit(cap);
  if (opts.scope === "live") {
    q = q.eq("lifecycle_status", "approved").eq("is_public", true);
  }
  const { data, error } = await q;
  if (error || !data) return [];
  return data as unknown as ViajesStagedListingRow[];
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
  // Package 3 — the full application submits `{version, negocios}` (or `{version, privado}`)
  // WITHOUT the intake block. The Community Opportunity Intake snapshot on the same row must
  // survive every later owner revision/submit, so merge it back rather than letting the
  // incoming envelope silently erase it. The full application never edits the intake block.
  const existingJson = (existing.listing_json ?? {}) as Record<string, unknown>;
  const incomingJson = (input.listing_json ?? {}) as Record<string, unknown>;
  const mergedListingJson =
    existingJson.intake && !incomingJson.intake
      ? { ...incomingJson, intake: existingJson.intake }
      : incomingJson;
  const { data: updated, error } = await supabase
    .from("viajes_staged_listings")
    .update({
      title: input.title,
      listing_json: mergedListingJson,
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

/* ==============================================================================================
 * Package 3 — Community Opportunity Intake persistence (owner lock 2026-08-25).
 *
 * One-row identity: the intake creates the SAME viajes_staged_listings row the full application
 * later enriches and submits. lifecycle_status "draft" was already in the table CHECK and in
 * every status map — Package 3 is the first writer of it.
 * ============================================================================================ */

/**
 * The owner's current intake-stage row (business lane, lifecycle "draft", intake block present,
 * no negocios block yet) — the dedupe target for repeat intake saves. At most one such row is
 * maintained per owner; if several somehow exist, the most recently updated wins.
 */
export async function fetchViajesIntakeStageDraftRowForOwner(
  ownerUserId: string,
): Promise<ViajesStagedListingRow | null> {
  if (!isSupabaseAdminConfigured() || !ownerUserId.trim()) return null;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("viajes_staged_listings")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .eq("lane", "business")
    .eq("lifecycle_status", "draft")
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error || !data) return null;
  const rows = data as ViajesStagedListingRow[];
  return rows.find((r) => resolveViajesStagedApplicationStage(r.listing_json) === "intake") ?? null;
}

/**
 * Best-effort transitional write of the community-benefit truth column. The column arrives with
 * the authored (NOT yet applied) Package 3 migration; before that, PostgREST rejects the update
 * and this helper reports `columnMissing` WITHOUT failing the caller's main operation. The
 * public badge is fail-closed either way (absent column ⇒ undefined ⇒ no badge).
 */
export async function setViajesCommunityBenefitStatus(
  id: string,
  status: ViajesCommunityBenefitStatus,
): Promise<{ ok: boolean; columnMissing?: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "not_configured" };
  const supabase = getAdminSupabase();
  const { data: updated, error } = await supabase
    .from("viajes_staged_listings")
    .update({ community_benefit_status: status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) {
    const columnMissing = /community_benefit_status/i.test(error.message);
    return { ok: false, columnMissing, error: error.message };
  }
  if (!updated || updated.length === 0) return { ok: false, error: "listing_not_found" };
  return { ok: true };
}

/**
 * Admin-only promotion `claimed` → `approved`. This is the ONLY path to `approved` anywhere in
 * the codebase; the write itself is narrowed by the current status so a non-claimed row can
 * never be approved (no read-then-write race). Requires the Package 3 migration: without the
 * column this returns `benefit_column_missing` so the admin UI reports the dependency honestly.
 */
export async function approveViajesCommunityBenefit(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "not_configured" };
  const supabase = getAdminSupabase();
  const { data: updated, error } = await supabase
    .from("viajes_staged_listings")
    .update({ community_benefit_status: "approved", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("community_benefit_status", "claimed")
    .select("id");
  if (error) {
    if (/community_benefit_status/i.test(error.message)) {
      return { ok: false, error: "benefit_column_missing" };
    }
    return { ok: false, error: error.message };
  }
  if (!updated || updated.length === 0) return { ok: false, error: "not_claimed_or_missing" };
  return { ok: true };
}

export type ViajesIntakeUpsertResult =
  | { ok: true; id: string; slug: string; created: boolean }
  | { ok: false; error: string };

/**
 * First save creates the early staged row (draft / business / not public); repeat saves update
 * the owner's existing intake-stage row in place (owner predicate in the write, zero-row-safe).
 * Never publishes, never marks submitted, never touches Stripe. Every save recomputes the
 * benefit claim status (`claimed`/`none`) best-effort — by doctrine this also downgrades an
 * already-`approved` benefit back to `claimed` whenever the owner edits the claim, forcing
 * Leonix re-review (documented fail-safe: no content-diff engine; any intake save re-reviews).
 */
export async function upsertViajesIntakeStagedRow(input: {
  owner_user_id: string;
  intake: ViajesIntakeV1;
  lang: "es" | "en";
}): Promise<ViajesIntakeUpsertResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "not_configured" };
  const ownerUserId = input.owner_user_id?.trim();
  if (!ownerUserId) return { ok: false, error: "owner_required" };

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const title = viajesIntakeProvisionalTitle(input.intake);
  const claimStatus: ViajesCommunityBenefitStatus = viajesIntakeClaimsBenefit(input.intake)
    ? "claimed"
    : "none";
  const submitterFields = {
    submitter_name: input.intake.businessName.trim() || null,
    submitter_email: input.intake.email.trim() || null,
    submitter_phone: input.intake.phone.trim() || null,
  };

  const existing = await fetchViajesIntakeStageDraftRowForOwner(ownerUserId);
  if (existing) {
    const existingJson = (existing.listing_json ?? {}) as Record<string, unknown>;
    const { data: updated, error } = await supabase
      .from("viajes_staged_listings")
      .update({
        title,
        listing_json: { ...existingJson, version: 1, intake: input.intake },
        lang: input.lang,
        ...submitterFields,
        updated_at: now,
      })
      .eq("id", existing.id)
      .eq("owner_user_id", ownerUserId)
      .select("id");
    if (error) return { ok: false, error: error.message };
    if (!updated || updated.length === 0) return { ok: false, error: "forbidden" };
    // Awaited but non-fatal: pre-migration the column is missing and this reports columnMissing.
    await setViajesCommunityBenefitStatus(existing.id, claimStatus);
    return { ok: true, id: existing.id, slug: existing.slug, created: false };
  }

  const slug = await allocateUniqueViajesStagedSlug(title);
  const { data, error } = await supabase
    .from("viajes_staged_listings")
    .insert({
      slug,
      lane: "business",
      owner_user_id: ownerUserId,
      title,
      listing_json: { version: 1, intake: input.intake },
      hero_image_url: null,
      lang: input.lang,
      ...submitterFields,
      lifecycle_status: "draft",
      is_public: false,
      submitted_at: null,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  const id = (data as { id: string }).id;
  // Awaited but non-fatal: pre-migration the column is missing and this reports columnMissing.
  await setViajesCommunityBenefitStatus(id, claimStatus);
  return { ok: true, id, slug, created: true };
}
