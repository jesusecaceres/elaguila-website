import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

import type { ViajesStagedLane, ViajesStagedListingRow, ViajesStagedLifecycleStatus } from "./viajesStagedListingTypes";
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
    .order("published_at", { ascending: false, nullsFirst: false });
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
  if (!isSupabaseAdminConfigured()) return [];
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("viajes_staged_listings").select("*").order("submitted_at", { ascending: false, nullsFirst: false });
  if (error || !data) return [];
  return data as ViajesStagedListingRow[];
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
  const { error } = await supabase.from("viajes_staged_listings").update(patch).eq("id", input.id);
  if (error) return { ok: false, error: error.message };
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
  owner_user_id: string | null;
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
  const { error } = await supabase
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
    .eq("id", input.id);
  if (error) return { ok: false, error: error.message };
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
  const { error } = await supabase
    .from("viajes_staged_listings")
    .update({
      lifecycle_status: "submitted",
      is_public: false,
      submitted_at: now,
      updated_at: now,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, slug: existing.slug };
}
