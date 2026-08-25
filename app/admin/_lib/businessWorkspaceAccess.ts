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
 * - no roster row means no *staff* Sales Workspace access — ever;
 * - no inferred owner_admin fallback;
 * - no anonymous or placeholder staff identity;
 * - the shared bootstrap password (ADMIN_PASSWORD, app/admin/login/submit/route.ts) is an
 *   OWNER OVERRIDE only: a valid `leonix_admin` + `leonix_admin_bootstrap` cookie pair is
 *   accepted as actorType "owner_bootstrap" with existing super_admin capabilities. It is
 *   never turned into a staff roster session, never fabricates a roster row, and never
 *   creates a Supabase Auth user;
 * - every *staff* mutation still requires a real, currently-active roster identity;
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
 * How a real staff identity is distinguished from the shared password, using only existing,
 * already-proven primitives (app/lib/supabase/adminSession.ts) — no new cookie/session mechanism:
 * - app/admin/login/submit/route.ts (shared password) sets ONLY the bootstrap cookie and
 *   explicitly clears the operator-email/auth-user-id cookies (see applyLeonixAdminSessionCookies,
 *   bootstrap branch) — isAdminBootstrapSession() catches this and we authorize an
 *   owner_bootstrap actor (not a staff actor). Operator cookies on a bootstrap session are
 *   ignored so bootstrap can never be mistaken for a roster session.
 * - app/admin/login/auth/route.ts (real per-person login) verifies Supabase Auth credentials AND
 *   an active roster row BEFORE ever setting a cookie, then sets operator-email and auth-user-id
 *   together. We additionally re-verify the roster row is *still* active, and now also
 *   re-verify the Auth user and the full identity chain, on every request — not just at login
 *   time — so a deactivated staff member or a forged/stale cookie loses access on the very next
 *   request, not after a 7-day cookie eventually expires.
 * - The `ADMIN_OPERATOR_EMAIL` env var fallback that the legacy resolver accepts is deliberately
 *   NOT accepted here as a staff identity — that is a shared, machine-level default, not a
 *   per-person session identity, and would make every visitor to this env "the same operator."
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
import type { CreativeActor } from "@/app/lib/business/creativeStudio/repository";
import type { OpportunityActor } from "@/app/lib/business/opportunity/types";
import type { AdvisorActor } from "@/app/lib/business/advisor/types";
import type { AssistantActor } from "@/app/lib/business/assistant/types";
import { capabilitiesForRole, isSalesWorkspaceRole, type SalesWorkspaceCapability, type SalesWorkspaceRole } from "./salesWorkspaceCapabilities";

export type SalesWorkspaceActorType = "staff" | "owner_bootstrap";

/**
 * Server-only attribution for owner-bootstrap writes. Not a roster id and not a created
 * Supabase Auth user — Creative Studio / opportunity CHECKs require a uuid on some columns
 * when a human reviews, and owner-type rows must not carry a fabricated roster FK.
 */
export const OWNER_BOOTSTRAP_ATTRIBUTION_AUTH_USER_ID = "00000000-0000-4000-a000-0000000000b7";
const OWNER_BOOTSTRAP_ACTOR_EMAIL = "owner.bootstrap@leonix.internal";

export type StrictSalesActor = {
  actorType: SalesWorkspaceActorType;
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
    return ownerBootstrapAccess();
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
      actorType: "staff",
      rosterId: roster.rosterMemberId,
      authUserId,
      email: authUser.email,
      role: normalizedRole,
      displayName: roster.displayName,
      capabilities: capabilitiesForRole(normalizedRole),
    },
  };
}

function ownerBootstrapAccess(): SalesWorkspaceAccessResult {
  return {
    ok: true,
    actor: {
      actorType: "owner_bootstrap",
      rosterId: "",
      authUserId: OWNER_BOOTSTRAP_ATTRIBUTION_AUTH_USER_ID,
      email: OWNER_BOOTSTRAP_ACTOR_EMAIL,
      role: "super_admin",
      displayName: "Leonix owner",
      capabilities: capabilitiesForRole("super_admin"),
    },
  };
}

export function isOwnerBootstrapActor(actor: StrictSalesActor): boolean {
  return actor.actorType === "owner_bootstrap";
}

/** Maps a verified workspace actor onto Creative Studio's staff|owner writer shape. */
export function salesActorToCreativeActor(actor: StrictSalesActor): CreativeActor {
  if (actor.actorType === "owner_bootstrap") {
    return {
      type: "owner",
      rosterId: null,
      authUserId: OWNER_BOOTSTRAP_ATTRIBUTION_AUTH_USER_ID,
      email: actor.email,
      role: actor.role,
    };
  }
  return {
    type: "staff",
    rosterId: actor.rosterId,
    authUserId: actor.authUserId,
    email: actor.email,
    role: actor.role,
  };
}

/** Maps a verified workspace actor onto Package B's opportunity writer shape. Never emits a fake staff roster row. */
export function salesActorToOpportunityActor(actor: StrictSalesActor): Extract<OpportunityActor, { type: "staff" | "owner" }> {
  if (actor.actorType === "owner_bootstrap") {
    return {
      type: "owner",
      authUserId: OWNER_BOOTSTRAP_ATTRIBUTION_AUTH_USER_ID,
      role: actor.role,
    };
  }
  return {
    type: "staff",
    rosterId: actor.rosterId,
    authUserId: actor.authUserId,
    role: actor.role,
  };
}

/** Maps a verified workspace actor onto Program 7 Advisor writer shape. Never fabricates a roster row. */
export function salesActorToAdvisorActor(actor: StrictSalesActor): AdvisorActor {
  if (actor.actorType === "owner_bootstrap" || !actor.rosterId) {
    return {
      type: "owner",
      authUserId: OWNER_BOOTSTRAP_ATTRIBUTION_AUTH_USER_ID,
      email: actor.email,
    };
  }
  return {
    type: "staff",
    rosterId: actor.rosterId,
    authUserId: actor.authUserId,
    email: actor.email,
    role: actor.role,
  };
}

/** Maps a verified workspace actor onto Program 7 Assistant writer shape. Never fabricates a roster row. */
export function salesActorToAssistantActor(actor: StrictSalesActor): AssistantActor {
  if (actor.actorType === "owner_bootstrap" || !actor.rosterId) {
    return {
      type: "owner",
      authUserId: OWNER_BOOTSTRAP_ATTRIBUTION_AUTH_USER_ID,
      email: actor.email,
    };
  }
  return {
    type: "staff",
    rosterId: actor.rosterId,
    authUserId: actor.authUserId,
    email: actor.email,
    role: actor.role,
  };
}

/** Convenience guard for a single capability — use in every route/page that needs more than "is a valid actor." */
export function actorHasCapability(actor: StrictSalesActor, capability: SalesWorkspaceCapability): boolean {
  return actor.capabilities.has(capability);
}

export function denialStatusCode(reason: SalesWorkspaceDenialReason): number {
  return reason === "no_admin_cookie" || reason === "no_operator_identity" || reason === "bootstrap_session_not_allowed" || reason === "auth_user_not_found" ? 401 : 403;
}
