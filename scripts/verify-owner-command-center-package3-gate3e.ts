/**
 * Owner Command Center — Package 3, Gate 3E focused verifier.
 *
 * Scope: Account Command Center + Business Concierge owner orchestration.
 * Consumes existing owner-safe truth. Does not invent Concierge engines,
 * routes, or metrics. Must not regress Gate 2A.
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

const dashboard = read("app/(site)/dashboard/page.tsx");
const businessTools = read("app/(site)/dashboard/business-tools/page.tsx");
const shell = read("app/(site)/dashboard/components/LeonixDashboardShell.tsx");
const commandCenter = read("app/(site)/dashboard/components/OwnerAccountCommandCenter.tsx");
const needsAttention = read("app/(site)/dashboard/components/OwnerNeedsAttention.tsx");
const performance = read("app/(site)/dashboard/components/OwnerAccountPerformance.tsx");
const preview = read("app/(site)/dashboard/components/OwnerManagedEntitiesPreview.tsx");
const activity = read("app/(site)/dashboard/components/OwnerRecentActivity.tsx");
const growth = read("app/(site)/dashboard/components/OwnerBusinessGrowthEntry.tsx");
const conciergeHome = read("app/(site)/dashboard/components/BusinessConciergeOwnerHome.tsx");
const helper = read("app/(site)/dashboard/lib/ownerAccountCommandCenter.ts");
const derived = read("app/(site)/dashboard/lib/derivedDashboardFeed.ts");
const ownerListingsQuery = read("app/(site)/dashboard/lib/ownerListingsQuery.ts");
const i18n = read("app/(site)/dashboard/lib/dashboardI18n.ts");
const theme = read("app/(site)/dashboard/lib/dashboardLeonixTheme.ts");

check("OwnerAccountCommandCenter exists", exists("app/(site)/dashboard/components/OwnerAccountCommandCenter.tsx"));
check("OwnerNeedsAttention exists", exists("app/(site)/dashboard/components/OwnerNeedsAttention.tsx"));
check("OwnerAccountPerformance exists", exists("app/(site)/dashboard/components/OwnerAccountPerformance.tsx"));
check("OwnerManagedEntitiesPreview exists", exists("app/(site)/dashboard/components/OwnerManagedEntitiesPreview.tsx"));
check("OwnerRecentActivity exists", exists("app/(site)/dashboard/components/OwnerRecentActivity.tsx"));
check("OwnerBusinessGrowthEntry exists", exists("app/(site)/dashboard/components/OwnerBusinessGrowthEntry.tsx"));
check("BusinessConciergeOwnerHome exists", exists("app/(site)/dashboard/components/BusinessConciergeOwnerHome.tsx"));
check("ownerAccountCommandCenter helper exists", exists("app/(site)/dashboard/lib/ownerAccountCommandCenter.ts"));
check("Gate 3E audit exists", exists("app/(site)/dashboard/OWNER_COMMAND_CENTER_PACKAGE3_GATE3E_AUDIT.md"));

check("ACCOUNT: uses LeonixDashboardShell workbench", /contentLayout="workbench"/.test(dashboard) && /<LeonixDashboardShell/.test(dashboard));
check("ACCOUNT: uses OwnerAccountCommandCenter", /<OwnerAccountCommandCenter/.test(dashboard));
check("ACCOUNT: hero Publish CTA is /publicar + btnPrimary", /\/publicar\?/.test(commandCenter) && /btnPrimary/.test(commandCenter));
check("ACCOUNT: anatomy includes Needs Attention", /<OwnerNeedsAttention/.test(dashboard));
check("ACCOUNT: anatomy includes Account Performance", /<OwnerAccountPerformance/.test(dashboard));
check("ACCOUNT: anatomy includes managed-entity preview", /<OwnerManagedEntitiesPreview/.test(dashboard));
check("ACCOUNT: anatomy includes recent activity", /<OwnerRecentActivity/.test(dashboard));
check("ACCOUNT: anatomy includes business/grow entry", /<OwnerBusinessGrowthEntry/.test(dashboard));
check(
  "ACCOUNT: first paint not blocked on secondary fetches (authLoading false before metrics)",
  /setAuthLoading\(false\)/.test(dashboard) && /metricsTask/.test(dashboard) && /attentionTask/.test(dashboard) && /previewTask/.test(dashboard),
);

check("NEEDS ATTENTION: consumes derived feed via accountAttentionItems", /accountAttentionItems/.test(needsAttention) && /DerivedFeedItem/.test(needsAttention));
check("NEEDS ATTENTION: helper kinds match derived feed", /expire_visibility/.test(helper) && /payment_attention/.test(helper) && /DerivedFeedKind/.test(helper));
check("NEEDS ATTENTION: derived feed is the source of truth", /export type DerivedFeedKind/.test(derived) && /payment_attention/.test(derived));
check("NEEDS ATTENTION: honest empty copy exists", /attentionEmpty:/.test(i18n));

check("PERFORMANCE: uses countOwnerActiveListingsAcrossSources", /countOwnerActiveListingsAcrossSources/.test(dashboard));
check("PERFORMANCE: uses countOwnerInventoryListings", /countOwnerInventoryListings/.test(dashboard));
check("PERFORMANCE: uses fetchDashboardAnalyticsSummary", /fetchDashboardAnalyticsSummary/.test(dashboard));
check("PERFORMANCE: uses fetchDashboardNavCounts drafts/expiringSoon", /fetchDashboardNavCounts/.test(dashboard) && /drafts/.test(dashboard) && /expiringSoon/.test(dashboard));
check("PERFORMANCE: hides views/contacts when analytics unavailable", /listingAnalyticsUnavailable/.test(dashboard) && /viewsUnavailable/.test(performance));
check("PERFORMANCE: no follower/revenue/ROI fabrication", !/follower/i.test(performance) && !/revenue/i.test(performance) && !/ROI/.test(performance) && !/follower/i.test(dashboard));

check("PREVIEW: uses canonical fetchOwnerListingsForDashboard", /fetchOwnerListingsForDashboard/.test(dashboard));
check("PREVIEW: one list fetch, slice of 4", (dashboard.match(/fetchOwnerListingsForDashboard\(/g) || []).length === 1 && /data\.slice\(0, 4\)/.test(dashboard));
check("PREVIEW: CTA to /dashboard/mis-anuncios", /\/dashboard\/mis-anuncios/.test(preview));
check("PREVIEW: no per-card fetch", !/fetch\(/.test(preview) && !/createSupabaseBrowserClient/.test(preview));

check("ACTIVITY: honest unsupported empty (no invented feed)", /activityUnsupported/.test(activity) && !/fetch\(/.test(activity));

check("GROWTH: Business Concierge discoverable via /dashboard/business-tools", /\/dashboard\/business-tools/.test(growth));
check("GROWTH: does not invent /aprender or idea-builder routes", !/href=\{`\/aprender/.test(growth) && !/idea-builder/.test(growth) && !/proximo-paso/.test(growth) && !/business-health/.test(growth));
check("GROWTH: copy admits idea-builder and /aprender are unpublished", /growthIdea:/.test(i18n) && /growthLearn:/.test(i18n) && /\/aprender/.test(i18n));

check("NON-BUSINESS: Concierge home has general/idea path", /generalTitle/.test(conciergeHome) && /ideaCta/.test(conciergeHome));
check("NON-BUSINESS: no fake Health Map or Next Right Move", /nrmUnsupported/.test(conciergeHome) && /healthUnsupported/.test(conciergeHome) && /available=\{false\}/.test(conciergeHome));
check("BUSINESS TOOLS: uses BusinessConciergeOwnerHome", /<BusinessConciergeOwnerHome/.test(businessTools));
check("BUSINESS TOOLS: uses LeonixDashboardShell workbench", /contentLayout="workbench"/.test(businessTools));
check("BUSINESS TOOLS: identity is listing-based (no public.businesses selector)", /identityListingBased/.test(conciergeHome) && /identityMissing/.test(conciergeHome) && !/from\("businesses"\)/.test(businessTools));
check("BUSINESS TOOLS: completeness is profile field count, not a health score", /completenessHint:/.test(i18n) && /No es un puntaje de salud/.test(i18n));
check("BUSINESS TOOLS: capabilities still come from package entitlements", /fetchDashboardListingPackageEntitlementBadges/.test(businessTools));
check("CONCIERGE MODULES: NRM/Health/Action/Understand/Learn/Progress/Assistant marked unavailable", /nrmUnsupported/.test(conciergeHome) && /healthUnsupported/.test(conciergeHome) && /actionUnsupported/.test(conciergeHome) && /understandUnsupported/.test(conciergeHome) && /learnUnsupported/.test(conciergeHome) && /progressUnsupported/.test(conciergeHome) && /assistantUnsupported/.test(conciergeHome));
check("CONCIERGE: approvals not marked Live without an owner API", /noPendingApprovals/.test(conciergeHome) && /available=\{false\}/.test(conciergeHome) && !/available=\{hasBusinessListings\}/.test(conciergeHome));
check("CONCIERGE: bilingual live/unavailable labels", /moduleLive/.test(conciergeHome) && /moduleUnavailable/.test(conciergeHome));

check("NAV: global sidebar has one Business tools entry", (shell.match(/\/dashboard\/business-tools/g) || []).length === 1);
check("NAV: no Concierge sub-route dump in global sidebar", !/proximo-paso/.test(shell) && !/business-health/.test(shell) && !/what-we-understand/.test(shell) && !/idea-builder/.test(shell) && !/\/aprender/.test(shell));
check(
  "ROUTES: bible Concierge subpages were not invented",
  !exists("app/(site)/dashboard/business-tools/idea-builder/page.tsx") &&
    !exists("app/(site)/dashboard/business-tools/concierge/page.tsx") &&
    !exists("app/(site)/dashboard/business-tools/proximo-paso/page.tsx") &&
    !exists("app/(site)/dashboard/business-tools/business-health/page.tsx") &&
    !exists("app/(site)/dashboard/business-tools/what-we-understand/page.tsx") &&
    !exists("app/(site)/aprender/page.tsx"),
);

check(
  "ORCHESTRATION COMPONENTS: presentational (no fetch)",
  !/fetch\(/.test(commandCenter) &&
    !/fetch\(/.test(needsAttention) &&
    !/fetch\(/.test(performance) &&
    !/fetch\(/.test(preview) &&
    !/fetch\(/.test(activity) &&
    !/fetch\(/.test(growth) &&
    !/fetch\(/.test(conciergeHome),
);
check("SHARED GRAMMAR: LX_DASH pageHero / panel / btnPrimary used", /pageHero/.test(commandCenter) && /panel/.test(needsAttention) && /btnPrimary/.test(commandCenter) && /export const LX_DASH/.test(theme));
check("ES/EN: accountCommandCenterCopy and businessConciergeHubCopy exist", /export function accountCommandCenterCopy/.test(i18n) && /export function businessConciergeHubCopy/.test(i18n));

check("No Gate 2A regression: owner listings select session cache still present", /lx_owner_listings_select_v1/.test(ownerListingsQuery));
check(
  "Layers A/B/C from prior gates still exist",
  exists("app/(site)/dashboard/components/LeonixDashboardShell.tsx") &&
    exists("app/(site)/dashboard/components/OwnerProductPageFrame.tsx") &&
    exists("app/(site)/dashboard/components/OwnerEntityWorkspace.tsx"),
);

const changedFiles = gitDiffNameOnly();
check("No migrations in this gate", !changedFiles.some((f) => /^supabase\/migrations\//.test(f)));

const forbiddenPatterns: Array<{ label: string; test: (f: string) => boolean }> = [
  { label: "Supabase migration", test: (f) => /^supabase\/migrations\//.test(f) },
  { label: "app/admin", test: (f) => /^app\/admin\//.test(f) },
  { label: "Analytics event-writing pipeline", test: (f) => /clasificadosAnalytics|listingAnalyticsEventTypes|recordGlobalAnalytics|ofertasLocalesPublicAnalytics\.ts$/.test(f) },
  {
    label: "Stripe/payment/entitlement writers",
    test: (f) => /revenueOs|stripe|publishCheckoutCheckpoint|revenuePricingMatrix/.test(f) && !/revenueCategoryCheckoutClient/.test(f),
  },
  {
    label: "Living Business Book / Health Map / NRM / DIY engines",
    test: (f) => /livingBusinessBook|healthMapEngine|nextRightMoveEngine|diyConciergeEngine|assistantMemory|promiseKeeper/i.test(f),
  },
  { label: "Recursos (non-audit)", test: (f) => /recursos/i.test(f) && !/OWNER_COMMAND_CENTER/.test(f) },
  { label: "Iglesias / Ad Branding owner pages", test: (f) => /dashboard\/iglesias|ad-branding/.test(f) },
];
for (const { label, test } of forbiddenPatterns) {
  const hits = changedFiles.filter(test);
  check(`No ${label} files changed`, hits.length === 0, hits.join(", "));
}

let untrackedNewRoutes: string[] = [];
try {
  const statusOut = execSync("git status --short", { cwd: ROOT, encoding: "utf8" });
  untrackedNewRoutes = statusOut
    .split("\n")
    .filter((l) => l.startsWith("??"))
    .map((l) => l.slice(3).trim().replace(/\\/g, "/"))
    .filter((f) => /page\.tsx$|route\.ts$/.test(f));
} catch {
  /* ignore */
}
check("No new routes created (no new untracked page.tsx/route.ts)", untrackedNewRoutes.length === 0, untrackedNewRoutes.join(", "));

check(
  "BUSINESS TOOLS: still uses restaurantes/servicios inventory fetches (no second business DB)",
  /fetchOwnerRestaurantListings/.test(businessTools) && /fetchOwnerServiciosListings/.test(businessTools),
);
check("No fake Health score 0-100 in Concierge home", !/0–100/.test(conciergeHome) && !/0-100/.test(conciergeHome) && !/healthScore/.test(conciergeHome));

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
