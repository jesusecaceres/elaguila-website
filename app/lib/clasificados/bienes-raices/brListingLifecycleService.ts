/**
 * Gate G.2.3.1 — server-authorized Bienes Raíces Negocio owner lifecycle mutations.
 *
 * Replaces the raw client-side `supabase.from("listings").update(...).eq("id", id)` pattern the
 * Gate G.2.3A audit found for BR pause/resume/archive/discontinue/republish: those writes relied
 * on RLS for ownership only, had no server-side state-transition validation, and — critically —
 * let Republish reactivate `pending` (unpaid), `flagged` (moderated), and `sold` rows with zero
 * payment or moderation check. This file is the single source of truth for whether a requested
 * BR transition is allowed; the API route that calls it does no validation of its own.
 *
 * Every mutation here revalidates ownership + category + eligibility server-side from the row
 * itself (never trusting a client-supplied status), and Resume additionally revalidates the
 * canonical main parent + entitlement + capacity for an inventory child, reusing the exact
 * Gate F.2.4.4 capacity gate (`checkBrChildActivationCapacity`) rather than re-deriving it.
 *
 * No `"server-only"` import, matching this file's immediate sibling `brListingPaymentService.ts`'s
 * own established convention in this directory — the real protection boundary is
 * `getAdminSupabase()`'s service-role credential, never exposed to a client bundle regardless.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  BR_ACTIVE_PROPERTY_LIMIT_ERROR,
  checkBrChildActivationCapacity,
  getBrListingById,
  type BrListingRowForPayment,
} from "./brListingPaymentService";
import {
  BR_LIFECYCLE_AUTH_REQUIRED_ERROR,
  BR_LIFECYCLE_LISTING_NOT_ELIGIBLE_ERROR,
  BR_LIFECYCLE_LISTING_NOT_FOUND_ERROR,
  BR_LIFECYCLE_MUTATION_KEYS,
  BR_LIFECYCLE_OWNER_MISMATCH_ERROR,
  BR_LIFECYCLE_PARENT_INACTIVE_ERROR,
  BR_LIFECYCLE_PARENT_INVALID_ERROR,
  BR_LIFECYCLE_SERVICE_UNAVAILABLE_ERROR,
  BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR,
  brArchiveEligible,
  brDiscontinueEligible,
  brPauseEligible,
  brRepublishEligible,
  brResumeEligible,
  type BrLifecycleErrorCode,
  type BrLifecycleMutationKey,
} from "./brListingLifecycleEligibility";

// Re-exported so callers (the API route, the self-test) have a single import surface for the
// pure contract, without this file redefining any of it.
export {
  BR_LIFECYCLE_AUTH_REQUIRED_ERROR,
  BR_LIFECYCLE_CAPACITY_LIMIT_ERROR,
  BR_LIFECYCLE_LISTING_NOT_ELIGIBLE_ERROR,
  BR_LIFECYCLE_LISTING_NOT_FOUND_ERROR,
  BR_LIFECYCLE_MUTATION_KEYS,
  BR_LIFECYCLE_OWNER_MISMATCH_ERROR,
  BR_LIFECYCLE_PARENT_INACTIVE_ERROR,
  BR_LIFECYCLE_PARENT_INVALID_ERROR,
  BR_LIFECYCLE_SERVICE_UNAVAILABLE_ERROR,
  BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR,
  brArchiveEligible,
  brDiscontinueEligible,
  brPauseEligible,
  brRepublishEligible,
  brResumeEligible,
} from "./brListingLifecycleEligibility";
export type { BrLifecycleErrorCode, BrLifecycleMutationKey } from "./brListingLifecycleEligibility";

export type BrLifecycleMutationResult =
  | { ok: true; id: string; status: string; isPublished: boolean }
  | { ok: false; error: BrLifecycleErrorCode };

/** Local, non-exported — used only for the parent-active check below. The five mutation
 * eligibility predicates themselves live in `brListingLifecycleEligibility.ts` and are
 * re-exported above, not redefined here. */
function isBrRowActiveAndPublished(row: Pick<BrListingRowForPayment, "status" | "is_published">): boolean {
  return row.status === "active" && row.is_published !== false;
}

/**
 * Loads the row and validates authentication/ownership/category server-side. This is the only
 * gate every mutation shares; each mutation then applies its own state-transition rule on top.
 */
async function loadEligibleBrRow(
  listingId: string,
  bearerUserId: string,
): Promise<{ ok: true; row: BrListingRowForPayment } | { ok: false; error: BrLifecycleErrorCode }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: BR_LIFECYCLE_SERVICE_UNAVAILABLE_ERROR };
  const trimmedId = listingId.trim();
  if (!trimmedId) return { ok: false, error: BR_LIFECYCLE_LISTING_NOT_FOUND_ERROR };

  const row = await getBrListingById(trimmedId);
  if (!row) return { ok: false, error: BR_LIFECYCLE_LISTING_NOT_FOUND_ERROR };
  if (String(row.owner_id ?? "").trim() !== bearerUserId.trim()) {
    return { ok: false, error: BR_LIFECYCLE_OWNER_MISMATCH_ERROR };
  }
  if (row.category !== "bienes-raices" || row.seller_type !== "business") {
    return { ok: false, error: BR_LIFECYCLE_LISTING_NOT_ELIGIBLE_ERROR };
  }
  return { ok: true, row };
}

/**
 * Validates that a child's canonical main parent (`br_inventory_parent_listing_id`) exists, is
 * owned by the same user, and is itself an active, published main row. Distinct from — and
 * performed in addition to — `checkBrChildActivationCapacity`'s own identity check: that reused
 * helper never validates the parent's *status* (it only needs to for checkout-time activation,
 * where the parent is being activated in the same request); Resume needs a stronger guarantee —
 * an inventory child must never resume while its own parent is paused/archived/sold.
 */
async function requireActiveBrParentForChildResume(
  child: BrListingRowForPayment,
): Promise<{ ok: true } | { ok: false; error: BrLifecycleErrorCode }> {
  const parentListingId = String(child.br_inventory_parent_listing_id ?? "").trim();
  if (!parentListingId) return { ok: false, error: BR_LIFECYCLE_PARENT_INVALID_ERROR };

  const parent = await getBrListingById(parentListingId);
  const childOwnerId = String(child.owner_id ?? "").trim();
  const parentOwnerId = String(parent?.owner_id ?? "").trim();
  if (
    !parent ||
    parent.category !== "bienes-raices" ||
    parent.seller_type !== "business" ||
    parent.inventory_role !== "main" ||
    !childOwnerId ||
    parentOwnerId !== childOwnerId
  ) {
    return { ok: false, error: BR_LIFECYCLE_PARENT_INVALID_ERROR };
  }
  if (!isBrRowActiveAndPublished(parent)) {
    return { ok: false, error: BR_LIFECYCLE_PARENT_INACTIVE_ERROR };
  }
  return { ok: true };
}

async function applyBrPause(row: BrListingRowForPayment): Promise<BrLifecycleMutationResult> {
  if (!brPauseEligible(row)) {
    return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  }
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "paused", is_published: false, updated_at: now })
    .eq("id", row.id)
    .eq("status", "active")
    .select("id, status, is_published")
    .maybeSingle();
  if (error || !data) return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  return { ok: true, id: data.id, status: data.status, isPublished: data.is_published === true };
}

/**
 * G.2.3.1 scope: mutates only the requested row. Parent pause cascade (Scenario A from the
 * Gate G.2.3A audit) is explicitly deferred to G.2.3.2 — this gate does not yet decide what
 * happens to a main parent's active children when the parent itself is paused.
 */
async function applyBrResume(row: BrListingRowForPayment): Promise<BrLifecycleMutationResult> {
  if (!brResumeEligible(row)) {
    return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  }

  if (row.inventory_role === "inventory_property") {
    const parentGuard = await requireActiveBrParentForChildResume(row);
    if (!parentGuard.ok) return parentGuard;

    const capacity = await checkBrChildActivationCapacity(row, row.id);
    if (!capacity.ok) {
      // `checkBrChildActivationCapacity`'s own identity failure is remapped to this file's own
      // parent-invalid code (already caught by `requireActiveBrParentForChildResume` above in
      // the normal case) — the capacity limit code passes through unchanged.
      return {
        ok: false,
        error: capacity.error === BR_ACTIVE_PROPERTY_LIMIT_ERROR ? BR_ACTIVE_PROPERTY_LIMIT_ERROR : BR_LIFECYCLE_PARENT_INVALID_ERROR,
      };
    }
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "active", is_published: true, updated_at: now })
    .eq("id", row.id)
    .eq("status", "paused")
    .select("id, status, is_published")
    .maybeSingle();
  if (error || !data) return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  return { ok: true, id: data.id, status: data.status, isPublished: data.is_published === true };
}

/**
 * G.2.3.1 scope: blocks only the already-removed source state, matching the current live UI's
 * own `disabled={... st === "removed"}` behavior exactly. Active-child disposition (Scenario C —
 * whether archiving a parent with active children should be blocked, cascaded, or require
 * explicit disposition) is deferred to G.2.3.3; this gate does not yet certify archive as safe
 * for a parent with active children, only as no less permissive than today.
 */
async function applyBrArchive(row: BrListingRowForPayment): Promise<BrLifecycleMutationResult> {
  if (!brArchiveEligible(row)) {
    return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  }
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "removed", is_published: false, updated_at: now })
    .eq("id", row.id)
    .neq("status", "removed")
    .select("id, status, is_published")
    .maybeSingle();
  if (error || !data) return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  return { ok: true, id: data.id, status: data.status, isPublished: data.is_published === true };
}

/** G.2.3.1 scope: same child-disposition deferral as Archive (Scenario D — G.2.3.3). */
async function applyBrDiscontinue(row: BrListingRowForPayment): Promise<BrLifecycleMutationResult> {
  if (!brDiscontinueEligible(row)) {
    return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  }
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "sold", is_published: false, updated_at: now })
    .eq("id", row.id)
    .eq("status", "active")
    .select("id, status, is_published")
    .maybeSingle();
  if (error || !data) return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  return { ok: true, id: data.id, status: data.status, isPublished: data.is_published === true };
}

/**
 * THE CRITICAL FIX (Gate G.2.3A finding, §9/§14): Republish is no longer eligible for any row
 * that is not already `active` and published. Republish is a freshness/"move to top" bump for an
 * already-live row — never Resume, never Payment Activation, never a Moderation Appeal, never
 * Restore. It updates only `republished_at`/`republish_count`/`last_republished_source`/
 * `last_republished_by` — it must never write `status` or `is_published`.
 */
async function applyBrRepublish(row: BrListingRowForPayment, bearerUserId: string): Promise<BrLifecycleMutationResult> {
  if (!brRepublishEligible(row)) {
    return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  }
  const supabase = getAdminSupabase();
  const { data: countRow } = await supabase
    .from("listings")
    .select("republish_count")
    .eq("id", row.id)
    .maybeSingle();
  const nextCount = Number((countRow as { republish_count?: number } | null)?.republish_count ?? 0) + 1;
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("listings")
    .update({
      republished_at: now,
      republish_count: nextCount,
      last_republished_source: "dashboard",
      last_republished_by: bearerUserId,
      updated_at: now,
    })
    .eq("id", row.id)
    .eq("status", "active")
    .select("id, status, is_published")
    .maybeSingle();
  if (error || !data) return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  return { ok: true, id: data.id, status: data.status, isPublished: data.is_published === true };
}

export async function applyBrLifecycleMutation(input: {
  listingId: string;
  bearerUserId: string;
  mutation: BrLifecycleMutationKey;
}): Promise<BrLifecycleMutationResult> {
  const bearerUserId = input.bearerUserId.trim();
  if (!bearerUserId) return { ok: false, error: BR_LIFECYCLE_AUTH_REQUIRED_ERROR };

  const loaded = await loadEligibleBrRow(input.listingId, bearerUserId);
  if (!loaded.ok) return loaded;

  switch (input.mutation) {
    case "pause":
      return applyBrPause(loaded.row);
    case "resume":
      return applyBrResume(loaded.row);
    case "archive":
      return applyBrArchive(loaded.row);
    case "discontinue":
      return applyBrDiscontinue(loaded.row);
    case "republish":
      return applyBrRepublish(loaded.row, bearerUserId);
  }
}
