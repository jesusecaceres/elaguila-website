/**
 * Owner-side `public.listings` lifecycle patches (dashboard).
 * Aligned with Admin staff archive: `status = removed`, `is_published = false` (soft archive; no row delete).
 * Pause: temporary hide — `paused` + unpublished (does not clear Leonix Ad ID).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export const OWNER_LISTING_SOFT_ARCHIVE_PATCH: Record<string, unknown> = {
  status: "removed",
  is_published: false,
};

export const OWNER_LISTING_PAUSE_PATCH: Record<string, unknown> = {
  status: "paused",
  is_published: false,
};

export function ownerListingResumeFromPausePatch(): Record<string, unknown> {
  return { status: "active", is_published: true };
}

export type OwnerListingPatchResult = {
  data: { id: string }[] | null;
  error: { message: string } | null;
};

/**
 * Gate I.12A — defense-in-depth wrapper around the direct `listings` lifecycle writes used
 * throughout the generic owner dashboard. Every prior call site wrote `.eq("id", id)` only,
 * with no owner predicate in the write itself (only the page's initial read was owner-scoped).
 * This does not by itself prove database-level authorization — no tracked migration defines a
 * `CREATE POLICY` on `public.listings`, so RLS enforcement is unverified from the repository.
 * Certification for owner-write authorization on this pipeline is PARTIAL, not complete, pending
 * a production Supabase RLS/config check (see the I.12A ledger entry).
 */
export async function applyOwnerListingPatch(
  supabase: SupabaseClient,
  id: string,
  ownerId: string | null | undefined,
  patch: Record<string, unknown>,
): Promise<OwnerListingPatchResult> {
  const trimmedOwnerId = (ownerId ?? "").trim();
  if (!trimmedOwnerId) {
    // Reject before any network call — identity must be resolved, never assumed.
    return { data: null, error: { message: "owner_identity_required" } };
  }

  const { data, error } = await supabase
    .from("listings")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", trimmedOwnerId)
    .select("id");

  if (error) return { data: null, error };

  if (!data || data.length === 0) {
    // A zero-row Postgrest UPDATE returns no error by default — without this check, a
    // wrong id or a listing that isn't the caller's own would silently look like success.
    return { data: [], error: { message: "listing_not_found_or_forbidden" } };
  }

  return { data, error: null };
}
