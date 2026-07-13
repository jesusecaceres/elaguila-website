/**
 * Revenue OS admin audit log writes — server-only.
 * Gate STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type RevenueAuditAction =
  | "revenue_payment_completed"
  | "revenue_payment_expired"
  | "revenue_promo_redeemed"
  | "revenue_entitlement_activated"
  | "restaurante_listing_activated_after_payment"
  | "servicios_listing_activated_after_payment"
  | "rentas_listing_activated_after_payment"
  | "empleos_listing_activated_after_payment"
  | "autos_privado_listing_activated_after_payment"
  | "bienes_fsbo_listing_activated_after_payment"
  | "revenue_webhook_ignored"
  | "revenue_webhook_validation_failed";

export async function writeRevenueAuditLog(entry: {
  action: RevenueAuditAction;
  targetType?: string | null;
  targetId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<{ ok: boolean; warning?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, warning: "supabase_not_configured" };
  }

  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.from("admin_audit_log").insert({
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      meta: {
        gate: "STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01",
        ...(entry.meta ?? {}),
      },
    });

    if (error) {
      return { ok: false, warning: error.message };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      warning: e instanceof Error ? e.message : "audit_log_insert_failed",
    };
  }
}
