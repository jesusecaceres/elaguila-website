/**
 * `@supabase/supabase-js`, reduced to the one thing the routes use it for directly:
 * `createClient(url, anonKey).auth.getUser(token)`, which is how a bearer token becomes an
 * identity. The harness maps tokens to user ids so a test can present a real caller, a forged
 * one, or none at all — and so an IDOR that reads identity from a query parameter instead of the
 * token fails a test rather than a reading.
 */
const tokens = new Map();

/**
 * A token maps to a user. The value may be a plain user id (the common case) or a full user
 * object, which is what the VERIFIED-identity gates read: `getVerifiedBearerUser` needs `email`
 * and `email_confirmed_at`, and a stub that returned only an id could never carry a checkout past
 * `emailVerified`. That is why the verified-intro discount path had no executed coverage at all.
 */
export function __setBearerTokens(map) {
  tokens.clear();
  for (const [token, value] of Object.entries(map ?? {})) {
    tokens.set(token, typeof value === "string" ? { id: value } : { ...value });
  }
}

export function createClient() {
  return {
    auth: {
      async getUser(token) {
        const user = tokens.get(token);
        if (!user) return { data: { user: null }, error: { message: "invalid token" } };
        return { data: { user: { ...user } }, error: null };
      },
    },
  };
}
