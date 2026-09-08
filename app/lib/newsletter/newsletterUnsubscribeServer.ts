/**
 * Newsletter unsubscribe — server-authoritative DB resolver.
 * Gate: CHECKOUT-NEWSLETTER-CHECKBOX-CAPTURE-01 (Step 5 — real unsubscribe path)
 *
 * Wraps the pure token-validation logic in `newsletterUnsubscribeToken.ts` with the actual
 * `leonix_newsletter_subscribers` lookup + write. This is the ONLY code path allowed to set
 * `status = "unsubscribed"`. Looks up strictly by `unsubscribe_token` — never by email — so
 * presenting one subscriber's token can never affect a different subscriber's row (no arbitrary
 * email mutation is possible here).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveNewsletterUnsubscribeRequest } from "./newsletterUnsubscribeToken";

export type NewsletterUnsubscribeResult =
  | { status: "UNSUBSCRIBED" }
  | { status: "ALREADY_UNSUBSCRIBED" }
  | { status: "INVALID_TOKEN" }
  | { status: "EXPIRED_TOKEN" }
  | { status: "FAILED"; reason: string };

/**
 * Processes an unsubscribe-link click/request. Idempotent: a repeat request with the same valid
 * token reports ALREADY_UNSUBSCRIBED and performs no further write, rather than erroring or
 * re-writing the row.
 */
export async function processNewsletterUnsubscribeToken(
  supabase: SupabaseClient,
  rawToken: string,
): Promise<NewsletterUnsubscribeResult> {
  const token = (rawToken ?? "").trim();
  if (!token) return { status: "INVALID_TOKEN" };

  const { data: subscriber, error: selectError } = await supabase
    .from("leonix_newsletter_subscribers")
    .select("id, status, unsubscribe_token, unsubscribe_token_expires_at")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (selectError) {
    console.error("[newsletter] unsubscribe lookup failed", { code: selectError.code });
    return { status: "FAILED", reason: "lookup_failed" };
  }

  // No row matches this token at all — never distinguish "wrong token" from "right token,
  // different subscriber" in the response; both must look identical to the caller.
  if (!subscriber) return { status: "INVALID_TOKEN" };

  const decision = resolveNewsletterUnsubscribeRequest({
    status: subscriber.status,
    storedToken: subscriber.unsubscribe_token,
    storedTokenExpiresAt: subscriber.unsubscribe_token_expires_at,
    presentedToken: token,
  });

  if (!decision.ok) {
    if (decision.reason === "token_expired") return { status: "EXPIRED_TOKEN" };
    return { status: "INVALID_TOKEN" };
  }

  if (decision.alreadyUnsubscribed) {
    return { status: "ALREADY_UNSUBSCRIBED" };
  }

  const nowIso = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("leonix_newsletter_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: nowIso, updated_at: nowIso })
    .eq("id", subscriber.id)
    // Defense in depth against a concurrent double-click race: only flip rows that are still not
    // already unsubscribed at the moment of the write.
    .neq("status", "unsubscribed");

  if (updateError) {
    console.error("[newsletter] unsubscribe write failed", { code: updateError.code });
    return { status: "FAILED", reason: "write_failed" };
  }

  return { status: "UNSUBSCRIBED" };
}
