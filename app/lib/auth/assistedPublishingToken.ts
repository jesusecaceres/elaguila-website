/**
 * Gate QB-STAFF-03 — PURE assisted-publishing token crypto.
 *
 * Extracted from `assistedPublishingSession.ts` for one reason: that module is `server-only`, so
 * no test could ever import it, and the security claim "a forged or tampered token can never
 * verify" was only ever asserted by matching strings in the source. This module has no
 * `server-only` import and no Next.js dependency, so
 * `scripts/verify-quick-assisted-operations-01.ts` proves that claim by actually attempting
 * forgery, tampering, truncation, algorithm-confusion and expiry attacks against the real code.
 *
 * The behaviour is unchanged: same HMAC-SHA256 construction, same constant-time comparison, same
 * fail-closed posture. The secret is passed in rather than read from the environment here, which
 * is what lets a test exercise sign/verify deterministically; the server-only wrapper remains the
 * only thing that knows where the secret comes from.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** Short-lived on purpose — one staff prep session, not a standing credential. */
export const ASSISTED_PUBLISH_MAX_AGE_SEC = 60 * 60; // 1 hour

export type AssistedPublishingContext = {
  businessId: string;
  /** The category this token was minted for (e.g. "servicios"). */
  category: string;
  /** admin_team_members.id of the staff actor this token was minted for. */
  rosterId: string;
  /**
   * The staff actor's real Supabase Auth user id, re-verified fresh at mint time. Used ONLY as
   * attribution (business_listing_links.linked_by — "who linked this record", not ownership).
   * Never written to any listing's customer-ownership column.
   */
  authUserId: string;
  issuedAtMs: number;
  expiresAtMs: number;
};

export function signAssistedPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

/** Constant-time compare — never a plain === on attacker-controlled input. */
export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Mint a signed, expiring token. `nowMs` is injectable so expiry behaviour is testable without
 * manipulating the system clock.
 */
export function createAssistedPublishingTokenWithSecret(
  input: { businessId: string; category: string; rosterId: string; authUserId: string },
  secret: string,
  nowMs: number = Date.now(),
): string | null {
  if (!secret) return null;
  const issuedAtMs = nowMs;
  const expiresAtMs = issuedAtMs + ASSISTED_PUBLISH_MAX_AGE_SEC * 1000;
  const payloadObj: AssistedPublishingContext = {
    businessId: input.businessId,
    category: input.category,
    rosterId: input.rosterId,
    authUserId: input.authUserId,
    issuedAtMs,
    expiresAtMs,
  };
  const payload = Buffer.from(JSON.stringify(payloadObj), "utf8").toString("base64url");
  return `${payload}.${signAssistedPayload(payload, secret)}`;
}

/**
 * Verify signature AND expiry. Fails closed on a missing secret, a malformed token, a bad
 * signature, or an expired / not-yet-valid timestamp. The signature covers the exact base64url
 * payload bytes, so a tampered payload can never verify.
 */
export function verifyAssistedPublishingTokenWithSecret(
  raw: string | null | undefined,
  secret: string,
  nowMs: number = Date.now(),
): AssistedPublishingContext | null {
  if (!secret) return null;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  const expectedSignature = signAssistedPayload(payload, secret);
  if (!safeEqualHex(signature, expectedSignature)) return null;

  let parsed: Partial<AssistedPublishingContext>;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    !parsed.businessId ||
    !parsed.category ||
    !parsed.rosterId ||
    !parsed.authUserId ||
    typeof parsed.issuedAtMs !== "number" ||
    typeof parsed.expiresAtMs !== "number"
  ) {
    return null;
  }
  if (parsed.issuedAtMs > nowMs) return null;
  if (parsed.expiresAtMs <= nowMs) return null;
  return {
    businessId: parsed.businessId,
    category: parsed.category,
    rosterId: parsed.rosterId,
    authUserId: parsed.authUserId,
    issuedAtMs: parsed.issuedAtMs,
    expiresAtMs: parsed.expiresAtMs,
  };
}
