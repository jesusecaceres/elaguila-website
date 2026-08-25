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
import { activateEntitlementsForPayment, type PaymentRecordRow } from "./revenueEntitlementFulfillment";
import { applyPaymentSuspension } from "./subscriptionLifecycle";
import { resolveCanonicalListingSourceForCategory } from "./revenueListingSourceResolver";

export type ManualPaymentMethod = "cash" | "check" | "zelle" | "ach" | "money_order" | "other";
export { canTransitionManualState, type ManualPaymentState } from "./refundDisputePolicy";
import { canTransitionManualState, type ManualPaymentState } from "./refundDisputePolicy";

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
  if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) {
    return { ok: false, code: "invalid_amount", message: "Amount must be a positive cent value." };
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leonix_payment_records")
    .insert({
      category: input.category,
      // Package 1 (Gate 3/4) — an explicit caller-supplied listingSource wins; otherwise resolve
      // canonically from the package's category rather than defaulting to the bare category slug.
      listing_source:
        input.listingSource ?? resolveCanonicalListingSourceForCategory(packageDef.category) ?? packageDef.category,
      listing_id: input.listingId ?? null,
      leonix_ad_id: input.leonixAdId ?? null,
      owner_user_id: input.ownerUserId,
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
    meta: { manual: true, manual_state: "pending_verification", method: input.method, admin: input.adminUserId },
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
}): Promise<{ ok: true; idempotent?: boolean; packageEntitlementId?: string | null } | { ok: false; code: string; message: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, code: "supabase_not_configured", message: "Admin storage unavailable." };
  const supabase = getAdminSupabase();

  const { data: record } = await supabase
    .from("leonix_payment_records")
    .select("id, category, package_key, listing_id, owner_user_id, leonix_ad_id, billing_mode, placement_tier, promo_code_id, promo_redemption_id, package_entitlement_id, placement_entitlement_id, stripe_checkout_session_id, manual_state, source, metadata")
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

  await writeRevenueAuditLog({
    action: "revenue_entitlement_activated",
    targetType: "payment_record",
    targetId: input.paymentRecordId,
    meta: { manual: true, manual_state: "cleared", verified_by: input.adminUserId, package_entitlement_id: packageEntitlementId },
  });
  return { ok: true, packageEntitlementId };
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
