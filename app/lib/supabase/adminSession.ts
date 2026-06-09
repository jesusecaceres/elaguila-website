import "server-only";

import type { CookieStore } from "@/app/lib/supabase/server";
import { getAdminSupabase, getServerSupabaseAnon, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

/** HTTP-only admin session cookies (STAFF-ADMIN-02). */
export const LEONIX_ADMIN_COOKIE = "leonix_admin";
export const LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE = "leonix_admin_operator_email";
export const LEONIX_ADMIN_AUTH_USER_ID_COOKIE = "leonix_admin_auth_user_id";
export const LEONIX_ADMIN_BOOTSTRAP_COOKIE = "leonix_admin_bootstrap";

const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

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

export function isAdminBootstrapSession(cookies: CookieStore): boolean {
  return cookies.get(LEONIX_ADMIN_BOOTSTRAP_COOKIE)?.value === "1";
}

export function applyLeonixAdminSessionCookies(
  res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } },
  opts: { operatorEmail?: string | null; authUserId?: string | null; bootstrap?: boolean },
  cookieOpts: AdminSessionCookieOptions = {},
) {
  const path = cookieOpts.path ?? "/";
  const maxAge = cookieOpts.maxAge ?? ADMIN_SESSION_MAX_AGE_SEC;
  const base = { path, httpOnly: true, sameSite: "lax" as const, maxAge };

  res.cookies.set(LEONIX_ADMIN_COOKIE, "1", base);

  if (opts.bootstrap) {
    res.cookies.set(LEONIX_ADMIN_BOOTSTRAP_COOKIE, "1", base);
    res.cookies.set(LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE, "", { ...base, maxAge: 0 });
    res.cookies.set(LEONIX_ADMIN_AUTH_USER_ID_COOKIE, "", { ...base, maxAge: 0 });
    return;
  }

  res.cookies.set(LEONIX_ADMIN_BOOTSTRAP_COOKIE, "", { ...base, maxAge: 0 });

  if (opts.operatorEmail) {
    res.cookies.set(LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE, opts.operatorEmail.trim().toLowerCase(), base);
  }
  if (opts.authUserId) {
    res.cookies.set(LEONIX_ADMIN_AUTH_USER_ID_COOKIE, opts.authUserId, base);
  }
}

export function clearLeonixAdminSessionCookies(
  res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } },
) {
  const expired = { path: "/", httpOnly: true, sameSite: "lax" as const, maxAge: 0 };
  res.cookies.set(LEONIX_ADMIN_COOKIE, "", expired);
  res.cookies.set(LEONIX_ADMIN_OPERATOR_EMAIL_COOKIE, "", expired);
  res.cookies.set(LEONIX_ADMIN_AUTH_USER_ID_COOKIE, "", expired);
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
  | { ok: true; rosterMemberId: string; role: string; displayName: string | null; isActive: true }
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
      isActive: true,
    };
  } catch {
    return { ok: false, code: "db_error" };
  }
}
