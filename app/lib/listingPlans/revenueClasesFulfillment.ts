/**
 * Clases paid-class listing activation after Revenue OS webhook payment — server-only.
 * Gate 2B (STRIPE-REVENUE-OS-CLASES-PAID-PUBLISH-01)
 *
 * Mirrors `revenueRentasFulfillment.ts`'s same-row activation pattern: flips a hidden `listings`
 * row (category "clases", status "pending") to active/published only after a verified Stripe
 * payment for `clases_paid_30d`. No renewal support and no `listing_json` merge — Clases has
 * neither an established renewal product nor a `listing_json` sub-schema (renewal/expired
 * republish is explicitly deferred per Gate 2B scope).
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { computeFixedDayRenewalExpiresAt } from "@/app/lib/listingLifecycle/resolveListingLifecycle";
import { getRevenuePackageDefinition } from "./revenuePricingMatrix";

export const CLASES_PAID_30D_PACKAGE_KEY = "clases_paid_30d" as const;

/** Hidden DB status for unpaid Clases listings saved before Revenue OS Stripe checkout. */
export const CLASES_PENDING_CHECKOUT_STATUS = "pending" as const;

export type ClasesRevenueActivationOutcome =
  | "activated"
  | "already_published"
  | "skipped_wrong_package"
  | "missing_listing_id"
  | "not_found"
  | "wrong_category"
  | "unsafe_status"
  | "error";

export type ClasesRevenueActivationResult = {
  ok: boolean;
  outcome: ClasesRevenueActivationOutcome;
  message?: string;
  listingId?: string | null;
};

export async function activatePaidClasesListingFromRevenueOs(input: {
  listingId: string | null | undefined;
  packageKey: string | null | undefined;
  paymentRecordId?: string | null;
  stripeCheckoutSessionId?: string | null;
  stripeEventId?: string | null;
  stripePaymentIntentId?: string | null;
  leonixAdId?: string | null;
}): Promise<ClasesRevenueActivationResult> {
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();
  if (packageKey !== CLASES_PAID_30D_PACKAGE_KEY) {
    return { ok: true, outcome: "skipped_wrong_package" };
  }

  const listingId = String(input.listingId ?? "").trim();
  if (!listingId) {
    return {
      ok: false,
      outcome: "missing_listing_id",
      message: "listingId is required for Clases activation.",
    };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, outcome: "error", message: "Supabase admin is not configured." };
  }

  const supabase = getAdminSupabase();
  const { data: row, error: readError } = await supabase
    .from("listings")
    .select("id, category, status, is_published, published_at, expires_at")
    .eq("id", listingId)
    .maybeSingle();

  if (readError) {
    return { ok: false, outcome: "error", message: readError.message, listingId };
  }
  if (!row?.id) {
    return { ok: false, outcome: "not_found", message: "Clases listing row not found.", listingId };
  }

  const category = String(row.category ?? "").trim().toLowerCase();
  if (category !== "clases") {
    return { ok: true, outcome: "wrong_category", message: "Listing is not a Clases row.", listingId };
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
      message: "Removed/flagged Clases listings are not auto-activated by webhook.",
      listingId,
    };
  }

  if (status !== CLASES_PENDING_CHECKOUT_STATUS || isPublished) {
    return {
      ok: false,
      outcome: "unsafe_status",
      message: `Cannot activate Clases listing from status "${status}" (published=${String(isPublished)}).`,
      listingId,
    };
  }

  const now = new Date().toISOString();
  const durationDays = getRevenuePackageDefinition(CLASES_PAID_30D_PACKAGE_KEY)?.durationDays ?? 30;
  const expiresAt = computeFixedDayRenewalExpiresAt({
    currentExpiresAtIso: null,
    paymentCompletedAtIso: now,
    durationDays,
  });

  const updatePatch = {
    status: "active",
    is_published: true,
    published_at: row.published_at ?? now,
    expires_at: expiresAt,
    updated_at: now,
  };

  // Conditional UPDATE (compare-and-swap on status/is_published) is the idempotency backstop: a
  // duplicate webhook delivery finds the row already flipped to active/published, the `.eq`
  // predicates below match zero rows, and the recheck path returns "already_published" instead
  // of re-activating or re-extending the term.
  const { data: updated, error: updateError } = await supabase
    .from("listings")
    .update(updatePatch)
    .eq("id", listingId)
    .eq("category", "clases")
    .eq("status", CLASES_PENDING_CHECKOUT_STATUS)
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
    return { ok: false, outcome: "error", message: "Clases listing activation update did not apply.", listingId };
  }

  return { ok: true, outcome: "activated", listingId };
}
