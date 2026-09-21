/**
 * LEONIX IX REWARDS — module hooks that let a test EXECUTE a Next.js route handler.
 *
 * WHY THIS EXISTS
 * ---------------
 * An independent reviewer reintroduced fourteen money and authorization defects into the HTTP
 * layer — an inert admin auth gate, an unauthenticated wallet IDOR, a doubled discount charged to
 * Stripe, a quadrupled redemption ceiling, a queue claim whose compare-and-set result was ignored
 * — and every one of them survived the whole behavioural suite, because that suite read the route
 * files as TEXT. It also showed the reverse: nine pure renames and reformats, with identical
 * behaviour, turned checks RED. A test that fails for a rename and passes for a hole is measuring
 * spelling.
 *
 * The routes could not be executed because they import `server-only`, `next/headers` and the
 * Supabase admin client, none of which exist outside a Next.js server. These hooks replace exactly
 * those three specifiers — and nothing else — with stubs the test controls. Everything else,
 * including every module under test, is loaded normally.
 *
 * Registered through `--import ./scripts/lib/routeHarnessRegister.mjs`, so it can never affect an
 * ordinary run of the application.
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const stub = (name) => pathToFileURL(resolvePath(here, "stubs", name)).href;

const REDIRECTS = new Map([
  ["server-only", stub("serverOnly.mjs")],
  ["next/headers", stub("nextHeaders.mjs")],
  ["@/app/lib/supabase/server", stub("supabaseServer.mjs")],
  ["@supabase/supabase-js", stub("supabaseJs.mjs")],
]);

export async function resolve(specifier, context, nextResolve) {
  if (process.env.LEONIX_HARNESS_DEBUG) console.error('[hook]', specifier);
  const target = REDIRECTS.get(specifier);
  if (target) return { url: target, shortCircuit: true, format: "module" };
  return nextResolve(specifier, context);
}
