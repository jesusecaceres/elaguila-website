/**
 * Restaurante listing activation after Revenue OS webhook payment — server-only.
 * Gate RESTAURANTES-REVENUE-OS-WEBHOOK-ACTIVATION-01
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

/** Hidden DB status for unpaid listings saved before Revenue OS Stripe checkout. */
export const RESTAURANTE_PENDING_CHECKOUT_STATUS = "pending_payment" as const;

export const RESTAURANTES_BASE_MONTHLY_PACKAGE_KEY = "restaurantes_base_monthly" as const;

/** Statuses webhook may activate to published after successful payment. */
export const RESTAURANTE_ACTIVATABLE_PRE_PUBLISH_STATUSES = [
  "archived",
  RESTAURANTE_PENDING_CHECKOUT_STATUS,
] as const;

const ACTIVATABLE_FROM_STATUSES = new Set<string>(RESTAURANTE_ACTIVATABLE_PRE_PUBLISH_STATUSES);

export type RestauranteRevenueActivationOutcome =
  | "activated"
  | "already_published"
  | "skipped_wrong_package"
  | "missing_listing_id"
  | "not_found"
  | "unsafe_status"
  | "error";

export type RestauranteRevenueActivationResult = {
  ok: boolean;
  outcome: RestauranteRevenueActivationOutcome;
  message?: string;
  listingId?: string | null;
};

export async function activatePaidRestauranteListingFromRevenueOs(input: {
  listingId: string | null | undefined;
  packageKey: string | null | undefined;
  paymentRecordId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripeEventId?: string | null;
  leonixAdId?: string | null;
}): Promise<RestauranteRevenueActivationResult> {
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();
  if (packageKey !== RESTAURANTES_BASE_MONTHLY_PACKAGE_KEY) {
    return { ok: true, outcome: "skipped_wrong_package" };
  }

  const listingId = String(input.listingId ?? "").trim();
  if (!listingId) {
    return {
      ok: false,
      outcome: "missing_listing_id",
      message: "listingId is required for Restaurante activation.",
    };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, outcome: "error", message: "Supabase admin is not configured." };
  }

  const supabase = getAdminSupabase();
  const { data: row, error: readError } = await supabase
    .from("restaurantes_public_listings")
    .select("id, status, published_at")
    .eq("id", listingId)
    .maybeSingle();

  if (readError) {
    return { ok: false, outcome: "error", message: readError.message, listingId };
  }

  if (!row?.id) {
    return {
      ok: false,
      outcome: "not_found",
      message: "Restaurante listing row not found.",
      listingId,
    };
  }

  const status = String(row.status ?? "").trim().toLowerCase();

  if (status === "published") {
    return { ok: true, outcome: "already_published", listingId };
  }

  if (status === "suspended") {
    return {
      ok: true,
      outcome: "unsafe_status",
      message: "Suspended restaurant listings are not auto-activated by webhook.",
      listingId,
    };
  }

  if (!ACTIVATABLE_FROM_STATUSES.has(status)) {
    return {
      ok: false,
      outcome: "unsafe_status",
      message: `Cannot activate restaurant listing from status "${status}".`,
      listingId,
    };
  }

  const now = new Date().toISOString();
  const patch: Record<string, string> = {
    status: "published",
    updated_at: now,
  };
  if (!row.published_at) {
    patch.published_at = now;
  }

  const { data: updated, error: updateError } = await supabase
    .from("restaurantes_public_listings")
    .update(patch)
    .eq("id", listingId)
    .in("status", [...RESTAURANTE_ACTIVATABLE_PRE_PUBLISH_STATUSES])
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { ok: false, outcome: "error", message: updateError.message, listingId };
  }

  if (!updated?.id) {
    const { data: recheck } = await supabase
      .from("restaurantes_public_listings")
      .select("status")
      .eq("id", listingId)
      .maybeSingle();
    if (String(recheck?.status ?? "").toLowerCase() === "published") {
      return { ok: true, outcome: "already_published", listingId };
    }
    return {
      ok: false,
      outcome: "error",
      message: "Restaurant listing activation update did not apply.",
      listingId,
    };
  }

  return { ok: true, outcome: "activated", listingId };
}
