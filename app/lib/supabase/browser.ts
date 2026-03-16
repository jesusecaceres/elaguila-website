// lib/supabase/browser.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Auth timeout (ms) for session/user checks. Prevents indefinite hang when auth is unavailable (e.g. 522). */
export const AUTH_CHECK_TIMEOUT_MS = 6000;

/** Races promise with a timeout. Rejects with a timeout error after ms. */
export function withAuthTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error("auth_timeout")), ms)
    ),
  ]);
}

export function createSupabaseBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
