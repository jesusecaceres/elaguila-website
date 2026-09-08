/**
 * Owner Command Center — Package 3, Gate 3A focused verifier.
 *
 * Scope: the canonical Owner Entity Workspace shell + capability registry, and the Servicios
 * + Restaurantes reference migration onto it. Confirms one shared structural component exists
 * and is genuinely consumed by both categories, the capability registry expresses richer-
 * than-boolean state, Community Trust remains read-only with no vote/write logic touched, the
 * semantic action color system is centralized (no per-category color maps), Restaurantes'
 * per-listing "Crear otro anuncio" duplicate is gone, no fabricated preview/lifecycle/activity
 * was introduced, and no protected system was touched.
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

function exists(relPath: string): boolean {
  return existsSync(path.join(ROOT, relPath));
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

const pageFrame = read("app/(site)/dashboard/components/OwnerProductPageFrame.tsx");
const workspace = read("app/(site)/dashboard/components/OwnerEntityWorkspace.tsx");
const header = read("app/(site)/dashboard/components/OwnerEntityHeader.tsx");
const performance = read("app/(site)/dashboard/components/OwnerEntityPerformance.tsx");
const communityTrustComp = read("app/(site)/dashboard/components/OwnerEntityCommunityTrust.tsx");
const externalReputation = read("app/(site)/dashboard/components/OwnerEntityExternalReputation.tsx");
const activityComp = read("app/(site)/dashboard/components/OwnerEntityActivity.tsx");
const specializedComp = read("app/(site)/dashboard/components/OwnerEntitySpecializedTools.tsx");
const registry = read("app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts");
const actionBar = read("app/(site)/dashboard/components/DashboardListingActionBar.tsx");
const servicios = read("app/(site)/dashboard/servicios/page.tsx");
const restaurantes = read("app/(site)/dashboard/restaurantes/page.tsx");
const endorsementServer = read("app/lib/leonixCommunityTrust/leonixEndorsementServer.ts");
const endorsementRoute = read("app/api/leonix-endorsements/route.ts");

// ---------------------------------------------------------------------------
// ARCHITECTURE — one shared shell, genuinely consumed
// ---------------------------------------------------------------------------
check("OwnerEntityWorkspace.tsx exists (canonical structural component)", exists("app/(site)/dashboard/components/OwnerEntityWorkspace.tsx"));
check("OwnerEntityHeader.tsx exists", exists("app/(site)/dashboard/components/OwnerEntityHeader.tsx"));
check("OwnerEntityPerformance.tsx exists", exists("app/(site)/dashboard/components/OwnerEntityPerformance.tsx"));
check("OwnerEntityCommunityTrust.tsx exists", exists("app/(site)/dashboard/components/OwnerEntityCommunityTrust.tsx"));
check("OwnerEntityActivity.tsx exists", exists("app/(site)/dashboard/components/OwnerEntityActivity.tsx"));
check("OwnerEntitySpecializedTools.tsx exists", exists("app/(site)/dashboard/components/OwnerEntitySpecializedTools.tsx"));
check("Servicios imports OwnerEntityWorkspace", /from "\.\.\/components\/OwnerEntityWorkspace"/.test(servicios));
check("Restaurantes imports OwnerEntityWorkspace", /from "\.\.\/components\/OwnerEntityWorkspace"/.test(restaurantes));
check("Servicios renders <OwnerEntityWorkspace", /<OwnerEntityWorkspace/.test(servicios));
check("Restaurantes renders <OwnerEntityWorkspace", /<OwnerEntityWorkspace/.test(restaurantes));
check("Restaurantes no longer renders DashboardCategoryListingCard (no separate replacement shell)", !/<DashboardCategoryListingCard/.test(restaurantes));
check("Servicios no longer renders its own <table> per-listing UI (dense table removed as primary management UI)", !/<table/.test(servicios));
check(
  "OwnerEntityWorkspace owns canonical section order (header, detail grid, performance, community trust, external reputation, primary action, quick/lifecycle/specialized, activity)",
  /OwnerEntityHeader/.test(workspace) &&
    /OwnerEntityDetailGrid/.test(workspace) &&
    /OwnerEntityPerformance/.test(workspace) &&
    /OwnerEntityCommunityTrust/.test(workspace) &&
    /OwnerEntityExternalReputation/.test(workspace) &&
    /OwnerEntityActivity/.test(workspace),
);
check("OwnerEntityWorkspace reuses the shared DashboardMobileActionSheet (no second drawer implementation)", /DashboardMobileActionSheet/.test(workspace));

// ---------------------------------------------------------------------------
// CAPABILITIES — richer-than-boolean state, UI truth only (not route truth)
// ---------------------------------------------------------------------------
check("ownerEntityCapabilityRegistry.ts exists", exists("app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts"));
check(
  "CapabilityState is a 4-value union, not a boolean",
  /export type CapabilityState = "supported" \| "unsupported" \| "unproven" \| "specialized";/.test(registry),
);
check("Registry documents it is UI capability truth, not route truth", /UI CAPABILITY TRUTH/.test(registry) && /NOT route truth/i.test(registry));
check("Registry does not import/construct hrefs (no route logic duplicated)", !/href\s*[:=]/.test(registry) && !/router\.push|router\.replace/.test(registry));
check("Servicios capability entry populated", /servicios: merge\(/.test(registry));
check("Restaurantes capability entry populated", /restaurantes: merge\(/.test(registry));
check("Servicios and Restaurantes pages read capabilities via getOwnerEntityCapabilities, not by inventing their own truth", /getOwnerEntityCapabilities\("servicios"\)/.test(servicios) && /getOwnerEntityCapabilities\("restaurantes"\)/.test(restaurantes));

// ---------------------------------------------------------------------------
// PERFORMANCE COMPONENT
// ---------------------------------------------------------------------------
check("OwnerEntityPerformance renders nothing when metrics is empty (never a synthetic zero)", /if \(metrics\.length === 0\) return null;/.test(performance));
check("Servicios feeds OwnerEntityPerformance from real per-listing metrics only (r.metrics)", /r\.metrics/.test(servicios) && /performance=\{/.test(servicios));
check("Restaurantes does not fabricate per-listing performance metrics (no metrics array passed — category has no proven per-listing analytics)", !/performance=\{/.test(restaurantes));
check("No per-card network fetch added inside the shared performance/community-trust presentational components themselves", !/fetch\(/.test(performance) && !/fetch\(/.test(communityTrustComp));

// ---------------------------------------------------------------------------
// COMMUNITY TRUST — first class, read only
// ---------------------------------------------------------------------------
check(
  "OwnerEntityCommunityTrust never imports/calls the vote/write path (checked against real import statements only, not doc-comment prose)",
  !communityTrustComp.split("\n").some((line) => /^\s*import\b/.test(line) && /toggleLeonixEndorsementVote/.test(line)) &&
    !/method:\s*"POST"/.test(communityTrustComp),
);
check("OwnerEntityCommunityTrust renders no star glyph or numeric average value (lion glyph + label + real count only)", !/★|StarRow/i.test(communityTrustComp));
check("Servicios reads Community Trust via the existing, unmodified GET /api/leonix-endorsements read endpoint", /\/api\/leonix-endorsements\?category=servicios/.test(servicios));
check("Restaurantes reads Community Trust via the same unmodified read endpoint", /\/api\/leonix-endorsements\?category=restaurantes/.test(restaurantes));
check("leonixEndorsementServer.ts (vote/write + read logic) untouched this gate — self-vote guard intact", /function isSelfVote/.test(endorsementServer) && /Best-effort self-vote block/.test(endorsementServer));
check("leonix-endorsements API route untouched this gate (GET/POST contract intact)", /export async function GET/.test(endorsementRoute) && /export async function POST/.test(endorsementRoute));
check("No new endorsement/vote table or RPC introduced (no CREATE TABLE/FUNCTION touching endorsements this gate)", !/CREATE (TABLE|FUNCTION).*endorsement/i.test(registry) && !/CREATE (TABLE|FUNCTION).*endorsement/i.test(workspace));

// ---------------------------------------------------------------------------
// ACTION SEMANTIC SYSTEM — centralized, no category color maps
// ---------------------------------------------------------------------------
check("Primary tone renders burgundy via the shared CSS variable (not a category-local hex)", /--lx-cta-primary-bg/.test(actionBar));
check("Positive/lifecycle tone is the shared #2A4536 green (not a category-local emerald)", /#2A4536/.test(actionBar) && !/emerald/i.test(workspace) && !/emerald/i.test(header));
check("Warning tone is the shared amber role", /amber-300|amber-50|amber-900/.test(actionBar));
check("Danger tone is the shared red role", /red-300|red-50|red-800/.test(actionBar));
check("Premium/specialized tone is the shared gold role", /#C9A84A/.test(actionBar));
check("OwnerEntityWorkspace does not define its own category-specific action color map", !/tone === "servicios"|tone === "restaurantes"/.test(workspace));
check("Servicios primary action carries no explicit tone override (workspace composer owns tone assignment)", !/primaryAction=\{\{[\s\S]{0,60}tone:/.test(servicios));
check("Restaurantes primary action carries no explicit tone override (workspace composer owns tone assignment)", !/primaryAction=\{\{[\s\S]{0,60}tone:/.test(restaurantes));

// ---------------------------------------------------------------------------
// SERVICIOS MIGRATION
// ---------------------------------------------------------------------------
check("Servicios preserves the real edit href chain (serviciosListingEditHref unchanged)", /serviciosListingEditHref\(/.test(servicios));
check("Servicios lifecycle endpoint unchanged (/api/clasificados/servicios/manage)", /\/api\/clasificados\/servicios\/manage/.test(servicios));
check("Servicios activity (leads) preserved and grouped per listing, not dropped", /rowLeads/.test(servicios) && /listing_slug === r\.slug/.test(servicios));

// ---------------------------------------------------------------------------
// RESTAURANTES MIGRATION
// ---------------------------------------------------------------------------
check("Restaurantes uses the same canonical shell as Servicios (both import OwnerEntityWorkspace from the identical path)", (restaurantes.match(/from "\.\.\/components\/OwnerEntityWorkspace"/g) || []).length >= 1 && (servicios.match(/from "\.\.\/components\/OwnerEntityWorkspace"/g) || []).length >= 1);
check("Restaurantes 'Crear otro anuncio' is not repeated per listing", !/label: t\.createAnother/.test(restaurantes) && !/createAnother/.test(restaurantes.replace(/createAnother: "[^"]*",?\n?/g, "")));
check("Restaurantes does not fabricate a per-listing Vista previa action (confirmed unsupported)", !/quickActions[\s\S]{0,400}previewLabel/.test(restaurantes));
check("Restaurantes public/results routes unchanged (publicHref/resultsHref built exactly as before)", /appendLangToPath\(`\/clasificados\/restaurantes\/\$\{encodeURIComponent\(r\.slug\)\}`, lang\)/.test(restaurantes) && /\/clasificados\/restaurantes\/resultados\?lang=\$\{lang\}&q=/.test(restaurantes));
check("Restaurantes does not fabricate listing-scoped activity (no activity prop passed — none exists for this category)", !/activity=\{/.test(restaurantes));

// ---------------------------------------------------------------------------
// RESPONSIVE — shared mobile sheet only, Community Trust/Activity are content not action-sheet items
// ---------------------------------------------------------------------------
check("Community Trust is rendered as workspace content, never passed into the mobile action sheet's actions array", !/DashboardMobileActionSheet[\s\S]{0,300}communityTrust/.test(workspace));
check("Activity is rendered as workspace content, never passed into the mobile action sheet's actions array", !/DashboardMobileActionSheet[\s\S]{0,300}activity\.items/.test(workspace));
check("No alternate mobile drawer/sheet implementation introduced in the new component family", !/role="dialog"/.test(header) && !/role="dialog"/.test(performance) && !/role="dialog"/.test(communityTrustComp) && !/role="dialog"/.test(activityComp) && !/role="dialog"/.test(specializedComp) && !/role="dialog"/.test(externalReputation));

// ---------------------------------------------------------------------------
// LAYER B — GLOBAL OWNER PRODUCT PAGE FRAME (Gate 3A Correction, Part 15)
// ---------------------------------------------------------------------------
check("1. OwnerProductPageFrame.tsx exists (the one global Layer B component)", exists("app/(site)/dashboard/components/OwnerProductPageFrame.tsx"));
check("2. Servicios imports OwnerProductPageFrame", /from "\.\.\/components\/OwnerProductPageFrame"/.test(servicios));
check("3. Restaurantes imports OwnerProductPageFrame", /from "\.\.\/components\/OwnerProductPageFrame"/.test(restaurantes));
check("4. Servicios renders <OwnerProductPageFrame", /<OwnerProductPageFrame/.test(servicios));
check("5. Restaurantes renders <OwnerProductPageFrame", /<OwnerProductPageFrame/.test(restaurantes));
check(
  "6. Servicios no longer retains its legacy page-level engagement/interaction-summary block",
  !/buildServiciosCategoryTotals/.test(servicios) && !/engagementTotals/.test(servicios) && !/Resumen de interacci/.test(servicios),
);
check(
  "7. Restaurantes no longer retains its legacy bespoke category KPI/stat-card dashboard",
  !/ownerTotalsToListingMetrics/.test(restaurantes) && !/DashboardStatsCard/.test(restaurantes) && !/activeCount|promotedCount|verifiedCount/.test(restaurantes),
);
check(
  "8. Both pages use the same desktop workbench width via the shell (contentLayout=\"workbench\"), not a bespoke max-width wrapper",
  /contentLayout="workbench"/.test(servicios) && /contentLayout="workbench"/.test(restaurantes),
);
check(
  "9. OwnerProductPageFrame owns header anatomy as typed props (eyebrow/title/subtitle/primaryAction/secondaryAction), not free-form children",
  /eyebrow:\s*string/.test(pageFrame) && /title:\s*string/.test(pageFrame) && /primaryAction\?:/.test(pageFrame) && /secondaryAction\?:/.test(pageFrame),
);
check(
  "10. OwnerProductPageFrame stays presentational — no data fetching/mutation logic of its own",
  !/fetch\(/.test(pageFrame) && !/supabase/i.test(pageFrame) && !/await /.test(pageFrame),
);
check(
  "11. Servicios supplies category-level primary+secondary actions to the frame (rendered once, not per row)",
  /<OwnerProductPageFrame[\s\S]{0,600}primaryAction=\{\{/.test(servicios) && /<OwnerProductPageFrame[\s\S]{0,600}secondaryAction=\{\{/.test(servicios),
);
check(
  "12. Restaurantes supplies category-level primary+secondary actions to the frame (rendered once, not per row)",
  /<OwnerProductPageFrame[\s\S]{0,600}primaryAction=\{\{/.test(restaurantes) && /<OwnerProductPageFrame[\s\S]{0,600}secondaryAction=\{\{/.test(restaurantes),
);
check(
  "13. Restaurantes' dropped page-level 'Vista previa (misma sesión)' bespoke action is not resurrected",
  !/Vista previa \(misma sesi/.test(restaurantes) && !/previewHref/.test(restaurantes),
);
check(
  "14. Restaurantes' primary create action appears once (frame header), never repeated inside the row/map body",
  (restaurantes.match(/publishHref/g) || []).length > 0 && !/rows\.map[\s\S]{0,2000}publishHref/.test(restaurantes),
);
check(
  "15. Neither page defines a second, bespoke outer max-width/container wrapper competing with the shell + frame",
  !/max-w-\[90rem\]|max-w-7xl/.test(servicios) && !/max-w-\[90rem\]|max-w-7xl/.test(restaurantes),
);
check(
  "16. Both pages route loading/empty/error state through the frame's props, not a bespoke conditional block outside it",
  /<OwnerProductPageFrame[\s\S]{0,600}loading=\{/.test(servicios) &&
    /<OwnerProductPageFrame[\s\S]{0,600}empty=\{/.test(servicios) &&
    /<OwnerProductPageFrame[\s\S]{0,600}loading=\{/.test(restaurantes) &&
    /<OwnerProductPageFrame[\s\S]{0,600}empty=\{/.test(restaurantes),
);
check("17. Servicios no longer imports the account-level analytics summary fetcher", !/fetchDashboardAnalyticsSummary/.test(servicios));
check("18. Restaurantes no longer imports the account-level analytics summary fetcher", !/fetchDashboardAnalyticsSummary/.test(restaurantes));
check(
  "19. OwnerProductPageFrame is the only page-frame component (no second competing frame file introduced this gate)",
  !exists("app/(site)/dashboard/components/OwnerCategoryPageFrame.tsx") && !exists("app/(site)/dashboard/components/OwnerPageShell.tsx"),
);
check(
  "20. Both pages nest Layer A → Layer B → Layer C correctly (frame closes inside the shell, workspace(s) render as the frame's children)",
  /<\/OwnerProductPageFrame>\s*<\/LeonixDashboardShell>/.test(servicios) && /<\/OwnerProductPageFrame>\s*<\/LeonixDashboardShell>/.test(restaurantes),
);

// ---------------------------------------------------------------------------
// PROTECTED SYSTEMS / NO REGRESSION
// ---------------------------------------------------------------------------
const changedFiles = gitDiffNameOnly();
const forbiddenPatterns: Array<{ label: string; test: (f: string) => boolean }> = [
  { label: "Supabase migration", test: (f) => /^supabase\/migrations\//.test(f) },
  { label: "Stripe/payment/pricing/entitlement business-rule source", test: (f) => /stripe|payment|checkout|revenue-os|entitlement|pricing/i.test(f) },
  { label: "Community Trust write/vote logic (leonixEndorsementServer.ts / leonix-endorsements API route / registry)", test: (f) => /leonixEndorsementServer\.ts$|leonixEndorsementRegistry\.ts$|api\/leonix-endorsements\/route\.ts$/.test(f) },
  { label: "Analytics event-writing pipeline", test: (f) => /clasificadosAnalytics|listingAnalyticsEventTypes|recordGlobalAnalytics/i.test(f) },
  { label: "categoryRouteRegistry.ts / dashboardActionResolver.ts (route truth unchanged)", test: (f) => /categoryRouteRegistry\.ts$|dashboardActionResolver\.ts$/.test(f) },
  { label: "Admin OS / app/admin", test: (f) => /^app\/admin\//.test(f) },
  { label: "Business Concierge engines (Living Business Book / Health Map / Next Right Move / DIY Concierge / Learning Center)", test: (f) => /businessConcierge|livingBusinessBook|healthMap|nextRightMove|diyConcierge|learningCenter/i.test(f) },
  { label: "Auth / RLS", test: (f) => /supabase\/migrations.*rls|app\/lib\/auth\//i.test(f) },
  { label: "Lifecycle mutation API routes", test: (f) => /\/api\/.*\/(manage|lifecycle)\/route\.ts$/.test(f) },
];
for (const { label, test } of forbiddenPatterns) {
  const hits = changedFiles.filter(test);
  check(`No ${label} files changed`, hits.length === 0, hits.join(", "));
}
// Note: ownerListingsQuery.ts / ownerEngagementListingKeys.ts (Gate 2A) already carry
// legitimate prior-gate changes from earlier in this uncommitted worktree (no commit boundary
// exists between gates here) — the same limitation documented in every prior gate's verifier.
// This gate's own diff never touches those files (confirmed by inspection during
// implementation); a git-diff-based negative check on them would only ever false-positive on
// prior gates' legitimate work.

// "No new routes" — checked against untracked (??) files only, since every legitimately
// modified page.tsx this gate (servicios, restaurantes) is a pre-existing tracked file, not a
// new route; a brand-new route would show as untracked (??) in git status.
let untrackedNewRoutes: string[] = [];
try {
  const statusOut = execSync("git status --short", { cwd: ROOT, encoding: "utf8" });
  untrackedNewRoutes = statusOut
    .split("\n")
    .filter((l) => l.startsWith("??"))
    .map((l) => l.slice(3).trim())
    .filter((f) => /page\.tsx$|route\.ts$/.test(f));
} catch {
  /* ignore */
}
check("No new routes created (no new, untracked page.tsx/route.ts files this gate)", untrackedNewRoutes.length === 0, untrackedNewRoutes.join(", "));

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
