/**
 * Revenue OS promo validation + pending redemption — server-only.
 * Gate STRIPE-REVENUE-OS-CHECKOUT-SESSION-01
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { resolveEffectivePromoCodeStatus } from "./promoCodeLifecycle";
import { promoScopeIsUnrestricted, validatePromoEligibility } from "./promoCodeRules";
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
  category: string | null;
  category_scope: string[] | null;
  package_scope: string[] | null;
  placement_scope: string[] | null;
  starts_at: string | null;
  ends_at: string | null;
  max_redemptions: number | null;
  redemption_count: number | null;
  per_customer_limit: number | null;
  metadata: Record<string, unknown> | null;
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
      promoFamily: string | null;
      websiteCheckoutOnly: boolean;
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
      promoFamily: string | null;
      websiteCheckoutOnly: boolean;
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
      "id, code, promo_type, code_type, is_active, status, percent_off, amount_off_cents, category, category_scope, package_scope, placement_scope, starts_at, ends_at, max_redemptions, redemption_count, per_customer_limit, metadata",
    )
    .eq("code", normalized)
    .maybeSingle();
  const row = (data as PromoRow | null) ?? null;
  if (!row) return null;
  const meta = row.metadata;
  row.metadata =
    meta && typeof meta === "object" && !Array.isArray(meta) ? (meta as Record<string, unknown>) : null;
  return row;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Website Launch 25 doctrine (Gate WEBSITE-LAUNCH-25-CHECKOUT-REDEMPTION-WIRING-01).
 *
 * Launch 25 codes are captured through newsletter/account/dashboard signup and are valid
 * for website Stripe checkout products only. They carry null category_scope/package_scope,
 * so we constrain them to the allowlisted central Revenue OS package keys below. Print,
 * combo, manual, free, renewal, and unknown products are never eligible.
 *
 * Keep in sync with live first-party website Stripe checkout base packages. Servicios base
 * monthly was added when SERVICIOS-GLOBAL-CHECKOUT-STANDARD-PARITY-01 made Servicios a live
 * Revenue OS website checkout product (Gate REVENUE-OS-NEWSLETTER-PROMO-CHECKOUT-VALIDATION-01).
 */
export const WEBSITE_LAUNCH_25_ALLOWLISTED_PACKAGE_KEYS: readonly string[] = [
  "rentas_30d",
  "empleos_job_post_paid",
  "autos_privado_30d",
  "restaurantes_base_monthly",
  "servicios_base_monthly",
];

function truthyFlag(value: unknown): boolean {
  if (value === true) return true;
  const s = String(value ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

/** True when a promo row belongs to the website_launch_25 family (metadata- or code_type-driven). */
export function isWebsiteLaunch25Promo(row: PromoRow): boolean {
  const meta = asRecord(row.metadata);
  const family = String(meta.promo_family ?? "").trim().toLowerCase();
  if (family === "website_launch_25") return true;
  const codeType = String(row.code_type ?? "").trim().toLowerCase();
  if (codeType === "newsletter" && truthyFlag(meta.website_checkout_only)) return true;
  return false;
}

/**
 * Launch 25 allowlist gate. Returns a rejection reason when the code is a Launch 25 family
 * code applied to a package key outside the website-checkout allowlist; otherwise null.
 *
 * Global checkout promos (Any category + Any package) skip the allowlist — newsletter is an
 * acquisition channel, not a package-restricted discount (Gate REVENUE-OS-NEWSLETTER-PROMO-CHECKOUT-VALIDATION-02).
 * Non-Launch-25 codes are unaffected.
 */
export function resolveWebsiteLaunch25Rejection(
  row: PromoRow,
  packageKey: string | null | undefined,
): string | null {
  if (!isWebsiteLaunch25Promo(row)) return null;

  const categoryScope = resolvePromoCategoryScope(row);
  const packageScope = row.package_scope;
  if (promoScopeIsUnrestricted(categoryScope) && promoScopeIsUnrestricted(packageScope)) {
    return null;
  }

  const key = String(packageKey ?? "").trim().toLowerCase();
  if (!WEBSITE_LAUNCH_25_ALLOWLISTED_PACKAGE_KEYS.includes(key)) {
    return "Launch 25 code applies only to eligible website checkout products.";
  }
  return null;
}

/**
 * Whether the promo may discount a paid Stripe checkout. Newsletter/discount codes carry
 * `can_discount_payment` on `metadata` (and/or nested `metadata.promo_rule`). Only an
 * explicit `false` disables payment discount; missing/legacy codes remain allowed so we do
 * not silently reject historically-valid discount codes.
 */
export function resolvePromoCanDiscountPayment(row: PromoRow): boolean {
  const meta = asRecord(row.metadata);
  const rule = asRecord(meta.promo_rule);
  const raw = meta.can_discount_payment ?? rule.can_discount_payment;
  if (raw === false) return false;
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "false" || s === "0" || s === "no") return false;
  return true;
}

/**
 * Whether checkout must prove subscriber/owner identity before applying the promo.
 *
 * Leonix doctrine (REVENUE-OS-NEWSLETTER-PROMO-CHECKOUT-VALIDATION-02):
 * - Newsletter/SMS origin is an acquisition/delivery channel — not a checkout identity gate.
 * - Assigned/private + delivery email are tracking metadata — not payment restrictions.
 * - Identity blocks checkout ONLY when explicitly required via checkout-specific flags.
 * - Legacy `subscriber_identity_required` on newsletter rows tracked delivery assignment;
 *   it must NOT reject Apply/checkout when Admin shows Subscriber identity = No.
 */
export function resolvePromoRequiresSubscriberIdentity(row: PromoRow): boolean {
  const meta = asRecord(row.metadata);
  const rule = asRecord(meta.promo_rule);

  // Explicit stored false wins (admin "Subscriber identity: No").
  if (
    meta.subscriber_identity_required === false ||
    rule.requires_subscriber_identity === false ||
    meta.checkout_subscriber_identity_required === false
  ) {
    return false;
  }

  // Explicit checkout identity gate (honored for any code type).
  if (truthyFlag(meta.checkout_subscriber_identity_required)) return true;

  const codeType = String(row.code_type ?? "").trim().toLowerCase();
  if (codeType === "newsletter" || codeType === "sms") {
    return false;
  }

  return truthyFlag(meta.subscriber_identity_required ?? rule.requires_subscriber_identity);
}

export function resolvePromoCategoryScope(row: PromoRow): string[] | null {
  if (row.category_scope?.length) return row.category_scope;
  const legacy = String(row.category ?? "").trim().toLowerCase();
  return legacy ? [legacy] : null;
}

export function resolvePromoPercentOff(row: PromoRow): number | null {
  if (row.percent_off != null && Number.isFinite(Number(row.percent_off))) {
    const pct = Number(row.percent_off);
    return pct > 0 ? pct : null;
  }
  const meta = asRecord(row.metadata);
  const raw = meta.discount_percent ?? meta.percent_off;
  if (raw != null && Number.isFinite(Number(raw))) {
    const pct = Number(raw);
    return pct > 0 ? pct : null;
  }
  return null;
}

export function resolvePromoAmountOffCents(row: PromoRow): number | null {
  if (row.amount_off_cents != null && Number.isFinite(Number(row.amount_off_cents))) {
    const cents = Math.floor(Number(row.amount_off_cents));
    return cents > 0 ? cents : null;
  }
  const meta = asRecord(row.metadata);
  if (meta.discount_amount_cents != null && Number.isFinite(Number(meta.discount_amount_cents))) {
    const cents = Math.floor(Number(meta.discount_amount_cents));
    return cents > 0 ? cents : null;
  }
  const dollars = meta.discount_amount_dollars ?? meta.discount_amount;
  if (dollars != null && Number.isFinite(Number(dollars))) {
    const cents = Math.round(Number(dollars) * 100);
    return cents > 0 ? cents : null;
  }
  return null;
}

export function resolveRevenuePromoTypeFromRow(row: PromoRow): string | null {
  const explicit = String(row.promo_type ?? "").trim().toLowerCase();
  if (explicit === "percent_off" || explicit === "amount_off") return explicit;

  const meta = asRecord(row.metadata);
  const metaType = String(meta.discount_type ?? meta.promo_type ?? "").trim().toLowerCase();
  if (metaType === "percent" || metaType === "percent_off") return "percent_off";
  if (metaType === "amount" || metaType === "amount_off") return "amount_off";

  if (resolvePromoPercentOff(row) != null) return "percent_off";
  if (resolvePromoAmountOffCents(row) != null) return "amount_off";

  return null;
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

  const effectiveStatus = resolveEffectivePromoCodeStatus({
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    redemptionCount: row.redemption_count,
    maxRedemptions: row.max_redemptions,
  });
  if (effectiveStatus !== "active") {
    return { ok: false, code: "promo_ineligible", message: "Promo code is not active." };
  }

  const launch25Rejection = resolveWebsiteLaunch25Rejection(row, input.packageDef.packageKey);
  if (launch25Rejection) {
    return { ok: false, code: "promo_ineligible", message: launch25Rejection };
  }

  if (!resolvePromoCanDiscountPayment(row)) {
    return {
      ok: false,
      code: "promo_payment_discount_disabled",
      message: "Promo code is not permitted to discount payment.",
    };
  }

  if (resolvePromoRequiresSubscriberIdentity(row)) {
    const identity = String(input.email ?? "").trim() || String(input.ownerUserId ?? "").trim();
    if (!identity) {
      return {
        ok: false,
        code: "promo_identity_required",
        message: "Promo code requires a matching subscriber identity.",
      };
    }
  }

  const promoType = resolveRevenuePromoTypeFromRow(row);
  if (!promoType) {
    return {
      ok: false,
      code: "promo_no_discount_configured",
      message: "Promo code has no server-owned discount value configured.",
    };
  }

  const percentOff = resolvePromoPercentOff(row);
  const amountOffCents = resolvePromoAmountOffCents(row);

  const validation = validatePromoEligibility({
    promoType,
    isActive: row.is_active !== false && row.status !== "revoked",
    categoryScope: resolvePromoCategoryScope(row),
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
    percentOff,
    amountOffCents,
  });

  if (discountCents <= 0) {
    return {
      ok: false,
      code: "promo_no_discount_configured",
      message: "Promo code has no applicable discount for this checkout.",
    };
  }

  const finalAmountCents = Math.max(0, input.baseAmountCents - discountCents);

  const isLaunch25 = isWebsiteLaunch25Promo(row);
  const promoFamily = isLaunch25
    ? "website_launch_25"
    : (() => {
        const fam = String(asRecord(row.metadata).promo_family ?? "").trim().toLowerCase();
        return fam || null;
      })();
  const websiteCheckoutOnly =
    isLaunch25 || truthyFlag(asRecord(row.metadata).website_checkout_only);

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
      promoFamily,
      websiteCheckoutOnly,
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
    promoFamily,
    websiteCheckoutOnly,
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
        gate: "PUBLISH-CHECKOUT-PROMO-VALIDATION-UI-01",
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

export type PromoRedemptionRow = {
  id: string;
  promo_code_id: string;
  payment_record_id: string | null;
  status: string;
  stripe_checkout_session_id: string | null;
  metadata: Record<string, unknown> | null;
};

export async function loadPromoRedemptionById(
  redemptionId: string,
): Promise<PromoRedemptionRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("leonix_promo_code_redemptions")
    .select("id, promo_code_id, payment_record_id, status, stripe_checkout_session_id, metadata")
    .eq("id", redemptionId)
    .maybeSingle();
  return (data as PromoRedemptionRow | null) ?? null;
}

export async function markPromoRedemptionRedeemed(input: {
  redemptionId: string;
  stripeCheckoutSessionId: string;
  paymentRecordId: string;
  webhookMeta: Record<string, unknown>;
}): Promise<{ ok: boolean; idempotent?: boolean; code?: string; message?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "supabase_not_configured", message: "Supabase admin not configured." };
  }

  const row = await loadPromoRedemptionById(input.redemptionId);
  if (!row) {
    return { ok: false, code: "promo_redemption_not_found", message: "Promo redemption not found." };
  }

  if (row.status === "redeemed") {
    return { ok: true, idempotent: true };
  }

  if (
    row.stripe_checkout_session_id &&
    row.stripe_checkout_session_id !== input.stripeCheckoutSessionId
  ) {
    return {
      ok: false,
      code: "session_mismatch",
      message: "Promo redemption session does not match webhook session.",
    };
  }

  if (row.payment_record_id && row.payment_record_id !== input.paymentRecordId) {
    return {
      ok: false,
      code: "payment_record_mismatch",
      message: "Promo redemption payment record mismatch.",
    };
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { data: updatedRows, error } = await supabase
    .from("leonix_promo_code_redemptions")
    .update({
      status: "redeemed",
      redeemed_at: now,
      updated_at: now,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      metadata: {
        ...(row.metadata ?? {}),
        ...input.webhookMeta,
        gate: "STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01",
      },
    })
    .eq("id", input.redemptionId)
    .in("status", ["pending", "validated"])
    .select("id");

  if (error) {
    return { ok: false, code: "promo_redemption_update_failed", message: error.message };
  }

  if (!updatedRows?.length) {
    const refreshed = await loadPromoRedemptionById(input.redemptionId);
    if (refreshed?.status === "redeemed") {
      return { ok: true, idempotent: true };
    }
    return { ok: false, code: "promo_redemption_update_failed", message: "Promo redemption not updated." };
  }

  const { data: promoRow } = await supabase
    .from("leonix_promo_codes")
    .select("redemption_count")
    .eq("id", row.promo_code_id)
    .maybeSingle();

  const nextCount = Number(promoRow?.redemption_count ?? 0) + 1;
  await supabase
    .from("leonix_promo_codes")
    .update({ redemption_count: nextCount, updated_at: now })
    .eq("id", row.promo_code_id);

  return { ok: true };
}

export async function markPromoRedemptionExpiredOrCancelled(input: {
  redemptionId: string;
  stripeCheckoutSessionId: string;
  webhookMeta: Record<string, unknown>;
}): Promise<{ ok: boolean; idempotent?: boolean; code?: string; message?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "supabase_not_configured", message: "Supabase admin not configured." };
  }

  const row = await loadPromoRedemptionById(input.redemptionId);
  if (!row) {
    return { ok: false, code: "promo_redemption_not_found", message: "Promo redemption not found." };
  }

  if (row.status === "expired" || row.status === "cancelled") {
    return { ok: true, idempotent: true };
  }

  if (row.status === "redeemed") {
    return {
      ok: false,
      code: "promo_already_redeemed",
      message: "Cannot cancel an already redeemed promo.",
    };
  }

  if (
    row.stripe_checkout_session_id &&
    row.stripe_checkout_session_id !== input.stripeCheckoutSessionId
  ) {
    return { ok: true, idempotent: true };
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("leonix_promo_code_redemptions")
    .update({
      status: "expired",
      updated_at: now,
      metadata: {
        ...(row.metadata ?? {}),
        ...input.webhookMeta,
        gate: "STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01",
      },
    })
    .eq("id", input.redemptionId)
    .eq("status", "pending");

  if (error) {
    return { ok: false, code: "promo_redemption_update_failed", message: error.message };
  }

  return { ok: true };
}
