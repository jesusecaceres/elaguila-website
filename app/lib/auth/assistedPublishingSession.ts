import "server-only";

import type { CookieStore } from "@/app/lib/supabase/server";
import {
  ASSISTED_PUBLISH_MAX_AGE_SEC,
  type AssistedPublishingContext,
  createAssistedPublishingTokenWithSecret,
  verifyAssistedPublishingTokenWithSecret,
} from "./assistedPublishingToken";

export type { AssistedPublishingContext } from "./assistedPublishingToken";

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

function getAssistedPublishingSecret(): string | null {
  const key = process.env.ASSISTED_PUBLISHING_SESSION_SECRET?.trim();
  return key ? key : null;
}


/**
 * Mints a signed, expiring assisted-publishing token. Returns null (fail closed — no token can be
 * created) when ASSISTED_PUBLISHING_SESSION_SECRET is not configured, mirroring
 * createBootstrapSessionToken()'s fail-closed doctrine exactly.
 */
export function createAssistedPublishingToken(input: {
  businessId: string;
  category: string;
  rosterId: string;
  authUserId: string;
}): string | null {
  const secret = getAssistedPublishingSecret();
  if (!secret) return null;
  return createAssistedPublishingTokenWithSecret(input, secret);
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
  return verifyAssistedPublishingTokenWithSecret(
    cookies.get(LEONIX_ASSISTED_PUBLISH_COOKIE)?.value,
    secret,
  );
}

/**
 * Sets (or, when token minting fails closed, explicitly clears) the assisted-publishing cookie on
 * a response. httpOnly + sameSite:"strict" + secure-in-production, mirroring
 * applyLeonixAdminSessionCookies()'s exact cookie-hardening options — path:"/" so it reaches every
 * category route (/publicar/*, /clasificados/*\/preview, etc.), never broader than the origin.
 */
export function applyAssistedPublishingCookie(
  res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } },
  input: { businessId: string; category: string; rosterId: string; authUserId: string },
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
