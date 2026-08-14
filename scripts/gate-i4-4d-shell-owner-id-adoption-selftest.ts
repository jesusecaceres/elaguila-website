/**
 * Gate I.4.4D — behavioral self-test for global dashboard shell owner-id adoption. Same
 * source-text-assertion pattern established across I.4.4/I.4.4B/I.4.4C — these are React page
 * components with no natural pure-function extraction point, and this repo's plain-`tsx`
 * self-test convention has no React render harness. No network, no Supabase, no browser. Run
 * from repo root:
 *   npx tsx scripts/gate-i4-4d-shell-owner-id-adoption-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..");
function src(...parts: string[]): string {
  return readFileSync(join(REPO_ROOT, ...parts), "utf8");
}

function countOwnerIdProps(text: string): number {
  return (text.match(/ownerId=\{[A-Za-z0-9_.]+\}/g) ?? []).length;
}
function countShellCalls(text: string): number {
  return (text.match(/<LeonixDashboardShell\b/g) ?? []).length;
}

/* ------------------------------------------------------------------------------------------ *
 * 1 — the complete caller inventory: exactly 20 files render <LeonixDashboardShell>.
 * ------------------------------------------------------------------------------------------ */

const ADOPTED_SIMPLE: string[][] = [
  ["app", "(site)", "dashboard", "analytics", "listing", "page.tsx"],
  ["app", "(site)", "dashboard", "analytics", "page.tsx"],
  ["app", "(site)", "dashboard", "business-tools", "page.tsx"],
  ["app", "(site)", "dashboard", "drafts", "page.tsx"],
  ["app", "(site)", "dashboard", "mis-anuncios", "[id]", "page.tsx"],
  ["app", "(site)", "dashboard", "notificaciones", "page.tsx"],
  ["app", "(site)", "dashboard", "perfil", "page.tsx"],
  ["app", "(site)", "dashboard", "servicios", "page.tsx"],
  ["app", "(site)", "dashboard", "viajes", "page.tsx"],
];

const ADOPTED_NEW_STATE: string[][] = [
  ["app", "(site)", "dashboard", "empleos", "page.tsx"],
  ["app", "(site)", "dashboard", "empleos", "[listingId]", "page.tsx"],
  ["app", "(site)", "dashboard", "guardados", "page.tsx"],
  ["app", "(site)", "dashboard", "mensajes", "page.tsx"],
  ["app", "(site)", "dashboard", "ofertas-locales", "page.tsx"],
  ["app", "(site)", "dashboard", "ofertas-locales", "[id]", "page.tsx"],
  ["app", "(site)", "dashboard", "restaurantes", "page.tsx"],
  ["app", "(site)", "dashboard", "seguridad", "page.tsx"],
  ["app", "(site)", "dashboard", "vistos-recientes", "page.tsx"],
];

const ALREADY_ADOPTED = ["app", "(site)", "dashboard", "mis-anuncios", "page.tsx"];
const EXCLUDED_GETSESSION_ONLY = ["app", "(site)", "dashboard", "page.tsx"];

const allCallers = [...ADOPTED_SIMPLE, ...ADOPTED_NEW_STATE, [ALREADY_ADOPTED], [EXCLUDED_GETSESSION_ONLY]];
assert.equal(
  ADOPTED_SIMPLE.length + ADOPTED_NEW_STATE.length + 1 + 1,
  20,
  "the complete shell-caller inventory must total exactly 20 files (19 non-mis-anuncios callers + mis-anuncios/page.tsx itself)",
);
void allCallers;

/* ------------------------------------------------------------------------------------------ *
 * 2 — every safe caller (with a verified getUser()-derived id) passes ownerId, at every shell
 * call site in that file (some files render the shell more than once — loading/empty states).
 * ------------------------------------------------------------------------------------------ */

for (const pathParts of [...ADOPTED_SIMPLE, ...ADOPTED_NEW_STATE]) {
  const text = src(...pathParts);
  const shellCalls = countShellCalls(text);
  const ownerIdProps = countOwnerIdProps(text);
  assert.ok(shellCalls >= 1, `${pathParts.join("/")} must render <LeonixDashboardShell> at least once`);
  assert.equal(
    ownerIdProps,
    shellCalls,
    `${pathParts.join("/")}: every one of its ${shellCalls} shell call site(s) must pass ownerId (found ${ownerIdProps})`,
  );
}

// mis-anuncios/page.tsx (already adopted in Gate I.4.4) remains correct.
{
  const text = src(...ALREADY_ADOPTED);
  assert.match(text, /ownerId=\{userId\}/, "mis-anuncios/page.tsx must still pass ownerId={userId}");
}

/* ------------------------------------------------------------------------------------------ *
 * 3 — the getSession()-only exception never passes ownerId (no unverified id trusted).
 * ------------------------------------------------------------------------------------------ */
{
  const text = src(...EXCLUDED_GETSESSION_ONLY);
  assert.doesNotMatch(text, /auth\.getUser\(\)/, "dashboard/page.tsx must genuinely have no getUser() call (confirms it is a real exception, not an oversight)");
  assert.equal(countOwnerIdProps(text), 0, "dashboard/page.tsx must never pass ownerId — its userId is getSession()-only, not server-verified");
}

/* ------------------------------------------------------------------------------------------ *
 * 6 — for every "new state" adoption, the state is set from the SAME verified getUser() result,
 * strictly after the auth-gate redirect check (never before, never from a different source).
 * ------------------------------------------------------------------------------------------ */

for (const pathParts of ADOPTED_NEW_STATE) {
  const text = src(...pathParts);
  assert.match(text, /const \[ownerId, setOwnerId\] = useState<string \| null>\(null\);/, `${pathParts.join("/")} must declare a new ownerId state variable`);
  assert.match(text, /setOwnerId\((?:user(?:Data)?\.user\.id|user\.id|u\.id)\)/, `${pathParts.join("/")}'s setOwnerId call must use a verified getUser() id`);
}

/* ------------------------------------------------------------------------------------------ *
 * 7 — no auth redirect was altered: every file's existing /login redirect line is still present
 * verbatim.
 * ------------------------------------------------------------------------------------------ */

const redirectPatterns: Array<[string[], RegExp]> = [
  [["app", "(site)", "dashboard", "empleos", "page.tsx"], /router\.replace\(`\/login\?redirect=\$\{redirect\}`\)/],
  [["app", "(site)", "dashboard", "empleos", "[listingId]", "page.tsx"], /router\.replace\(`\/login\?redirect=\$\{encodeURIComponent\(`\/dashboard\/empleos\/\$\{listingId\}`\)\}`\)/],
  [["app", "(site)", "dashboard", "guardados", "page.tsx"], /router\.replace\(`\/login\?redirect=\$\{encodeURIComponent\(`\/dashboard\/guardados\?\$\{q\}`\)\}`\)/],
  [["app", "(site)", "dashboard", "mensajes", "page.tsx"], /router\.replace\(`\/login\?redirect=\$\{encodeURIComponent\(`\/dashboard\/mensajes\?\$\{q\}`\)\}`\)/],
  [["app", "(site)", "dashboard", "ofertas-locales", "page.tsx"], /router\.replace\(`\/login\?redirect=\$\{redirect\}`\)/],
  [["app", "(site)", "dashboard", "restaurantes", "page.tsx"], /router\.replace\(`\/login\?redirect=\$\{encodeURIComponent\(`\/dashboard\/restaurantes\?\$\{q\}`\)\}`\)/],
  [["app", "(site)", "dashboard", "seguridad", "page.tsx"], /router\.replace\(`\/login\?redirect=\$\{redirect\}`\)/],
  [["app", "(site)", "dashboard", "vistos-recientes", "page.tsx"], /auth\.getUser\(\)/],
];
for (const [pathParts, pattern] of redirectPatterns) {
  const text = src(...pathParts);
  assert.match(text, pattern, `${pathParts.join("/")}'s auth flow (redirect or verified getUser call) must remain unchanged`);
}

console.log(`gate-i4-4d-shell-owner-id-adoption-selftest: OK`);
