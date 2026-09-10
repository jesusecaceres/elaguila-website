/**
 * Comida Local listing activation after Revenue OS webhook payment — server-only.
 * Gate D19 — mirrors the proven activatePaidRestauranteListingFromRevenueOs pattern
 * (revenueRestaurantFulfillment.ts) with no coupon/add-on branch, since Comida Local has no
 * coupon feature (Gate D14 — N/A, no existing feature).
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

/** Hidden DB status for unpaid listings saved before Revenue OS Stripe checkout. */
export const COMIDA_LOCAL_PENDING_CHECKOUT_STATUS = "pending_payment" as const;

export const COMIDA_LOCAL_BASE_MONTHLY_PACKAGE_KEY = "comida_local_base_monthly" as const;

/** Statuses webhook may activate to published after successful payment. */
export const COMIDA_LOCAL_ACTIVATABLE_PRE_PUBLISH_STATUSES = [
  "draft",
  COMIDA_LOCAL_PENDING_CHECKOUT_STATUS,
] as const;

const ACTIVATABLE_FROM_STATUSES = new Set<string>(COMIDA_LOCAL_ACTIVATABLE_PRE_PUBLISH_STATUSES);

export type ComidaLocalRevenueActivationOutcome =
  | "activated"
  | "already_published"
  | "skipped_wrong_package"
  | "missing_listing_id"
  | "not_found"
  | "unsafe_status"
  | "error";

export type ComidaLocalRevenueActivationResult = {
  ok: boolean;
  outcome: ComidaLocalRevenueActivationOutcome;
  message?: string;
  listingId?: string | null;
};

export async function activatePaidComidaLocalListingFromRevenueOs(input: {
  listingId: string | null | undefined;
  packageKey: string | null | undefined;
  paymentRecordId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripeEventId?: string | null;
  leonixAdId?: string | null;
}): Promise<ComidaLocalRevenueActivationResult> {
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();
  if (packageKey !== COMIDA_LOCAL_BASE_MONTHLY_PACKAGE_KEY) {
    return { ok: true, outcome: "skipped_wrong_package" };
  }

  const listingId = String(input.listingId ?? "").trim();
  if (!listingId) {
    return {
      ok: false,
      outcome: "missing_listing_id",
      message: "listingId is required for Comida Local activation.",
    };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, outcome: "error", message: "Supabase admin is not configured." };
  }

  const supabase = getAdminSupabase();
  const { data: row, error: readError } = await supabase
    .from("comida_local_public_listings")
    .select("id, status, published_at, payment_status")
    .eq("id", listingId)
    .maybeSingle();

  if (readError) {
    return { ok: false, outcome: "error", message: readError.message, listingId };
  }

  if (!row?.id) {
    return {
      ok: false,
      outcome: "not_found",
      message: "Comida Local listing row not found.",
      listingId,
    };
  }

  const status = String(row.status ?? "").trim().toLowerCase();

  if (status === "published") {
    return { ok: true, outcome: "already_published", listingId };
  }

  if (status === "suspended" || status === "paused") {
    return {
      ok: true,
      outcome: "unsafe_status",
      message: "Suspended/paused Comida Local listings are not auto-activated by webhook.",
      listingId,
    };
  }

  if (!ACTIVATABLE_FROM_STATUSES.has(status)) {
    return {
      ok: false,
      outcome: "unsafe_status",
      message: `Cannot activate Comida Local listing from status "${status}".`,
      listingId,
    };
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: "published",
    payment_status: "paid",
    updated_at: now,
  };
  if (!row.published_at) {
    patch.published_at = now;
  }

  const { data: updated, error: updateError } = await supabase
    .from("comida_local_public_listings")
    .update(patch)
    .eq("id", listingId)
    .in("status", [...COMIDA_LOCAL_ACTIVATABLE_PRE_PUBLISH_STATUSES])
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { ok: false, outcome: "error", message: updateError.message, listingId };
  }

  if (!updated?.id) {
    const { data: recheck } = await supabase
      .from("comida_local_public_listings")
      .select("status")
      .eq("id", listingId)
      .maybeSingle();
    if (String(recheck?.status ?? "").toLowerCase() === "published") {
      return { ok: true, outcome: "already_published", listingId };
    }
    return {
      ok: false,
      outcome: "error",
      message: "Comida Local listing activation update did not apply.",
      listingId,
    };
  }

  return { ok: true, outcome: "activated", listingId };
}
