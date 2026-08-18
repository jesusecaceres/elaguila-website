import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

export type VerifiedBearerUser = {
  id: string;
  email: string | null;
  emailConfirmedAt: string | null;
};

/**
 * Package C Build 2 (C4) — like getBearerUserId (bearerUser.ts), but also returns the
 * authenticated email and its confirmation timestamp for verified-discount eligibility gates.
 * Additive: does not change getBearerUserId's contract or its callers. Field shape confirmed
 * against app/lib/auth/dashboardPasswordMode.ts, which already reads `email_confirmed_at` from
 * the same Supabase `User` object in a client/dashboard context.
 */
export async function getVerifiedBearerUser(req: NextRequest): Promise<VerifiedBearerUser | null> {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    emailConfirmedAt: data.user.email_confirmed_at ?? null,
  };
}
