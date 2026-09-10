/**
 * Newsletter double opt-in verification — STATE FOUNDATION ONLY.
 * Gate: CHECKOUT-NEWSLETTER-CHECKBOX-CAPTURE-01 (Step 4 — verification foundation)
 *
 * This module provides the pure state-machine + opaque token generator that a real double
 * opt-in flow would use. It does NOT send any email and is NOT wired into the live checkout
 * capture or newsletter subscribe write paths — those still write status "subscribed"
 * immediately, exactly as before this change, because there is no outbound email integration
 * in scope to actually deliver a confirmation link. Wiring this in (setting a new subscriber's
 * status to "pending_verification", generating+storing a token, emailing a confirmation link,
 * and calling `resolveNewsletterVerificationState` from a `/api/newsletter/verify` route) is a
 * separate, isolated deployment requirement — do not treat this file as proof verification
 * "works end to end".
 *
 * Storage: supabase/migrations/20260826130000_leonix_newsletter_verification_state.sql adds the
 * `pending_verification` status value plus `verification_token` / `verification_token_expires_at`
 * / `verified_at` columns additively (no existing row/value touched).
 */

import { randomBytes } from "node:crypto";

export type NewsletterSubscriberStatus = "subscribed" | "unsubscribed" | "pending_verification";

/**
 * Generates a random opaque verification token. Never log or print the return value — it is a
 * bearer credential for confirming someone else's email address.
 */
export function generateNewsletterVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

export type VerifyNewsletterTokenInput = {
  /** The subscriber row's current status. */
  status: NewsletterSubscriberStatus | string | null | undefined;
  /** The token currently stored on the subscriber row (null if none / already cleared). */
  storedToken: string | null | undefined;
  /** The subscriber row's token expiry, if any. */
  storedTokenExpiresAt: string | Date | null | undefined;
  /** The token presented by the confirmation link/request. */
  presentedToken: string | null | undefined;
  /** Injectable clock for deterministic tests; defaults to `new Date()`. */
  now?: Date;
};

export type VerifyNewsletterTokenResult =
  | { ok: true; nextStatus: "subscribed" }
  | {
      ok: false;
      reason: "not_pending" | "token_missing" | "token_mismatch" | "token_expired";
    };

/**
 * Pure pending -> verified transition. No DB/network access.
 *
 * Contract for a future caller: on `ok: true`, persist `nextStatus`, set `verified_at = now()`,
 * and clear `verification_token` (set to null) on the row. Clearing the token is what makes a
 * *reused* token correctly fail on a second attempt — it will no longer match `storedToken`
 * (a cleared token compares as `token_missing`/`token_mismatch`, never a second `ok: true`).
 */
export function resolveNewsletterVerificationState(
  input: VerifyNewsletterTokenInput,
): VerifyNewsletterTokenResult {
  if (input.status !== "pending_verification") {
    return { ok: false, reason: "not_pending" };
  }

  const presented = (input.presentedToken ?? "").trim();
  const stored = (input.storedToken ?? "").trim();
  if (!presented || !stored) {
    return { ok: false, reason: "token_missing" };
  }
  if (presented !== stored) {
    return { ok: false, reason: "token_mismatch" };
  }

  if (input.storedTokenExpiresAt) {
    const expiresAtMs = new Date(input.storedTokenExpiresAt).getTime();
    const nowMs = (input.now ?? new Date()).getTime();
    if (Number.isFinite(expiresAtMs) && expiresAtMs < nowMs) {
      return { ok: false, reason: "token_expired" };
    }
  }

  return { ok: true, nextStatus: "subscribed" };
}
