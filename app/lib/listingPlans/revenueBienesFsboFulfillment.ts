/**
 * Bienes Raices FSBO listing activation after Revenue OS webhook payment.
 *
 * Flips hidden `listings` rows (category bienes-raices, seller_type personal,
 * br_publish lane privado) to active/published only after paid truth.
 *
 * Gate BIENES-PRIVADO-1 (reconciled onto Owner Command Center Gate 20 at the Servicios integration
 * gate) — the FIRST activation also writes the paid 45-day term onto the same row. Without it a new
 * FSBO listing carried `expires_at = null`, which every public rule treats as "no term", so the
 * 45 days the buyer paid for were never honored. Same shared engine
 * (`computeFixedDayRenewalExpiresAt`) and the same registry duration Gate 20's renewal uses, so the
 * first term and every renewal are computed identically.
 */

import "server-only";
import { mergeBrListingPaymentMeta } from "@/app/lib/clasificados/bienes-raices/brListingPaymentMetadata";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  paymentRecordIsRenewal,
  isRenewalAlreadyApplied,
  markRenewalPaymentApplied,
} from "@/app/lib/listingLifecycle/listingRenewalFulfillment";
import { computeFixedDayRenewalExpiresAt } from "@/app/lib/listingLifecycle/resolveListingLifecycle";
import { BR_FSBO_LIFECYCLE_DURATION_DAYS } from "@/app/lib/listingLifecycle/listingLifecycleConfig";

export const BIENES_RAICES_FSBO_PACKAGE_KEY = "br_fsbo_45d" as const;
export const BIENES_RAICES_FSBO_PENDING_CHECKOUT_STATUS = "pending" as const;

export type BienesFsboRevenueActivationOutcome =
  | "activated"
  | "renewed"
  | "already_published"
  | "skipped_wrong_package"
  | "missing_listing_id"
  | "not_found"
  | "wrong_category"
  | "wrong_lane"
  | "unsafe_status"
  | "error";

export type BienesFsboRevenueActivationResult = {
  ok: boolean;
  outcome: BienesFsboRevenueActivationOutcome;
  message?: string;
  listingId?: string | null;
};

export async function activatePaidBienesFsboListingFromRevenueOs(input: {
  listingId: string | null | undefined;
  packageKey: string | null | undefined;
  stripePaymentIntentId?: string | null;
  paymentMetadata?: Record<string, unknown> | null;
  paymentRecordId?: string | null;
}): Promise<BienesFsboRevenueActivationResult> {
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();
  if (packageKey !== BIENES_RAICES_FSBO_PACKAGE_KEY) {
    return { ok: true, outcome: "skipped_wrong_package" };
  }

  const listingId = String(input.listingId ?? "").trim();
  if (!listingId) {
    return {
      ok: false,
      outcome: "missing_listing_id",
      message: "listingId is required for Bienes Raices FSBO activation.",
    };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, outcome: "error", message: "Supabase admin is not configured." };
  }

  const supabase = getAdminSupabase();
  const { data: row, error: readError } = await supabase
    .from("listings")
    .select("id, category, seller_type, status, is_published, published_at, expires_at, listing_json")
    .eq("id", listingId)
    .maybeSingle();

  if (readError) {
    return { ok: false, outcome: "error", message: readError.message, listingId };
  }

  if (!row?.id) {
    return { ok: false, outcome: "not_found", message: "Bienes Raices FSBO listing row not found.", listingId };
  }

  const category = String(row.category ?? "").trim().toLowerCase();
  if (category !== "bienes-raices") {
    return { ok: true, outcome: "wrong_category", message: "Listing is not a Bienes Raices row.", listingId };
  }

  const sellerType = String(row.seller_type ?? "").trim().toLowerCase();
  const brPublish =
    row.listing_json && typeof row.listing_json === "object"
      ? (row.listing_json as { br_publish?: { lane?: string; payment_status?: string } }).br_publish
      : null;
  if (sellerType !== "personal" || brPublish?.lane !== "privado") {
    return { ok: true, outcome: "wrong_lane", message: "Listing is not a Bienes Raices FSBO row.", listingId };
  }

  const status = String(row.status ?? "").trim().toLowerCase();
  const isPublished = row.is_published === true;
  const renewal = paymentRecordIsRenewal(input.paymentMetadata);

  if (renewal) {
    // Webhook-retry idempotency — see isRenewalAlreadyApplied doc. Must be checked before any
    // write: a redelivered "renewal succeeded" event must never extend the term a second time.
    if (isRenewalAlreadyApplied(input.paymentMetadata)) {
      return { ok: true, outcome: "already_published", listingId };
    }
    // Gate 20 — same-row renewal only: never touches status/is_published (already active and
    // published, exactly like a lifecycle-expired-but-still-active Rentas row), only extends
    // expires_at from whichever is later: the real current expiration or the payment moment.
    if (status !== "active" || !isPublished) {
      return {
        ok: false,
        outcome: "unsafe_status",
        message: `Cannot renew Bienes Raices FSBO listing from status "${status}" (published=${String(isPublished)}).`,
        listingId,
      };
    }
    const now = new Date().toISOString();
    const newExpiresAt = computeFixedDayRenewalExpiresAt({
      currentExpiresAtIso: typeof row.expires_at === "string" ? row.expires_at : null,
      paymentCompletedAtIso: now,
      durationDays: BR_FSBO_LIFECYCLE_DURATION_DAYS,
    });
    const listingJson = mergeBrListingPaymentMeta(row.listing_json, {
      payment_status: "paid",
      lane: "privado",
      stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
      renewed_at: now,
    });
    const { data: renewed, error: renewError } = await supabase
      .from("listings")
      .update({ expires_at: newExpiresAt, updated_at: now, listing_json: listingJson })
      .eq("id", listingId)
      .eq("category", "bienes-raices")
      .eq("seller_type", "personal")
      .eq("status", "active")
      .eq("is_published", true)
      .select("id")
      .maybeSingle();
    if (renewError) {
      return { ok: false, outcome: "error", message: renewError.message, listingId };
    }
    if (!renewed?.id) {
      return { ok: false, outcome: "error", message: "Bienes Raices FSBO renewal update did not apply.", listingId };
    }
    if (input.paymentRecordId) {
      await markRenewalPaymentApplied({
        paymentRecordId: input.paymentRecordId,
        renewedAt: now,
        newExpiresAt,
      });
    }
    return { ok: true, outcome: "renewed", listingId };
  }

  if (status === "active" && isPublished) {
    return { ok: true, outcome: "already_published", listingId };
  }

  if (status === "removed" || status === "flagged") {
    return {
      ok: true,
      outcome: "unsafe_status",
      message: "Removed/flagged Bienes Raices FSBO listings are not auto-activated by webhook.",
      listingId,
    };
  }

  if (status !== BIENES_RAICES_FSBO_PENDING_CHECKOUT_STATUS || isPublished) {
    return {
      ok: false,
      outcome: "unsafe_status",
      message: `Cannot activate Bienes Raices FSBO listing from status "${status}" (published=${String(isPublished)}).`,
      listingId,
    };
  }

  const now = new Date().toISOString();
  const listingJson = mergeBrListingPaymentMeta(row.listing_json, {
    payment_status: "paid",
    lane: "privado",
    stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
    paid_at: now,
  });
  // First term: a full 45 days from the webhook-authoritative payment moment (no prior expiry).
  const firstTermExpiresAt = computeFixedDayRenewalExpiresAt({
    currentExpiresAtIso: null,
    paymentCompletedAtIso: now,
    durationDays: BR_FSBO_LIFECYCLE_DURATION_DAYS,
  });

  const { data: updated, error: updateError } = await supabase
    .from("listings")
    .update({
      status: "active",
      is_published: true,
      published_at: row.published_at ?? now,
      expires_at: firstTermExpiresAt,
      updated_at: now,
      listing_json: listingJson,
    })
    .eq("id", listingId)
    .eq("category", "bienes-raices")
    .eq("seller_type", "personal")
    .eq("status", BIENES_RAICES_FSBO_PENDING_CHECKOUT_STATUS)
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
      message: "Bienes Raices FSBO listing activation update did not apply.",
      listingId,
    };
  }

  return { ok: true, outcome: "activated", listingId };
}
