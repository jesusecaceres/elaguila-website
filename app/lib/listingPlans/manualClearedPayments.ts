/**
 * Package C Build 1 (C2, Gate 10) — manual cleared-payment foundation.
 *
 * Agreement v1.2 §7-§9: Leonix accepts Zelle / ACH / cash-with-receipt / approved business
 * check, and payment is received ONLY when funds are verified cleared — never on screenshot,
 * pending processor status, provisional credit, or deposited-check availability.
 *
 * This is NOT an accounting system. It is an auditable admin-only clearing sub-machine on the
 * existing leonix_payment_records ledger (source 'admin_manual'; no fake Stripe identities):
 *   pending_verification -> cleared -> (fulfill once) | rejected | reversed.
 * Only 'cleared' may fulfill entitlement, via the standard entitlement writer with
 * grant_source 'manual_cleared_payment'. Reversal suspends via the standard suspension adapter
 * and flags admin review — it never deletes content or history.
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { writeRevenueAuditLog } from "./revenueAuditLog";
import { getRevenuePackageDefinition } from "./revenuePricingMatrix";
import { isCanonicalRecordedAmountForPackage } from "./listingPackagePaymentAuthority";
import { activateEntitlementsForPayment, type PaymentRecordRow } from "./revenueEntitlementFulfillment";
import { applyPaymentSuspension } from "./subscriptionLifecycle";

import { upgradeTargetPackageKey } from "./businessAccessLevel";
import { isBusinessBaseUpgradeInPlace, readBusinessListingOwner } from "./businessBasePlanOffer";
import { convergeQuickToFullAfterPayment } from "./quickToFullConvergence";

/** True when `packageKey` is the category's FULL base package (the target of a Simple upgrade). */
function isBusinessUpgradePackage(category: string, packageKey: string): boolean {
  const target = upgradeTargetPackageKey(category);
  return Boolean(target) && String(packageKey ?? "").trim().toLowerCase() === target;
}

export type ManualPaymentMethod = "cash" | "check" | "zelle" | "ach" | "money_order" | "other";
export { canTransitionManualState, type ManualPaymentState } from "./refundDisputePolicy";
import { canTransitionManualState, type ManualPaymentState } from "./refundDisputePolicy";
import { awardCreditsForSettledPayment, earnBaseFromPaymentMetadata } from "@/app/lib/rewards/rewardsFulfillment";

export type RecordManualPaymentInput = {
  adminUserId: string;
  ownerUserId: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  businessName?: string | null;
  category: string;
  listingSource?: string | null;
  listingId?: string | null;
  leonixAdId?: string | null;
  packageKey: string;
  amountCents: number;
  method: ManualPaymentMethod;
  receivedAt?: string | null;
  /** Invoice/order/agreement reference — an identifier only, never sensitive bank data. */
  evidenceReference?: string | null;
  notes?: string | null;
};

export async function recordManualPaymentPendingVerification(
  input: RecordManualPaymentInput,
): Promise<{ ok: true; paymentRecordId: string } | { ok: false; code: string; message: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, code: "supabase_not_configured", message: "Admin storage unavailable." };
  const packageDef = getRevenuePackageDefinition(input.packageKey);
  if (!packageDef) return { ok: false, code: "unknown_package", message: `Unknown package key: ${input.packageKey}` };
  const category = String(input.category ?? "").trim().toLowerCase();
  if (!category) return { ok: false, code: "invalid_category", message: "Category is required." };
  if (category !== packageDef.category) {
    return {
      ok: false,
      code: "category_package_mismatch",
      message: `Category ${category} does not sell package ${packageDef.packageKey}.`,
    };
  }
  if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) {
    return { ok: false, code: "invalid_amount", message: "Amount must be a positive cent value." };
  }
  if (!isCanonicalRecordedAmountForPackage(packageDef.packageKey, input.amountCents)) {
    return {
      ok: false,
      code: "amount_package_mismatch",
      message: "Amount must equal the canonical package price (or the verified-intro first invoice for Quick $249).",
    };
  }

  // SIMPLE -> FULL upgrade guard (admin entry into the SAME upgrade the customer checkout runs).
  // Recording a Full base payment is an upgrade of an EXISTING listing, never a second listing or a
  // data re-entry: it requires the listing id, and that listing must currently resolve to Simple
  // access for the category (`isBusinessBaseUpgradeInPlace`, the same server truth the checkout
  // route uses). The owner is taken from the listing itself so convergence can never be attributed
  // to the wrong account.
  let ownerUserId = input.ownerUserId;
  const isUpgrade = isBusinessUpgradePackage(category, packageDef.packageKey);
  if (isUpgrade) {
    const listingId = String(input.listingId ?? "").trim();
    if (!listingId) {
      return {
        ok: false,
        code: "upgrade_listing_required",
        message: "A Simple to Full upgrade must be recorded against the existing listing (listingId is required).",
      };
    }
    const simple = await isBusinessBaseUpgradeInPlace({ category, packageKey: packageDef.packageKey, listingId });
    if (!simple) {
      return {
        ok: false,
        code: "upgrade_requires_simple_listing",
        message: "This listing does not currently hold Simple access for this category, so it cannot be upgraded to Full here.",
      };
    }
    const listingOwner = await readBusinessListingOwner(category, listingId);
    if (!listingOwner) {
      return { ok: false, code: "upgrade_listing_owner_unknown", message: "The listing owner could not be verified." };
    }
    if (ownerUserId && String(ownerUserId).trim() !== listingOwner) {
      return { ok: false, code: "upgrade_owner_mismatch", message: "ownerUserId does not match the listing owner." };
    }
    ownerUserId = listingOwner;
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leonix_payment_records")
    .insert({
      category: input.category,
      listing_source: input.listingSource ?? packageDef.category,
      listing_id: input.listingId ?? null,
      leonix_ad_id: input.leonixAdId ?? null,
      owner_user_id: ownerUserId,
      customer_name: input.customerName ?? null,
      customer_email: input.customerEmail ?? null,
      business_name: input.businessName ?? null,
      package_key: packageDef.packageKey,
      billing_mode: packageDef.billingMode,
      amount_cents: input.amountCents,
      amount_total_cents: input.amountCents,
      currency: "usd",
      source: "admin_manual",
      payment_status: "pending",
      manual_method: input.method,
      manual_state: "pending_verification",
      evidence_reference: input.evidenceReference ?? null,
      created_by: input.adminUserId,
      metadata: {
        gate: "PACKAGE-C-BUILD-1-MANUAL-CLEARED-PAYMENT",
        received_at: input.receivedAt ?? null,
        notes: input.notes ?? null,
      },
    })
    .select("id")
    .single();
  if (error || !data?.id) return { ok: false, code: "insert_failed", message: error?.message ?? "Insert failed." };

  await writeRevenueAuditLog({
    action: "revenue_payment_completed",
    targetType: "payment_record",
    targetId: data.id as string,
    meta: {
      manual: true,
      manual_state: "pending_verification",
      method: input.method,
      admin: input.adminUserId,
      ...(isUpgrade ? { upgrade_from_simple: true, listing_id: input.listingId ?? null, package_key: packageDef.packageKey } : {}),
    },
  });
  return { ok: true, paymentRecordId: data.id as string };
}

/**
 * Verify cleared funds and fulfill ONCE. Idempotent: a second clearance call on an already
 * cleared record returns idempotent without duplicating entitlement (the entitlement writer's
 * payment-record dedupe + the M4 live-uniqueness index both back this).
 */
export async function verifyManualPaymentCleared(input: {
  adminUserId: string;
  paymentRecordId: string;
}): Promise<
  | {
      ok: true;
      idempotent?: boolean;
      packageEntitlementId?: string | null;
      /** Present only for a Simple to Full upgrade: what convergence did to the Quick subscription. */
      quickConvergence?: { outcome: string; reason?: string };
    }
  | { ok: false; code: string; message: string }
> {
  if (!isSupabaseAdminConfigured()) return { ok: false, code: "supabase_not_configured", message: "Admin storage unavailable." };
  const supabase = getAdminSupabase();

  const { data: record } = await supabase
    .from("leonix_payment_records")
    .select("id, category, package_key, listing_id, owner_user_id, leonix_ad_id, billing_mode, placement_tier, promo_code_id, promo_redemption_id, package_entitlement_id, placement_entitlement_id, stripe_checkout_session_id, manual_state, source, metadata, amount_cents, amount_paid_cents, amount_total_cents, amount_discount_cents")
    .eq("id", input.paymentRecordId)
    .maybeSingle();
  if (!record) return { ok: false, code: "record_not_found", message: "Payment record not found." };
  if (String(record.source) !== "admin_manual") {
    return { ok: false, code: "not_manual", message: "Only admin-manual records can be cleared here." };
  }

  const currentState = String(record.manual_state ?? "") as ManualPaymentState;
  if (currentState === "cleared") {
    return { ok: true, idempotent: true, packageEntitlementId: record.package_entitlement_id ?? null };
  }
  if (!canTransitionManualState(currentState, "cleared")) {
    return { ok: false, code: "invalid_transition", message: `Cannot clear a ${currentState || "unknown"} record.` };
  }

  // CAS: only the pending_verification -> cleared transition fulfills; concurrent calls collapse.
  const nowIso = new Date().toISOString();
  const { data: claimed } = await supabase
    .from("leonix_payment_records")
    .update({ manual_state: "cleared", cleared_at: nowIso, verified_by: input.adminUserId, payment_status: "paid", paid_at: nowIso, updated_at: nowIso })
    .eq("id", input.paymentRecordId)
    .eq("manual_state", "pending_verification")
    .select("id");
  if (!claimed?.length) {
    return { ok: true, idempotent: true, packageEntitlementId: record.package_entitlement_id ?? null };
  }

  // LEONIX IX REWARDS — a cleared manual payment is FINAL on clearance (there is no card
  // settlement window to wait out), so its credits are awarded as immediately spendable rather
  // than pending. Best-effort: never fails the clearance that just succeeded.
  await awardCreditsForSettledPayment({
    paymentRecordId: input.paymentRecordId,
    ownerUserId: record.owner_user_id ? String(record.owner_user_id) : null,
    // The shared helper decides whether the stored total is already net of the credits applied,
    // so a credit-funded purchase is never charged its own loyalty value twice.
    ...earnBaseFromPaymentMetadata({
      amountPaidCents: Number(record.amount_paid_cents ?? record.amount_total_cents ?? record.amount_cents ?? 0),
      metadata: record.metadata as Record<string, unknown> | null,
    }),
    promoDiscountCents: Number(record.amount_discount_cents ?? 0),
    source: "admin_manual",
    sourceKind: "manual_payment",
    sourceId: `manual:${input.paymentRecordId}`,
    pendingUntilSettlementFinal: false,
  }).catch(() => null);

  const packageDef = getRevenuePackageDefinition(String(record.package_key ?? ""));
  let packageEntitlementId: string | null = null;
  if (packageDef && record.listing_id) {
    const fulfillment = await activateEntitlementsForPayment({
      paymentRecord: record as unknown as PaymentRecordRow,
      packageDef,
      stripeEventId: `manual:${input.paymentRecordId}`,
      stripeEventType: "manual_cleared_payment",
      stripeCheckoutSessionId: "",
      grantSource: "manual_cleared_payment",
    });
    packageEntitlementId = fulfillment.packageEntitlementId ?? null;
  }

  // SIMPLE -> FULL upgrade: once the Full entitlement exists, run the SAME convergence the Stripe
  // webhook runs so an existing Stripe Quick subscription on THIS listing is cancelled (prorated)
  // and the customer is not billed for both. A manual payment carries no Stripe customer or
  // subscription, so the planner's customer guard is not evaluable and the owner + listing +
  // category + Quick-package tie in the ledger lookup is what scopes the cancel. Best-effort by
  // contract: a settled payment is never failed by convergence; the outcome is audited (the
  // convergence module also writes its own attempted/completed/skipped/refused/failed trail).
  let quickConvergence: { outcome: string; reason?: string } | null = null;
  const recordCategory = String(record.category ?? "").trim().toLowerCase();
  if (
    packageEntitlementId &&
    record.listing_id &&
    record.owner_user_id &&
    isBusinessUpgradePackage(recordCategory, String(record.package_key ?? ""))
  ) {
    const converged = await convergeQuickToFullAfterPayment({
      full: {
        ownerUserId: String(record.owner_user_id),
        category: recordCategory,
        packageKey: String(record.package_key),
        listingId: String(record.listing_id),
        paid: true,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
      },
      eventId: `manual:${input.paymentRecordId}`,
      paymentRecordId: input.paymentRecordId,
    }).catch((err: unknown) => ({
      ok: false as const,
      outcome: "failed" as const,
      reason: err instanceof Error ? err.message.slice(0, 200) : "convergence_threw",
      retryable: true as const,
    }));
    quickConvergence = {
      outcome: converged.outcome,
      ...("reason" in converged && converged.reason ? { reason: converged.reason } : {}),
    };
  }

  await writeRevenueAuditLog({
    action: "revenue_entitlement_activated",
    targetType: "payment_record",
    targetId: input.paymentRecordId,
    meta: {
      manual: true,
      manual_state: "cleared",
      verified_by: input.adminUserId,
      package_entitlement_id: packageEntitlementId,
      ...(quickConvergence ? { upgrade_from_simple: true, quick_convergence: quickConvergence } : {}),
    },
  });
  return { ok: true, packageEntitlementId, ...(quickConvergence ? { quickConvergence } : {}) };
}

export async function markManualPaymentRejected(input: {
  adminUserId: string;
  paymentRecordId: string;
  reason?: string | null;
}): Promise<{ ok: boolean; message?: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, message: "Admin storage unavailable." };
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("leonix_payment_records")
    .update({ manual_state: "rejected", payment_status: "failed", updated_at: new Date().toISOString() })
    .eq("id", input.paymentRecordId)
    .eq("manual_state", "pending_verification")
    .select("id");
  if (!data?.length) return { ok: false, message: "Only pending_verification records can be rejected." };
  await writeRevenueAuditLog({
    action: "revenue_payment_expired",
    targetType: "payment_record",
    targetId: input.paymentRecordId,
    meta: { manual: true, manual_state: "rejected", admin: input.adminUserId, reason: input.reason ?? null },
  });
  return { ok: true };
}

/** Reversal (returned check, reversed transfer): suspend paid visibility, preserve everything, flag review. */
export async function markManualPaymentReversed(input: {
  adminUserId: string;
  paymentRecordId: string;
  reason?: string | null;
}): Promise<{ ok: boolean; message?: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, message: "Admin storage unavailable." };
  const supabase = getAdminSupabase();
  const { data: record } = await supabase
    .from("leonix_payment_records")
    .select("id, category, listing_id, manual_state")
    .eq("id", input.paymentRecordId)
    .maybeSingle();
  if (!record) return { ok: false, message: "Payment record not found." };

  const { data: claimed } = await supabase
    .from("leonix_payment_records")
    .update({ manual_state: "reversed", payment_status: "canceled", canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", input.paymentRecordId)
    .eq("manual_state", "cleared")
    .select("id");
  if (!claimed?.length) return { ok: false, message: "Only cleared records can be reversed." };

  if (record.category && record.listing_id) {
    await applyPaymentSuspension(String(record.category), String(record.listing_id));
  }
  await writeRevenueAuditLog({
    action: "revenue_payment_expired",
    targetType: "payment_record",
    targetId: input.paymentRecordId,
    meta: { manual: true, manual_state: "reversed", admin: input.adminUserId, reason: input.reason ?? null, requires_admin_review: true },
  });
  return { ok: true };
}
