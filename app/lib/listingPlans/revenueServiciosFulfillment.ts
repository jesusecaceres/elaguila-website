/**
 * Servicios listing activation after Revenue OS webhook payment — server-only.
 * Gate SERVICIOS-GLOBAL-CHECKOUT-STANDARD-PARITY-01
 *
 * Flips a hidden `pending_payment` Servicios listing to `published` only after paid truth.
 * Mirrors revenueRestaurantFulfillment.ts. Does not touch Stripe raw body/signature.
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

/** Hidden DB status for unpaid Servicios listings saved before Revenue OS Stripe checkout. */
export const SERVICIOS_PENDING_CHECKOUT_STATUS = "pending_payment" as const;

export const SERVICIOS_BASE_MONTHLY_PACKAGE_KEY = "servicios_base_monthly" as const;

/** Statuses the webhook may activate to `published` after successful payment. */
export const SERVICIOS_ACTIVATABLE_PRE_PUBLISH_STATUSES = [
  "paused_unpublished",
  SERVICIOS_PENDING_CHECKOUT_STATUS,
] as const;

const ACTIVATABLE_FROM_STATUSES = new Set<string>(SERVICIOS_ACTIVATABLE_PRE_PUBLISH_STATUSES);

export type ServiciosRevenueActivationOutcome =
  | "activated"
  | "already_published"
  | "skipped_wrong_package"
  | "missing_listing_id"
  | "not_found"
  | "unsafe_status"
  | "error";

export type ServiciosRevenueActivationResult = {
  ok: boolean;
  outcome: ServiciosRevenueActivationOutcome;
  message?: string;
  listingId?: string | null;
};

export async function activatePaidServiciosListingFromRevenueOs(input: {
  listingId: string | null | undefined;
  packageKey: string | null | undefined;
  paymentRecordId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripeEventId?: string | null;
  leonixAdId?: string | null;
}): Promise<ServiciosRevenueActivationResult> {
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();
  if (packageKey !== SERVICIOS_BASE_MONTHLY_PACKAGE_KEY) {
    return { ok: true, outcome: "skipped_wrong_package" };
  }

  const listingId = String(input.listingId ?? "").trim();
  if (!listingId) {
    return {
      ok: false,
      outcome: "missing_listing_id",
      message: "listingId is required for Servicios activation.",
    };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, outcome: "error", message: "Supabase admin is not configured." };
  }

  const supabase = getAdminSupabase();
  const { data: row, error: readError } = await supabase
    .from("servicios_public_listings")
    .select("id, listing_status, published_at")
    .eq("id", listingId)
    .maybeSingle();

  if (readError) {
    return { ok: false, outcome: "error", message: readError.message, listingId };
  }

  if (!row?.id) {
    return { ok: false, outcome: "not_found", message: "Servicios listing row not found.", listingId };
  }

  const status = String(row.listing_status ?? "").trim().toLowerCase();

  if (status === "published") {
    return { ok: true, outcome: "already_published", listingId };
  }

  if (status === "suspended" || status === "rejected") {
    return {
      ok: true,
      outcome: "unsafe_status",
      message: "Suspended/rejected Servicios listings are not auto-activated by webhook.",
      listingId,
    };
  }

  if (!ACTIVATABLE_FROM_STATUSES.has(status)) {
    return {
      ok: false,
      outcome: "unsafe_status",
      message: `Cannot activate Servicios listing from status "${status}".`,
      listingId,
    };
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    listing_status: "published",
    updated_at: now,
  };
  if (!row.published_at) {
    patch.published_at = now;
  }

  const { data: updated, error: updateError } = await supabase
    .from("servicios_public_listings")
    .update(patch)
    .eq("id", listingId)
    .in("listing_status", [...SERVICIOS_ACTIVATABLE_PRE_PUBLISH_STATUSES])
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { ok: false, outcome: "error", message: updateError.message, listingId };
  }

  if (!updated?.id) {
    const { data: recheck } = await supabase
      .from("servicios_public_listings")
      .select("listing_status")
      .eq("id", listingId)
      .maybeSingle();
    if (String(recheck?.listing_status ?? "").toLowerCase() === "published") {
      return { ok: true, outcome: "already_published", listingId };
    }
    return {
      ok: false,
      outcome: "error",
      message: "Servicios listing activation update did not apply.",
      listingId,
    };
  }

  return { ok: true, outcome: "activated", listingId };
}
