/**
 * Saved Search 03 — Autos Save Search UI + owner management verifier.
 * Run: npx tsx scripts/verify-saved-search-autos-03.ts
 *
 * A. Results CTA reuses the Saved Search 02 adapter/contract, no parallel builder
 * B. Duplicate/reactivation state is server-authoritative
 * C. Owner management surface calls the existing API, never queries the table directly
 * D. Return-to-results URL reuses the canonical Autos browse contract
 * E. ES/EN copy parity
 * F. No forbidden scope (email/SMS/push/notification/outbox/cron/publish-hook)
 */
import fs from "node:fs";
import path from "node:path";
import { strict as assert } from "node:assert";

import { buildAutosSavedSearchResultsUrl } from "../app/lib/saved-search/autos/autosSavedSearchResultsUrl";
import { describeAutosSavedSearchFacets } from "../app/lib/saved-search/autos/savedSearchAutosAdapter";
import type { SavedSearchNormalizedInput } from "../app/lib/saved-search/savedSearchTypes";

const root = process.cwd();
const failures: string[] = [];

async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function stripJsComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

async function main() {
const buttonSrc = read("app/(site)/clasificados/autos/components/public/AutosSaveSearchButton.tsx");
const shellSrc = read("app/(site)/clasificados/autos/components/public/AutosPublicResultsShell.tsx");
const clientSrc = read("app/lib/saved-search/savedSearchClient.ts");
const urlBuilderSrc = read("app/lib/saved-search/autos/autosSavedSearchResultsUrl.ts");
const dashboardPageSrc = read("app/(site)/dashboard/busquedas-guardadas/page.tsx");
const shellNavSrc = read("app/(site)/dashboard/components/LeonixDashboardShell.tsx");
const i18nSrc = read("app/(site)/dashboard/lib/dashboardI18n.ts");

// =================================================================================
// A. Results CTA
// =================================================================================

await check("save button reuses autosFilterStateToSavedSearch — no manual filter_payload construction", () => {
  assert.ok(buttonSrc.includes("autosFilterStateToSavedSearch("), "must call the Saved Search 02 adapter");
  assert.ok(!/filterPayload:\s*\{[^}]*make:/.test(stripJsComments(buttonSrc)), "must not manually build a filter_payload object inline");
});

await check("results shell passes the COMMITTED filter state (applied), not the in-progress draft", () => {
  assert.ok(shellSrc.includes("<AutosSaveSearchButton filters={applied.filters} searchQ={applied.q} lang={lang} />"), "must be wired with applied.filters/applied.q, not draftFilters/qDraft");
});

await check("save button component accepts no sort/page/radius prop — cannot receive UI-only state", () => {
  const sig = buttonSrc.match(/export function AutosSaveSearchButton\(\{([\s\S]*?)\}:\s*\{([\s\S]*?)\}\)/)?.[2] ?? "";
  assert.ok(sig.length > 0, "could not locate AutosSaveSearchButton prop type");
  assert.ok(!/\bsort\b|\bpage\b|\bperPage\b|\bradiusMiles\b/i.test(sig), `props must not include sort/page/radiusMiles, got: ${sig}`);
});

await check("signed-out path uses the existing /login redirect flow, not a new auth modal", () => {
  assert.ok(/\/login\?lang=\$\{lang\}&redirect=/.test(buttonSrc), "must redirect to the existing /login route with a redirect param");
  assert.ok(!/new\s+Modal|AuthModal|createModal/i.test(buttonSrc), "must not introduce a new auth modal system");
});

await check("no caller-controlled user_id anywhere in the new browser client or UI", () => {
  for (const [name, src] of [
    ["savedSearchClient.ts", clientSrc],
    ["AutosSaveSearchButton.tsx", buttonSrc],
    ["busquedas-guardadas/page.tsx", dashboardPageSrc],
  ]) {
    assert.ok(!/user_id\s*:/.test(src) && !/ownerId\s*:\s*["'`]/.test(src), `${name} must never set a literal/caller-supplied user_id or ownerId`);
  }
});

await check("browser client resolves the token from the real Supabase session, never a hardcoded/fake value", () => {
  assert.ok(clientSrc.includes("createSupabaseBrowserClient()") && clientSrc.includes("sb.auth.getSession()"));
  assert.ok(clientSrc.includes("Authorization: `Bearer ${token}`") || clientSrc.includes("Authorization: `Bearer"));
});

await check("no service-role key referenced in any new client-side file", () => {
  for (const [name, src] of [
    ["savedSearchClient.ts", clientSrc],
    ["AutosSaveSearchButton.tsx", buttonSrc],
    ["busquedas-guardadas/page.tsx", dashboardPageSrc],
  ]) {
    assert.ok(!/service_role|SUPABASE_SERVICE_ROLE|getAdminSupabase/.test(src), `${name} must never reference the service-role key or admin client`);
  }
});

// =================================================================================
// B. Duplicate / reactivation state — server-authoritative
// =================================================================================

await check("saved-state check compares against the server's own fingerprint, not a client-side guess", () => {
  assert.ok(buttonSrc.includes("buildSavedSearchFingerprintBrowser(normalized)"));
  assert.ok(buttonSrc.includes("row.fingerprint === fingerprint && row.isActive"));
});

await check("client fingerprint uses Web Crypto (browser-safe), never node:crypto — the exact bug that broke the build", () => {
  assert.ok(!/node:crypto|require\(["']crypto["']\)/.test(buttonSrc), "AutosSaveSearchButton.tsx must never import node:crypto directly or transitively via a crypto-bearing module");
  const browserFpSrc = stripJsComments(read("app/lib/saved-search/savedSearchFingerprintBrowser.ts"));
  assert.ok(browserFpSrc.includes("crypto.subtle.digest("), "browser fingerprint helper must use Web Crypto");
  assert.ok(!browserFpSrc.includes("node:crypto"), "browser fingerprint helper must never import node:crypto");
  const canonicalizeSrc = stripJsComments(read("app/lib/saved-search/savedSearchCanonicalize.ts"));
  assert.ok(!canonicalizeSrc.includes("node:crypto"), "the shared canonicalization module (imported by client code) must never import node:crypto");
});

await check("server and browser fingerprint implementations hash the identical canonical input — proven equal, not assumed", async () => {
  const { canonicalizeSavedSearch: canon, buildSavedSearchFingerprintInput: fpInput } = await import("../app/lib/saved-search/savedSearchCanonicalize");
  const { buildSavedSearchFingerprint: serverFp } = await import("../app/lib/saved-search/savedSearchFingerprintServer");
  const { buildSavedSearchFingerprintBrowser: browserFp } = await import("../app/lib/saved-search/savedSearchFingerprintBrowser");
  const sample: SavedSearchNormalizedInput = { category: "autos", city: "Fresno", minPrice: 1000, maxPrice: null, filterPayload: { make: "Honda" } };
  const server = serverFp(sample);
  const browser = await browserFp(sample);
  assert.equal(server, browser, "server (Node crypto) and browser (Web Crypto) fingerprints must be byte-identical for the same input");
  assert.equal(server.length, 64, "SHA-256 hex digest must be 64 characters");
  void canon;
  void fpInput;
});

await check("save button never writes to localStorage/sessionStorage to decide saved state", () => {
  assert.ok(!/localStorage|sessionStorage/.test(buttonSrc), "duplicate/saved state must come from the server list, not client storage");
});

await check("save action always goes through the single createOrReactivateSavedSearch-backed endpoint (POST /api/saved-search)", () => {
  const saveFn = clientSrc.match(/export async function saveSavedSearchClient\([\s\S]*?\n\}/)?.[0] ?? "";
  assert.ok(saveFn.includes('callSavedSearchApi("/api/saved-search"'), "saveSavedSearchClient must call the single canonical POST /api/saved-search endpoint");
  assert.equal((clientSrc.match(/method:\s*"POST"/g) ?? []).length, 1, "there must be exactly one POST call site — no second/duplicate create path");
  assert.ok(buttonSrc.includes("saveSavedSearchClient(normalized)"));
});

await check("saved-active button becomes non-interactive — clicking again cannot fire a second create call", () => {
  assert.ok(/state === "saved-active" \|\| state === "saving" \|\| state === "checking"\)\s*return;/.test(stripJsComments(buttonSrc).replace(/\s+/g, " ")));
});

// =================================================================================
// C. Owner management surface
// =================================================================================

await check("dashboard page lists via the Saved Search API client, never a direct saved_searches table query", () => {
  assert.ok(dashboardPageSrc.includes("listSavedSearchesClient("));
  assert.ok(!/\.from\(\s*["']saved_searches["']\s*\)/.test(dashboardPageSrc), "must never query saved_searches directly from the client");
});

await check("pause/reactivate uses setSavedSearchActiveClient (PATCH), delete uses deleteSavedSearchClient (DELETE)", () => {
  assert.ok(dashboardPageSrc.includes("setSavedSearchActiveClient("));
  assert.ok(dashboardPageSrc.includes("deleteSavedSearchClient("));
});

await check("delete requires confirmation before calling the API, mirroring the existing dashboard confirm() convention", () => {
  assert.ok(/if \(!confirm\(t\.confirmDelete\)\) return;/.test(dashboardPageSrc));
});

await check("owner scoping preserved — dashboard page never sends another user's id and always redirects unauthenticated visitors", () => {
  assert.ok(dashboardPageSrc.includes("supabase.auth.getUser()"));
  assert.ok(dashboardPageSrc.includes("router.replace(`/login?redirect="));
});

await check("no raw JSON dumped to the user — filter_payload is only ever passed through describeAutosSavedSearchFacets, never JSON.stringify'd for display", () => {
  assert.ok(!/JSON\.stringify\(\s*row\.filterPayload/.test(dashboardPageSrc));
  // Saved Search 06 generalized the dashboard to a per-category registry (Gate 20) — Autos facets
  // now render via `entry.describeFacets(...)` dispatch rather than a hardcoded direct call, but
  // `describeAutosSavedSearchFacets` remains the exact function wired in for Autos rows (imported
  // and registered), never bypassed for a raw JSON dump. Accept either call form.
  const directCall = dashboardPageSrc.includes("describeAutosSavedSearchFacets(");
  const registryDispatch =
    dashboardPageSrc.includes("import { describeAutosSavedSearchFacets }") &&
    dashboardPageSrc.includes("describeFacets: describeAutosSavedSearchFacets") &&
    dashboardPageSrc.includes("entry.describeFacets(");
  assert.ok(directCall || registryDispatch, "describeAutosSavedSearchFacets must be genuinely wired in, directly or via the category registry");
});

await check("dashboard reuses the existing LeonixDashboardShell — no parallel dashboard chrome", () => {
  assert.ok(dashboardPageSrc.includes('import { LeonixDashboardShell } from "../components/LeonixDashboardShell"'));
  assert.ok(dashboardPageSrc.includes('activeNav="savedSearches"'));
});

await check("dashboard nav gains exactly one new entry, gated behind the same readiness-flag convention as existing entries", () => {
  assert.ok(shellNavSrc.includes('"savedSearches"'), "LeonixDashboardActiveNav union must include savedSearches");
  assert.ok(shellNavSrc.includes("DASHBOARD_SAVED_SEARCHES_READY"), "must use a readiness flag, matching DASHBOARD_SAVED_LISTINGS_READY's pattern");
  assert.ok(shellNavSrc.includes('navItem("savedSearches", `/dashboard/busquedas-guardadas?${q}`, L.savedSearches)'));
});

// =================================================================================
// D. Return-to-results URL
// =================================================================================

await check("URL builder reuses serializeAutosBrowseUrl verbatim — no second query-string contract", () => {
  assert.ok(urlBuilderSrc.includes('import { serializeAutosBrowseUrl'));
  assert.ok(urlBuilderSrc.includes("serializeAutosBrowseUrl(bundle)"));
});

await check("URL builder always resets to page 1, default 'newest' sort — never treats saved sort/page as match semantics", () => {
  assert.ok(urlBuilderSrc.includes('sort: "newest"'));
  assert.ok(urlBuilderSrc.includes("page: 1,"));
});

const roundTripSaved: SavedSearchNormalizedInput = {
  category: "autos",
  city: "Sacramento",
  minPrice: 5000,
  maxPrice: 15000,
  filterPayload: { make: "Toyota", model: "Camry", sellerType: "private", yearMin: 2018, yearMax: 2022 },
};

await check("buildAutosSavedSearchResultsUrl produces a real /clasificados/autos/resultados URL with the meaningful facets preserved", () => {
  const url = buildAutosSavedSearchResultsUrl(roundTripSaved, "es");
  assert.ok(url.startsWith("/clasificados/autos/results?") || url.startsWith("/clasificados/autos/resultados?"), `unexpected path: ${url}`);
  const qs = new URLSearchParams(url.split("?")[1]);
  assert.equal(qs.get("city"), "Sacramento");
  assert.equal(qs.get("priceMin"), "5000");
  assert.equal(qs.get("priceMax"), "15000");
  assert.equal(qs.get("make"), "Toyota");
  assert.equal(qs.get("model"), "Camry");
  assert.equal(qs.get("yearMin"), "2018");
  assert.equal(qs.get("yearMax"), "2022");
  assert.equal(qs.get("seller"), "private");
  assert.equal(qs.get("sort"), null, "default sort must not appear in the URL (newest is implicit)");
  assert.equal(qs.get("page"), null, "page 1 must not appear in the URL (implicit default)");
});

await check("buildAutosSavedSearchResultsUrl routes dealer-lane saved searches to the dealer results path", () => {
  const dealerSaved: SavedSearchNormalizedInput = { ...roundTripSaved, filterPayload: { ...roundTripSaved.filterPayload, sellerType: "dealer" } };
  const url = buildAutosSavedSearchResultsUrl(dealerSaved, "en");
  assert.ok(url.startsWith("/clasificados/dealers-de-autos/results?"), `expected dealer results path, got: ${url}`);
});

await check("describeAutosSavedSearchFacets never returns raw JSON — only known, translated facet strings", () => {
  const facets = describeAutosSavedSearchFacets(roundTripSaved, "es");
  assert.ok(Array.isArray(facets) && facets.length > 0);
  for (const f of facets) {
    assert.ok(!f.includes("{") && !f.includes("}"), `facet string looks like raw JSON: ${f}`);
  }
});

// =================================================================================
// E. ES/EN parity
// =================================================================================

await check("Save Search CTA copy — ES/EN", () => {
  assert.ok(buttonSrc.includes('save: "Guardar búsqueda"') && buttonSrc.includes('save: "Save search"'));
  assert.ok(buttonSrc.includes('saved: "Búsqueda guardada"') && buttonSrc.includes('saved: "Search saved"'));
  assert.ok(buttonSrc.includes("Save this search so you can quickly return to it later.") && buttonSrc.includes("Guarda esta búsqueda para volver a encontrarla fácilmente."));
});

await check("Save Search CTA never promises delivery/notifications in any copy string", () => {
  const forbiddenPhrases = [/te avisaremos/i, /we.?ll notify/i, /alerts enabled/i, /notifications on/i, /notificaciones activadas/i];
  for (const re of forbiddenPhrases) {
    assert.ok(!re.test(buttonSrc), `forbidden notification-promise phrase matched: ${re}`);
  }
});

await check("dashboard nav label — ES/EN", () => {
  assert.ok(i18nSrc.includes('savedSearches: "Búsquedas guardadas"'));
  assert.ok(i18nSrc.includes('savedSearches: "Saved searches"'));
});

await check("dashboard page action copy — ES/EN (pause/reactivate/delete/view results)", () => {
  assert.ok(dashboardPageSrc.includes('pause: "Pausar"') && dashboardPageSrc.includes('pause: "Pause"'));
  assert.ok(dashboardPageSrc.includes('reactivate: "Reactivar"') && dashboardPageSrc.includes('reactivate: "Reactivate"'));
  assert.ok(dashboardPageSrc.includes('delete: "Eliminar"') && dashboardPageSrc.includes('delete: "Delete"'));
  assert.ok(dashboardPageSrc.includes('viewResults: "Ver resultados"') && dashboardPageSrc.includes('viewResults: "View results"'));
  assert.ok(dashboardPageSrc.includes('title: "Búsquedas guardadas"') && dashboardPageSrc.includes('title: "Saved searches"'));
});

await check("dashboard page derives lang from the same ?lang= query param convention as the rest of the dashboard", () => {
  assert.ok(dashboardPageSrc.includes('searchParams?.get("lang") || "es") === "en" ? "en" : "es"'));
});

// =================================================================================
// F. No forbidden scope
// =================================================================================

const newOrChangedFiles = [
  "app/lib/saved-search/savedSearchClient.ts",
  "app/lib/saved-search/autos/autosSavedSearchResultsUrl.ts",
  "app/(site)/clasificados/autos/components/public/AutosSaveSearchButton.tsx",
  "app/(site)/clasificados/autos/components/public/AutosPublicResultsShell.tsx",
  "app/(site)/dashboard/busquedas-guardadas/page.tsx",
  "app/(site)/dashboard/components/LeonixDashboardShell.tsx",
  "app/(site)/dashboard/lib/dashboardI18n.ts",
  "app/(site)/dashboard/lib/dashboardProductTruth.ts",
  "app/lib/saved-search/autos/savedSearchAutosAdapter.ts",
];

const FORBIDDEN_PATTERNS: [RegExp, string][] = [
  [/\bsendEmail\b|nodemailer|resend\.|sendgrid/i, "email"],
  [/\btwilio\b|\bsendSms\b/i, "SMS"],
  [/push notification|webpush|expo-notifications/i, "push notification"],
  [/\boutbox\b/i, "outbox"],
  [/\bcron\b/i, "cron"],
  [/edge function|supabase\/functions/i, "Edge Function"],
  [/on\s*publish|publishHook|afterPublish/i, "publish hook"],
  [/price[-_]?drop/i, "price-drop trigger"],
  [/notification preferences|preferencias de notificaci/i, "notification preferences"],
];

await check("no forbidden-scope terms actually implemented in any new/changed file (comments documenting what is NOT done are fine)", () => {
  for (const rel of newOrChangedFiles) {
    const code = stripJsComments(read(rel));
    for (const [re, label] of FORBIDDEN_PATTERNS) {
      assert.ok(!re.test(code), `${rel} must not implement ${label}`);
    }
  }
});

await check("no new file ever mutates the saved_listings (favorites) table", () => {
  for (const rel of newOrChangedFiles) {
    const src = read(rel);
    assert.ok(!/\.from\(\s*["']saved_listings["']\s*\)/.test(src), `${rel} must never query/mutate saved_listings`);
  }
});

// =================================================================================
if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-saved-search-autos-03: PASS");
}

void main();
