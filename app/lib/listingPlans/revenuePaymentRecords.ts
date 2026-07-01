/**
 * Revenue OS pending payment record writes — server-only.
 * Gate STRIPE-REVENUE-OS-CHECKOUT-SESSION-01
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { RevenuePackageDefinition } from "./revenuePricingMatrix";

export type CreatePendingPaymentRecordInput = {
  category: string;
  packageKey: string;
  packageDef: RevenuePackageDefinition;
  amountCents: number;
  currency?: string;
  listingId: string;
  leonixAdId?: string | null;
  ownerUserId?: string | null;
  customerEmail?: string | null;
  promoCodeId?: string | null;
  promoRedemptionId?: string | null;
  discountCents?: number;
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
  const subtotal = input.packageDef.priceCents;
  const discount = Math.max(0, input.discountCents ?? 0);
  const total = Math.max(0, input.amountCents);

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
        package_label: input.packageDef.label,
        destructive: false,
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
