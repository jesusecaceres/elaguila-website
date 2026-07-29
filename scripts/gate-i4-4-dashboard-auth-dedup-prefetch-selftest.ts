/**
 * Gate I.4.4 — behavioral self-test for the global dashboard auth deduplication and per-listing
 * action-link prefetch control. `LeonixDashboardShell.tsx` and `DashboardListingActionBar.tsx`
 * are React components with no natural pure-function extraction point for this change (a prop
 * default/conditional and a single JSX prop) — consistent with this repo's own established
 * fallback convention for exactly this situation, this test reads the real, committed source of
 * each changed file and asserts on its actual structure, rather than re-rendering React (no
 * React Testing Library/jsdom harness exists in this project's plain-`tsx` self-test convention).
 * No network, no Supabase, no browser. Run from repo root:
 *   npx tsx scripts/gate-i4-4-dashboard-auth-dedup-prefetch-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..");
const shellSrc = readFileSync(
  join(REPO_ROOT, "app", "(site)", "dashboard", "components", "LeonixDashboardShell.tsx"),
  "utf8",
);
const actionBarSrc = readFileSync(
  join(REPO_ROOT, "app", "(site)", "dashboard", "components", "DashboardListingActionBar.tsx"),
  "utf8",
);
const misAnunciosSrc = readFileSync(
  join(REPO_ROOT, "app", "(site)", "dashboard", "mis-anuncios", "page.tsx"),
  "utf8",
);

/* ------------------------------------------------------------------------------------------ *
 * Auth deduplication
 * ------------------------------------------------------------------------------------------ */

// 1 — the dashboard page still resolves an authenticated owner itself (unchanged primary path).
assert.match(misAnunciosSrc, /await supabase\.auth\.getUser\(\)/, "mis-anuncios/page.tsx must still resolve the authenticated owner via getUser()");

// 2 — the shell accepts a trusted owner id as an optional prop.
assert.match(shellSrc, /ownerId\?\s*:\s*string \| null/, "the shell must declare an optional `ownerId` prop");
assert.match(shellSrc, /ownerId\s*=\s*null,/, "the shell's `ownerId` prop must default to null (backward compatible for every other caller)");

// 3 — the shell's own getUser() call is now conditional on ownerId being absent, not unconditional.
assert.doesNotMatch(
  shellSrc,
  /useEffect\(\(\) => \{\s*let cancelled = false;\s*async function run\(\) \{\s*try \{\s*const sb = createSupabaseBrowserClient\(\);\s*const \{\s*data: \{ user \},\s*\} = await sb\.auth\.getUser\(\);/,
  "the shell must no longer call getUser() unconditionally as the very first step of its effect",
);
assert.match(
  shellSrc,
  /if \(!resolvedOwnerId\) \{\s*const \{\s*data: \{ user \},\s*\} = await sb\.auth\.getUser\(\);/,
  "the shell's getUser() call must be gated behind `if (!resolvedOwnerId)`",
);

// 4 — nav counts still receive a real owner id (whichever source resolved it).
assert.match(shellSrc, /fetchDashboardNavCounts\(sb, resolvedOwnerId\)/, "nav counts must still be fetched using a resolved owner id");

// 5 — missing/unresolved owner id fails safely (no nav-count fetch attempted).
assert.match(shellSrc, /if \(!resolvedOwnerId \|\| cancelled\) return;/, "an unresolved owner id must short-circuit before any nav-count fetch");

// 6 — owner identity is never sourced from a URL/query/localStorage value anywhere in the shell
// (checking actual code usage, not the word appearing in an explanatory comment).
for (const forbidden of [/\bsearchParams\b/, /window\.location/, /localStorage\s*[.[]/]) {
  assert.doesNotMatch(shellSrc, forbidden, `the shell must never read owner identity from ${forbidden}`);
}

// 7 — the entitlement bearer-token flow is untouched.
assert.match(misAnunciosSrc, /await supabase\.auth\.getSession\(\)/, "the entitlement bearer-token getSession() call must remain present and untouched");

// 8 — unauthenticated redirect behavior is untouched.
assert.match(
  misAnunciosSrc,
  /router\.replace\(`\/login\?redirect=\$\{redirect\}`\)/,
  "the unauthenticated-user redirect to /login must remain unchanged",
);

// mis-anuncios/page.tsx actually wires the trusted id through to the shell.
assert.match(misAnunciosSrc, /<LeonixDashboardShell[\s\S]*?ownerId=\{userId\}/, "mis-anuncios/page.tsx must pass its own verified userId to the shell");

/* ------------------------------------------------------------------------------------------ *
 * Prefetch control
 * ------------------------------------------------------------------------------------------ */

// 1/2/3 — the action-bar Link keeps its href contract, stays a next/link <Link> (real client
// navigation on click), and now disables automatic prefetch.
assert.match(actionBarSrc, /import Link from "next\/link";/, "the action bar must still use next/link's <Link>, not a plain <a>");
assert.match(actionBarSrc, /href=\{action\.href\}/, "the action Link's href contract must remain exactly `action.href`");
assert.match(actionBarSrc, /prefetch=\{false\}/, "the per-listing action Link must disable automatic prefetch");

// Only one <Link> render site exists in the action bar (the whole `actions.map` renders through
// this single branch) — every current and future action item automatically inherits
// prefetch={false} with no per-action-type branching required.
const linkOccurrences = (actionBarSrc.match(/<Link\b/g) ?? []).length;
assert.equal(linkOccurrences, 1, "the action bar must render exactly one <Link> call site so every action item inherits the same prefetch behavior automatically");

// 5 — the non-link (button) action branch is untouched by this change.
assert.match(actionBarSrc, /<button\s*\n\s*key=\{action\.label\}/, "the button-action branch must remain unchanged");

// 4 — primary shell navigation (sidebar nav items, publish CTA) is NOT globally prefetch-disabled
// — this change is scoped to the per-listing action bar only.
const shellLinkBlocks = shellSrc.match(/<Link\b[\s\S]*?<\/Link>/g) ?? [];
assert.ok(shellLinkBlocks.length >= 2, "the shell must still render its primary nav/publish <Link> elements");
for (const block of shellLinkBlocks) {
  assert.doesNotMatch(block, /prefetch=\{false\}/, "primary shell navigation links must not have prefetch disabled by this gate");
}

console.log(`gate-i4-4-dashboard-auth-dedup-prefetch-selftest: OK`);
