/**
 * Rentas listing activation after Revenue OS webhook payment — server-only.
 * Gate REVENUE-OS-RENTAS-PAID-PUBLISH-LOCKDOWN-01
 *
 * Flips hidden `listings` rows (category rentas, status pending) to active/published
 * only after paid truth. Mirrors revenueServiciosFulfillment pattern.
 */

import "server-only";
import { mergeRentasListingPaymentMeta } from "@/app/lib/clasificados/rentas/rentasListingPaymentMetadata";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const RENTAS_30D_PACKAGE_KEY = "rentas_30d" as const;

/** Hidden DB status for unpaid Rentas listings saved before Revenue OS Stripe checkout. */
export const RENTAS_PENDING_CHECKOUT_STATUS = "pending" as const;

export const RENTAS_ACTIVATABLE_PRE_PUBLISH_STATUSES = [RENTAS_PENDING_CHECKOUT_STATUS] as const;

const ACTIVATABLE_FROM_STATUSES = new Set<string>(RENTAS_ACTIVATABLE_PRE_PUBLISH_STATUSES);

export type RentasRevenueActivationOutcome =
  | "activated"
  | "already_published"
  | "skipped_wrong_package"
  | "missing_listing_id"
  | "not_found"
  | "wrong_category"
  | "unsafe_status"
  | "error";

export type RentasRevenueActivationResult = {
  ok: boolean;
  outcome: RentasRevenueActivationOutcome;
  message?: string;
  listingId?: string | null;
};

export async function activatePaidRentasListingFromRevenueOs(input: {
  listingId: string | null | undefined;
  packageKey: string | null | undefined;
  paymentRecordId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripeEventId?: string | null;
  stripePaymentIntentId?: string | null;
  leonixAdId?: string | null;
}): Promise<RentasRevenueActivationResult> {
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();
  if (packageKey !== RENTAS_30D_PACKAGE_KEY) {
    return { ok: true, outcome: "skipped_wrong_package" };
  }

  const listingId = String(input.listingId ?? "").trim();
  if (!listingId) {
    return {
      ok: false,
      outcome: "missing_listing_id",
      message: "listingId is required for Rentas activation.",
    };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, outcome: "error", message: "Supabase admin is not configured." };
  }

  const supabase = getAdminSupabase();
  const { data: row, error: readError } = await supabase
    .from("listings")
    .select("id, category, status, is_published, published_at, listing_json")
    .eq("id", listingId)
    .maybeSingle();

  if (readError) {
    return { ok: false, outcome: "error", message: readError.message, listingId };
  }

  if (!row?.id) {
    return { ok: false, outcome: "not_found", message: "Rentas listing row not found.", listingId };
  }

  const category = String(row.category ?? "").trim().toLowerCase();
  if (category !== "rentas") {
    return {
      ok: true,
      outcome: "wrong_category",
      message: "Listing is not a Rentas row.",
      listingId,
    };
  }

  const status = String(row.status ?? "").trim().toLowerCase();
  const isPublished = row.is_published === true;

  if (status === "active" && isPublished) {
    return { ok: true, outcome: "already_published", listingId };
  }

  if (status === "removed" || status === "flagged") {
    return {
      ok: true,
      outcome: "unsafe_status",
      message: "Removed/flagged Rentas listings are not auto-activated by webhook.",
      listingId,
    };
  }

  if (!ACTIVATABLE_FROM_STATUSES.has(status) || isPublished) {
    return {
      ok: false,
      outcome: "unsafe_status",
      message: `Cannot activate Rentas listing from status "${status}" (published=${String(isPublished)}).`,
      listingId,
    };
  }

  const now = new Date().toISOString();
  const listingJson = mergeRentasListingPaymentMeta(row.listing_json, {
    payment_status: "paid",
    stripe_checkout_session_id: null,
    stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
    paid_at: now,
  });

  const { data: updated, error: updateError } = await supabase
    .from("listings")
    .update({
      status: "active",
      is_published: true,
      published_at: row.published_at ?? now,
      updated_at: now,
      listing_json: listingJson,
    })
    .eq("id", listingId)
    .eq("category", "rentas")
    .eq("status", RENTAS_PENDING_CHECKOUT_STATUS)
    .eq("is_published", false)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { ok: false, outcome: "error", message: updateError.message, listingId };
  }

  if (!updated?.id) {
    const { data: recheck } = await supabase
      .from("listings")
      .select("status, is_published")
      .eq("id", listingId)
      .maybeSingle();
    if (recheck?.status === "active" && recheck.is_published === true) {
      return { ok: true, outcome: "already_published", listingId };
    }
    return {
      ok: false,
      outcome: "error",
      message: "Rentas listing activation update did not apply.",
      listingId,
    };
  }

  return { ok: true, outcome: "activated", listingId };
}
