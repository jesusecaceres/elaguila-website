/**
 * Newsletter unsubscribe — pure token validation + opaque token generator.
 * Gate: CHECKOUT-NEWSLETTER-CHECKBOX-CAPTURE-01 (Step 5 — real unsubscribe path)
 *
 * Deliberately separate from `newsletterVerificationState.ts`: `unsubscribe_token` and
 * `verification_token` are two distinct secrets with opposite consequences (one confirms a new
 * subscription, the other ends one) and must never be interchangeable — a leaked/guessed
 * verification token must never be able to unsubscribe someone, and a leaked unsubscribe token
 * must never be able to confirm/verify a subscription.
 *
 * No DB/network access in this file (mirrors newsletterVerificationState.ts so it can be imported
 * directly by relative path under tsx for a pure-function regression check).
 */

import { randomBytes } from "node:crypto";

/**
 * Generates a random opaque unsubscribe token. Never log or print the return value — like the
 * verification token, it is a bearer credential (this one ends someone's subscription).
 */
export function generateNewsletterUnsubscribeToken(): string {
  return randomBytes(32).toString("hex");
}

export type ResolveNewsletterUnsubscribeInput = {
  /** The subscriber row's current status. */
  status: string | null | undefined;
  /** The token currently stored on the subscriber row (null if none was ever issued). */
  storedToken: string | null | undefined;
  /** The subscriber row's unsubscribe-token expiry, if any. */
  storedTokenExpiresAt: string | Date | null | undefined;
  /** The token presented via the unsubscribe link/request. */
  presentedToken: string | null | undefined;
  /** Injectable clock for deterministic tests; defaults to `new Date()`. */
  now?: Date;
};

export type ResolveNewsletterUnsubscribeResult =
  | { ok: true; alreadyUnsubscribed: true }
  | { ok: true; alreadyUnsubscribed: false }
  | { ok: false; reason: "token_missing" | "token_mismatch" | "token_expired" };

/**
 * Pure token-validation + idempotency decision for the unsubscribe flow. No DB/network access.
 *
 * Contract for a real caller:
 *  - `ok: false` -> reject the request (INVALID_TOKEN / EXPIRED_TOKEN), never mutate anything.
 *  - `ok: true, alreadyUnsubscribed: true` -> the row is already unsubscribed; report
 *    ALREADY_UNSUBSCRIBED truthfully and skip the write (idempotent, no redundant UPDATE).
 *  - `ok: true, alreadyUnsubscribed: false` -> persist `status = "unsubscribed"`,
 *    `unsubscribed_at = now()`. Never clear `unsubscribe_token` — the same link must keep working
 *    on a repeat visit (that repeat visit then hits the `alreadyUnsubscribed: true` branch above).
 */
export function resolveNewsletterUnsubscribeRequest(
  input: ResolveNewsletterUnsubscribeInput,
): ResolveNewsletterUnsubscribeResult {
  const presented = (input.presentedToken ?? "").trim();
  const stored = (input.storedToken ?? "").trim();

  // Token check always runs first, before looking at status — an invalid/absent token must never
  // leak whether a given token *would* have matched an already-unsubscribed row.
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

  if (input.status === "unsubscribed") {
    return { ok: true, alreadyUnsubscribed: true };
  }
  return { ok: true, alreadyUnsubscribed: false };
}
