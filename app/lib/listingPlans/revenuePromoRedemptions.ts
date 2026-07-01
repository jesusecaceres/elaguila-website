/**
 * Revenue OS promo validation + pending redemption — server-only.
 * Gate STRIPE-REVENUE-OS-CHECKOUT-SESSION-01
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { validatePromoEligibility } from "./promoCodeRules";
import type { RevenuePackageDefinition } from "./revenuePricingMatrix";

export type PromoRow = {
  id: string;
  code: string;
  promo_type: string | null;
  code_type: string | null;
  is_active: boolean | null;
  status: string | null;
  percent_off: number | null;
  amount_off_cents: number | null;
  category_scope: string[] | null;
  package_scope: string[] | null;
  placement_scope: string[] | null;
  starts_at: string | null;
  ends_at: string | null;
  max_redemptions: number | null;
  redemption_count: number | null;
  per_customer_limit: number | null;
};

export type PromoCheckoutResolution =
  | {
      ok: true;
      promoCodeId: string;
      promoCode: string;
      promoType: string;
      discountCents: number;
      finalAmountCents: number;
      requiresCheckout: true;
    }
  | {
      ok: true;
      promoCodeId: string;
      promoCode: string;
      promoType: string;
      discountCents: number;
      finalAmountCents: 0;
      requiresCheckout: false;
      code: "CHECKOUT_NOT_REQUIRED_COMP_REQUIRES_NEXT_GATE";
      message: string;
    }
  | { ok: false; code: string; message: string };

export async function loadPromoByCode(code: string): Promise<PromoRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const normalized = String(code ?? "").trim().toUpperCase();
  if (!normalized) return null;
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("leonix_promo_codes")
    .select(
      "id, code, promo_type, code_type, is_active, status, percent_off, amount_off_cents, category_scope, package_scope, placement_scope, starts_at, ends_at, max_redemptions, redemption_count, per_customer_limit",
    )
    .eq("code", normalized)
    .maybeSingle();
  return (data as PromoRow | null) ?? null;
}

function resolvePromoType(row: PromoRow): string {
  return String(row.promo_type ?? row.code_type ?? "manual").trim().toLowerCase();
}

export function calculatePromoDiscountCents(input: {
  baseAmountCents: number;
  promoType: string;
  percentOff?: number | null;
  amountOffCents?: number | null;
}): number {
  const base = Math.max(0, input.baseAmountCents);
  const type = input.promoType.toLowerCase();

  if (type === "percent_off" && input.percentOff != null) {
    const pct = Math.min(100, Math.max(0, Number(input.percentOff)));
    return Math.floor((base * pct) / 100);
  }

  if (type === "amount_off" && input.amountOffCents != null) {
    return Math.min(base, Math.max(0, Math.floor(Number(input.amountOffCents))));
  }

  if (
    type === "free_comp" ||
    type === "print_client" ||
    type === "staff_comp" ||
    type === "manual"
  ) {
    return base;
  }

  return 0;
}

export async function resolvePromoForCheckout(input: {
  promoCode: string;
  packageDef: RevenuePackageDefinition;
  baseAmountCents: number;
  ownerUserId?: string | null;
  email?: string | null;
}): Promise<PromoCheckoutResolution> {
  const row = await loadPromoByCode(input.promoCode);
  if (!row) {
    return { ok: false, code: "promo_not_found", message: "Promo code not found." };
  }

  const promoType = resolvePromoType(row);
  const validation = validatePromoEligibility({
    promoType,
    isActive: row.is_active !== false && row.status !== "revoked",
    categoryScope: row.category_scope,
    packageScope: row.package_scope,
    placementScope: row.placement_scope,
    startsAt: row.starts_at,
    expiresAt: row.ends_at,
    maxRedemptions: row.max_redemptions,
    redemptionCount: row.redemption_count,
    perCustomerLimit: row.per_customer_limit,
    category: input.packageDef.category,
    packageKey: input.packageDef.packageKey,
    placementTier: input.packageDef.placementTierKey,
  });

  if (!validation.eligible) {
    return { ok: false, code: "promo_ineligible", message: validation.reason };
  }

  const discountCents = calculatePromoDiscountCents({
    baseAmountCents: input.baseAmountCents,
    promoType,
    percentOff: row.percent_off,
    amountOffCents: row.amount_off_cents,
  });

  const finalAmountCents = Math.max(0, input.baseAmountCents - discountCents);

  if (finalAmountCents <= 0) {
    return {
      ok: true,
      promoCodeId: row.id,
      promoCode: row.code,
      promoType,
      discountCents,
      finalAmountCents: 0,
      requiresCheckout: false,
      code: "CHECKOUT_NOT_REQUIRED_COMP_REQUIRES_NEXT_GATE",
      message:
        "Promo reduces amount to zero — comp fulfillment deferred to next gate (no Stripe Checkout).",
    };
  }

  return {
    ok: true,
    promoCodeId: row.id,
    promoCode: row.code,
    promoType,
    discountCents,
    finalAmountCents,
    requiresCheckout: true,
  };
}

export async function createPendingPromoRedemption(input: {
  promoCodeId: string;
  paymentRecordId: string;
  ownerUserId?: string | null;
  email?: string | null;
  listingId: string;
  leonixAdId?: string | null;
  category: string;
  packageKey: string;
  placementTier?: string | null;
  discountCents: number;
}): Promise<{ ok: true; redemptionId: string } | { ok: false; code: string; message: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "supabase_not_configured", message: "Supabase admin not configured." };
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leonix_promo_code_redemptions")
    .insert({
      promo_code_id: input.promoCodeId,
      payment_record_id: input.paymentRecordId,
      owner_user_id: input.ownerUserId ?? null,
      email: input.email ?? null,
      listing_id: input.listingId,
      leonix_ad_id: input.leonixAdId ?? null,
      category: input.category,
      package_key: input.packageKey,
      placement_tier: input.placementTier ?? null,
      status: "pending",
      discount_cents: input.discountCents,
      metadata: {
        gate: "STRIPE-REVENUE-OS-CHECKOUT-SESSION-01",
        destructive: false,
      },
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return {
      ok: false,
      code: "promo_redemption_insert_failed",
      message: error?.message ?? "Failed to create pending promo redemption.",
    };
  }

  return { ok: true, redemptionId: data.id as string };
}

export async function attachStripeSessionToPromoRedemption(input: {
  redemptionId: string;
  stripeCheckoutSessionId: string;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("leonix_promo_code_redemptions")
    .update({
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.redemptionId);
  return !error;
}
