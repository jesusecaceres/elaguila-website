import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function isSupabasePublicReadConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isSupabaseAdminConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Server-only anon client for RLS-gated public reads (e.g. published Comida Local rows).
 * Never use for owner/admin writes — service role or authenticated session required.
 */
export function getServerSupabaseAnon(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase public read config: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
    );
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Server-only. Creates a Supabase client with the service role key.
 * Never use this in client components or expose the key to the browser.
 */
export function getAdminSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin config: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export type CookieStore = { get: (name: string) => { value?: string } | undefined };

/**
 * Returns true if the leonix_admin cookie is set to "1". Intentionally a coarse "an admin
 * session exists" marker, not a security boundary by itself, and NOT signed (Staging Release
 * Blocker Hardening audit, see app/lib/supabase/adminSession.ts): it spans both /admin/** pages
 * and /api/admin/** routes, which share no path prefix narrower than "/", so it cannot be
 * cookie-path-scoped without breaking one of them, and several unrelated admin domains
 * (viajes/empleos/magazine/executive-hub) read it directly rather than through this function.
 * Real identity is always re-verified independently downstream of this check: staff sessions via
 * requireSalesWorkspaceAccess() (re-checks the operator-email/auth-user-id cookies against live
 * Supabase Auth + roster on every request) and bootstrap sessions via the signed, expiring token
 * in isAdminBootstrapSession() (app/lib/supabase/adminSession.ts) — that is the actual authority
 * boundary that was hardened, since bootstrap has no downstream identity to re-check against.
 */
export function requireAdminCookie(cookies: CookieStore): boolean {
  return cookies.get("leonix_admin")?.value === "1";
}
