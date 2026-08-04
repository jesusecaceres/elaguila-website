/**
 * Gate BCO-4A.1/4A.7 — strict, capability-based server-side authorization boundary for the Sales
 * Team Business Workspace (/admin/businesses/**). This REPLACES the previous, looser
 * requireSalesWorkspaceAccess() (Gate B), which reused the legacy `canAccessSalesTools()` check —
 * that check effectively allows any `leonix_admin` cookie holder regardless of role, and
 * `getCurrentAdminAccessContext()` (the legacy role resolver) fails OPEN to full `owner_admin`
 * when no roster row is configured. Neither behavior is acceptable for a surface that exposes
 * business-owner PII.
 *
 * Locked doctrine (do not weaken):
 * - no roster row means no Sales Workspace access — ever;
 * - no inferred owner_admin fallback;
 * - no anonymous or placeholder staff identity;
 * - the shared bootstrap password (ADMIN_PASSWORD, app/admin/login/submit/route.ts) NEVER
 *   authorizes Sales Workspace access on its own, even though it satisfies the legacy
 *   `leonix_admin` cookie check used everywhere else in app/admin/**;
 * - every mutation requires a real, currently-active roster identity;
 * - every page and route calls this independently — never trust the dashboard layout's cookie
 *   check alone (most existing app/api/admin/** routes only check that cookie; this package must
 *   not repeat that gap).
 *
 * Gate BCO-4A.7 hardening — the operator-email/auth-user-id cookie pair is NEVER trusted as bare
 * strings on its own (found during BCO-4A.6 live certification: a roster row with a NULL
 * `auth_user_id` plus an arbitrary syntactically-valid UUID in the cookie was previously enough to
 * pass, because roster resolution went by email only and the auth-user-id cookie was never
 * cross-checked against anything). Every request now re-verifies, via the Supabase Auth Admin API
 * and a roster lookup keyed by `auth_user_id` (not email):
 * - the auth_user_id cookie corresponds to a REAL, currently-existing Supabase Auth user;
 * - the roster row is found BY that exact auth_user_id (a NULL-auth_user_id roster row can never
 *   match, by construction — no special-casing needed);
 * - the cookie's claimed operator email, the real Supabase Auth email, and the roster row's own
 *   email all agree after normalization.
 * A mismatch anywhere in that chain denies access before any business data is read.
 *
 * How a real identity is distinguished from the shared password, using only existing, already-
 * proven primitives (app/lib/supabase/adminSession.ts) — no new cookie/session mechanism:
 * - app/admin/login/submit/route.ts (shared password) sets ONLY the bootstrap cookie and
 *   explicitly clears the operator-email/auth-user-id cookies (see applyLeonixAdminSessionCookies,
 *   bootstrap branch) — isAdminBootstrapSession() catches this and we deny outright.
 * - app/admin/login/auth/route.ts (real per-person login) verifies Supabase Auth credentials AND
 *   an active roster row BEFORE ever setting a cookie, then sets operator-email and auth-user-id
 *   together. We additionally re-verify the roster row is *still* active, and now also
 *   re-verify the Auth user and the full identity chain, on every request — not just at login
 *   time — so a deactivated staff member or a forged/stale cookie loses access on the very next
 *   request, not after a 7-day cookie eventually expires.
 * - The `ADMIN_OPERATOR_EMAIL` env var fallback that the legacy resolver accepts is deliberately
 *   NOT accepted here — that is a shared, machine-level default, not a per-person session
 *   identity, and would make every visitor to this env "the same operator."
 */
import "server-only";

import { cookies } from "next/headers";
import {
  getAdminOperatorEmailFromCookies,
  getAdminAuthUserIdFromCookies,
  isAdminBootstrapSession,
  lookupActiveAdminRosterByAuthUserId,
  lookupAuthUserById,
} from "@/app/lib/supabase/adminSession";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { capabilitiesForRole, isSalesWorkspaceRole, type SalesWorkspaceCapability, type SalesWorkspaceRole } from "./salesWorkspaceCapabilities";

export type StrictSalesActor = {
  rosterId: string;
  authUserId: string;
  email: string;
  role: SalesWorkspaceRole;
  displayName: string | null;
  capabilities: ReadonlySet<SalesWorkspaceCapability>;
};

export type SalesWorkspaceDenialReason =
  | "no_admin_cookie"
  | "bootstrap_session_not_allowed"
  | "no_operator_identity"
  | "auth_user_not_found"
  | "identity_mismatch"
  | "roster_not_found"
  | "roster_inactive"
  | "role_not_permitted";

export type SalesWorkspaceAccessResult = { ok: true; actor: StrictSalesActor } | { ok: false; reason: SalesWorkspaceDenialReason };

/**
 * Server-only. Call at the top of every /admin/businesses page and every
 * app/api/admin/businesses/** route handler. Re-resolves the full identity chain fresh on every
 * call (no caching across requests) so a deactivated staff member, or a cookie that no longer
 * corresponds to a real/matching Auth identity, is denied immediately — not once a 7-day cookie
 * eventually expires.
 */
export async function requireSalesWorkspaceAccess(): Promise<SalesWorkspaceAccessResult> {
  const jar = await cookies();

  if (!requireAdminCookie(jar)) {
    return { ok: false, reason: "no_admin_cookie" };
  }
  if (isAdminBootstrapSession(jar)) {
    return { ok: false, reason: "bootstrap_session_not_allowed" };
  }

  const operatorEmail = getAdminOperatorEmailFromCookies(jar);
  const authUserId = getAdminAuthUserIdFromCookies(jar);
  if (!operatorEmail || !authUserId) {
    return { ok: false, reason: "no_operator_identity" };
  }

  // Step 1: authUserId must be a REAL, currently-existing Supabase Auth user — never trusted as a
  // bare cookie string. A forged, stale, or syntactically-valid-but-nonexistent UUID is rejected
  // here, before any roster lookup even runs.
  const authUser = await lookupAuthUserById(authUserId);
  if (!authUser.ok) {
    return { ok: false, reason: "auth_user_not_found" };
  }

  // Step 2: the cookie's claimed operator email must match the REAL Supabase Auth email for this
  // UUID. Catches a genuine Auth UUID paired with a forged/stale/different operator-email cookie.
  if (authUser.email !== operatorEmail.trim().toLowerCase()) {
    return { ok: false, reason: "identity_mismatch" };
  }

  // Step 3: the roster row is resolved by auth_user_id, never by email. A roster row whose
  // auth_user_id is NULL (e.g. an invited-but-not-yet-Auth-linked row) can never match this query
  // — fail-closed by construction, no special-case NULL handling required.
  const roster = await lookupActiveAdminRosterByAuthUserId(authUserId);
  if (!roster.ok) {
    return { ok: false, reason: roster.code === "inactive" ? "roster_inactive" : "roster_not_found" };
  }

  // Step 4: defense in depth — the roster row's own email column must also agree with the
  // verified Auth email (catches a roster row whose auth_user_id link is correct but whose email
  // has since drifted out of sync with the real Auth identity).
  if (roster.email.trim().toLowerCase() !== authUser.email) {
    return { ok: false, reason: "identity_mismatch" };
  }

  const normalizedRole = roster.role.trim().toLowerCase();
  if (!isSalesWorkspaceRole(normalizedRole)) {
    return { ok: false, reason: "role_not_permitted" };
  }

  return {
    ok: true,
    actor: {
      rosterId: roster.rosterMemberId,
      authUserId,
      email: authUser.email,
      role: normalizedRole,
      displayName: roster.displayName,
      capabilities: capabilitiesForRole(normalizedRole),
    },
  };
}

/** Convenience guard for a single capability — use in every route/page that needs more than "is a valid actor." */
export function actorHasCapability(actor: StrictSalesActor, capability: SalesWorkspaceCapability): boolean {
  return actor.capabilities.has(capability);
}

export function denialStatusCode(reason: SalesWorkspaceDenialReason): number {
  return reason === "no_admin_cookie" || reason === "no_operator_identity" || reason === "bootstrap_session_not_allowed" || reason === "auth_user_not_found" ? 401 : 403;
}
