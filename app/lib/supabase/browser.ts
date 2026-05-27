// lib/supabase/browser.ts
import {
  createClient,
  type Session,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

/** Single browser client to avoid multiple GoTrueClient instances (same storage key). */
let browserSingleton: SupabaseClient | null = null;

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

  const options = {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // OAuth/magic-link completion is handled explicitly in /auth/callback.
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  } as const;

  if (typeof window !== "undefined") {
    if (!browserSingleton) {
      browserSingleton = createClient(url, anonKey, options);
    }
    return browserSingleton;
  }

  // SSR / non-browser: ephemeral client (no shared storage).
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Waits for a browser session after OAuth code exchange or hash token handoff.
 * Prefers local `getSession()` (immediate) and listens for SIGNED_IN when needed.
 */
export async function waitForBrowserSession(
  supabase: SupabaseClient,
  timeoutMs: number
): Promise<{ session: Session | null; user: User | null }> {
  const read = async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session ?? null;
    return { session, user: session?.user ?? null };
  };

  const initial = await read();
  if (initial.user) return initial;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (session: Session | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
      resolve({ session, user: session?.user ?? null });
    };

    const timer = setTimeout(() => finish(null), timeoutMs);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session?.user
      ) {
        finish(session);
      }
    });

    void read().then(({ session, user }) => {
      if (user) finish(session);
    });
  });
}

/**
 * Resolved auth user for client engagement (likes/saves).
 * Prefer `getSession()` (local session, same source the shell uses immediately); then
 * `getUser()` with timeout like {@link ServiciosTopBar} so we do not treat slow validation as logged-out.
 */
export async function getBrowserAuthUserForEngagement(): Promise<User | null> {
  if (typeof window === "undefined") return null;
  const sb = createSupabaseBrowserClient();
  const { data: sessionData } = await sb.auth.getSession();
  const fromSession = sessionData.session?.user ?? null;
  if (fromSession) return fromSession;
  try {
    const { data } = await withAuthTimeout(sb.auth.getUser(), AUTH_CHECK_TIMEOUT_MS);
    return data.user ?? null;
  } catch {
    return null;
  }
}
