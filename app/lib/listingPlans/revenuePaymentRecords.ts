/**
 * Revenue OS pending payment record writes — server-only.
 * Gate STRIPE-REVENUE-OS-CHECKOUT-SESSION-01
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { RevenuePackageDefinition } from "./revenuePricingMatrix";
import type { ValidatedRevenueCheckoutAddOn } from "./revenueCheckout";
import {
  BR_INVENTORY_PACK_PACKAGE_KEY,
  RESTAURANTES_COUPON_ADDON_PACKAGE_KEY,
} from "./publishCheckoutCheckpoint";

export type CreatePendingPaymentRecordInput = {
  operation?: "renew_listing" | null;
  category: string;
  packageKey: string;
  packageDef: RevenuePackageDefinition;
  amountCents: number;
  subtotalCents?: number;
  addOns?: ValidatedRevenueCheckoutAddOn[];
  currency?: string;
  listingId: string;
  leonixAdId?: string | null;
  ownerUserId?: string | null;
  customerEmail?: string | null;
  promoCodeId?: string | null;
  promoRedemptionId?: string | null;
  discountCents?: number;
  promoCode?: string | null;
  discountType?: string | null;
  /** Promo family (e.g. website_launch_25) resolved server-side; null for generic codes. */
  promoFamily?: string | null;
  /** True when the applied promo is a website-checkout-only code (Launch 25 doctrine). */
  promoWebsiteCheckoutOnly?: boolean;
  /** Pre-discount subtotal used to compute the promo discount (server-owned). */
  promoBaseAmountCents?: number;
  /** True when checkout is add-on-only (e.g. dashboard Restaurante coupon upgrade). */
  addonOnly?: boolean;
  sourceTable?: string | null;
  currentExpiresAt?: string | null;
  returnContext?: string | null;
};

export type PendingPaymentRecordResult =
  | { ok: true; paymentRecordId: string }
  | { ok: false; code: string; message: string };

/** Each Checkout attempt creates a new pending row (sandbox-safe, auditable retries). */
export async function createPendingPaymentRecord(
  input: CreatePendingPaymentRecordInput,
): Promise<PendingPaymentRecordResult> {
  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      code: "supabase_not_configured",
      message: "Supabase admin is not configured.",
    };
  }

  const supabase = getAdminSupabase();
  const currency = (input.currency ?? "usd").toLowerCase();
  const subtotal = Math.max(0, input.subtotalCents ?? input.packageDef.priceCents);
  const discount = Math.max(0, input.discountCents ?? 0);
  const total = Math.max(0, input.amountCents);
  const addOns = input.addOns ?? [];
  const restaurantCouponSelected =
    input.addonOnly === true ||
    addOns.some((a) => a.key === RESTAURANTES_COUPON_ADDON_PACKAGE_KEY);
  const bienesInventorySelected =
    input.packageKey === BR_INVENTORY_PACK_PACKAGE_KEY ||
    addOns.some((a) => a.key === BR_INVENTORY_PACK_PACKAGE_KEY);

  const { data, error } = await supabase
    .from("leonix_payment_records")
    .insert({
      category: input.category,
      listing_id: input.listingId,
      package_key: input.packageKey,
      placement_tier: input.packageDef.placementTierKey ?? null,
      billing_mode: input.packageDef.billingMode,
      amount_cents: total,
      amount_subtotal_cents: subtotal,
      amount_discount_cents: discount > 0 ? discount : null,
      amount_total_cents: total,
      currency,
      payment_status: "pending",
      source: "stripe_checkout",
      owner_user_id: input.ownerUserId ?? null,
      leonix_ad_id: input.leonixAdId ?? null,
      customer_email: input.customerEmail ?? null,
      promo_code_id: input.promoCodeId ?? null,
      promo_redemption_id: input.promoRedemptionId ?? null,
      metadata: {
        gate: "STRIPE-REVENUE-OS-CHECKOUT-SESSION-01",
        ...(input.operation ? { operation: input.operation } : {}),
        ...(input.sourceTable?.trim() ? { source_table: input.sourceTable.trim() } : {}),
        ...(input.currentExpiresAt?.trim() ? { current_expires_at: input.currentExpiresAt.trim() } : {}),
        ...(input.returnContext?.trim() ? { return_context: input.returnContext.trim() } : {}),
        package_label: input.packageDef.label,
        destructive: false,
        subtotal_cents: subtotal,
        ...(addOns.length
          ? {
              add_ons: addOns.map((a) => ({
                key: a.key,
                price_cents: a.unitPriceCents,
                quantity: a.quantity,
                label: a.packageDef.label,
              })),
            }
          : {}),
        ...(input.category === "restaurantes"
          ? {
              restaurant_coupon_addon_selected: restaurantCouponSelected,
              ...(input.addonOnly ? { checkout_mode: "addon_only" } : {}),
              ...(restaurantCouponSelected
                ? {
                    restaurant_offers_addon_package_key: RESTAURANTES_COUPON_ADDON_PACKAGE_KEY,
                    restaurant_offers_addon_price_cents:
                      input.addonOnly
                        ? input.packageDef.priceCents
                        : addOns.find((a) => a.key === RESTAURANTES_COUPON_ADDON_PACKAGE_KEY)
                            ?.unitPriceCents,
                  }
                : {}),
            }
          : {}),
        ...(input.category === "bienes-raices"
          ? {
              bienes_inventory_pack_selected: bienesInventorySelected,
              ...(input.packageKey === BR_INVENTORY_PACK_PACKAGE_KEY ? { checkout_mode: "addon_only" } : {}),
              ...(bienesInventorySelected
                ? {
                    bienes_inventory_pack_package_key: BR_INVENTORY_PACK_PACKAGE_KEY,
                    bienes_inventory_pack_price_cents:
                      input.packageKey === BR_INVENTORY_PACK_PACKAGE_KEY
                        ? input.packageDef.priceCents
                        : addOns.find((a) => a.key === BR_INVENTORY_PACK_PACKAGE_KEY)?.unitPriceCents,
                  }
                : {}),
            }
          : {}),
        ...(input.promoCode?.trim() ? { promo_code: input.promoCode.trim() } : {}),
        ...(input.discountType?.trim() ? { promo_discount_type: input.discountType.trim() } : {}),
        ...(input.promoFamily?.trim() ? { promo_family: input.promoFamily.trim() } : {}),
        ...(input.promoCode?.trim() && input.promoWebsiteCheckoutOnly
          ? { website_checkout_only: true }
          : {}),
        ...(discount > 0
          ? {
              promo_subtotal_cents: subtotal,
              promo_discount_cents: discount,
              promo_total_cents: total,
              base_amount_cents: input.promoBaseAmountCents ?? subtotal,
              final_amount_cents: total,
            }
          : {}),
      },
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return {
      ok: false,
      code: "payment_record_insert_failed",
      message: error?.message ?? "Failed to create pending payment record.",
    };
  }

  return { ok: true, paymentRecordId: data.id as string };
}

export async function attachStripeSessionToPaymentRecord(input: {
  paymentRecordId: string;
  stripeCheckoutSessionId: string;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("leonix_payment_records")
    .update({
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.paymentRecordId);
  return !error;
}

export async function attachPromoRedemptionToPaymentRecord(input: {
  paymentRecordId: string;
  promoRedemptionId: string;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("leonix_payment_records")
    .update({
      promo_redemption_id: input.promoRedemptionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.paymentRecordId);
  return !error;
}

export type LeonixPaymentRecordRow = {
  id: string;
  category: string;
  package_key: string | null;
  listing_id: string | null;
  owner_user_id: string | null;
  leonix_ad_id: string | null;
  billing_mode: string | null;
  placement_tier: string | null;
  amount_cents: number | null;
  amount_total_cents: number | null;
  currency: string | null;
  payment_status: string;
  source: string | null;
  promo_code_id: string | null;
  promo_redemption_id: string | null;
  package_entitlement_id: string | null;
  placement_entitlement_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  paid_at: string | null;
  canceled_at: string | null;
  metadata: Record<string, unknown> | null;
};

const PAYMENT_RECORD_SELECT =
  "id, category, package_key, listing_id, owner_user_id, leonix_ad_id, billing_mode, placement_tier, amount_cents, amount_total_cents, amount_subtotal_cents, amount_discount_cents, currency, payment_status, source, promo_code_id, promo_redemption_id, package_entitlement_id, placement_entitlement_id, stripe_checkout_session_id, stripe_payment_intent_id, stripe_customer_id, stripe_subscription_id, paid_at, canceled_at, customer_email, business_name, metadata";

/** Extended payment row for promo redemption business attribution (Gate REVENUE-OS-PROMO-REDEMPTION-BUSINESS-ATTRIBUTION-01). */
export type LeonixPaymentRecordAttributionRow = LeonixPaymentRecordRow & {
  customer_email?: string | null;
  business_name?: string | null;
  amount_subtotal_cents?: number | null;
  amount_discount_cents?: number | null;
};

export async function loadPaymentRecordById(
  paymentRecordId: string,
): Promise<LeonixPaymentRecordRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("leonix_payment_records")
    .select(PAYMENT_RECORD_SELECT)
    .eq("id", paymentRecordId)
    .maybeSingle();
  return (data as LeonixPaymentRecordRow | null) ?? null;
}

export async function loadPaymentRecordForPromoAttribution(
  paymentRecordId: string,
): Promise<LeonixPaymentRecordAttributionRow | null> {
  const row = await loadPaymentRecordById(paymentRecordId);
  return (row as LeonixPaymentRecordAttributionRow | null) ?? null;
}

export async function loadPaymentRecordByStripeSessionId(
  stripeCheckoutSessionId: string,
): Promise<LeonixPaymentRecordRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("leonix_payment_records")
    .select(PAYMENT_RECORD_SELECT)
    .eq("stripe_checkout_session_id", stripeCheckoutSessionId)
    .maybeSingle();
  return (data as LeonixPaymentRecordRow | null) ?? null;
}

export async function markPaymentRecordPaid(input: {
  paymentRecordId: string;
  stripePaymentIntentId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  amountPaidCents?: number | null;
  webhookMeta: Record<string, unknown>;
  existingMetadata?: Record<string, unknown> | null;
}): Promise<{ ok: boolean; idempotent?: boolean; code?: string; message?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "supabase_not_configured", message: "Supabase admin not configured." };
  }

  const row = await loadPaymentRecordById(input.paymentRecordId);
  if (!row) {
    return { ok: false, code: "payment_record_not_found", message: "Payment record not found." };
  }

  if (row.payment_status === "paid" || row.payment_status === "succeeded") {
    return { ok: true, idempotent: true };
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("leonix_payment_records")
    .update({
      payment_status: "paid",
      source: "stripe_webhook",
      stripe_payment_intent_id: input.stripePaymentIntentId ?? row.stripe_payment_intent_id,
      stripe_customer_id: input.stripeCustomerId ?? row.stripe_customer_id,
      stripe_subscription_id: input.stripeSubscriptionId ?? row.stripe_subscription_id,
      amount_paid_cents: input.amountPaidCents ?? row.amount_total_cents ?? row.amount_cents,
      paid_at: now,
      updated_at: now,
      metadata: {
        ...(row.metadata ?? {}),
        ...(input.existingMetadata ?? {}),
        ...input.webhookMeta,
        gate: "STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01",
      },
    })
    .eq("id", input.paymentRecordId)
    .in("payment_status", ["pending", "unpaid", "requires_action"]);

  if (error) {
    return { ok: false, code: "payment_record_update_failed", message: error.message };
  }

  return { ok: true };
}

export async function markPaymentRecordExpiredOrCanceled(input: {
  paymentRecordId: string;
  webhookMeta: Record<string, unknown>;
  existingMetadata?: Record<string, unknown> | null;
}): Promise<{ ok: boolean; idempotent?: boolean; code?: string; message?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "supabase_not_configured", message: "Supabase admin not configured." };
  }

  const row = await loadPaymentRecordById(input.paymentRecordId);
  if (!row) {
    return { ok: false, code: "payment_record_not_found", message: "Payment record not found." };
  }

  if (row.payment_status === "canceled" || row.payment_status === "failed") {
    return { ok: true, idempotent: true };
  }

  if (row.payment_status === "paid" || row.payment_status === "succeeded") {
    return {
      ok: false,
      code: "payment_already_paid",
      message: "Cannot expire a paid payment record.",
    };
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("leonix_payment_records")
    .update({
      payment_status: "canceled",
      canceled_at: now,
      updated_at: now,
      metadata: {
        ...(row.metadata ?? {}),
        ...(input.existingMetadata ?? {}),
        ...input.webhookMeta,
        gate: "STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01",
      },
    })
    .eq("id", input.paymentRecordId)
    .eq("payment_status", "pending");

  if (error) {
    return { ok: false, code: "payment_record_update_failed", message: error.message };
  }

  return { ok: true };
}
