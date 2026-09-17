import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { CookieStore } from "@/app/lib/supabase/server";
import { getAdminSupabase, getServerSupabaseAnon, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

/** HTTP-only admin session cookies (STAFF-ADMIN-02). */
export const LEONIX_ADMIN_COOKIE = "leonix_admin";
export const LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE = "leonix_admin_operator_email";
export const LEONIX_ADMIN_AUTH_USER_ID_COOKIE = "leonix_admin_auth_user_id";
export const LEONIX_ADMIN_BOOTSTRAP_COOKIE = "leonix_admin_bootstrap";

const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

// =====================================================================================================
// Bootstrap session hardening (Staging Release Blocker Hardening).
//
// Finding: leonix_admin_bootstrap used to be a bare, unsigned "1" — a raw HTTP client could send
// that literal cookie value and reach ownerBootstrapAccess() (super_admin capabilities) without
// ever knowing ADMIN_PASSWORD, because nothing re-verified the cookie against anything. Every
// other admin identity path (real per-person staff login) is safe because
// requireSalesWorkspaceAccess() independently re-verifies the operator-email/auth-user-id cookies
// against real Supabase Auth + roster on every request — bootstrap has no such identity to
// re-check against, so the session token itself must now carry its own proof.
//
// Fix: leonix_admin_bootstrap's value is now a signed, expiring token —
// "<issuedAtMs>.<expiresAtMs>.<hmacSha256Hex>" — computed with ADMIN_BOOTSTRAP_SESSION_SECRET, a
// dedicated server-only secret (never ADMIN_PASSWORD itself, so a signing-key leak and a
// password leak are independent failures). isAdminBootstrapSession() is confirmed by a
// repository-wide grep to be the ONLY place that ever reads this cookie — every caller
// (adminAuthBoundary.ts, leonixAdminGate.ts's re-export, businessWorkspaceAccess.ts) goes through
// it, so hardening this one function closes the gap everywhere at once. leonix_admin itself is
// intentionally left as a coarse "an admin session exists" marker — it spans both /admin/** pages
// and /api/admin/** routes (no single path prefix narrower than "/" covers both, so it cannot be
// path-scoped without breaking one of them), and it was never the actual authority boundary for
// bootstrap or for real staff (both re-verify identity downstream); signing it too would touch 6+
// unrelated admin domains (viajes/empleos/magazine/executive-hub raw cookie checks) for no
// additional security benefit.
//
// Fails closed: with ADMIN_BOOTSTRAP_SESSION_SECRET unset, no bootstrap session can be created OR
// verified — bootstrap becomes entirely unavailable rather than falling back to the old bare "1"
// behavior.
// =====================================================================================================

/** Shorter-lived than the 7-day staff session — bootstrap is emergency/owner-only access, not a daily-use identity. */
const ADMIN_BOOTSTRAP_SESSION_MAX_AGE_SEC = 60 * 60 * 12;

function getBootstrapSessionSecret(): string | null {
  const key = process.env.ADMIN_BOOTSTRAP_SESSION_SECRET?.trim();
  return key ? key : null;
}

function signBootstrapPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Creates a signed, expiring bootstrap session token. Returns null (fail closed — no bootstrap
 * session can be created) when ADMIN_BOOTSTRAP_SESSION_SECRET is not configured. `issuedAtMs`/
 * `expiresAtMs` overrides exist only so regression tests can construct an already-expired or
 * not-yet-valid token against the real signing implementation, rather than reimplementing it —
 * production callers (applyLeonixAdminSessionCookies) never pass them.
 */
export function createBootstrapSessionToken(issuedAtMs?: number, expiresAtMs?: number): string | null {
  const secret = getBootstrapSessionSecret();
  if (!secret) return null;
  const issuedAt = issuedAtMs ?? Date.now();
  const expiresAt = expiresAtMs ?? issuedAt + ADMIN_BOOTSTRAP_SESSION_MAX_AGE_SEC * 1000;
  const payload = `${issuedAt}.${expiresAt}`;
  return `${payload}.${signBootstrapPayload(payload, secret)}`;
}

export function getAdminOperatorEmailFromCookies(cookies: CookieStore): string | null {
  const raw = cookies.get(LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE)?.value;
  const email = (raw ?? "").trim().toLowerCase();
  return email.includes("@") ? email : null;
}

export function getAdminAuthUserIdFromCookies(cookies: CookieStore): string | null {
  const raw = cookies.get(LEONIX_ADMIN_AUTH_USER_ID_COOKIE)?.value;
  const id = (raw ?? "").trim();
  return id.length >= 32 ? id : null;
}

export type AdminSessionCookieOptions = {
  path?: string;
  maxAge?: number;
};

/**
 * Verifies the bootstrap session token's signature and expiry. Fails closed (returns false) when
 * ADMIN_BOOTSTRAP_SESSION_SECRET is not configured, the cookie is missing/malformed, the
 * signature does not match (constant-time compare — never a plain === on attacker-controlled
 * input), or the token has expired or claims to be issued in the future. A forged legacy "1", or
 * any value without a valid signature over its own exact issuedAt/expiresAt pair, can never verify.
 */
export function isAdminBootstrapSession(cookies: CookieStore): boolean {
  const secret = getBootstrapSessionSecret();
  if (!secret) return false;
  const raw = cookies.get(LEONIX_ADMIN_BOOTSTRAP_COOKIE)?.value;
  if (!raw) return false;
  const parts = raw.split(".");
  if (parts.length !== 3) return false;
  const [issuedAtStr, expiresAtStr, signature] = parts;
  const issuedAt = Number(issuedAtStr);
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return false;
  if (issuedAt > Date.now()) return false;
  if (expiresAt <= Date.now()) return false;
  const expectedSignature = signBootstrapPayload(`${issuedAtStr}.${expiresAtStr}`, secret);
  return safeEqualHex(signature, expectedSignature);
}

export type ApplyBootstrapSessionResult = { ok: true } | { ok: false; reason: "bootstrap_secret_not_configured" };

export function applyLeonixAdminSessionCookies(
  res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } },
  opts: { operatorEmail?: string | null; authUserId?: string | null; bootstrap?: boolean },
  cookieOpts: AdminSessionCookieOptions = {},
): ApplyBootstrapSessionResult {
  const path = cookieOpts.path ?? "/";
  const maxAge = cookieOpts.maxAge ?? ADMIN_SESSION_MAX_AGE_SEC;
  // Secure is skipped only in local (non-production) dev, where the app is served over plain
  // http://localhost; every deployed environment (Preview and Production alike) runs with
  // NODE_ENV=production and is HTTPS-only on Vercel.
  const secure = process.env.NODE_ENV === "production";
  const base = { path, httpOnly: true, sameSite: "strict" as const, secure, maxAge };

  res.cookies.set(LEONIX_ADMIN_COOKIE, "1", base);

  if (opts.bootstrap) {
    const token = createBootstrapSessionToken();
    if (!token) {
      // Fail closed: never issue a bootstrap session under any cookie name without a valid
      // signed token — clear anything that might already be set instead of leaving a stray
      // leonix_admin=1 cookie behind with no matching bootstrap proof.
      res.cookies.set(LEONIX_ADMIN_COOKIE, "", { ...base, maxAge: 0 });
      res.cookies.set(LEONIX_ADMIN_BOOTSTRAP_COOKIE, "", { ...base, maxAge: 0 });
      return { ok: false, reason: "bootstrap_secret_not_configured" };
    }
    res.cookies.set(LEONIX_ADMIN_BOOTSTRAP_COOKIE, token, { ...base, maxAge: ADMIN_BOOTSTRAP_SESSION_MAX_AGE_SEC });
    res.cookies.set(LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE, "", { ...base, maxAge: 0 });
    res.cookies.set(LEONIX_ADMIN_AUTH_USER_ID_COOKIE, "", { ...base, maxAge: 0 });
    return { ok: true };
  }

  res.cookies.set(LEONIX_ADMIN_BOOTSTRAP_COOKIE, "", { ...base, maxAge: 0 });

  if (opts.operatorEmail) {
    res.cookies.set(LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE, opts.operatorEmail.trim().toLowerCase(), base);
  }
  if (opts.authUserId) {
    res.cookies.set(LEONIX_ADMIN_AUTH_USER_ID_COOKIE, opts.authUserId, base);
  }
  return { ok: true };
}

export function clearLeonixAdminSessionCookies(
  res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } },
) {
  const secure = process.env.NODE_ENV === "production";
  const expired = { path: "/", httpOnly: true, sameSite: "strict" as const, secure, maxAge: 0 };
  res.cookies.set(LEONIX_ADMIN_COOKIE, "", expired);
  res.cookies.set(LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE, "", expired);
  res.cookies.set(LEONIX_ADMIN_AUTH_USER_ID_COOKIE, "", expired);
  // A logged-out bootstrap token can never re-verify anyway (blank string fails the 3-part split
  // check), but clearing it explicitly still removes it from the browser/cookie jar on logout.
  res.cookies.set(LEONIX_ADMIN_BOOTSTRAP_COOKIE, "", expired);
}

export function resolveLeonixSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "http://127.0.0.1:3000";
}

export type AdminCredentialVerifyResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; code: "invalid_credentials" | "config" | "auth_error"; message: string };

/** Verify email/password against Supabase Auth (server-only anon client). */
export async function verifyAdminSupabaseCredentials(
  email: string,
  password: string,
): Promise<AdminCredentialVerifyResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@") || !password) {
    return { ok: false, code: "invalid_credentials", message: "Invalid email or password." };
  }

  try {
    const supabase = getServerSupabaseAnon();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });

    if (error || !data.user?.id) {
      return { ok: false, code: "invalid_credentials", message: "Invalid email or password." };
    }

    return { ok: true, userId: data.user.id, email: normalized };
  } catch (e) {
    return {
      ok: false,
      code: "config",
      message: (e as { message?: string })?.message ?? "Supabase Auth is not configured.",
    };
  }
}

export type RosterLookupResult =
  | { ok: true; rosterMemberId: string; role: string; displayName: string | null; email: string; isActive: true }
  | { ok: false; code: "not_in_roster" | "inactive" | "db_error" };

/** Active admin_team_members row required for email-based admin login. */
export async function lookupActiveAdminRosterByEmail(email: string): Promise<RosterLookupResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "db_error" };
  }

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("admin_team_members")
      .select("id, email, display_name, role, is_active")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error || !data) {
      return { ok: false, code: "not_in_roster" };
    }

    if (!(data as { is_active?: boolean }).is_active) {
      return { ok: false, code: "inactive" };
    }

    return {
      ok: true,
      rosterMemberId: String((data as { id: string }).id),
      role: String((data as { role?: string }).role ?? ""),
      displayName:
        (data as { display_name?: string | null }).display_name != null
          ? String((data as { display_name: string }).display_name)
          : null,
      email: String((data as { email: string }).email),
      isActive: true,
    };
  } catch {
    return { ok: false, code: "db_error" };
  }
}

/**
 * Gate BCO-4A.7 — active admin_team_members row required for Sales Workspace access, resolved by
 * the roster row's own `auth_user_id` column, never by email. A roster row whose `auth_user_id`
 * is NULL (e.g. an invited-but-not-yet-Auth-linked row created via the legacy "roster row only"
 * form at /admin/team/roster) can never match `.eq("auth_user_id", authUserId)` — no special-case
 * NULL handling is required, the query itself is fail-closed by construction.
 */
export async function lookupActiveAdminRosterByAuthUserId(authUserId: string): Promise<RosterLookupResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "db_error" };
  }

  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("admin_team_members")
      .select("id, email, display_name, role, is_active, auth_user_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (error || !data) {
      return { ok: false, code: "not_in_roster" };
    }

    if (!(data as { is_active?: boolean }).is_active) {
      return { ok: false, code: "inactive" };
    }

    return {
      ok: true,
      rosterMemberId: String((data as { id: string }).id),
      role: String((data as { role?: string }).role ?? ""),
      displayName:
        (data as { display_name?: string | null }).display_name != null
          ? String((data as { display_name: string }).display_name)
          : null,
      email: String((data as { email: string }).email),
      isActive: true,
    };
  } catch {
    return { ok: false, code: "db_error" };
  }
}

export type AuthUserLookupResult = { ok: true; id: string; email: string } | { ok: false };

/**
 * Gate BCO-4A.7 — confirms an `auth_user_id` cookie value corresponds to a REAL, currently
 * existing Supabase Auth user, via the Admin API (service-role only — never callable from the
 * browser). A syntactically valid but non-existent or forged UUID is rejected here, before any
 * roster lookup runs, closing the gap where a placeholder UUID paired with a real roster email
 * was previously enough to pass authorization.
 */
export async function lookupAuthUserById(authUserId: string): Promise<AuthUserLookupResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false };
  }
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.auth.admin.getUserById(authUserId);
    if (error || !data?.user?.email) {
      return { ok: false };
    }
    return { ok: true, id: data.user.id, email: data.user.email.trim().toLowerCase() };
  } catch {
    return { ok: false };
  }
}
