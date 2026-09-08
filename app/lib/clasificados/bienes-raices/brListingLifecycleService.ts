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
import { activateBrNegocioListingAtomic } from "@/app/lib/listingPlans/capacityActivationRpc";
import {
  BR_LIFECYCLE_AUTH_REQUIRED_ERROR,
  BR_LIFECYCLE_CHILD_CASCADE_FAILED_ERROR,
  BR_LIFECYCLE_CHILD_DISPOSITION_REQUIRED_ERROR,
  BR_LIFECYCLE_LISTING_NOT_ELIGIBLE_ERROR,
  BR_LIFECYCLE_LISTING_NOT_FOUND_ERROR,
  BR_LIFECYCLE_MUTATION_KEYS,
  BR_LIFECYCLE_OWNER_MISMATCH_ERROR,
  BR_LIFECYCLE_PARENT_INACTIVE_ERROR,
  BR_LIFECYCLE_PARENT_INVALID_ERROR,
  BR_LIFECYCLE_PARENT_PAUSE_INCOMPLETE_ERROR,
  BR_LIFECYCLE_SERVICE_UNAVAILABLE_ERROR,
  BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR,
  brArchiveEligible,
  brChildBlocksParentDisposition,
  brChildCascadePauseEligible,
  brActivatePendingEligible,
  brDiscontinueEligible,
  brPauseEligible,
  brRepublishEligible,
  brResumeEligible,
  type BrLifecycleCascadeChildCandidate,
  type BrLifecycleErrorCode,
  type BrLifecycleMutationKey,
} from "./brListingLifecycleEligibility";

// Re-exported so callers (the API route, the self-test) have a single import surface for the
// pure contract, without this file redefining any of it.
export {
  BR_LIFECYCLE_AUTH_REQUIRED_ERROR,
  BR_LIFECYCLE_CAPACITY_LIMIT_ERROR,
  BR_LIFECYCLE_CHILD_CASCADE_FAILED_ERROR,
  BR_LIFECYCLE_CHILD_DISPOSITION_REQUIRED_ERROR,
  BR_LIFECYCLE_LISTING_NOT_ELIGIBLE_ERROR,
  BR_LIFECYCLE_LISTING_NOT_FOUND_ERROR,
  BR_LIFECYCLE_MUTATION_KEYS,
  BR_LIFECYCLE_OWNER_MISMATCH_ERROR,
  BR_LIFECYCLE_PARENT_INACTIVE_ERROR,
  BR_LIFECYCLE_PARENT_INVALID_ERROR,
  BR_LIFECYCLE_PARENT_PAUSE_INCOMPLETE_ERROR,
  BR_LIFECYCLE_SERVICE_UNAVAILABLE_ERROR,
  BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR,
  brActivatePendingEligible,
  brArchiveEligible,
  brChildBlocksParentDisposition,
  brChildCascadePauseEligible,
  brDiscontinueEligible,
  brPauseEligible,
  brRepublishEligible,
  brResumeEligible,
} from "./brListingLifecycleEligibility";
export type { BrLifecycleErrorCode, BrLifecycleMutationKey } from "./brListingLifecycleEligibility";

export type BrLifecycleMutationResult =
  | { ok: true; id: string; status: string; isPublished: boolean; childrenPausedCount?: number }
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

async function pauseOneBrRow(
  supabase: ReturnType<typeof getAdminSupabase>,
  listingId: string,
  now: string,
): Promise<{ id: string; status: string; isPublished: boolean } | null> {
  const { data, error } = await supabase
    .from("listings")
    .update({ status: "paused", is_published: false, updated_at: now })
    .eq("id", listingId)
    .eq("status", "active")
    .select("id, status, is_published")
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id, status: data.status, isPublished: data.is_published === true };
}

/**
 * Shared low-level query, reused by both the Gate G.2.3.2 Pause cascade and the Gate G.2.3.3
 * Archive/Discontinue child-disposition guard: every currently-`"active"` `inventory_property`
 * row canonically linked to `parent` (category/seller_type/role/parent-id/owner-id all required —
 * never group id, owner-alone, title, or slug). Returns `{ok:false}` on any read failure or a
 * parent with no resolvable `owner_id`; deliberately does NOT decide what that means — each
 * caller below has its own, opposite, fail-closed direction for that case (see each caller's own
 * comment) and must not share one.
 */
async function queryBrActiveCanonicalChildren(
  supabase: ReturnType<typeof getAdminSupabase>,
  parent: BrListingRowForPayment,
): Promise<{ ok: true; rows: BrLifecycleCascadeChildCandidate[] } | { ok: false }> {
  const parentOwnerId = String(parent.owner_id ?? "").trim();
  if (!parentOwnerId) return { ok: false };

  const { data, error } = await supabase
    .from("listings")
    .select("id, category, seller_type, inventory_role, br_inventory_parent_listing_id, owner_id, status, is_published")
    .eq("category", "bienes-raices")
    .eq("seller_type", "business")
    .eq("inventory_role", "inventory_property")
    .eq("br_inventory_parent_listing_id", parent.id)
    .eq("owner_id", parentOwnerId)
    .eq("status", "active");
  if (error) return { ok: false };
  return { ok: true, rows: (data ?? []) as BrLifecycleCascadeChildCandidate[] };
}

/**
 * Gate G.2.3.2 — pauses every canonical, currently-active inventory child of `parent` before the
 * parent itself is ever touched (see the file-level ordering note on `applyBrPause`). Stops and
 * reports failure on the first child that cannot be paused; already-paused children from a prior
 * successful call are naturally excluded (their `status` is no longer `"active"`), making a
 * duplicate parent Pause request idempotent by construction, not by special-casing.
 *
 * Fail-closed direction for a failed/empty query: cascade nothing (`count: 0`, via the caught
 * `!query.ok` branch below returning a failure that blocks the parent write) — a pause cascade
 * that cannot find its children must never proceed to hide the parent while leaving them public.
 */
async function cascadePauseBrChildren(
  supabase: ReturnType<typeof getAdminSupabase>,
  parent: BrListingRowForPayment,
  now: string,
): Promise<{ ok: true; count: number } | { ok: false; error: BrLifecycleErrorCode }> {
  const query = await queryBrActiveCanonicalChildren(supabase, parent);
  if (!query.ok) return { ok: false, error: BR_LIFECYCLE_CHILD_CASCADE_FAILED_ERROR };

  const eligibleChildren = query.rows.filter((child) => brChildCascadePauseEligible(child, parent));

  let pausedCount = 0;
  for (const child of eligibleChildren) {
    const childId = String(child.id ?? "").trim();
    if (!childId) continue;
    const result = await pauseOneBrRow(supabase, childId, now);
    if (!result) {
      // Children successfully paused before this failure stay paused — no fabricated rollback
      // without a real transaction (see the file-level atomicity note). The parent is never
      // touched when this branch is reached.
      return { ok: false, error: BR_LIFECYCLE_CHILD_CASCADE_FAILED_ERROR };
    }
    pausedCount += 1;
  }
  return { ok: true, count: pausedCount };
}

/**
 * Gate G.2.3.3 — blocks main-parent Archive/Discontinue while any canonical child is currently
 * active/public. Fail-closed direction is the OPPOSITE of the pause cascade above: if the query
 * itself fails (or the parent has no resolvable `owner_id`), this function cannot confirm there
 * are no active children, so it must assume there might be and block the transition — never the
 * inverse assumption that would let a parent with unconfirmed children go hidden.
 */
async function assertNoActiveBrCanonicalChildren(
  supabase: ReturnType<typeof getAdminSupabase>,
  parent: BrListingRowForPayment,
): Promise<{ ok: true } | { ok: false; error: BrLifecycleErrorCode }> {
  const query = await queryBrActiveCanonicalChildren(supabase, parent);
  if (!query.ok) return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };

  const hasActiveChild = query.rows.some((child) => brChildBlocksParentDisposition(child, parent));
  if (hasActiveChild) return { ok: false, error: BR_LIFECYCLE_CHILD_DISPOSITION_REQUIRED_ERROR };
  return { ok: true };
}

/**
 * Gate G.2.3.2 ordering rule: children are paused BEFORE the parent, never after. This repository
 * has no real multi-statement transaction available to this service (no Supabase RPC/transaction
 * wrapper exists for this table today, and this gate does not add one — see the objective's own
 * instruction not to create a migration or database RPC). Children-first ordering is the safest
 * achievable ordering without one: if the cascade fails partway, the worst reachable state is
 * "some children paused, parent still active" (safe — nothing that should be hidden is exposed).
 * The dangerous inverse ("parent paused/hidden, active children still public") is structurally
 * impossible here because the parent's own compare-and-set never runs until cascade succeeds.
 */
async function applyBrPause(row: BrListingRowForPayment): Promise<BrLifecycleMutationResult> {
  if (!brPauseEligible(row)) {
    return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  }
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  if (row.inventory_role === "main") {
    const cascade = await cascadePauseBrChildren(supabase, row, now);
    if (!cascade.ok) return { ok: false, error: cascade.error };

    const parentResult = await pauseOneBrRow(supabase, row.id, now);
    if (!parentResult) {
      // Every eligible child paused successfully, but the parent's own transition then failed
      // (e.g. a concurrent status change on the parent row itself) — a distinct, honestly
      // reported partial state, never silently reported as full success.
      return { ok: false, error: BR_LIFECYCLE_PARENT_PAUSE_INCOMPLETE_ERROR };
    }
    return { ok: true, ...parentResult, childrenPausedCount: cascade.count };
  }

  // Individual child (or any non-"main" role) — pauses only the requested row, exactly as
  // G.2.3.1 established. Never touches the parent or siblings.
  const result = await pauseOneBrRow(supabase, row.id, now);
  if (!result) return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  return { ok: true, ...result };
}

/**
 * Certified Gate G.2.3.2 policy (Scenario B): main-parent Resume mutates ONLY the requested
 * parent row — it never touches children, by design, not by omission. A child cascade-paused (or
 * independently paused) alongside a parent pause stays paused after the parent resumes; the
 * owner resumes each child individually via the "inventory_property" branch below, which
 * continues to revalidate the parent/entitlement/capacity every time, unchanged from G.2.3.1.
 * There is deliberately no new column tracking "cascade-paused vs. manually-paused" — this gate
 * does not add a migration, so that distinction is not recorded, and none is needed: every paused
 * child, regardless of how it got paused, requires the exact same explicit, individual Resume.
 */
/**
 * Package C Build 4 (C7, Gate 4/5) — the actual status transition now routes through the atomic
 * `br_negocio_activate_listing` RPC for BOTH roles, closing the pre-existing gap where a `main`
 * parent's own resume was never capacity-checked (only `inventory_property` children were).
 * `checkBrChildActivationCapacity` (via `requireActiveBrParentForChildResume`) remains as the
 * pre-flight friendly-error check for children — advisory only, the RPC is the real authority.
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

  const ownerId = String(row.owner_id ?? "").trim();
  const rpcResult = await activateBrNegocioListingAtomic({ listingId: row.id, ownerId, fromStatus: "paused" });
  if (!rpcResult.ok) {
    return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  }
  if (!rpcResult.activated && !rpcResult.idempotent) {
    return {
      ok: false,
      error: rpcResult.blockedReason === "capacity_reached" ? BR_ACTIVE_PROPERTY_LIMIT_ERROR : BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR,
    };
  }

  const live = await getBrListingById(row.id);
  if (!live || live.status !== "active" || live.is_published !== true) {
    return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  }
  return { ok: true, id: live.id, status: live.status, isPublished: live.is_published === true };
}

/**
 * Package C Build 4 (C7, Gate 5) — activates a freshly-inserted, never-yet-live BR negocio row
 * (`status: "pending"`) whose publish flow skipped Stripe checkout because it was either already
 * covered by existing paid capacity (adding a property under an active pack) or a dev/QA payment
 * bypass. `leonixPublishRealEstateListingCore.ts` now always inserts such rows as
 * `activationMode: "pending_payment"` (never `"active"` directly) — this is the one sanctioned,
 * capacity/lifecycle-checked way to bring one live. Structurally identical to `applyBrResume`
 * except the required prior state (`"pending"`, not `"paused"`) and the RPC's `p_from_status`.
 */
async function applyBrActivatePending(row: BrListingRowForPayment): Promise<BrLifecycleMutationResult> {
  if (!brActivatePendingEligible(row)) {
    return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  }

  if (row.inventory_role === "inventory_property") {
    const parentGuard = await requireActiveBrParentForChildResume(row);
    if (!parentGuard.ok) return parentGuard;

    const capacity = await checkBrChildActivationCapacity(row, row.id);
    if (!capacity.ok) {
      return {
        ok: false,
        error: capacity.error === BR_ACTIVE_PROPERTY_LIMIT_ERROR ? BR_ACTIVE_PROPERTY_LIMIT_ERROR : BR_LIFECYCLE_PARENT_INVALID_ERROR,
      };
    }
  }

  const ownerId = String(row.owner_id ?? "").trim();
  const rpcResult = await activateBrNegocioListingAtomic({ listingId: row.id, ownerId, fromStatus: "pending" });
  if (!rpcResult.ok) {
    return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  }
  if (!rpcResult.activated && !rpcResult.idempotent) {
    return {
      ok: false,
      error: rpcResult.blockedReason === "capacity_reached" ? BR_ACTIVE_PROPERTY_LIMIT_ERROR : BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR,
    };
  }

  const live = await getBrListingById(row.id);
  if (!live || live.status !== "active" || live.is_published !== true) {
    return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  }
  return { ok: true, id: live.id, status: live.status, isPublished: live.is_published === true };
}

/**
 * Blocks only the already-removed source state, matching the current live UI's own
 * `disabled={... st === "removed"}` behavior exactly. Certified Gate G.2.3.3 policy (Scenario C):
 * a main parent additionally requires zero active/public canonical children before the archive
 * write ever runs — checked after the row's own eligibility, before the compare-and-set, so a
 * blocked request leaves both parent and every child completely untouched. An individual child
 * (any non-"main" role) is never subject to this additional guard — it archives independently.
 */
async function applyBrArchive(row: BrListingRowForPayment): Promise<BrLifecycleMutationResult> {
  if (!brArchiveEligible(row)) {
    return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  }
  const supabase = getAdminSupabase();

  if (row.inventory_role === "main") {
    const guard = await assertNoActiveBrCanonicalChildren(supabase, row);
    if (!guard.ok) return guard;
  }

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

/** Same certified Scenario D policy as Archive: a main parent requires zero active/public
 * canonical children before Discontinue writes anything; an individual child discontinues
 * independently, exactly as G.2.3.1 established. */
async function applyBrDiscontinue(row: BrListingRowForPayment): Promise<BrLifecycleMutationResult> {
  if (!brDiscontinueEligible(row)) {
    return { ok: false, error: BR_LIFECYCLE_TRANSITION_NOT_ALLOWED_ERROR };
  }
  const supabase = getAdminSupabase();

  if (row.inventory_role === "main") {
    const guard = await assertNoActiveBrCanonicalChildren(supabase, row);
    if (!guard.ok) return guard;
  }

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
    case "activate_pending":
      return applyBrActivatePending(loaded.row);
  }
}
