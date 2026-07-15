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
import { RENTAS_LIFECYCLE_DURATION_DAYS } from "@/app/lib/listingLifecycle/listingLifecycleConfig";
import { computeFixedDayRenewalExpiresAt } from "@/app/lib/listingLifecycle/resolveListingLifecycle";
import { paymentRecordIsRenewal } from "@/app/lib/listingLifecycle/listingRenewalFulfillment";

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
  | "renewed"
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
  const rowRead = await readRentasPaymentRow(listingId);
  const row = rowRead.row;
  const readError = rowRead.error;

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
      message: "Removed/flagged Rentas listings are not auto-activated by webhook.",
      listingId,
    };
  }

  if (!renewal && (!ACTIVATABLE_FROM_STATUSES.has(status) || isPublished)) {
    return {
      ok: false,
      outcome: "unsafe_status",
      message: `Cannot activate Rentas listing from status "${status}" (published=${String(isPublished)}).`,
      listingId,
    };
  }

  const now = new Date().toISOString();
  const expiresAt = renewal
    ? computeFixedDayRenewalExpiresAt({
        currentExpiresAtIso: typeof row.expires_at === "string" ? row.expires_at : null,
        paymentCompletedAtIso: now,
        durationDays: RENTAS_LIFECYCLE_DURATION_DAYS,
      })
    : computeFixedDayRenewalExpiresAt({
        currentExpiresAtIso: null,
        paymentCompletedAtIso: now,
        durationDays: RENTAS_LIFECYCLE_DURATION_DAYS,
      });
  const listingJson = mergeRentasListingPaymentMeta(row.listing_json, {
    payment_status: "paid",
    stripe_checkout_session_id: null,
    stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
    paid_at: now,
    ...(renewal ? { renewed_at: now, renewal_payment_record_id: input.paymentRecordId ?? null } : {}),
  });

  const updatePatch: Record<string, unknown> = {
    status: "active",
    is_published: true,
    published_at: row.published_at ?? now,
    expires_at: expiresAt,
    updated_at: now,
    listing_json: listingJson,
  };

  const updateResult = await updateRentasPaymentRowResilient({
    listingId,
    patch: updatePatch,
    renewal,
  });
  const updated = updateResult.data;
  const updateError = updateResult.error;

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

  if (renewal && input.paymentRecordId) {
    await markRentasRenewalPaymentApplied({
      paymentRecordId: input.paymentRecordId,
      renewedAt: now,
      newExpiresAt: expiresAt,
    });
  }

  return { ok: true, outcome: renewal ? "renewed" : "activated", listingId };
}

async function readPaymentRecordMetadata(paymentRecordId: string): Promise<Record<string, unknown> | null> {
  const { data } = await getAdminSupabase()
    .from("leonix_payment_records")
    .select("metadata")
    .eq("id", paymentRecordId)
    .maybeSingle();
  return data?.metadata && typeof data.metadata === "object" ? (data.metadata as Record<string, unknown>) : null;
}

async function markRentasRenewalPaymentApplied(input: {
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

async function readRentasPaymentRow(listingId: string): Promise<{
  row: Record<string, unknown> | null;
  error: { message: string } | null;
}> {
  const supabase = getAdminSupabase();
  for (const cols of [
    "id, category, status, is_published, published_at, expires_at, listing_json",
    "id, category, status, is_published, published_at, expires_at",
    "id, category, status, is_published, published_at",
  ]) {
    const { data, error } = await supabase.from("listings").select(cols).eq("id", listingId).maybeSingle();
    if (!error) return { row: (data as Record<string, unknown> | null) ?? null, error: null };
    if (!/column .* does not exist|schema cache/i.test(error.message)) return { row: null, error: { message: error.message } };
  }
  return { row: null, error: { message: "Unable to read Rentas listing lifecycle row." } };
}

async function updateRentasPaymentRowResilient(input: {
  listingId: string;
  patch: Record<string, unknown>;
  renewal: boolean;
}): Promise<{ data: { id?: string } | null; error: { message: string } | null }> {
  const supabase = getAdminSupabase();
  let patch = { ...input.patch };
  for (let attempt = 0; attempt < 8; attempt++) {
    let q = supabase.from("listings").update(patch).eq("id", input.listingId).eq("category", "rentas");
    if (!input.renewal) {
      q = q.eq("status", RENTAS_PENDING_CHECKOUT_STATUS).eq("is_published", false);
    } else {
      q = q.in("status", ["active", "expired"]);
    }
    const { data, error } = await q.select("id").maybeSingle();
    if (!error) return { data: (data as { id?: string } | null) ?? null, error: null };
    const match = /column\s+["']?(\w+)["']?\s+of\s+relation\s+["']?listings["']?\s+does not exist/i.exec(error.message);
    const missing = match?.[1];
    if (!missing || !(missing in patch)) return { data: null, error: { message: error.message } };
    const next = { ...patch };
    delete next[missing];
    patch = next;
  }
  return { data: null, error: { message: "Rentas lifecycle update could not be made schema-compatible." } };
}
