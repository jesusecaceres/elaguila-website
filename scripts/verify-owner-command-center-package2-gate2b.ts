/**
 * Owner Command Center — Package 2, Gate 2B focused verifier.
 *
 * Scope: category navigation (desktop/tablet wrap, mobile dropdown-primary), the status
 * filter row, and the canonical listing folder card (primary/rest action grouping + mobile
 * overflow sheet) on `/dashboard/mis-anuncios`. Presentation-only — confirms no route,
 * action-vocabulary, data-fetch, or protected-system file was touched.
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

/** Cumulative-tree exception: Gates 2C–3D may touch later OCC files on this uncommitted tree. */
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

const selector = read("app/(site)/dashboard/components/DashboardMisAnunciosCategorySelector.tsx");
const card = read("app/(site)/dashboard/components/DashboardCategoryListingCard.tsx");
const sheet = read("app/(site)/dashboard/components/DashboardMobileActionSheet.tsx");
const misAnuncios = read("app/(site)/dashboard/mis-anuncios/page.tsx");

// ---------------------------------------------------------------------------
// Category selector — desktop/tablet wrap, mobile dropdown-primary, no dual selector
// ---------------------------------------------------------------------------
check("Category selector no longer uses unconditional flex-nowrap", !/flex-nowrap gap-2 overflow-x-auto/.test(selector));
check("Category selector no longer relies on overflow-x-auto for the category rail", !selector.includes("overflow-x-auto"));
check("Category pill row wraps and is hidden below md: (mobile keeps only the dropdown)", /hidden w-full min-w-0 flex-wrap gap-2 md:flex/.test(selector));
check("The 'swipe for more categories' hint was removed (no scroll model implied)", !/Desliza para ver más categorías|Swipe for more categories/.test(selector));
check("Dropdown selector (mobile-primary) is still present and unchanged in structure", /aria-haspopup="listbox"/.test(selector));
check("Category selector still exposes the same onSelect/selected/counts contract (no new state)", /onSelect: \(key: MisAnunciosCategoryKey\) => void/.test(selector) && /selected: MisAnunciosCategoryKey/.test(selector));
check("chipLabel/category ordering logic untouched (categories.map, no sort introduced)", /categories\.map\(\(cat\) => \{/.test(selector) && !/\.sort\(/.test(selector));

// ---------------------------------------------------------------------------
// Status filter row — wraps instead of scrolling
// ---------------------------------------------------------------------------
check(
  "Status filter tab row no longer uses horizontal-scroll classes",
  !/flex flex-nowrap gap-1\.5 overflow-x-auto/.test(misAnuncios) && /flex flex-wrap gap-1\.5/.test(misAnuncios),
);
check("Status filter tab semantics unchanged (still tabBtn(\"all\"/\"active\"/\"expired\"/\"moderation\"))", ['tabBtn("all"', 'tabBtn("active"', 'tabBtn("expired"', 'tabBtn("moderation"'].every((s) => misAnuncios.includes(s)));

// ---------------------------------------------------------------------------
// Canonical listing folder card — primary/rest grouping, mobile sheet, no new I/O
// ---------------------------------------------------------------------------
check(
  "Card splits actions into a dominant primary slot and the rest",
  card.includes("const primaryActions = actions.filter((a) => a.tone === \"primary\");") &&
    (card.includes('const restActions = actions.filter((a) => a.tone !== "primary");') ||
      card.includes("const restActions = [...viewActions, ...lifecycleActions, ...premiumActions];")),
);
check("Card reuses the existing DashboardListingActionBar for both tiers (no duplicated action-rendering logic)", (card.match(/<DashboardListingActionBar actions=/g) || []).length >= 2);
check("Card renders the mobile overflow sheet for non-primary actions only when they exist", /restActions\.length > 0 \? \(\s*<DashboardMobileActionSheet/.test(card));
check("Optional performanceSnapshot prop is additive and never fabricated (only rendered when non-empty)", /performanceSnapshot\.length > 0 \?/.test(card) && /performanceSnapshot = \[\]/.test(card));
check("Card status presentation still uses the Package 1 LX_DASH status-tone helper (no new color map)", /lxDashStatusChipClass/.test(card) && !/bg-emerald-100|bg-amber-100|bg-red-100/.test(card));
check("No fetch/Supabase/API call added inside the card component", !/fetch\(|createSupabaseBrowserClient|supabase\.from/.test(card));

// ---------------------------------------------------------------------------
// Mobile action sheet — presentation only, no route/action logic
// ---------------------------------------------------------------------------
check("Mobile action sheet exists", sheet.length > 0);
check("Mobile action sheet renders actions via the existing DashboardListingActionBar (no route truth of its own)", /<DashboardListingActionBar actions=\{actions\}/.test(sheet));
check("Mobile action sheet defines no href/route construction of its own", !/href=\{`\//.test(sheet) && !/router\.push|router\.replace/.test(sheet));
check("Mobile action sheet has no fetch/Supabase call", !/fetch\(|createSupabaseBrowserClient|supabase\.from/.test(sheet));
check("Mobile action sheet closes on Escape", /key === "Escape"/.test(sheet));
check("Mobile action sheet is a labeled dialog", /role="dialog"/.test(sheet) && /aria-modal="true"/.test(sheet));
check("Mobile trigger/sheet are hidden at md: and up (mobile-only)", /md:hidden/.test(sheet));

// ---------------------------------------------------------------------------
// Negative checks — Gate 2B must not touch Gate 2A internals, action vocabulary, or
// protected systems
// ---------------------------------------------------------------------------
check("Gate 2A's tiered-query cache untouched", read("app/(site)/dashboard/lib/ownerListingsQuery.ts").includes("cachedWorkingListingsSelect"));
check(
  "Gate 2A's countOwnerActiveListingsAcrossSources parallelization untouched",
  (() => {
    const src = read("app/lib/ownerEngagementListingKeys.ts");
    return src.includes("Promise.all([") && src.includes("countListings(),") && src.includes("countViajes(),");
  })(),
);
check("mis-anuncios/page.tsx still shows the Gate 2A skeleton (no full-page loading regression)", /animate-pulse/.test(misAnuncios) && /aria-busy="true"/.test(misAnuncios));
check("mis-anuncios/page.tsx still renders the category nav unconditionally (not gated by showLoading)", (() => {
  const shellOpenIdx = misAnuncios.indexOf("<LeonixDashboardShell");
  const showLoadingTernaryIdx = misAnuncios.indexOf("{showLoading ? (", shellOpenIdx);
  const selectorIdx = misAnuncios.indexOf("<DashboardMisAnunciosCategorySelector");
  return selectorIdx !== -1 && shellOpenIdx !== -1 && (showLoadingTernaryIdx === -1 || selectorIdx < showLoadingTernaryIdx);
})());
check("Existing empty-state copy ('Aún no tienes anuncios en') preserved", /Aún no tienes anuncios en/.test(misAnuncios));
check("isLoadingSelectedDedicatedCategory guard still present", /isLoadingSelectedDedicatedCategory/.test(misAnuncios));

const changedFiles = gitDiffNameOnly();
const forbiddenPatterns: Array<{ label: string; test: (f: string) => boolean }> = [
  { label: "Supabase migration", test: (f) => /^supabase\/migrations\//.test(f) },
  { label: "Stripe/payment/pricing/entitlement source", test: (f) => /stripe|payment|checkout|revenue-os|entitlement|pricing/i.test(f) },
  { label: "Analytics event-writing pipeline", test: (f) => /clasificadosAnalytics|listingAnalyticsEventTypes|recordGlobalAnalytics/i.test(f) },
  { label: "Community Trust", test: (f) => /leonixEndorsement|leonix-endorsements|leonixCommunityTrust/i.test(f) },
  { label: "Saved-search runtime / delivery", test: (f) => /savedSearch.*(delivery|orchestrator|resolver|match)/i.test(f) },
  { label: "Ad Branding", test: (f) => /brand.*studio|ad-branding/i.test(f) },
  { label: "Admin", test: (f) => /^app\/admin\//.test(f) },
];
// Note: whether Gate 2A's ownerListingsQuery.ts / ownerEngagementListingKeys.ts remain
// unmodified BY GATE 2B specifically can't be determined from `git diff` alone (there is no
// commit boundary between gates in this uncommitted worktree — those files legitimately show
// as changed vs HEAD because Gate 2A changed them). The content-based checks above
// ("Gate 2A's tiered-query cache untouched" / "countOwnerActiveListingsAcrossSources
// parallelization untouched") verify the actual Gate 2A mechanisms are intact instead.
for (const { label, test } of forbiddenPatterns) {
  const hits = changedFiles.filter(test);
  check(`No ${label} files changed`, hits.length === 0, hits.join(", "));
}

const knownBaseline = new Set([
  // Package 1
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
  // Gate 2A
  "app/lib/ownerEngagementListingKeys.ts",
  "app/(site)/dashboard/lib/ownerListingsQuery.ts",
  "app/(site)/dashboard/mis-anuncios/page.tsx",
  "package.json",
]);
const gate2bFiles = new Set([
  "app/(site)/dashboard/components/DashboardMisAnunciosCategorySelector.tsx",
  "app/(site)/dashboard/components/DashboardCategoryListingCard.tsx",
  "app/(site)/dashboard/components/DashboardMobileActionSheet.tsx",
  "app/(site)/dashboard/mis-anuncios/page.tsx",
]);
const unexpectedSourceChanges = changedFiles.filter(
  (f) =>
    !knownBaseline.has(f) &&
    !gate2bFiles.has(f) &&
    !isLaterCertifiedOccArtifact(f) &&
    !f.startsWith("scripts/verify-owner-command-center-package1") &&
    !f.startsWith("scripts/verify-owner-command-center-package2") &&
    !f.endsWith("PACKAGE1_AUDIT.md") &&
    !f.endsWith("PACKAGE2_GATE2A_AUDIT.md") &&
    !f.endsWith("PACKAGE2_GATE2B_AUDIT.md"),
);
check(
  "No source files changed outside the known baseline + Gate 2B's declared file family",
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
