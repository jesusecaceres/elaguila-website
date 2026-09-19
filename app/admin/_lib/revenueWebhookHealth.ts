/**
 * Revenue OS webhook circuit health — PURE classifier (no I/O, no secrets).
 *
 * WHY THIS EXISTS (production forensic, 2026-09-18): POST /api/revenue-os/webhook returned 503 on
 * every delivery. The route rejects with 503 BEFORE the event ledger is touched (verification at
 * route.ts precedes claimStripeEvent), so a missing STRIPE_WEBHOOK_SECRET leaves no row anywhere,
 * and the old System Health "Stripe" component only checked STRIPE_SECRET_KEY — it could not see the
 * broken circuit. This classifier separates three different truths and never blends them:
 *
 *   CONFIG PRESENT  — are the two env vars set in THIS runtime (presence only; values never read out)
 *   RUNTIME PROOF   — has a verified Stripe delivery actually been recorded (ledger), and when
 *   RECENT FAILURE  — ledger events that verified but failed to fulfil
 *
 * It deliberately does NOT claim Stripe reachability from env presence, and it says out loud that
 * deliveries rejected before verification (503 missing secret, 400 bad signature) are invisible to
 * the ledger.
 */

export type StripeKeyMode = "test" | "live" | "restricted" | "unknown" | "absent";

/** Prefix-only classification. The key value itself is never returned or logged. */
export function classifyStripeKeyMode(secret: string | null | undefined): StripeKeyMode {
  const v = (secret ?? "").trim();
  if (!v) return "absent";
  if (v.startsWith("sk_test_")) return "test";
  if (v.startsWith("sk_live_")) return "live";
  if (v.startsWith("rk_test_") || v.startsWith("rk_live_")) return "restricted";
  return "unknown";
}

export type RevenueWebhookLedgerSummary = {
  /** false when the ledger table could not be read at all (never inferred as "no traffic"). */
  available: boolean;
  lastReceivedAt: string | null;
  lastCheckoutCompletedAt: string | null;
  failedRetryable7d: number;
  failedTerminal7d: number;
  /** `livemode` of the most recent recorded event, when known. */
  latestLivemode: boolean | null;
};

export type RevenueWebhookHealthInput = {
  stripeSecretKeyPresent: boolean;
  keyMode: StripeKeyMode;
  webhookSecretPresent: boolean;
  supabaseProjectRef: string | null;
  ledger: RevenueWebhookLedgerSummary;
  now?: Date;
};

export type RevenueWebhookHealthState = "HEALTHY" | "DEGRADED" | "NOT_CONFIGURED" | "UNKNOWN";

export type RevenueWebhookHealth = {
  state: RevenueWebhookHealthState;
  message: string;
  config: { secretKey: boolean; webhookSecret: boolean; keyMode: StripeKeyMode };
};

const DAY_MS = 24 * 60 * 60 * 1000;
export const REVENUE_WEBHOOK_PROOF_WINDOW_DAYS = 30;

const BLIND_SPOT =
  "Deliveries rejected before verification (503 missing secret/key, 400 bad signature) are never written to the ledger, so their absence here proves nothing — Vercel runtime logs show them as 503/400 on /api/revenue-os/webhook.";

function fmt(iso: string | null): string {
  if (!iso) return "none recorded";
  const t = new Date(iso);
  return Number.isFinite(t.getTime()) ? t.toISOString().replace("T", " ").slice(0, 16) + " UTC" : "none recorded";
}

export function classifyRevenueWebhookHealth(input: RevenueWebhookHealthInput): RevenueWebhookHealth {
  const now = input.now ?? new Date();
  const config = { secretKey: input.stripeSecretKeyPresent, webhookSecret: input.webhookSecretPresent, keyMode: input.keyMode };
  const ref = input.supabaseProjectRef ? ` Supabase project: ${input.supabaseProjectRef}.` : "";

  if (!input.stripeSecretKeyPresent && !input.webhookSecretPresent) {
    return {
      state: "NOT_CONFIGURED",
      config,
      message: "CONFIG: neither STRIPE_SECRET_KEY nor STRIPE_WEBHOOK_SECRET is set in this environment — Revenue OS checkout and its webhook are off here." + ref,
    };
  }

  if (!input.webhookSecretPresent) {
    return {
      state: "DEGRADED",
      config,
      message:
        `CONFIG: STRIPE_WEBHOOK_SECRET is NOT set in this environment (Stripe key is set, mode ${input.keyMode}). ` +
        "Every Stripe delivery to /api/revenue-os/webhook is rejected with HTTP 503 (webhook_secret_missing) before it can be recorded — paid checkouts will stay 'pending' and their listings will not go live. " +
        "Fix: set the signing secret of the Stripe webhook endpoint that points at THIS deployment, scoped to this environment, in the hosting provider's environment variables." +
        ref,
    };
  }

  if (!input.stripeSecretKeyPresent) {
    return {
      state: "DEGRADED",
      config,
      message:
        "CONFIG: STRIPE_SECRET_KEY is NOT set in this environment while a webhook secret is. Deliveries are rejected with HTTP 503 (stripe_not_configured) and checkout cannot create sessions." + ref,
    };
  }

  // Both present: CONFIG PRESENT. Everything below is runtime evidence from the ledger.
  const configLine = `CONFIG PRESENT: key mode ${input.keyMode}, webhook signing secret set.` + ref;
  const l = input.ledger;
  if (!l.available) {
    return {
      state: "UNKNOWN",
      config,
      message: `${configLine} RUNTIME PROOF: the webhook event ledger could not be read, so no delivery evidence is available. ${BLIND_SPOT}`,
    };
  }

  const failures = l.failedRetryable7d + l.failedTerminal7d;
  const modeMismatch =
    l.latestLivemode != null &&
    ((l.latestLivemode === false && input.keyMode === "live") || (l.latestLivemode === true && input.keyMode === "test"));
  const proofAgeMs = l.lastReceivedAt ? now.getTime() - new Date(l.lastReceivedAt).getTime() : null;
  const hasRecentProof = proofAgeMs != null && Number.isFinite(proofAgeMs) && proofAgeMs <= REVENUE_WEBHOOK_PROOF_WINDOW_DAYS * DAY_MS;
  const proofLine = `RUNTIME PROOF: last verified delivery ${fmt(l.lastReceivedAt)}; last completed checkout ${fmt(l.lastCheckoutCompletedAt)}.`;
  const failureLine = failures > 0
    ? `RECENT FAILURE: ${l.failedRetryable7d} retryable + ${l.failedTerminal7d} terminal event(s) failed fulfilment in the last 7 days — see Payment Tracker.`
    : "RECENT FAILURE: none recorded in the last 7 days.";

  if (modeMismatch) {
    return {
      state: "DEGRADED",
      config,
      message: `${configLine} MODE MISMATCH: the most recent recorded event is ${l.latestLivemode ? "LIVE" : "TEST"} mode but the configured key is ${input.keyMode} — the key and the webhook endpoint belong to different Stripe environments. ${proofLine} ${failureLine} ${BLIND_SPOT}`,
    };
  }
  if (failures > 0) {
    return { state: "DEGRADED", config, message: `${configLine} ${proofLine} ${failureLine} ${BLIND_SPOT}` };
  }
  if (!hasRecentProof) {
    return {
      state: "UNKNOWN",
      config,
      message: `${configLine} ${proofLine} No verified delivery in the last ${REVENUE_WEBHOOK_PROOF_WINDOW_DAYS} days, so the circuit is configured but NOT proven — complete one test payment and confirm a new ledger entry. ${BLIND_SPOT}`,
    };
  }
  return { state: "HEALTHY", config, message: `${configLine} ${proofLine} ${failureLine} ${BLIND_SPOT}` };
}
