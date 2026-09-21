/**
 * `@supabase/supabase-js`, reduced to the one thing the routes use it for directly:
 * `createClient(url, anonKey).auth.getUser(token)`, which is how a bearer token becomes an
 * identity. The harness maps tokens to user ids so a test can present a real caller, a forged
 * one, or none at all — and so an IDOR that reads identity from a query parameter instead of the
 * token fails a test rather than a reading.
 */
const tokens = new Map();

export function __setBearerTokens(map) {
  tokens.clear();
  for (const [token, userId] of Object.entries(map ?? {})) tokens.set(token, userId);
}

export function createClient() {
  return {
    auth: {
      async getUser(token) {
        const userId = tokens.get(token);
        if (!userId) return { data: { user: null }, error: { message: "invalid token" } };
        return { data: { user: { id: userId } }, error: null };
      },
    },
  };
}
