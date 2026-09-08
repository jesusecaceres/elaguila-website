/**
 * Owner Command Center — Package 1 focused verifier.
 *
 * Scope: shared dashboard shell, canonical theme, sidebar IA grouping, mobile
 * navigation, i18n foundation, and the /dashboard/messages alias — plus negative
 * checks confirming Package 1 did not touch feature/data logic that belongs to
 * later packages (payments, analytics APIs, Community Trust, saved-search
 * runtime, Ad Branding, admin).
 *
 * Static/string-based on purpose — checks for the presence of markers, not exact
 * formatting, so it does not become brittle to incidental whitespace/class-order
 * changes.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DASHBOARD = path.join(ROOT, "app", "(site)", "dashboard");

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

// ---------------------------------------------------------------------------
// 1. LeonixDashboardShell exists and exposes the workbench/default layout prop
// ---------------------------------------------------------------------------
const shellPath = "app/(site)/dashboard/components/LeonixDashboardShell.tsx";
const shell = read(shellPath);
check("LeonixDashboardShell.tsx exists", shell.length > 0, shellPath);
check(
  "Shell exposes contentLayout workbench/default modes",
  /contentLayout\?:\s*"default"\s*\|\s*"workbench"/.test(shell),
);

// ---------------------------------------------------------------------------
// 2. LX_DASH remains the sole canonical dashboard theme — no second theme file
// ---------------------------------------------------------------------------
const themePath = "app/(site)/dashboard/lib/dashboardLeonixTheme.ts";
const theme = read(themePath);
check("dashboardLeonixTheme.ts (LX_DASH) exists", /export const LX_DASH/.test(theme), themePath);
check(
  "LX_DASH defines the Package 1 presentation helpers (btnPositive/btnWarning/btnDanger/input/emptyState)",
  ["btnPositive", "btnWarning", "btnDanger", "input:", "emptyState:"].every((token) => theme.includes(token)),
);
check("Shared dashboard status-tone helper exists", /lxDashStatusChipClass/.test(theme));

const libDir = path.join(DASHBOARD, "lib");
const themeLikeFiles = existsSync(libDir)
  ? readdirSync(libDir).filter((f) => /theme/i.test(f) && f !== "dashboardLeonixTheme.ts")
  : [];
check(
  "No second/competing dashboard theme file was created",
  themeLikeFiles.length === 0,
  themeLikeFiles.join(", "),
);

// ---------------------------------------------------------------------------
// 3. Grouped nav labels present ES/EN, including the "Alertas y búsquedas" rename
// ---------------------------------------------------------------------------
const i18nPath = "app/(site)/dashboard/lib/dashboardI18n.ts";
const i18n = read(i18nPath);
check(
  "Sidebar group labels present in dashboardI18n.ts",
  ["navGroupInicio", "navGroupMisAnuncios", "navGroupClientesYRendimiento", "navGroupMiActividad", "navGroupCuenta", "navGroupNegocio"].every(
    (key) => i18n.includes(key),
  ),
);
check("Spanish 'Alertas y búsquedas' label present", i18n.includes("Alertas y búsquedas"));
check("English 'Alerts & saved searches' label present", i18n.includes("Alerts & saved searches"));

// ---------------------------------------------------------------------------
// 4. Mobile navigation implementation + accessible state attributes in the shell
// ---------------------------------------------------------------------------
check("Mobile nav open/close state exists in shell", /mobileNavOpen/.test(shell));
check("Mobile nav trigger has aria-expanded", /aria-expanded=\{mobileNavOpen\}/.test(shell));
check("Mobile nav drawer has aria-controls wiring", /aria-controls="lx-dashboard-mobile-nav"/.test(shell) && /id="lx-dashboard-mobile-nav"/.test(shell));
check("Mobile nav drawer is a labeled dialog", /role="dialog"/.test(shell) && /aria-modal="true"/.test(shell));
check("Desktop sidebar hidden below lg (mobile now uses the drawer, not a stacked sidebar)", /hidden h-fit rounded-3xl[\s\S]*lg:block/.test(shell));

// ---------------------------------------------------------------------------
// 5. Sidebar IA — grouped nav rendering present, routes unchanged
// ---------------------------------------------------------------------------
check("Shell renders grouped nav via buildNavGroups/renderNavGroups", /buildNavGroups/.test(shell) && /renderNavGroups/.test(shell));
for (const route of [
  "/dashboard/mis-anuncios",
  "/dashboard/drafts",
  "/dashboard/mensajes",
  "/dashboard/analytics",
  "/dashboard/notificaciones",
  "/dashboard/guardados",
  "/dashboard/busquedas-guardadas",
  "/dashboard/vistos-recientes",
  "/dashboard/perfil",
  "/dashboard/seguridad",
  "/dashboard/business-tools",
]) {
  check(`Shell still routes to ${route}`, shell.includes(route));
}

// ---------------------------------------------------------------------------
// 6. Phase-11 pages reference the shared shell / canonical theme
// ---------------------------------------------------------------------------
const normalizedPages = [
  "app/(site)/dashboard/page.tsx",
  "app/(site)/dashboard/analytics/page.tsx",
  "app/(site)/dashboard/mensajes/page.tsx",
  "app/(site)/dashboard/drafts/page.tsx",
  "app/(site)/dashboard/guardados/page.tsx",
  "app/(site)/dashboard/busquedas-guardadas/page.tsx",
  "app/(site)/dashboard/perfil/page.tsx",
  "app/(site)/dashboard/seguridad/page.tsx",
  "app/(site)/dashboard/notificaciones/page.tsx",
  "app/(site)/dashboard/business-tools/page.tsx",
  "app/(site)/dashboard/vistos-recientes/page.tsx",
];
for (const rel of normalizedPages) {
  const content = read(rel);
  check(`${rel} uses LeonixDashboardShell`, /LeonixDashboardShell/.test(content));
  // Gate 3E moved Account Command Center and Concierge hub titles into shared
  // composers. The heading token remains LX_DASH.pageTitle; it no longer has to
  // live on the route file itself.
  const headingFiles =
    rel === "app/(site)/dashboard/page.tsx"
      ? [rel, "app/(site)/dashboard/components/OwnerAccountCommandCenter.tsx"]
      : rel === "app/(site)/dashboard/business-tools/page.tsx"
        ? [rel, "app/(site)/dashboard/components/BusinessConciergeOwnerHome.tsx"]
        : [rel];
  check(
    `${rel} uses LX_DASH.pageTitle for its page heading`,
    headingFiles.some((f) => /LX_DASH\.pageTitle/.test(f === rel ? content : read(f))),
  );
}
for (const rel of [
  "app/(site)/dashboard/page.tsx",
  "app/(site)/dashboard/analytics/page.tsx",
  "app/(site)/dashboard/notificaciones/page.tsx",
  "app/(site)/dashboard/business-tools/page.tsx",
  "app/(site)/dashboard/busquedas-guardadas/page.tsx",
]) {
  check(`${rel} opts into workbench content layout`, /contentLayout="workbench"/.test(read(rel)));
}

// ---------------------------------------------------------------------------
// 7. /dashboard/messages canonicalizes to /dashboard/mensajes via server redirect
// ---------------------------------------------------------------------------
const messagesAlias = read("app/(site)/dashboard/messages/page.tsx");
check(
  "/dashboard/messages/page.tsx redirects to /dashboard/mensajes (matches analiticas/borradores/notifications pattern)",
  /redirect\(/.test(messagesAlias) && messagesAlias.includes("/dashboard/mensajes") && !messagesAlias.includes('"use client"'),
);

// ---------------------------------------------------------------------------
// 8. Negative checks — Package 1 must not touch feature/data logic
// ---------------------------------------------------------------------------
const changedFiles = gitDiffNameOnly();
const forbiddenPatterns: Array<{ label: string; test: (f: string) => boolean }> = [
  { label: "Stripe/payment source", test: (f) => /stripe|payment|checkout|revenue-os/i.test(f) && !/verify-owner-command-center/i.test(f) },
  { label: "Analytics API/aggregation", test: (f) => /dashboardAnalyticsMetrics|dashboardAnalyticsSummary|api\/dashboard\/analytics|fetchDashboardAnalyticsApi/i.test(f) },
  { label: "Community Trust", test: (f) => /leonixEndorsement|leonix-endorsements|leonixCommunityTrust/i.test(f) },
  { label: "Saved-search runtime", test: (f) => /saved-search|savedSearch(?!es\.ts$)/i.test(f) && /server|delivery|orchestrator|resolver|match/i.test(f) },
  { label: "Ad Branding", test: (f) => /brand.*studio|ad-branding/i.test(f) },
  { label: "Admin", test: (f) => /^app\/admin\//.test(f) },
  { label: "Supabase migration", test: (f) => /^supabase\/migrations\//.test(f) },
];
for (const { label, test } of forbiddenPatterns) {
  const hits = changedFiles.filter(test);
  check(`No ${label} files changed`, hits.length === 0, hits.join(", "));
}

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
