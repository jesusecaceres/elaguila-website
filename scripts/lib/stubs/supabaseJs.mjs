/**
 * `@supabase/supabase-js`, reduced to the one thing the routes use it for directly:
 * `createClient(url, anonKey).auth.getUser(token)`, which is how a bearer token becomes an
 * identity. The harness maps tokens to user ids so a test can present a real caller, a forged
 * one, or none at all — and so an IDOR that reads identity from a query parameter instead of the
 * token fails a test rather than a reading.
 *
 * `rpc` is the caller-scoped accept_business_ownership_claim path. Tests set the result with
 * `__setBearerRpc` so a successful claim can still fail later on listing transfer.
 */
const tokens = new Map();
let rpcResult = { data: null, error: { message: "harness: no bearer rpc" } };

export function __setBearerTokens(map) {
  tokens.clear();
  for (const [token, value] of Object.entries(map ?? {})) {
    tokens.set(token, typeof value === "string" ? { id: value } : { ...value });
  }
}

export function __setBearerRpc(result) {
  rpcResult = result ?? { data: null, error: { message: "harness: no bearer rpc" } };
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
    async rpc() {
      return rpcResult;
    },
  };
}
