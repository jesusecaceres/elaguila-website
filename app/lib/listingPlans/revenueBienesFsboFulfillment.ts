/**
 * Bienes Raices FSBO listing activation after Revenue OS webhook payment.
 *
 * Flips hidden `listings` rows (category bienes-raices, seller_type personal,
 * br_publish lane privado) to active/published only after paid truth.
 */

import "server-only";
import { mergeBrListingPaymentMeta } from "@/app/lib/clasificados/bienes-raices/brListingPaymentMetadata";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const BIENES_RAICES_FSBO_PACKAGE_KEY = "br_fsbo_45d" as const;
export const BIENES_RAICES_FSBO_PENDING_CHECKOUT_STATUS = "pending" as const;

export type BienesFsboRevenueActivationOutcome =
  | "activated"
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
    .select("id, category, seller_type, status, is_published, published_at, listing_json")
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
