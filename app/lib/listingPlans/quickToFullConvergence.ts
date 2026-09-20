/**
 * Gate QB-CONVERGENCE-01 — Quick→Full subscription convergence.
 *
 * Owner decision (Option C): when a Full subscription is confirmed via webhook,
 * cancel the user's existing Quick subscription for the same category ONLY after
 * authoritative Full payment confirmation. The cancellation is scheduled at
 * period-end (cancel_at_period_end = true) so the customer is never double-charged
 * and retains Quick access until the period ends.
 *
 * Idempotent, retry-safe, out-of-order-safe, duplicate-safe:
 *  - Detects whether a Quick subscription exists before calling Stripe.
 *  - The Stripe `cancel_at_period_end` flag is idempotent (setting it twice is a no-op).
 *  - If the Quick sub is already cancelled, the result is ok: true (nothing to do).
 *
 * Pure classification lives in `quickToFullConvergencePure.ts`; Stripe I/O lives here.
 */
import "server-only";

import Stripe from "stripe";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

/**
 * Maps Quick package key → Full package prefix for convergence eligibility check.
 * Each entry lists the Quick subscription package keys; when the incoming FULL
 * package key shares the same category root, convergence fires.
 */
export const QUICK_PACKAGE_KEYS_BY_CATEGORY: Readonly<Record<string, string>> = {
  servicios: "servicios_quick_monthly",
  restaurantes: "restaurantes_quick_monthly",
  autos: "autos_dealer_quick_monthly",
  "bienes-raices": "br_agent_quick_monthly",
};

/**
 * The Full base package key prefixes that trigger convergence.
 * If the new package key starts with one of these, a Quick cancellation is scheduled.
 */
export const FULL_BASE_PACKAGE_PREFIXES: readonly string[] = [
  "servicios_base",
  "restaurantes_base",
  "autos_dealer_base",
  "br_agent_base",
];

export function isFullBasePackageKey(packageKey: string): boolean {
  return FULL_BASE_PACKAGE_PREFIXES.some((prefix) => packageKey.startsWith(prefix));
}

export function quickPackageKeyForCategory(category: string): string | null {
  return QUICK_PACKAGE_KEYS_BY_CATEGORY[category] ?? null;
}

export type QuickToFullConvergenceResult =
  | { ok: true; skipped: true; reason: string }
  | { ok: true; skipped: false; cancelledAtPeriodEnd: boolean; stripeSubscriptionId: string }
  | { ok: false; error: string };

function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { typescript: true });
}

/**
 * Finds the active Quick subscription for the user+category and schedules it for
 * cancellation at period end via Stripe. Best-effort and non-blocking: failures are
 * logged but never propagate to the main fulfillment return.
 */
export async function scheduleQuickCancellationAfterFullPayment(input: {
  ownerUserId: string;
  category: string;
  newPackageKey: string;
  eventId: string;
}): Promise<QuickToFullConvergenceResult> {
  const { ownerUserId, category, newPackageKey, eventId } = input;

  // Only trigger for Full base packages
  if (!isFullBasePackageKey(newPackageKey)) {
    return { ok: true, skipped: true, reason: "not_full_base_package" };
  }

  const quickPackageKey = quickPackageKeyForCategory(category);
  if (!quickPackageKey) {
    return { ok: true, skipped: true, reason: "no_quick_package_for_category" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "db_not_configured" };
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return { ok: false, error: "stripe_not_configured" };
  }

  // Look up active Quick subscription for this user+category
  const db = getAdminSupabase();
  const { data, error: lookupError } = await db
    .from("leonix_payment_records")
    .select("id, stripe_subscription_id")
    .eq("owner_user_id", ownerUserId)
    .eq("category", category)
    .eq("package_key", quickPackageKey)
    .eq("billing_mode", "subscription")
    .eq("payment_status", "paid")
    .not("stripe_subscription_id", "is", null)
    .order("paid_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error("[quickToFullConvergence] lookup error", { ownerUserId, category, eventId, error: lookupError.message });
    return { ok: false, error: "lookup_failed" };
  }

  if (!data || !data.stripe_subscription_id) {
    return { ok: true, skipped: true, reason: "no_quick_subscription_found" };
  }

  const stripeSubscriptionId = String(data.stripe_subscription_id);

  // Check current Stripe subscription state before attempting cancellation
  let sub: Stripe.Subscription;
  try {
    sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[quickToFullConvergence] retrieve error", { stripeSubscriptionId, eventId, error: msg });
    return { ok: false, error: "stripe_retrieve_failed" };
  }

  // Already cancelled or in a terminal state — nothing to do
  if (sub.status === "canceled" || sub.cancel_at_period_end) {
    return { ok: true, skipped: false, cancelledAtPeriodEnd: sub.cancel_at_period_end, stripeSubscriptionId };
  }

  // Schedule cancellation at period end (idempotent: setting this twice is a no-op in Stripe)
  try {
    const updated = await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
      metadata: {
        leonix_convergence_event_id: eventId.slice(0, 255),
        leonix_convergence_reason: "quick_to_full_upgrade",
        leonix_new_package_key: newPackageKey.slice(0, 100),
      },
    });
    console.info("[quickToFullConvergence] scheduled Quick cancellation at period end", {
      stripeSubscriptionId,
      ownerUserId,
      category,
      quickPackageKey,
      newPackageKey,
      eventId,
      cancel_at: updated.cancel_at,
    });
    return { ok: true, skipped: false, cancelledAtPeriodEnd: true, stripeSubscriptionId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[quickToFullConvergence] cancel update error", { stripeSubscriptionId, eventId, error: msg });
    return { ok: false, error: "stripe_update_failed" };
  }
}
