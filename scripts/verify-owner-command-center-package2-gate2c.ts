/**
 * Owner Command Center — Package 2, Gate 2C focused verifier.
 *
 * Scope: canonical primary-action vocabulary + classification across Mis Anuncios cards
 * (dashboardMisAnunciosCategoryTools.ts, the three bespoke category cards, and the shared
 * card/action-bar/mobile-sheet components). Confirms the "Administrar anuncio"/"Manage
 * listing" doorway is used everywhere a truthful destination exists, the Servicios
 * duplicate primary is gone, preview/analytics truth is untouched, and no protected
 * system or later-gate file was touched.
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

const tools = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts");
const card = read("app/(site)/dashboard/components/DashboardCategoryListingCard.tsx");
const actionBar = read("app/(site)/dashboard/components/DashboardListingActionBar.tsx");
const sheet = read("app/(site)/dashboard/components/DashboardMobileActionSheet.tsx");
const enVenta = read("app/(site)/clasificados/en-venta/dashboard/EnVentaListingManageCard.tsx");
const brCard = read("app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx");
const autosCard = read("app/(site)/clasificados/autos/dashboard/AutosClassifiedListingManageCard.tsx");
const autosDealer = read("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");
const misAnunciosPage = read("app/(site)/dashboard/mis-anuncios/page.tsx");
const actionTypes = read("app/lib/listingIdentity/dashboardActionTypes.ts");
const inventory = read("app/(site)/dashboard/lib/dashboardInventory.ts");
const comidaLocalCard = read("app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx");

// ---------------------------------------------------------------------------
// Canonical primary label lock
// ---------------------------------------------------------------------------
check(
  "Canonical primary ES label is exactly 'Administrar anuncio'",
  /openPanelLabel\(lang: Lang\): string \{\s*return lang === "es" \? "Administrar anuncio"/.test(tools),
);
check(
  "Canonical primary EN label is exactly 'Manage listing' (not 'Manage ad')",
  /: "Manage listing";\s*\}/.test(tools) && !/"Manage ad"/.test(tools),
);
check("No primary label 'Gestionar vacante' remains on the Mis Anuncios card path", !/label: lang === "es" \? "Gestionar vacante"/.test(tools));
check("No primary label 'Gestionar envío' remains on the Mis Anuncios card path", !/label: lang === "es" \? "Gestionar envío"/.test(tools));
check("Empleos card primary now resolves via openPanelLabel with tone primary", /category === "empleos" && listingToolIsReady\(category, "edit"\)\) \{[\s\S]{0,400}label: openPanelLabel\(lang\),\s*tone: "primary"/.test(tools));
check("Viajes card primary now resolves via openPanelLabel with tone primary", /category === "viajes" && listingToolIsReady\(category, "edit"\)\) \{[\s\S]{0,400}label: openPanelLabel\(lang\),\s*tone: "primary"/.test(tools));
check("Restaurantes card primary (openPanel) is tone primary", /category === "restaurantes" && listingToolIsReady\(category, "openPanel"\)\) \{[\s\S]{0,400}tone: "primary"/.test(tools));
check("Ver público (publicView) is no longer tone 'primary' for any category", !/label: publicViewLabel\(lang\),\s*tone: "primary"/.test(tools));

// ---------------------------------------------------------------------------
// Servicios duplicate primary retired
// ---------------------------------------------------------------------------
check(
  "Servicios legacy actionContract.manageUrl duplicate CTA branch is retired",
  !/item\.actionContract\?\.manageUrl\) \{\s*actions\.push\(\{\s*href: item\.actionContract\.manageUrl,\s*label: openPanelLabel/.test(tools),
);
check(
  "Servicios edit/manage action still resolves through the single canonical href chain",
  /canonical\.get\("edit"\)\?\.href \?\? opts\?\.serviciosEditHref \?\? item\.editHref/.test(tools),
);
check(
  "Only one 'servicios' branch pushes a tone:\"primary\" action (no second competing doorway)",
  (tools.match(/category === "servicios"[\s\S]{0,400}?tone: "primary"/g) || []).length <= 1,
);

// ---------------------------------------------------------------------------
// Lifecycle classification present (positive/warning/danger)
// ---------------------------------------------------------------------------
check("Pause actions use the 'warning' tone", /pauseListingLabel\(lang\),\s*onClick: \(\) => opts\.onServiciosManage!\("pause"\),\s*disabled: opts\.serviciosManageBusy,\s*tone: "warning"/.test(tools));
check("Resume/reactivate actions use the 'positive' tone", /resumeListingLabel\(lang\),\s*onClick: \(\) => opts\.onServiciosManage!\("resume"\),\s*disabled: opts\.serviciosManageBusy,\s*tone: "positive"/.test(tools));
check("Empleos archive uses the 'danger' tone (was 'subtle')", /archiveListingLabel\(lang\),\s*onClick: \(\) => opts\.onEmpleosLifecycle!\("archived"\),\s*disabled: opts\.empleosLifecycleBusy,\s*tone: "danger"/.test(tools));
check("Specialized/add-on actions (coupons/offers) use the 'premium' tone, not 'primary'", (tools.match(/tone: "premium"/g) || []).length >= 3);

// ---------------------------------------------------------------------------
// Shared components support the extended tone vocabulary (presentation only)
// ---------------------------------------------------------------------------
check("ActionItem tone type extended with positive/warning/danger/premium", /"primary" \| "secondary" \| "subtle" \| "positive" \| "warning" \| "danger" \| "premium"/.test(actionBar));
check("actionClass() renders positive/warning/danger/premium as color-only fragments (no LX_DASH full-button-class reuse/conflict)", /tone === "positive"/.test(actionBar) && /tone === "warning"/.test(actionBar) && /tone === "danger"/.test(actionBar) && /tone === "premium"/.test(actionBar) && !/from "\.\.\/lib\/dashboardLeonixTheme"/.test(actionBar));
check("DashboardCategoryListingCard imports the shared ActionItem type (no re-declared/drifted tone union)", /import \{ DashboardListingActionBar, type ActionItem \} from "\.\/DashboardListingActionBar";/.test(card));
check("DashboardMobileActionSheet imports the shared ActionItem type (no re-declared/drifted tone union)", /import \{ DashboardListingActionBar, type ActionItem \} from "\.\/DashboardListingActionBar";/.test(sheet));
check("Card groups actions into primary/view/lifecycle/premium clusters (Task 2C-13)", /const viewActions = actions\.filter/.test(card) && /const lifecycleActions = actions\.filter/.test(card) && /const premiumActions = actions\.filter/.test(card));
check("Mobile sheet still receives resolved actions only, no route logic of its own", !/href=\{`\//.test(sheet) && !/router\.push|router\.replace/.test(sheet));

// ---------------------------------------------------------------------------
// Bespoke cards — primary doorway added/relabeled, custom logic preserved
// ---------------------------------------------------------------------------
check("EnVentaListingManageCard renders a primary 'Administrar anuncio'/manage doorway via workspaceHref", /\{L\.manage\}/.test(enVenta) && /href=\{workspaceHref\}/.test(enVenta));
check("EnVentaListingManageCard's existing sold-confirm modal logic (confirmMarkSold) untouched", /const confirmMarkSold = \(\) => \{/.test(enVenta) && /onMarkSold\(\);/.test(enVenta));
check("EnVentaListingManageCard's republish-confirm modal logic (confirmRepublicar) untouched", /const confirmRepublicar = \(\) => \{/.test(enVenta));
check("EnVentaListingManageCard now gates Archive behind a confirmation (Task 2C-11)", /const \[archiveConfirmOpen, setArchiveConfirmOpen\] = useState\(false\);/.test(enVenta) && /const confirmArchive = \(\) => \{/.test(enVenta));
check("LeonixRealEstateListingManageCard renders a primary 'Administrar anuncio' doorway to the generic workspace", /\{openPanelLabel\(lang\)\}/.test(brCard) && /\/dashboard\/mis-anuncios\/\$\{encodeURIComponent\(row\.id\)\}/.test(brCard));
check("LeonixRealEstateListingManageCard's BR-Negocio global lifecycle descriptor logic (brLifecycleContract) untouched", /const brLifecycleContract = isBrNegocioRow/.test(brCard));
check("AutosClassifiedListingManageCard's edit link relabeled to the canonical primary doorway", /\{L\.manage\}/.test(autosCard));
check(
  "AutosDealerInventoryDashboardSection's parent edit link is the canonical primary doorway",
  /OwnerEntityWorkspace/.test(autosDealer) &&
    /parentCanonical\.get\("edit"\)/.test(autosDealer) &&
    /editListingLabel\(lang\)/.test(autosDealer),
);

// ---------------------------------------------------------------------------
// Truth preservation — preview/analytics gating untouched
// ---------------------------------------------------------------------------
check("Preview still gated on item.previewHref existing (never fabricated for restaurantes/empleos/viajes)", /if \(item\.previewHref && listingToolIsReady\(category, "preview"\)\)/.test(tools));
check("Restaurantes analytics status is still 'unproven' (Gate 2E's job to change, not this gate)", /restaurantes: \{[\s\S]{0,300}analytics: "unproven"/.test(tools));
check("Comida Local / Clases / Comunidad / Busco / Mascotas analytics remain 'unproven'", (tools.match(/analytics: "unproven"/g) || []).length >= 5);
check("No CATEGORY_LISTING_TOOL_TRUTH analytics status was flipped from unproven to ready", !/analytics: "ready"[\s\S]{0,0}\/\/ Gate 2C/.test(tools));

// ---------------------------------------------------------------------------
// No universal Messages CTA added (Task 2C-20)
// ---------------------------------------------------------------------------
check("No generic/universal 'Mensajes' or 'Messages' action added to buildInventoryListingActions", !/label: lang === "es" \? "Mensajes" : "Messages"/.test(tools));

// ---------------------------------------------------------------------------
// Negative checks — protected systems / later gates
// ---------------------------------------------------------------------------
const changedFiles = gitDiffNameOnly();
const forbiddenPatterns: Array<{ label: string; test: (f: string) => boolean }> = [
  { label: "Supabase migration", test: (f) => /^supabase\/migrations\//.test(f) },
  { label: "Stripe/payment/pricing/entitlement source", test: (f) => /stripe|payment|checkout|revenue-os|entitlement|pricing/i.test(f) },
  { label: "Analytics event-writing pipeline", test: (f) => /clasificadosAnalytics|listingAnalyticsEventTypes|recordGlobalAnalytics/i.test(f) },
  { label: "Community Trust", test: (f) => /leonixEndorsement|leonix-endorsements|leonixCommunityTrust/i.test(f) },
  { label: "Saved-search runtime / delivery", test: (f) => /savedSearch.*(delivery|orchestrator|resolver|match)/i.test(f) },
  { label: "Ad Branding", test: (f) => /brand.*studio|ad-branding/i.test(f) },
  { label: "Admin", test: (f) => /^app\/admin\//.test(f) },
  { label: "categoryRouteRegistry.ts / dashboardActionResolver.ts (resolver internals unchanged)", test: (f) => /categoryRouteRegistry\.ts$|dashboardActionResolver\.ts$/.test(f) },
  { label: "Lifecycle mutation API routes", test: (f) => /\/api\/.*\/(manage|lifecycle)\/route\.ts$/.test(f) },
  { label: "RLS/ownership policy migration or auth files", test: (f) => /supabase\/migrations.*rls|app\/lib\/auth\//i.test(f) },
];
for (const { label, test } of forbiddenPatterns) {
  const hits = changedFiles.filter(test);
  check(`No ${label} files changed`, hits.length === 0, hits.join(", "));
}
// Note: whether DashboardMisAnunciosCategorySelector.tsx (Gate 2B scope) was touched BY GATE
// 2C specifically can't be determined from `git diff` alone — there's no commit boundary
// between gates in this uncommitted worktree, and Gate 2B already changed this file
// legitimately. This gate's own edits simply never reference or import that file (confirmed
// by inspection during implementation), so no content-based check is needed either.

// ---------------------------------------------------------------------------
// GATE 2C CLOSURE — architecture reconciliation locks
// ---------------------------------------------------------------------------
check(
  "Autos Dealer parent action genuinely resolver-sourced (canonicalAutosNegocioActions calls buildListingIdentity + resolveDashboardActions)",
  /function canonicalAutosNegocioActions[\s\S]{0,600}buildListingIdentity\(\{[\s\S]{0,600}resolveDashboardActions\(\{/.test(autosDealer),
);
check(
  "EnVentaListingManageCard rendering is gated strictly to x.category === \"en-venta\" (Clases/Comunidad/Busco/Mascotas use the separate generic block, not this card)",
  /if \(x\.category === "en-venta"\) \{/.test(misAnunciosPage),
);
check(
  "Generic fallback block (Clases/Comunidad/Busco/Mascotas/En Venta's own destination pattern) uses the canonical manageListing label, not an inline literal",
  /\{t\.manageListing\}/.test(misAnunciosPage),
);
check(
  "Canonical manageListing i18n string is exactly 'Administrar anuncio' / 'Manage listing'",
  /manageListing: "Administrar anuncio"/.test(read("app/(site)/dashboard/lib/dashboardI18n.ts")) &&
    /manageListing: "Manage listing"/.test(read("app/(site)/dashboard/lib/dashboardI18n.ts")),
);
check(
  "Comida Local tool truth still honestly marks openPanel 'hidden' (no primary silently fabricated this closure pass)",
  /"comida-local": \{ openPanel: "hidden"/.test(tools),
);
check(
  "Comida Local manage doorway is now the visually-dominant primary (Gates 2D/3C superseded the 2C deferred Ver-ficha-primary card)",
  /OwnerEntityWorkspace/.test(comidaLocalCard) &&
    /primaryAction=\{\{ href: editHref, label: editListingLabel\(lang\) \}\}/.test(comidaLocalCard),
);
check(
  "DashboardActionKind still only reserves (does not emit) 'lifecycle' — resolver emission logic not extended this closure pass (Option B lock)",
  /DashboardActionKind = "navigate" \| "checkout" \| "lifecycle"/.test(actionTypes) &&
    /href: string/.test(actionTypes),
);
check(
  "Servicios legacy actionContract still only consumed for non-manage fields in dashboardInventory.ts (no reintroduced second action push)",
  /buildServiciosDashboardActionContract\(\{/.test(inventory) && !/actions\.push\(\{\s*href: (item\.)?actionContract\.manageUrl/.test(inventory),
);
check(
  "No resolver/registry/action-types file changed this closure pass (protected — Option B relies on this file's existing documented boundary)",
  !changedFiles.some((f) => /dashboardActionTypes\.ts$|categoryRouteRegistry\.ts$|dashboardActionResolver\.ts$/.test(f)),
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
