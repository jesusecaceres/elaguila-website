/**
 * Empleos listing activation after Revenue OS webhook payment — server-only.
 * Gate EMPLEOS-REVENUE-OS-PAID-PUBLISH-CHECKPOINT-01
 *
 * Flips hidden `empleos_public_listings` rows (lifecycle_status = draft) to
 * published (or pending_review when EMPLEOS_REQUIRE_LISTING_REVIEW=1) after paid truth.
 * Feria (empleos_job_fair_free) never uses this path.
 */

import "server-only";
import { EMPLEOS_JOB_POST_PAID_PACKAGE_KEY } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

/** Hidden DB lifecycle for unpaid Empleos job posts saved before Revenue OS Stripe checkout. */
export const EMPLEOS_PENDING_CHECKOUT_STATUS = "draft" as const;

export const EMPLEOS_ACTIVATABLE_PRE_PUBLISH_STATUSES = [EMPLEOS_PENDING_CHECKOUT_STATUS] as const;

const ACTIVATABLE_FROM_STATUSES = new Set<string>(EMPLEOS_ACTIVATABLE_PRE_PUBLISH_STATUSES);

function publishLifecycleAfterPayment(): "published" | "pending_review" {
  return process.env.EMPLEOS_REQUIRE_LISTING_REVIEW === "1" ? "pending_review" : "published";
}

export type EmpleosRevenueActivationOutcome =
  | "activated"
  | "already_published"
  | "skipped_wrong_package"
  | "missing_listing_id"
  | "not_found"
  | "unsafe_status"
  | "error";

export type EmpleosRevenueActivationResult = {
  ok: boolean;
  outcome: EmpleosRevenueActivationOutcome;
  message?: string;
  listingId?: string | null;
};

export async function activatePaidEmpleosListingFromRevenueOs(input: {
  listingId: string | null | undefined;
  packageKey: string | null | undefined;
  paymentRecordId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripeEventId?: string | null;
  leonixAdId?: string | null;
}): Promise<EmpleosRevenueActivationResult> {
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();
  if (packageKey !== EMPLEOS_JOB_POST_PAID_PACKAGE_KEY) {
    return { ok: true, outcome: "skipped_wrong_package" };
  }

  const listingId = String(input.listingId ?? "").trim();
  if (!listingId) {
    return {
      ok: false,
      outcome: "missing_listing_id",
      message: "listingId is required for Empleos activation.",
    };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, outcome: "error", message: "Supabase admin is not configured." };
  }

  const supabase = getAdminSupabase();
  const { data: row, error: readError } = await supabase
    .from("empleos_public_listings")
    .select("id, lifecycle_status, published_at, listing_snapshot")
    .eq("id", listingId)
    .maybeSingle();

  if (readError) {
    return { ok: false, outcome: "error", message: readError.message, listingId };
  }

  if (!row?.id) {
    return { ok: false, outcome: "not_found", message: "Empleos listing row not found.", listingId };
  }

  const status = String(row.lifecycle_status ?? "").trim().toLowerCase();

  if (status === "published" || status === "pending_review") {
    return { ok: true, outcome: "already_published", listingId };
  }

  if (status === "archived" || status === "rejected" || status === "paused") {
    return {
      ok: true,
      outcome: "unsafe_status",
      message: "Archived/rejected/paused Empleos listings are not auto-activated by webhook.",
      listingId,
    };
  }

  if (!ACTIVATABLE_FROM_STATUSES.has(status)) {
    return {
      ok: false,
      outcome: "unsafe_status",
      message: `Cannot activate Empleos listing from lifecycle_status "${status}".`,
      listingId,
    };
  }

  const now = new Date().toISOString();
  const nextLifecycle = publishLifecycleAfterPayment();
  const patch: Record<string, unknown> = {
    lifecycle_status: nextLifecycle,
    updated_at: now,
  };
  if (nextLifecycle === "published") {
    patch.published_at = row.published_at ?? now;
  }

  // Keep snapshot listingStatus in sync when present.
  const snap = row.listing_snapshot;
  if (snap && typeof snap === "object") {
    const snapshot = { ...(snap as Record<string, unknown>) };
    const canonical = snapshot.canonical;
    if (canonical && typeof canonical === "object") {
      snapshot.canonical = {
        ...(canonical as Record<string, unknown>),
        status: nextLifecycle === "published" ? "published" : "pending_review",
        publishedAt: nextLifecycle === "published" ? (row.published_at ?? now) : null,
      };
    }
    const jobRecord = snapshot.jobRecord;
    if (jobRecord && typeof jobRecord === "object" && nextLifecycle === "published") {
      snapshot.jobRecord = {
        ...(jobRecord as Record<string, unknown>),
        publishedAt: (jobRecord as { publishedAt?: string }).publishedAt ?? now,
      };
    }
    patch.listing_snapshot = snapshot;
  }

  const { data: updated, error: updateError } = await supabase
    .from("empleos_public_listings")
    .update(patch)
    .eq("id", listingId)
    .eq("lifecycle_status", EMPLEOS_PENDING_CHECKOUT_STATUS)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { ok: false, outcome: "error", message: updateError.message, listingId };
  }

  if (!updated?.id) {
    const { data: recheck } = await supabase
      .from("empleos_public_listings")
      .select("lifecycle_status")
      .eq("id", listingId)
      .maybeSingle();
    const reStatus = String(recheck?.lifecycle_status ?? "").toLowerCase();
    if (reStatus === "published" || reStatus === "pending_review") {
      return { ok: true, outcome: "already_published", listingId };
    }
    return {
      ok: false,
      outcome: "error",
      message: "Empleos listing activation update did not apply.",
      listingId,
    };
  }

  return { ok: true, outcome: "activated", listingId };
}
