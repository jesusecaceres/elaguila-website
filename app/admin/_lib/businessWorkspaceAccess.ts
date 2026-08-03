/**
 * Gate BCO-4A.1 — strict, capability-based server-side authorization boundary for the Sales Team
 * Business Workspace (/admin/businesses/**). This REPLACES the previous, looser
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
 * How a real identity is distinguished from the shared password, using only existing, already-
 * proven primitives (app/lib/supabase/adminSession.ts) — no new cookie/session mechanism:
 * - app/admin/login/submit/route.ts (shared password) sets ONLY the bootstrap cookie and
 *   explicitly clears the operator-email/auth-user-id cookies (see applyLeonixAdminSessionCookies,
 *   bootstrap branch) — isAdminBootstrapSession() catches this and we deny outright.
 * - app/admin/login/auth/route.ts (real per-person login) verifies Supabase Auth credentials AND
 *   an active roster row BEFORE ever setting a cookie, then sets operator-email and auth-user-id
 *   together. We additionally re-verify the roster row is *still* active on every request
 *   (lookupActiveAdminRosterByEmail), not just at login time — a deactivated staff member loses
 *   access on their very next request, not after their 7-day cookie expires.
 * - The `ADMIN_OPERATOR_EMAIL` env var fallback that the legacy resolver accepts is deliberately
 *   NOT accepted here — that is a shared, machine-level default, not a per-person session
 *   identity, and would make every visitor to this env "the same operator."
 */
import "server-only";

import { cookies } from "next/headers";
import { getAdminOperatorEmailFromCookies, getAdminAuthUserIdFromCookies, isAdminBootstrapSession, lookupActiveAdminRosterByEmail } from "@/app/lib/supabase/adminSession";
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
  | "roster_not_found"
  | "roster_inactive"
  | "role_not_permitted";

export type SalesWorkspaceAccessResult = { ok: true; actor: StrictSalesActor } | { ok: false; reason: SalesWorkspaceDenialReason };

/**
 * Server-only. Call at the top of every /admin/businesses page and every
 * app/api/admin/businesses/** route handler. Re-resolves the roster row fresh on every call
 * (no caching across requests) so a deactivated staff member is denied immediately, not once
 * their cookie eventually expires.
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

  const roster = await lookupActiveAdminRosterByEmail(operatorEmail);
  if (!roster.ok) {
    return { ok: false, reason: roster.code === "inactive" ? "roster_inactive" : "roster_not_found" };
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
      email: operatorEmail,
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
  return reason === "no_admin_cookie" || reason === "no_operator_identity" || reason === "bootstrap_session_not_allowed" ? 401 : 403;
}
