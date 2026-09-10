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
import { requireAdminCookie, type CookieStore } from "@/app/lib/supabase/server";
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
  return resolveSalesWorkspaceAccess(jar);
}

/**
 * The actual resolution logic, factored out from requireSalesWorkspaceAccess() so it can be
 * exercised in a regression test with a fake CookieStore — next/headers' cookies() only works
 * inside a real Next.js request, so this split is what makes the precedence guarantee below
 * (real staff session over legacy bootstrap) independently testable without a request context.
 * Exported for tests only; every real call site should use requireSalesWorkspaceAccess() above.
 */
export async function resolveSalesWorkspaceAccess(jar: CookieStore): Promise<SalesWorkspaceAccessResult> {
  if (!requireAdminCookie(jar)) {
    return { ok: false, reason: "no_admin_cookie" };
  }

  // Precedence hardening (Real-Owner-Login repair): a real per-person staff session always takes
  // precedence over legacy bootstrap, checked BEFORE isAdminBootstrapSession() rather than after.
  // Every login route already clears the *other* cookie set on login (see
  // applyLeonixAdminSessionCookies in adminSession.ts), so in normal operation the two cookie sets
  // should never coexist — but that invariant lived only in the login routes' care to clear
  // cookies correctly. This makes it a structural guarantee of the resolver itself: if both
  // staff-identity cookies are present, staff resolution runs to completion (success, or a
  // specific staff denial reason) and bootstrap is never even consulted. An incomplete or invalid
  // staff session still denies — it never silently falls back to bootstrap access, which would be
  // a privilege escalation, not a safety measure.
  const operatorEmail = getAdminOperatorEmailFromCookies(jar);
  const authUserId = getAdminAuthUserIdFromCookies(jar);
  if (operatorEmail && authUserId) {
    return resolveStaffSession(operatorEmail, authUserId);
  }

  if (isAdminBootstrapSession(jar)) {
    return ownerBootstrapAccess();
  }

  return { ok: false, reason: "no_operator_identity" };
}

async function resolveStaffSession(operatorEmail: string, authUserId: string): Promise<SalesWorkspaceAccessResult> {
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

/** Convenience guard for a single capability — use in every route/page that needs more than "is a valid actor." */
export function actorHasCapability(actor: { capabilities: ReadonlySet<SalesWorkspaceCapability> }, capability: SalesWorkspaceCapability): boolean {
  return actor.capabilities.has(capability);
}

export function denialStatusCode(reason: SalesWorkspaceDenialReason): number {
  return reason === "no_admin_cookie" || reason === "no_operator_identity" || reason === "bootstrap_session_not_allowed" || reason === "auth_user_not_found" ? 401 : 403;
}

// =====================================================================================================
// Systemic Repair Build — canonical staff-write standard.
//
// Locked PM policy (overrides/deprecates every prior "map bootstrap to owner" pattern that used to
// live in this file as salesActorToCreativeActor / salesActorToOpportunityActor /
// salesActorToAdvisorActor / salesActorToAssistantActor, and in livingBookActor.ts as
// salesActorToLivingBookActor):
//   - owner_bootstrap may NEVER perform a Business Concierge write. Not by fabricating a staff
//     roster row, and not by remapping to a fake "owner" actor either — both are attribution
//     bypasses, not safety measures.
//   - a real staff write requires the full linked identity chain (already verified above:
//     auth.users.id <-> profiles.id <-> admin_team_members.auth_user_id <-> admin_team_members.id)
//     — i.e. a non-empty rosterId AND authUserId on a "staff" actorType.
//   - there is exactly one way to obtain a writable staff actor: requireStaffWorkspaceWriteAccess()
//     (for the common single/either-of capability check) or toStaffWriteActor() (for routes whose
//     capability logic branches per action and only converts once, right before the write). Every
//     other construction of a `{ type: "staff", ... }` actor object on the admin surface is
//     forbidden — see scripts/verify-business-concierge-actor-safety-01.ts.
// =====================================================================================================

export type StaffWriteDenialReason = SalesWorkspaceDenialReason | "bootstrap_write_denied" | "staff_identity_incomplete";

/**
 * The one canonical writable-staff-actor shape. Structurally compatible with every module's own
 * `Extract<XActor, { type: "staff" }>` (FieldDiscoveryActor, HealthMapActor, DiyConciergeActor,
 * StewardshipStaffActor, LivingBookActor, AdvisorActor, AssistantActor, ProposalActor,
 * meetingStudio/promiseKeeper's inline staff actor shape) and assignable to CreativeActor /
 * OpportunityActor's staff variant — pass it directly, no per-module mapper needed.
 */
export type StaffWriteActor = {
  type: "staff";
  rosterId: string;
  authUserId: string;
  email: string;
  role: SalesWorkspaceRole;
  capabilities: ReadonlySet<SalesWorkspaceCapability>;
};

export type StaffWorkspaceWriteAccessResult =
  | { ok: true; actor: StaffWriteActor }
  | { ok: false; status: number; reason: StaffWriteDenialReason };

/**
 * Core guard: converts an already-verified StrictSalesActor into a StaffWriteActor, denying
 * bootstrap and any staff actor missing a link in the identity chain. Use this directly (after
 * requireSalesWorkspaceAccess() and your own capability checks) when a route's capability logic
 * branches per action and only needs to convert once, right before the write.
 */
export function toStaffWriteActor(actor: StrictSalesActor): StaffWorkspaceWriteAccessResult {
  if (isOwnerBootstrapActor(actor)) {
    return { ok: false, status: 403, reason: "bootstrap_write_denied" };
  }
  if (!actor.rosterId || !actor.authUserId) {
    return { ok: false, status: 403, reason: "staff_identity_incomplete" };
  }
  return {
    ok: true,
    actor: {
      type: "staff",
      rosterId: actor.rosterId,
      authUserId: actor.authUserId,
      email: actor.email,
      role: actor.role,
      capabilities: actor.capabilities,
    },
  };
}

/**
 * Convenience wrapper for the common case: one call resolves access, checks a single capability
 * (or that at least one of several applies), and denies bootstrap/incomplete-identity writes —
 * all with one clean HTTP status/error contract. Never returns a raw DB error to the caller.
 */
export async function requireStaffWorkspaceWriteAccess(
  capability: SalesWorkspaceCapability | readonly SalesWorkspaceCapability[],
): Promise<StaffWorkspaceWriteAccessResult> {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return { ok: false, status: denialStatusCode(access.reason), reason: access.reason };
  }
  const capabilities = Array.isArray(capability) ? capability : [capability as SalesWorkspaceCapability];
  if (!capabilities.some((c) => actorHasCapability(access.actor, c))) {
    return { ok: false, status: 403, reason: "role_not_permitted" };
  }
  return toStaffWriteActor(access.actor);
}
