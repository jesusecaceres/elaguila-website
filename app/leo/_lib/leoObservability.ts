/**
 * LEO-ADMIN-OS-FINAL.2 item 11 — bounded, secret-safe structured logging.
 *
 * Extends the exact pattern already shipped on /api/leo/speech
 * (logLeoSpeechOutcome) to the other consequential LEO routes. Allowed
 * metadata only: route, intent/category, provider_attempted, fallback_used,
 * fallback_reason_enum, failure_class, duration_ms, governance result,
 * connection-state enum. Never log API keys, OAuth tokens, email bodies,
 * full prompts, full AI responses, or customer/private record payloads.
 */

export type LeoObservabilityFailureClass =
  | "NONE"
  | "AUTH_DENIED"
  | "VALIDATION_FAILED"
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_ERROR"
  | "PROVIDER_TIMEOUT"
  | "GOVERNANCE_DENIED"
  | "GMAIL_TWO_KEY_GATE_DENIED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export type LeoObservabilityEvent = {
  route: string;
  intent?: string | null;
  category?: string | null;
  providerAttempted?: string | null;
  fallbackUsed?: boolean;
  fallbackReasonEnum?: string | null;
  failureClass: LeoObservabilityFailureClass;
  durationMs: number;
  governanceResult?: string | null;
  connectionState?: string | null;
};

export function logLeoObservabilityEvent(event: LeoObservabilityEvent): void {
  console.log(
    JSON.stringify({
      route: event.route,
      intent: event.intent ?? null,
      category: event.category ?? null,
      provider_attempted: event.providerAttempted ?? null,
      fallback_used: event.fallbackUsed ?? false,
      fallback_reason_enum: event.fallbackReasonEnum ?? null,
      failure_class: event.failureClass,
      duration_ms: event.durationMs,
      governance_result: event.governanceResult ?? null,
      connection_state: event.connectionState ?? null,
    }),
  );
}
