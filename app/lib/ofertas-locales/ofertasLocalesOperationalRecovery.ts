import "server-only";

import {
  OFERTAS_RENEWAL_ABANDONED_AFTER_DAYS,
  type OfertaLocalRenewalAttemptRow,
} from "./ofertasLocalesRenewals";

export type OfertaLocalOperationalStaleState =
  | "source_without_scan"
  | "scan_processing_stale"
  | "scan_page_stale"
  | "review_abandoned"
  | "renewal_authorized_not_prepared"
  | "renewal_pending_review_stale"
  | "scheduled_activation_overdue"
  | "cleanup_processing_stale"
  | "webhook_pending";

export type OfertaLocalOperationalFinding = {
  state: OfertaLocalOperationalStaleState;
  stale: boolean;
  retryEligible: boolean;
  adminAction: string;
  ownerMessage: string;
  lastActivityAt: string | null;
};

function ageMs(iso: string | null | undefined, now: Date): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return now.getTime() - d.getTime();
}
function olderThan(iso: string | null | undefined, now: Date, minutes: number): boolean {
  const age = ageMs(iso, now);
  return age != null && age > minutes * 60 * 1000;
}
export function detectOfertaLocalScanStaleState(input: {
  status: string | null | undefined;
  currentStage?: string | null;
  lastActivityAt?: string | null;
  updatedAt?: string | null;
  now?: Date;
}): OfertaLocalOperationalFinding | null {
  const now = input.now ?? new Date();
  const lastActivity = input.lastActivityAt || input.updatedAt || null;
  if (String(input.status ?? "") === "processing" && olderThan(lastActivity, now, 45)) {
    return {
      state: "scan_processing_stale",
      stale: true,
      retryEligible: true,
      adminAction: "Inspect scan job, failed pages, and source asset before retry.",
      ownerMessage: "AI scan appears delayed. Leonix can safely retry without publishing incomplete items.",
      lastActivityAt: lastActivity,
    };
  }
  return null;
}

export function detectOfertaLocalRenewalStaleState(input: {
  attempt: Pick<OfertaLocalRenewalAttemptRow, "state" | "updated_at" | "scheduled_activation_at">;
  now?: Date;
}): OfertaLocalOperationalFinding | null {
  const now = input.now ?? new Date();
  const state = input.attempt.state;
  if ((state === "awaiting_payment" || state === "payment_pending") && olderThan(input.attempt.updated_at, now, OFERTAS_RENEWAL_ABANDONED_AFTER_DAYS * 24 * 60)) {
    return {
      state: "webhook_pending",
      stale: true,
      retryEligible: true,
      adminAction: "Verify payment record/webhook before creating another checkout.",
      ownerMessage: "Payment is not confirmed yet. Do not retry blindly if you already paid.",
      lastActivityAt: input.attempt.updated_at,
    };
  }
  if (state === "authorized" && olderThan(input.attempt.updated_at, now, 24 * 60)) {
    return {
      state: "renewal_authorized_not_prepared",
      stale: true,
      retryEligible: true,
      adminAction: "Ask owner to reuse content or upload replacement before review.",
      ownerMessage: "Renewal is authorized. Choose existing content or upload a replacement to continue.",
      lastActivityAt: input.attempt.updated_at,
    };
  }
  if (state === "approved_scheduled" && input.attempt.scheduled_activation_at && olderThan(input.attempt.scheduled_activation_at, now, 30)) {
    return {
      state: "scheduled_activation_overdue",
      stale: true,
      retryEligible: true,
      adminAction: "Run the due renewal activation worker/helper and inspect failure reason.",
      ownerMessage: "Renewal is approved and waiting for activation.",
      lastActivityAt: input.attempt.scheduled_activation_at,
    };
  }
  return null;
}
