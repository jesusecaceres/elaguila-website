/**
 * Bienes Raices FSBO listing activation after Revenue OS webhook payment.
 *
 * Flips hidden `listings` rows (category bienes-raices, seller_type personal,
 * br_publish lane privado) to active/published only after paid truth.
 *
 * Gate BIENES-PRIVADO-1 — this file previously wrote status/is_published/published_at and NEVER
 * `expires_at`, so the 45-day term the buyer paid for existed only inside
 * `listing_package_entitlements.ends_at` and nothing public ever honored it. The term is now written
 * onto the SAME listing row at the same webhook-authoritative moment, using the shared fixed-term
 * engine (`computeFixedDayRenewalExpiresAt`) that Rentas already uses, with the duration read from
 * the canonical Revenue OS matrix via `bienesFsboDurationDays()` — never a duplicated 45-day literal.
 *
 * Renewal is handled here too, on the SAME row (Master §10 same-row / no-recharge): a renewal is a
 * genuine new $49.99 purchase that extends `expires_at` from whichever is later — the current expiry
 * or the payment moment — and preserves listings.id, leonix_ad_id, owner, media, analytics and
 * content. No second listing is ever created. Only this webhook path can extend a term; a failed or
 * cancelled checkout never reaches this function, so it cannot republish or extend anything.
 */

import "server-only";
import { mergeBrListingPaymentMeta } from "@/app/lib/clasificados/bienes-raices/brListingPaymentMetadata";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { computeFixedDayRenewalExpiresAt } from "@/app/lib/listingLifecycle/resolveListingLifecycle";
import { paymentRecordIsRenewal } from "@/app/lib/listingLifecycle/listingRenewalFulfillment";
import { bienesFsboDurationDays } from "@/app/lib/listingLifecycle/bienesFsboLifecycle";

export const BIENES_RAICES_FSBO_PACKAGE_KEY = "br_fsbo_45d" as const;
export const BIENES_RAICES_FSBO_PENDING_CHECKOUT_STATUS = "pending" as const;

/** Statuses a renewal payment may legitimately extend. A renewal never resurrects moderation. */
export const BIENES_RAICES_FSBO_RENEWABLE_FROM_STATUSES = ["active", "expired"] as const;

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
  /** Present for renewals; its metadata carries `operation: "renew_listing"` and the applied stamp. */
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

  // Renewal truth is server-side only: it comes from the payment record this webhook is fulfilling,
  // never from anything the client sent. `renewal_applied_at` makes a replayed webhook idempotent,
  // so a redelivered Stripe event cannot stack a second 45 days onto the same purchase.
  const paymentMetadata = input.paymentRecordId ? await readPaymentRecordMetadata(input.paymentRecordId) : null;
  const renewal = paymentRecordIsRenewal(paymentMetadata);
  if (renewal && paymentMetadata?.renewal_applied_at) {
    return { ok: true, outcome: "already_published", listingId };
  }

  if (status === "active" && isPublished && !renewal) {
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

  if (renewal && !RENEWABLE_FROM_STATUSES.has(status)) {
    return {
      ok: true,
      outcome: "unsafe_status",
      message: `Cannot renew Bienes Raices FSBO listing from status "${status}".`,
      listingId,
    };
  }

  if (!renewal && (status !== BIENES_RAICES_FSBO_PENDING_CHECKOUT_STATUS || isPublished)) {
    return {
      ok: false,
      outcome: "unsafe_status",
      message: `Cannot activate Bienes Raices FSBO listing from status "${status}" (published=${String(isPublished)}).`,
      listingId,
    };
  }

  const now = new Date().toISOString();
  // The ONE fixed-term computation, shared with Rentas. A first activation starts the term at the
  // payment moment (currentExpiresAtIso: null). A renewal passes the current expiry, and the shared
  // engine starts from whichever is later — so renewing early never burns the days already paid for,
  // and renewing after expiry starts a clean 45 days from payment.
  const durationDays = bienesFsboDurationDays();
  const expiresAt = computeFixedDayRenewalExpiresAt({
    currentExpiresAtIso: renewal && typeof row.expires_at === "string" ? row.expires_at : null,
    paymentCompletedAtIso: now,
    durationDays,
  });
  const listingJson = mergeBrListingPaymentMeta(row.listing_json, {
    payment_status: "paid",
    lane: "privado",
    stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
    paid_at: now,
    ...(renewal ? { renewed_at: now, renewal_payment_record_id: input.paymentRecordId ?? null } : {}),
  });

  // Same-row write. `published_at` is preserved on renewal (`row.published_at ?? now`) so the
  // listing keeps its original publication date and its age/ordering history — only the term moves.
  const patch = {
    status: "active",
    is_published: true,
    published_at: row.published_at ?? now,
    expires_at: expiresAt,
    updated_at: now,
    listing_json: listingJson,
  };

  // Compare-and-set on the same predicates as before, plus a status gate that differs by operation:
  // a first activation may only move pending/unpublished -> active, while a renewal may only extend
  // a row that is already active or expired. Either way the row must still be this lane's row.
  let updateQuery = supabase
    .from("listings")
    .update(patch)
    .eq("id", listingId)
    .eq("category", "bienes-raices")
    .eq("seller_type", "personal");
  updateQuery = renewal
    ? updateQuery.in("status", [...BIENES_RAICES_FSBO_RENEWABLE_FROM_STATUSES])
    : updateQuery.eq("status", BIENES_RAICES_FSBO_PENDING_CHECKOUT_STATUS).eq("is_published", false);

  const { data: updated, error: updateError } = await updateQuery.select("id").maybeSingle();

  if (updateError) {
    return { ok: false, outcome: "error", message: updateError.message, listingId };
  }

  if (!updated?.id) {
    const { data: recheck } = await supabase
      .from("listings")
      .select("status, is_published")
      .eq("id", listingId)
      .maybeSingle();
    if (!renewal && recheck?.status === "active" && recheck.is_published === true) {
      return { ok: true, outcome: "already_published", listingId };
    }
    return {
      ok: false,
      outcome: "error",
      message: renewal
        ? "Bienes Raices FSBO listing renewal update did not apply."
        : "Bienes Raices FSBO listing activation update did not apply.",
      listingId,
    };
  }

  if (renewal && input.paymentRecordId) {
    await markBienesFsboRenewalPaymentApplied({
      paymentRecordId: input.paymentRecordId,
      renewedAt: now,
      newExpiresAt: expiresAt,
    });
  }

  return { ok: true, outcome: renewal ? "renewed" : "activated", listingId };
}

const RENEWABLE_FROM_STATUSES = new Set<string>(BIENES_RAICES_FSBO_RENEWABLE_FROM_STATUSES);

async function readPaymentRecordMetadata(paymentRecordId: string): Promise<Record<string, unknown> | null> {
  const { data } = await getAdminSupabase()
    .from("leonix_payment_records")
    .select("metadata")
    .eq("id", paymentRecordId)
    .maybeSingle();
  return data?.metadata && typeof data.metadata === "object" ? (data.metadata as Record<string, unknown>) : null;
}

/**
 * Stamps the payment record so a replayed webhook for the SAME purchase is a no-op. Written only
 * after the listing row update has already committed, so a failed renewal leaves no applied stamp.
 */
async function markBienesFsboRenewalPaymentApplied(input: {
  paymentRecordId: string;
  renewedAt: string;
  newExpiresAt: string;
}): Promise<void> {
  const metadata = (await readPaymentRecordMetadata(input.paymentRecordId)) ?? {};
  await getAdminSupabase()
    .from("leonix_payment_records")
    .update({
      metadata: {
        ...metadata,
        renewal_applied_at: input.renewedAt,
        renewal_new_expires_at: input.newExpiresAt,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.paymentRecordId);
}
