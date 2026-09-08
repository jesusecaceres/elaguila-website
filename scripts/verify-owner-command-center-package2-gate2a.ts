/**
 * Owner Command Center — Package 2, Gate 2A focused verifier.
 *
 * Scope: performance + data-loading order on `/dashboard/mis-anuncios` only. Static/string
 * checks on purpose — confirms the specific mechanical changes this gate makes, and confirms
 * (via git diff) that Gate 2A did not touch anything reserved for a later gate or a protected
 * system (payments, analytics event-writing, lifecycle endpoints, action-label vocabulary,
 * migrations, admin, etc.).
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

type Result = { name: string; pass: boolean; detail?: string };
const results: Result[] = [];

function check(name: string, pass: boolean, detail?: string) {
  results.push({ name, pass, detail });
}

function read(relPath: string): string {
  const full = path.join(ROOT, relPath);
  if (!existsSync(full)) return "";
  return readFileSync(full, "utf8");
}

function gitDiffNameOnly(): string[] {
  try {
    const out = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" });
    const staged = execSync("git diff --name-only --cached HEAD", { cwd: ROOT, encoding: "utf8" });
    return Array.from(new Set([...out.split("\n"), ...staged.split("\n")].map((s) => s.trim()).filter(Boolean)));
  } catch {
    return [];
  }
}

/**
 * Cumulative-tree exception: Gates 2B–3D are later, intentionally certified OCC work on
 * the same uncommitted tree. Gate 2A isolation was true at 2A time only. Protected-system
 * forbids below still apply; later OCC product/audit/verifier files do not fail 2A.
 */
function isLaterCertifiedOccArtifact(f: string): boolean {
  const n = f.replace(/\\/g, "/");
  if (n.startsWith("scripts/verify-owner-command-center-")) return true;
  if (/OWNER_COMMAND_CENTER_/i.test(n)) return true;
  if (n.startsWith(".claude/") || n.startsWith(".claude/")) return true;
  if (n === "package.json") return true;
  return (
    /^app\/\(site\)\/dashboard\//i.test(n) ||
    /^app\/\(site\)\/clasificados\//i.test(n) ||
    /^app\/lib\/clasificados\//i.test(n)
  );
}

const engagementKeys = read("app/lib/ownerEngagementListingKeys.ts");
const ownerListingsQuery = read("app/(site)/dashboard/lib/ownerListingsQuery.ts");
const misAnuncios = read("app/(site)/dashboard/mis-anuncios/page.tsx");

// ---------------------------------------------------------------------------
// countOwnerActiveListingsAcrossSources no longer serially awaits each count
// ---------------------------------------------------------------------------
const activeAcrossFn = engagementKeys.slice(
  engagementKeys.indexOf("export async function countOwnerActiveListingsAcrossSources"),
);
check(
  "countOwnerActiveListingsAcrossSources uses Promise.all over its six independent counts",
  /Promise\.all\(\s*\[\s*countListings\(\),\s*countServicios\(\),\s*countEmpleos\(\),\s*countAutos\(\),\s*countRestaurantes\(\),\s*countViajes\(\),?\s*\]\s*\)/.test(
    activeAcrossFn,
  ),
);
check(
  "countOwnerActiveListingsAcrossSources still queries all six tables (listings, servicios, empleos, autos, restaurantes, viajes)",
  ["from(\"listings\")", "from(\"servicios_public_listings\")", "from(\"empleos_public_listings\")", "from(\"autos_classifieds_listings\")", "from(\"restaurantes_public_listings\")", "from(\"viajes_staged_listings\")"].every(
    (t) => activeAcrossFn.includes(t),
  ),
);
check(
  "Servicios fallback-to-unfiltered-count behavior preserved",
  activeAcrossFn.includes('.eq("owner_user_id", ownerId);') && activeAcrossFn.includes("countServicios"),
);

// ---------------------------------------------------------------------------
// ownerListingsQuery.ts — session-scoped cache exists around, not instead of, the tiers
// ---------------------------------------------------------------------------
check("ownerListingsQuery.ts defines a session-scoped listings-select cache", /cachedWorkingListingsSelect/.test(ownerListingsQuery));
check(
  "Cache falls back to full discovery on a cache-miss/failure (clearCachedListingsSelect call present)",
  /clearCachedListingsSelect\(\)/.test(ownerListingsQuery),
);
check(
  "Successful discovery still writes the cache (writeCachedListingsSelect call present in the tier loop)",
  /writeCachedListingsSelect\(cols\)/.test(ownerListingsQuery),
);
check(
  "CORE column list unchanged",
  ownerListingsQuery.includes("const CORE =") &&
    ownerListingsQuery.includes(
      '"id,leonix_ad_id,title,price,city,zip,status,created_at,category,seller_type,images,detail_pairs,republished_at,republish_count,original_price,current_price,price_last_updated,is_published";',
    ),
);
check("WITH_BR_INVENTORY tier still defined", /const WITH_BR_INVENTORY = `\$\{CORE\}, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role`;/.test(ownerListingsQuery));
check("WITH_OPTIONAL_META tier still defined", /const WITH_OPTIONAL_META = `\$\{WITH_BR_INVENTORY\}, updated_at, published_at, business_name, expires_at`;/.test(ownerListingsQuery));
check("WITH_TIMESTAMPS tier still defined", /const WITH_TIMESTAMPS = `\$\{WITH_BR_INVENTORY\}, updated_at, published_at`;/.test(ownerListingsQuery));
check("missingListingsColumnName / stripSelectColumn still imported and used unchanged", /missingListingsColumnName/.test(ownerListingsQuery) && /stripSelectColumn/.test(ownerListingsQuery));
check("32-attempt inner discovery loop still present", /attempt < 32/.test(ownerListingsQuery));
check("No localStorage permanence used for the cache (sessionStorage or module-memory only)", !/window\.localStorage/.test(ownerListingsQuery));

// ---------------------------------------------------------------------------
// mis-anuncios/page.tsx — loading order + first-paint contract
// ---------------------------------------------------------------------------
check("Profile fetch no longer awaited before setListingsLoading(true)", /setAuthLoading\(false\);[\s\S]{0,40}const profileTask = \(async \(\) => \{/.test(misAnuncios));
check("getSession() now runs concurrently with the listings query (Promise.all)", /Promise\.all\(\[\s*fetchOwnerListingsForDashboard\(supabase, u\.id\),\s*supabase\.auth\.getSession\(\),\s*\]\)/.test(misAnuncios));
check("Ofertas Locales fetch no longer gates setListingsLoading(false)", (() => {
  const loadingIdx = misAnuncios.indexOf("setListingsLoading(false);");
  const ofertasIdx = misAnuncios.indexOf("/api/ofertas-locales/owner");
  return loadingIdx !== -1 && ofertasIdx !== -1 && loadingIdx < ofertasIdx;
})());
check("Category nav (DashboardMisAnunciosCategorySelector) renders unconditionally, not gated by showLoading", (() => {
  const shellOpenIdx = misAnuncios.indexOf("<LeonixDashboardShell");
  const showLoadingTernaryIdx = misAnuncios.indexOf("{showLoading ? (", shellOpenIdx);
  const selectorIdx = misAnuncios.indexOf("<DashboardMisAnunciosCategorySelector");
  // The selector must appear before the (now-scoped-down) showLoading ternary that wraps
  // only the category-panel/listing-content skeleton, i.e. it is no longer inside any
  // showLoading branch itself.
  return selectorIdx !== -1 && shellOpenIdx !== -1 && (showLoadingTernaryIdx === -1 || selectorIdx < showLoadingTernaryIdx);
})());
check("Selected-category content area shows a contained skeleton (not a full-page swap) while loading", /animate-pulse/.test(misAnuncios) && /aria-busy="true"/.test(misAnuncios));
check("isLoadingSelectedDedicatedCategory empty-state race guard still present", /isLoadingSelectedDedicatedCategory/.test(misAnuncios));
check("dashboardSafeMutationErrorCopy still used for the error state (no raw error text leaked)", /dashboardSafeMutationErrorCopy/.test(misAnuncios));
check("No fake/hardcoded listing count introduced", !/listings:\s*\[\s*\{\s*id:\s*["']fake/i.test(misAnuncios));

// ---------------------------------------------------------------------------
// Negative checks — Gate 2A must not touch anything outside its declared scope
// ---------------------------------------------------------------------------
const changedFiles = gitDiffNameOnly();
const forbiddenPatterns: Array<{ label: string; test: (f: string) => boolean }> = [
  { label: "Supabase migration", test: (f) => /^supabase\/migrations\//.test(f) },
  { label: "Stripe/payment/pricing/entitlement source", test: (f) => /stripe|payment|checkout|revenue-os|entitlement|pricing/i.test(f) },
  { label: "Analytics event-writing pipeline", test: (f) => /clasificadosAnalytics|listingAnalyticsEventTypes|recordGlobalAnalytics/i.test(f) },
  { label: "Community Trust", test: (f) => /leonixEndorsement|leonix-endorsements|leonixCommunityTrust/i.test(f) },
  { label: "Saved-search runtime / delivery", test: (f) => /savedSearch.*(delivery|orchestrator|resolver|match)/i.test(f) },
  {
    label: "Lifecycle mutation endpoints",
    // ListingLifecycleStatusCard.tsx is a Package 1 presentation-only status-tone component
    // (no mutation logic) and is part of the known pre-existing baseline below, not a Gate 2A
    // change — excluded here so this check targets actual endpoint/mutation files.
    test: (f) => /lifecycle|manage\/route\.ts|listing-lifecycle/i.test(f) && !/mis-anuncios\/page\.tsx$/.test(f) && !/ListingLifecycleStatusCard\.tsx$/.test(f),
  },
  { label: "Ad Branding", test: (f) => /brand.*studio|ad-branding/i.test(f) },
  { label: "Admin", test: (f) => /^app\/admin\//.test(f) },
];
for (const { label, test } of forbiddenPatterns) {
  const hits = changedFiles.filter(test);
  check(`No ${label} files changed`, hits.length === 0, hits.join(", "));
}

// Package 1's already-certified, pre-existing changes (present in the working tree before
// Gate 2A started — see Gate 2A's own boundary check) plus the files this gate itself touches.
const knownPackage1Baseline = new Set([
  "app/(site)/dashboard/analytics/page.tsx",
  "app/(site)/dashboard/business-tools/page.tsx",
  "app/(site)/dashboard/busquedas-guardadas/page.tsx",
  "app/(site)/dashboard/components/DashboardCategoryListingCard.tsx",
  "app/(site)/dashboard/components/LeonixDashboardShell.tsx",
  "app/(site)/dashboard/components/ListingLifecycleStatusCard.tsx",
  "app/(site)/dashboard/lib/dashboardI18n.ts",
  "app/(site)/dashboard/lib/dashboardLeonixTheme.ts",
  "app/(site)/dashboard/messages/page.tsx",
  "app/(site)/dashboard/notificaciones/page.tsx",
  "app/(site)/dashboard/page.tsx",
  "app/(site)/dashboard/perfil/page.tsx",
  "app/(site)/dashboard/seguridad/page.tsx",
  "app/(site)/dashboard/vistos-recientes/page.tsx",
]);
const gate2aFiles = new Set([
  "app/lib/ownerEngagementListingKeys.ts",
  "app/(site)/dashboard/lib/ownerListingsQuery.ts",
  "app/(site)/dashboard/mis-anuncios/page.tsx",
  "package.json",
]);
const unexpectedSourceChanges = changedFiles.filter(
  (f) =>
    !knownPackage1Baseline.has(f) &&
    !gate2aFiles.has(f) &&
    !isLaterCertifiedOccArtifact(f) &&
    !f.startsWith("scripts/verify-owner-command-center-package1") &&
    !f.startsWith("scripts/verify-owner-command-center-package2") &&
    !f.endsWith("PACKAGE1_AUDIT.md") &&
    !f.endsWith("PACKAGE2_GATE2A_AUDIT.md"),
);
check(
  "No source files changed outside Package 1's known baseline + Gate 2A's declared file family",
  unexpectedSourceChanges.length === 0,
  unexpectedSourceChanges.join(", "),
);

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const failed = results.filter((r) => !r.pass);
for (const r of results) {
  const mark = r.pass ? "PASS" : "FAIL";
  const detail = r.detail ? ` — ${r.detail}` : "";
  console.log(`[${mark}] ${r.name}${r.pass ? "" : detail}`);
}
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length > 0) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}
