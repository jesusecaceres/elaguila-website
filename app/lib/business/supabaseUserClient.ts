import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Isolated to app/lib/business — deliberately NOT added to the shared app/lib/supabase/server.ts
 * (locked file per Package BCO-2 scope). The repo has no existing user-scoped RLS client helper
 * (confirmed: no @supabase/ssr dependency, no getServerSupabaseForUser precedent) — the closest
 * convention is app/api/_lib/bearerUser.ts, which builds an anon client per-request from a bearer
 * token purely to resolve `sb.auth.getUser(token)`. This does the same thing but keeps the client
 * around so RLS-scoped reads/writes (business_onboarding_drafts, and the finalize RPC) run as the
 * authenticated user via Postgres RLS / auth.uid() — never via the service-role client, and never
 * by trusting a client-supplied user id.
 */
export function getServerSupabaseForBearerToken(bearerToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing Supabase public read config: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
  }
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${bearerToken}` } },
  });
}

export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader?.startsWith("Bearer ")) return null;
  const token = authorizationHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

/** Resolves the authenticated user id from a bearer token, or null. Never trusts a client-supplied id. */
export async function resolveAuthenticatedUserId(bearerToken: string): Promise<string | null> {
  const supabase = getServerSupabaseForBearerToken(bearerToken);
  const { data, error } = await supabase.auth.getUser(bearerToken);
  if (error || !data.user) return null;
  return data.user.id;
}
