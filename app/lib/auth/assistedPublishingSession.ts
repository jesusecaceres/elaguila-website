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

/**
 * Gate QB-STAFF-03 (2026-09-21 audit repair) — REDEMPTION-TIME roster re-check.
 *
 * THE GAP THIS CLOSES: the token is minted only after a full
 * `requireStaffWorkspaceWriteAccess("assisted_category_publishing")` check, but that check happens
 * ONCE, at mint time. The signature and expiry are all that `readAssistedPublishingContext`
 * verifies afterwards, so a staff member deactivated, removed from the roster, or unlinked from
 * their Auth user keeps a fully valid write token for the remainder of
 * `ASSISTED_PUBLISH_MAX_AGE_SEC` and can still publish on a customer's behalf.
 *
 * WHAT THIS ADDS: every seam that WRITES on a customer's behalf re-resolves the roster row at
 * redemption and refuses unless it is still active AND still the same row the token names.
 * Cryptographic validity is necessary and no longer sufficient.
 *
 * FAIL-CLOSED, deliberately: a missing secret, a bad signature, an expired token, a roster row
 * that is absent, inactive, or whose id no longer matches the token, and a database that cannot
 * be reached all resolve to `null`. There is no branch in which an unverifiable roster is treated
 * as an active one.
 *
 * Read-only surfaces (the UI gate, `my-listing`) deliberately keep the cheap synchronous read:
 * they render a screen, they do not write, and adding a database round-trip to every render would
 * buy nothing this check does not already deliver at the write boundary.
 */
export async function readActiveAssistedPublishingContext(
  cookies: CookieStore,
): Promise<AssistedPublishingContext | null> {
  const ctx = readAssistedPublishingContext(cookies);
  if (!ctx) return null;
  const { lookupActiveAdminRosterByAuthUserId } = await import("@/app/lib/supabase/adminSession");
  const roster = await lookupActiveAdminRosterByAuthUserId(ctx.authUserId);
  if (!roster.ok) return null;
  // The token names a specific roster row. A different row for the same Auth user (a re-invite,
  // a re-created member) is a different actor and must re-authenticate.
  if (roster.rosterMemberId !== ctx.rosterId) return null;
  return ctx;
}

export function clearAssistedPublishingCookie(res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } }) {
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(LEONIX_ASSISTED_PUBLISH_COOKIE, "", { path: "/", httpOnly: true, sameSite: "strict", secure, maxAge: 0 });
}
