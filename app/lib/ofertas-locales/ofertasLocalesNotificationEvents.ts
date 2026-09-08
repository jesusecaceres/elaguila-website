import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type OfertaLocalNotificationEventKey =
  | "payment_authorized"
  | "renewal_content_required"
  | "scan_complete"
  | "scan_failed"
  | "review_required"
  | "submission_received"
  | "correction_requested"
  | "renewal_approved"
  | "renewal_scheduled"
  | "renewal_activated"
  | "expiring_soon"
  | "expired"
  | "cleanup_failed_admin"
  | "scheduled_activation_failed_admin";

export type OfertaLocalNotificationRecipientRole = "owner" | "admin";

export function buildOfertaLocalNotificationIdempotencyKey(input: {
  eventKey: OfertaLocalNotificationEventKey;
  ofertaLocalId: string;
  renewalAttemptId?: string | null;
  milestone?: string | null;
}): string {
  return [
    "ofertas-locales",
    input.eventKey,
    input.ofertaLocalId,
    input.renewalAttemptId ?? "none",
    input.milestone ?? "once",
  ].join(":");
}

export async function queueOfertaLocalNotificationEvent(input: {
  supabase: SupabaseClient;
  eventKey: OfertaLocalNotificationEventKey;
  ofertaLocalId: string;
  renewalAttemptId?: string | null;
  recipientRole: OfertaLocalNotificationRecipientRole;
  recipientUserId?: string | null;
  metadata?: Record<string, unknown>;
  milestone?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string; detail?: string }> {
  const idempotencyKey = buildOfertaLocalNotificationIdempotencyKey({
    eventKey: input.eventKey,
    ofertaLocalId: input.ofertaLocalId,
    renewalAttemptId: input.renewalAttemptId,
    milestone: input.milestone,
  });
  const safeMetadata = JSON.parse(JSON.stringify(input.metadata ?? {})) as Record<string, unknown>;
  const { error } = await input.supabase.from("ofertas_local_notification_events").upsert(
    {
      event_key: input.eventKey,
      oferta_local_id: input.ofertaLocalId,
      renewal_attempt_id: input.renewalAttemptId ?? null,
      recipient_role: input.recipientRole,
      recipient_user_id: input.recipientUserId ?? null,
      metadata: safeMetadata,
      idempotency_key: idempotencyKey,
      status: "pending",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "idempotency_key", ignoreDuplicates: true }
  );
  if (error) return { ok: false, error: "notification_event_queue_failed", detail: error.message };
  return { ok: true };
}

export const OFERTAS_NOTIFICATION_DELIVERY_CONTRACT = {
  deliveryAdapterImplemented: false,
  sentRequiresAdapterConfirmation: true,
  externalDeliveryPerformedByPackage8: false,
} as const;
