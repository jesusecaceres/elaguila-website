/**
 * Servicios listing activation after Revenue OS webhook payment — server-only.
 * Gate SERVICIOS-GLOBAL-CHECKOUT-STANDARD-PARITY-01
 *
 * Flips a hidden `pending_payment` Servicios listing to `published` only after paid truth.
 * Mirrors revenueRestaurantFulfillment.ts. Does not touch Stripe raw body/signature.
 */

import "server-only";
import { randomBytes } from "node:crypto";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { LeonixPaymentRecordRow } from "./revenuePaymentRecords";
import { getRevenuePackageDefinition } from "./revenuePricingMatrix";

/** Hidden DB status for unpaid Servicios listings saved before Revenue OS Stripe checkout. */
export const SERVICIOS_PENDING_CHECKOUT_STATUS = "pending_payment" as const;

export const SERVICIOS_BASE_MONTHLY_PACKAGE_KEY = "servicios_base_monthly" as const;
export const SERVICIOS_OFFERS_ADDON_PACKAGE_KEY = "servicios_offers_addon" as const;

/** Statuses the webhook may activate to `published` after successful payment. */
export const SERVICIOS_ACTIVATABLE_PRE_PUBLISH_STATUSES = [
  "paused_unpublished",
  SERVICIOS_PENDING_CHECKOUT_STATUS,
] as const;

const ACTIVATABLE_FROM_STATUSES = new Set<string>(SERVICIOS_ACTIVATABLE_PRE_PUBLISH_STATUSES);

function generateEntitlementCode(): string {
  return `LX-SVC-OFFER-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function paymentRecordIncludesServiciosOffersAddon(row: LeonixPaymentRecordRow): boolean {
  const addOns = row.metadata?.add_ons;
  if (!Array.isArray(addOns)) return false;
  return addOns.some(
    (a) =>
      a &&
      typeof a === "object" &&
      String((a as Record<string, unknown>).key ?? "").trim().toLowerCase() ===
        SERVICIOS_OFFERS_ADDON_PACKAGE_KEY,
  );
}

export async function grantServiciosOffersAddonEntitlementFromBasePayment(input: {
  paymentRecord: LeonixPaymentRecordRow;
  stripeEventId: string;
  stripeCheckoutSessionId: string;
}): Promise<{ ok: boolean; message?: string }> {
  if (!paymentRecordIncludesServiciosOffersAddon(input.paymentRecord)) return { ok: true };
  if (!isSupabaseAdminConfigured()) return { ok: false, message: "Supabase admin is not configured." };

  const listingId = input.paymentRecord.listing_id?.trim();
  if (!listingId) return { ok: false, message: "listingId is required for Servicios offers entitlement." };

  const packageDef = getRevenuePackageDefinition(SERVICIOS_OFFERS_ADDON_PACKAGE_KEY);
  if (!packageDef) return { ok: false, message: "Servicios offers package definition is missing." };

  const supabase = getAdminSupabase();
  const { data: existing } = await supabase
    .from("listing_package_entitlements")
    .select("id, status")
    .eq("listing_id", listingId)
    .eq("package_key", SERVICIOS_OFFERS_ADDON_PACKAGE_KEY)
    .eq("payment_record_id", input.paymentRecord.id)
    .maybeSingle();

  if (existing?.id && existing.status === "active") return { ok: true };

  const startsAt = new Date();
  const endsAt = new Date(startsAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + 30);

  const { error } = await supabase.from("listing_package_entitlements").insert({
    category: "servicios",
    listing_source: "servicios_public_listings",
    listing_id: listingId,
    package_tier: "digital_only",
    entitlement_code: generateEntitlementCode(),
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    status: "active",
    package_key: SERVICIOS_OFFERS_ADDON_PACKAGE_KEY,
    billing_mode: packageDef.billingMode,
    payment_record_id: input.paymentRecord.id,
    promo_code_id: input.paymentRecord.promo_code_id,
    promo_redemption_id: input.paymentRecord.promo_redemption_id,
    benefits: { offers_module: true },
    placement_scope: [],
    metadata: {
      source: "stripe_webhook",
      gate: "SERVICIOS-PRODUCTION-READINESS-CLOSURE-02",
      stripe_event_id: input.stripeEventId,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      package_key: SERVICIOS_OFFERS_ADDON_PACKAGE_KEY,
      parent_package_key: SERVICIOS_BASE_MONTHLY_PACKAGE_KEY,
      subscription_active: true,
    },
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

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
