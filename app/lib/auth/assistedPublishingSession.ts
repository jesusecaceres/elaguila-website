import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { CookieStore } from "@/app/lib/supabase/server";

/**
 * P0 Staff-Assisted Category Access — the ONE reusable "is this specific render authorized for a
 * Leonix staff actor, without a customer Supabase session" primitive, shared by every category's
 * application AND preview route through a single choke point (PublishAuthGate.tsx /
 * PublishAuthGateLayout.tsx). Not a new auth system — the exact same signed, expiring, HMAC-SHA256
 * token pattern already proven by the admin bootstrap session
 * (app/lib/supabase/adminSession.ts's createBootstrapSessionToken/isAdminBootstrapSession),
 * deliberately NOT sharing code with it so the two token types can never be cross-validated, and
 * signed with its own dedicated secret (ASSISTED_PUBLISHING_SESSION_SECRET) so a leak of one
 * secret never compromises the other — same doctrine adminSession.ts documents for its own secret
 * being independent from ADMIN_PASSWORD.
 *
 * What this token does NOT do, by design:
 * - It never touches the database. Every category's draft/preview is 100% browser-local until
 *   Publish (confirmed by source trace) — this token only lets the CLIENT-SIDE UI GATE render,
 *   nothing more.
 * - It never weakens or is consulted by the real publish-time server auth
 *   (serviciosOwnerIdFromBearer / restauranteOwnerIdFromBearer and equivalents) — those still
 *   independently require a real customer Supabase Auth bearer token in every "strict" (production)
 *   environment, completely unchanged by this file.
 * - It cannot be forged, extended, or activated by a query string, a client-settable cookie, or
 *   any other client-supplied value — it is minted ONLY server-side, ONLY after a fresh
 *   requireStaffWorkspaceWriteAccess("assisted_category_publishing") check (real Supabase Auth +
 *   roster re-verification, same as every other staff write in this codebase).
 */

export const LEONIX_ASSISTED_PUBLISH_COOKIE = "leonix_assisted_publish";

/** Short-lived on purpose — one staff prep session, not a standing credential. Re-minted on every fresh handoff. */
const ASSISTED_PUBLISH_MAX_AGE_SEC = 60 * 60; // 1 hour

function getAssistedPublishingSecret(): string | null {
  const key = process.env.ASSISTED_PUBLISHING_SESSION_SECRET?.trim();
  return key ? key : null;
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export type AssistedPublishingContext = {
  businessId: string;
  /** The PublicarGatewayCategoryKey this token was minted for (e.g. "servicios"). Informational —
   * the render gate itself only requires ANY valid, unexpired token; display surfaces (the
   * existing ConciergeReturnBanner, which reads the separate unsigned sessionStorage context) are
   * the source of truth for what's shown to the staff member. */
  category: string;
  /** admin_team_members.id of the staff actor this token was minted for. Never a bootstrap/fake id
   * — toStaffWriteActor() already rejects owner_bootstrap before this module is ever reached. */
  rosterId: string;
  issuedAtMs: number;
  expiresAtMs: number;
};

/**
 * Mints a signed, expiring assisted-publishing token. Returns null (fail closed — no token can be
 * created) when ASSISTED_PUBLISHING_SESSION_SECRET is not configured, mirroring
 * createBootstrapSessionToken()'s fail-closed doctrine exactly.
 */
export function createAssistedPublishingToken(input: {
  businessId: string;
  category: string;
  rosterId: string;
}): string | null {
  const secret = getAssistedPublishingSecret();
  if (!secret) return null;
  const issuedAtMs = Date.now();
  const expiresAtMs = issuedAtMs + ASSISTED_PUBLISH_MAX_AGE_SEC * 1000;
  const payloadObj: AssistedPublishingContext = {
    businessId: input.businessId,
    category: input.category,
    rosterId: input.rosterId,
    issuedAtMs,
    expiresAtMs,
  };
  const payload = Buffer.from(JSON.stringify(payloadObj), "utf8").toString("base64url");
  return `${payload}.${signPayload(payload, secret)}`;
}

/**
 * Verifies the assisted-publishing token's signature and expiry (constant-time compare — never a
 * plain === on attacker-controlled input). Fails closed on any missing secret, malformed token,
 * bad signature, or expired/not-yet-valid timestamp. A forged or tampered payload can never
 * verify: the signature covers the exact base64url payload bytes.
 */
export function readAssistedPublishingContext(cookies: CookieStore): AssistedPublishingContext | null {
  const secret = getAssistedPublishingSecret();
  if (!secret) return null;
  const raw = cookies.get(LEONIX_ASSISTED_PUBLISH_COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  const expectedSignature = signPayload(payload, secret);
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
    typeof parsed.issuedAtMs !== "number" ||
    typeof parsed.expiresAtMs !== "number"
  ) {
    return null;
  }
  if (parsed.issuedAtMs > Date.now()) return null;
  if (parsed.expiresAtMs <= Date.now()) return null;
  return {
    businessId: parsed.businessId,
    category: parsed.category,
    rosterId: parsed.rosterId,
    issuedAtMs: parsed.issuedAtMs,
    expiresAtMs: parsed.expiresAtMs,
  };
}

/**
 * Sets (or, when token minting fails closed, explicitly clears) the assisted-publishing cookie on
 * a response. httpOnly + sameSite:"strict" + secure-in-production, mirroring
 * applyLeonixAdminSessionCookies()'s exact cookie-hardening options — path:"/" so it reaches every
 * category route (/publicar/*, /clasificados/*\/preview, etc.), never broader than the origin.
 */
export function applyAssistedPublishingCookie(
  res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } },
  input: { businessId: string; category: string; rosterId: string },
): boolean {
  const secure = process.env.NODE_ENV === "production";
  const base = { path: "/", httpOnly: true, sameSite: "strict" as const, secure };
  const token = createAssistedPublishingToken(input);
  if (!token) {
    res.cookies.set(LEONIX_ASSISTED_PUBLISH_COOKIE, "", { ...base, maxAge: 0 });
    return false;
  }
  res.cookies.set(LEONIX_ASSISTED_PUBLISH_COOKIE, token, { ...base, maxAge: ASSISTED_PUBLISH_MAX_AGE_SEC });
  return true;
}

export function clearAssistedPublishingCookie(res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } }) {
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(LEONIX_ASSISTED_PUBLISH_COOKIE, "", { path: "/", httpOnly: true, sameSite: "strict", secure, maxAge: 0 });
}
