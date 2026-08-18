/**
 * Package C Build 1 (C2+C3, Gate 12) — refund / cancellation / dispute foundations.
 *
 * Encodes the Advertising Agreement v1.2 policy as STATE + REVIEW METADATA. Nothing here
 * auto-charges, auto-retains, or computes legal fees; uncertain interpretation is flagged for
 * owner/legal review (contract rule).
 *
 * CONTRACTUAL 25% — DO NOT CONFUSE WITH THE RETIRED PROMOTIONAL CAMPAIGN:
 * Agreement v1.2 §12 permits Leonix to retain twenty-five percent (25%) of the total package
 * price as the design/setup fee after design, setup, production, campaign preparation, or
 * placement reservation begins. This constant is CONTRACT policy and must survive the C4
 * retirement of the unrelated 25% promotional discount campaign.
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { writeRevenueAuditLog } from "./revenueAuditLog";

export {
  assessRefundPolicy,
  DESIGN_SETUP_RETENTION_PERCENT,
  FULFILLMENT_STAGES,
  type FulfillmentStage,
  type RefundPolicyAssessment,
} from "./refundDisputePolicy";
import { assessRefundPolicy, type FulfillmentStage } from "./refundDisputePolicy";

/**
 * Record a refund on the original payment record — history preserved, replay idempotent.
 * Entitlement adjustment (if any) is a separate, audited admin decision; refunds never delete
 * listings or content, and print-included digital components are not separately refundable
 * (Agreement v1.2 §2 — surfaced here as review metadata).
 */
export async function recordRefundOnPaymentRecord(input: {
  paymentRecordId: string;
  amountRefundedCents: number;
  stripeEventId?: string | null;
  fulfillmentStage?: FulfillmentStage | null;
  partial?: boolean;
}): Promise<{ ok: boolean; idempotent?: boolean; message?: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, message: "supabase_not_configured" };
  const supabase = getAdminSupabase();

  const { data: record } = await supabase
    .from("leonix_payment_records")
    .select("id, payment_status, metadata, amount_total_cents")
    .eq("id", input.paymentRecordId)
    .maybeSingle();
  if (!record) return { ok: false, message: "payment_record_not_found" };

  const meta = (record.metadata ?? {}) as Record<string, unknown>;
  const priorEventId = typeof meta.refund_stripe_event_id === "string" ? meta.refund_stripe_event_id : null;
  if (String(record.payment_status) === "refunded" && (!input.stripeEventId || priorEventId === input.stripeEventId)) {
    return { ok: true, idempotent: true };
  }

  const stage = input.fulfillmentStage ?? "activated";
  const assessment = assessRefundPolicy(stage);
  const { error } = await supabase
    .from("leonix_payment_records")
    .update({
      payment_status: "refunded",
      refunded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        ...meta,
        refund_amount_cents: input.amountRefundedCents,
        refund_partial: Boolean(input.partial),
        refund_stripe_event_id: input.stripeEventId ?? null,
        refund_policy_assessment: assessment,
        integrated_print_digital_rule: "Digital component of a print package is not separately refundable (Agreement v1.2 §2).",
        original_payment_preserved: true,
      },
    })
    .eq("id", input.paymentRecordId);
  if (error) return { ok: false, message: error.message };

  await writeRevenueAuditLog({
    action: "revenue_payment_expired",
    targetType: "payment_record",
    targetId: input.paymentRecordId,
    meta: { refund: true, amount_cents: input.amountRefundedCents, partial: Boolean(input.partial), stage, stripe_event_id: input.stripeEventId ?? null },
  });
  return { ok: true };
}

/** Mark a payment disputed (chargeback). Suspension is handled by the subscription lifecycle. */
export async function recordDisputeOnPaymentRecord(input: {
  paymentRecordId: string;
  stripeEventId?: string | null;
  disputeId?: string | null;
}): Promise<{ ok: boolean; idempotent?: boolean; message?: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, message: "supabase_not_configured" };
  const supabase = getAdminSupabase();
  const { data: record } = await supabase
    .from("leonix_payment_records")
    .select("id, payment_status, metadata")
    .eq("id", input.paymentRecordId)
    .maybeSingle();
  if (!record) return { ok: false, message: "payment_record_not_found" };
  if (String(record.payment_status) === "disputed") return { ok: true, idempotent: true };

  const meta = (record.metadata ?? {}) as Record<string, unknown>;
  const { error } = await supabase
    .from("leonix_payment_records")
    .update({
      payment_status: "disputed",
      updated_at: new Date().toISOString(),
      metadata: {
        ...meta,
        dispute_stripe_event_id: input.stripeEventId ?? null,
        dispute_id: input.disputeId ?? null,
        dispute_policy: "Chargeback does not cancel valid obligations for delivered services (Agreement v1.2 §16); content preserved; admin review required.",
        requires_admin_review: true,
      },
    })
    .eq("id", input.paymentRecordId);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
