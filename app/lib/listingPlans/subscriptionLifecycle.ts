/**
 * Package C Build 1 (C3) — canonical Leonix subscription lifecycle.
 *
 * Billing truth lives on leonix_subscription_records; the linked
 * listing_package_entitlements row is the durable capability being kept alive; lane listing
 * status columns are only the public-visibility projection, written through the per-lane
 * suspension adapters below and restored by compare-and-swap so payment recovery can never
 * override a moderation/owner/admin state.
 *
 * States: pending | active | grace | suspended | canceled.
 *   - cancel_at_period_end is a flag on an active sub, not a state.
 *   - past_due folds into grace: the locked 7-CALENDAR-DAY clock starts at the first
 *     unresolved payment failure (Advertising Agreement v1.2 + Bible).
 *   - dispute = suspended with suspension_reason 'chargeback'.
 *   - expired is derivable from dates (same read-time doctrine as addonLifecycle.ts).
 *
 * Grace enforcement NEVER depends on dashboard visits: it runs (a) on every canonical webhook
 * delivery (reconcileSubscriptionByStripeId), (b) inline in the commercial write guard before
 * any capacity-increasing mutation, (c) via the entitlement ends_at = period_end + GRACE_DAYS
 * pessimistic backstop (read-time lapse), and (d) via the secured admin sweep endpoint.
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { writeRevenueAuditLog } from "./revenueAuditLog";

export {
  computeGraceEndsAt,
  CONTRACTUAL_LATE_AFTER_DAYS,
  decideSubscriptionTransition,
  isGraceExpired,
  laneSuspensionSpecForCategory,
  SUBSCRIPTION_GRACE_DAYS,
  type LeonixSubscriptionStatus,
  type SubscriptionEventKind,
  type SubscriptionTransition,
} from "./subscriptionLifecyclePolicy";
import {
  isGraceExpired as isGraceExpiredPolicy,
  laneSuspensionSpecForCategory as laneSpec,
} from "./subscriptionLifecyclePolicy";

/* ============================================================================================
 * Per-lane visibility suspension adapters — existing status vocabularies only, CAS restore.
 * ==========================================================================================*/


export type VisibilitySuspendResult =
  | { ok: true; applied: true; priorStatus: string }
  | { ok: true; applied: false; reason: "not_visible" | "lane_unsupported" | "listing_missing" }
  | { ok: false; error: string };

/** Payment-suspend a listing's public visibility. Only fires from visible-paid states. */
export async function applyPaymentSuspension(category: string, listingId: string): Promise<VisibilitySuspendResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "supabase_not_configured" };
  const spec = laneSpec(category);
  if (!spec) return { ok: true, applied: false, reason: "lane_unsupported" };
  const supabase = getAdminSupabase();

  const { data: row, error: readError } = await supabase
    .from(spec.table)
    .select(`id, ${spec.statusColumn}`)
    .eq("id", listingId)
    .maybeSingle();
  if (readError) return { ok: false, error: readError.message };
  if (!row) return { ok: true, applied: false, reason: "listing_missing" };

  const currentStatus = String((row as unknown as Record<string, unknown>)[spec.statusColumn] ?? "");
  if (!spec.visibleStatuses.includes(currentStatus)) {
    // Archived/removed/rejected/paused etc. — a stronger state owns the listing; never overwrite.
    return { ok: true, applied: false, reason: "not_visible" };
  }

  const { data: updated, error: updateError } = await supabase
    .from(spec.table)
    .update({ [spec.statusColumn]: spec.suspendedValue, suspended_reason: "payment" })
    .eq("id", listingId)
    .eq(spec.statusColumn, currentStatus)
    .select("id");
  if (updateError) return { ok: false, error: updateError.message };
  if (!updated?.length) return { ok: true, applied: false, reason: "not_visible" };
  return { ok: true, applied: true, priorStatus: currentStatus };
}

export type VisibilityRestoreResult =
  | { ok: true; restored: true }
  | { ok: true; restored: false; reason: "listing_owned_elsewhere" | "lane_unsupported" | "no_prior_status" }
  | { ok: false; error: string };

/**
 * Compare-and-swap restore: only lifts a suspension THIS engine applied. Zero rows updated
 * means another actor (moderation/owner/admin) owns the state — listing untouched, audited.
 */
export async function liftPaymentSuspension(
  category: string,
  listingId: string,
  priorStatus: string | null | undefined,
): Promise<VisibilityRestoreResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, error: "supabase_not_configured" };
  const spec = laneSpec(category);
  if (!spec) return { ok: true, restored: false, reason: "lane_unsupported" };
  const prior = String(priorStatus ?? "").trim();
  if (!prior) return { ok: true, restored: false, reason: "no_prior_status" };
  const supabase = getAdminSupabase();

  const { data: updated, error } = await supabase
    .from(spec.table)
    .update({ [spec.statusColumn]: prior, suspended_reason: null })
    .eq("id", listingId)
    .eq(spec.statusColumn, spec.suspendedValue)
    .eq("suspended_reason", "payment")
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!updated?.length) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_ignored",
      targetType: "listing",
      targetId: listingId,
      meta: { reason: "payment_restore_skipped_listing_owned_elsewhere", category },
    });
    return { ok: true, restored: false, reason: "listing_owned_elsewhere" };
  }
  return { ok: true, restored: true };
}

/* ============================================================================================
 * Reconciliation + sweep (grace enforcement that never depends on dashboard visits).
 * ==========================================================================================*/

export type SubscriptionRecordRow = {
  id: string;
  status: string;
  category: string | null;
  listing_id: string | null;
  package_key: string | null;
  suspension_reason: string | null;
  grace_ends_at: string | null;
  listing_prior_status: string | null;
  listing_suspended_status: string | null;
  package_entitlement_id: string | null;
  metadata: Record<string, unknown> | null;
};

/** Reconcile one subscription: applies grace-expiry suspension if due. Idempotent. */
export async function reconcileSubscriptionRow(row: SubscriptionRecordRow): Promise<{ suspended: boolean }> {
  if (row.status !== "grace" || !isGraceExpiredPolicy(row.grace_ends_at)) return { suspended: false };
  if (!isSupabaseAdminConfigured()) return { suspended: false };
  const supabase = getAdminSupabase();

  const category = String(row.category ?? "");
  const listingId = String(row.listing_id ?? "");
  let priorStatus: string | null = null;
  let suspendedStatus: string | null = null;
  if (category && listingId) {
    const result = await applyPaymentSuspension(category, listingId);
    if (result.ok && result.applied) {
      priorStatus = result.priorStatus;
      suspendedStatus = laneSpec(category)?.suspendedValue ?? null;
    }
  }

  // CAS on the subscription row itself so concurrent reconcilers don't double-write.
  const { data: updated } = await supabase
    .from("leonix_subscription_records")
    .update({
      status: "suspended",
      suspended_at: new Date().toISOString(),
      suspension_reason: "payment_failure",
      listing_prior_status: priorStatus,
      listing_suspended_status: suspendedStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("status", "grace")
    .select("id");

  const suspended = Boolean(updated?.length);
  if (suspended) {
    await writeRevenueAuditLog({
      action: "revenue_payment_expired",
      targetType: "subscription",
      targetId: row.id,
      meta: { reason: "grace_period_expired_payment_suspension", category, listing_id: listingId, package_key: row.package_key },
    });
  }
  return { suspended };
}

export async function reconcileSubscriptionByStripeId(stripeSubscriptionId: string): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  const id = String(stripeSubscriptionId ?? "").trim();
  if (!id) return;
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("leonix_subscription_records")
    .select("id, status, category, listing_id, package_key, suspension_reason, grace_ends_at, listing_prior_status, listing_suspended_status, package_entitlement_id, metadata")
    .eq("stripe_subscription_id", id)
    .maybeSingle();
  if (data) await reconcileSubscriptionRow(data as SubscriptionRecordRow);
}

/** Sweep all grace-expired subscriptions. Used by the secured admin sweep endpoint. */
export async function sweepDueSubscriptionTransitions(opts?: { dryRun?: boolean; limit?: number }): Promise<{
  due: number;
  suspended: number;
  dryRun: boolean;
}> {
  if (!isSupabaseAdminConfigured()) return { due: 0, suspended: 0, dryRun: Boolean(opts?.dryRun) };
  const supabase = getAdminSupabase();
  const limit = Math.min(Math.max(Number(opts?.limit ?? 100), 1), 500);
  const { data } = await supabase
    .from("leonix_subscription_records")
    .select("id, status, category, listing_id, package_key, suspension_reason, grace_ends_at, listing_prior_status, listing_suspended_status, package_entitlement_id, metadata")
    .eq("status", "grace")
    .lt("grace_ends_at", new Date().toISOString())
    .limit(limit);

  const rows = (data ?? []) as SubscriptionRecordRow[];
  if (opts?.dryRun) return { due: rows.length, suspended: 0, dryRun: true };

  let suspended = 0;
  for (const row of rows) {
    const result = await reconcileSubscriptionRow(row);
    if (result.suspended) suspended += 1;
  }
  return { due: rows.length, suspended, dryRun: false };
}
