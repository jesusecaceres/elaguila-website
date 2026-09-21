/**
 * The controls the route harness uses to drive its stubs, behind ONE typed door.
 *
 * `scripts/lib/tsconfig.harness.json` redirects `@/app/lib/supabase/server`, `next/headers` and
 * `@supabase/supabase-js` onto stub modules at RUN time. The repository's own `tsc` run resolves
 * those same specifiers to the real modules, which do not export `__seed` or `__setCookies` — so
 * importing the controls directly would make the whole-project typecheck fail on a file that is
 * perfectly correct when it runs.
 *
 * Casting once, here, keeps that seam in a single place with the shapes written down, instead of
 * scattering `as unknown as` through the tests.
 */
import * as supabaseModule from "@/app/lib/supabase/server";
import * as nextHeadersModule from "next/headers";
import * as supabaseJsModule from "@supabase/supabase-js";
import * as stripeModule from "stripe";

type SupabaseHarness = {
  __reset(): void;
  __seed(table: string, rows: Record<string, unknown>[]): void;
  __rows(table: string): Record<string, unknown>[];
  __rpcCalls(fn?: string): { fn: string; params: Record<string, unknown> }[];
  __onRpc(handler: (fn: string, params: Record<string, unknown>) => unknown): void;
  __setAuthUsers(users: { id: string; email: string }[]): void;
  __failReadsOn(table?: string, selector?: { requires?: string[]; excludes?: string[] }): void;
};

type HeadersHarness = { __setCookies(entries: Record<string, string>): void };
/**
 * A bearer token maps to a user id, or to a full user object when a check needs the VERIFIED
 * identity fields (`email`, `email_confirmed_at`) that the intro-discount gates read off the
 * token. The union is deliberate: every existing caller keeps passing a plain id.
 */
type HarnessBearerUser = string | { id: string; email?: string | null; email_confirmed_at?: string | null };
type SupabaseJsHarness = { __setBearerTokens(map: Record<string, HarnessBearerUser>): void };
type StripeHarness = {
  __stripeSessions(): Record<string, unknown>[];
  __resetStripe(): void;
  __stripeCoupons(): Record<string, unknown>[];
  __seedCoupon(coupon: Record<string, unknown>): void;
  __failCouponCreate(error?: unknown): void;
};
/** The stub's own client, reached through THIS module so it is the same instance the routes use. */
type ClientHarness = { getAdminSupabase(): { from(table: string): Record<string, (...args: unknown[]) => unknown> } };


const supabase = supabaseModule as unknown as SupabaseHarness;
const nextHeaders = nextHeadersModule as unknown as HeadersHarness;
const supabaseJs = supabaseJsModule as unknown as SupabaseJsHarness;
const stripe = stripeModule as unknown as StripeHarness;

export const __reset = supabase.__reset;
export const __seed = supabase.__seed;
export const __rows = supabase.__rows;
export const __rpcCalls = supabase.__rpcCalls;
export const __onRpc = supabase.__onRpc;
export const __setAuthUsers = supabase.__setAuthUsers;
export const __failReadsOn = supabase.__failReadsOn;
export const getHarnessClient = (supabaseModule as unknown as ClientHarness).getAdminSupabase;
export const __setCookies = nextHeaders.__setCookies;
export const __setBearerTokens = supabaseJs.__setBearerTokens;
export const __stripeSessions = stripe.__stripeSessions;
export const __resetStripe = stripe.__resetStripe;
export const __stripeCoupons = stripe.__stripeCoupons;
export const __seedCoupon = stripe.__seedCoupon;
export const __failCouponCreate = stripe.__failCouponCreate;
