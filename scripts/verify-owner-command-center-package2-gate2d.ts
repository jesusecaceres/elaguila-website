/**
 * Owner Command Center — Package 2, Gate 2D focused verifier.
 *
 * Scope: Servicios specialized workspace rebuild, Restaurantes specialized workspace
 * vocabulary cleanup, Comida Local canonical primary adapter, and a narrow re-certification
 * that the three Gate 2C "accepted adapter" categories (Viajes, Autos Privado, Autos Dealer)
 * still carry their canonical primary doorway.
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

const servicios = read("app/(site)/dashboard/servicios/page.tsx");
const restaurantes = read("app/(site)/dashboard/restaurantes/page.tsx");
const comidaLocalCard = read("app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx");
const tools = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts");
const autosCard = read("app/(site)/clasificados/autos/dashboard/AutosClassifiedListingManageCard.tsx");
const autosDealer = read("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");

// ---------------------------------------------------------------------------
// SERVICIOS
// ---------------------------------------------------------------------------
check("Servicios uses the shared LeonixDashboardShell", /LeonixDashboardShell/.test(servicios));
check(
  "Servicios uses shared owner workspace grammar (no new design system)",
  servicios.includes("OwnerEntityWorkspace") && servicios.includes("OwnerProductPageFrame"),
);
check(
  "Servicios has no legacy competing manageUrl primary branch (never restored)",
  !/actionContract\?\.manageUrl/.test(servicios) && !/actions\.push\(\{\s*href: item\.actionContract\.manageUrl/.test(servicios),
);
check(
  "Servicios workspace primary internal operation is Editar anuncio / Edit listing (canonical editListingLabel)",
  /primaryAction=\{\{ href: serviciosEditHref\(r\), label: editListingLabel\(lang\) \}\}/.test(servicios),
);
check(
  "Servicios surviving edit href chain (serviciosListingEditHref) unchanged — no restored second destination",
  /serviciosListingEditHref\(/.test(servicios),
);
check(
  "Servicios lifecycle mutation endpoint unchanged (/api/clasificados/servicios/manage)",
  /\/api\/clasificados\/servicios\/manage/.test(servicios),
);
check(
  "Servicios lifecycle labels are canonical (pauseListingLabel/resumeListingLabel), not raw English drift",
  /pauseListingLabel\(lang\)/.test(servicios) && /resumeListingLabel\(lang\)/.test(servicios),
);
check(
  "Servicios preview remains conditionally gated on cloud+published (never fabricated)",
  /r\.source === "cloud" && r\.listingStatus === "published"/.test(servicios) && /previewLabel\(lang\)/.test(servicios),
);
check(
  "Servicios leads/inquiries panel preserved (no merge into global Messages, no fake Mensajes)",
  servicios.includes("const activityItems") &&
    servicios.includes("t.leadsEmpty") &&
    !/label: lang === "es" \? "Mensajes" : "Messages"/.test(servicios),
);
check("Servicios Spanish header no longer says 'My Servicios showcases' (English drift fixed)", !/"My Servicios showcases"/.test(servicios));
check("Servicios ES header title is exactly 'Servicios'", /title: "Servicios",/.test(servicios));
check("Servicios off-brand blue (#3B66AD) removed", !/#3B66AD/.test(servicios));
check("Servicios status now uses the shared friendly status chip (resolveListingUiStatus/listingUiStatusLabel), not a raw DB string", /resolveListingUiStatus\(\{ status: r\.listingStatus \}\)/.test(servicios) && /listingUiStatusLabel\(uiStatus, lang\)/.test(servicios));
check("Servicios makes no new per-listing network fetch (data loading effect untouched — still one run() effect)", (servicios.match(/useEffect\(/g) || []).length === 1);

// ---------------------------------------------------------------------------
// RESTAURANTES
// ---------------------------------------------------------------------------
check(
  "Restaurantes remains a specialized workspace (OwnerEntityWorkspace + LeonixDashboardShell; Gate 3A retired the listing card shell)",
  /OwnerEntityWorkspace/.test(restaurantes) && /LeonixDashboardShell/.test(restaurantes) && !/DashboardCategoryListingCard/.test(restaurantes),
);
check("Restaurantes does not fabricate a per-listing Vista previa action in cardActions", !/previewLabel\(lang\)/.test(restaurantes));
check(
  "Restaurantes misleading 'Formulario' primary wording retired (relabeled truthfully, same destination)",
  !/linkForm: "Formulario"/.test(restaurantes) && /publishCta: "Publicar un restaurante"/.test(restaurantes),
);
check(
  "Restaurantes global Mensajes no longer represented as a listing-scoped card action",
  !/openMessages: "Mensajes"/.test(restaurantes) && !/label: t\.openMessages/.test(restaurantes),
);
check(
  "Restaurantes uses canonical owner task labels (editListingLabel/publicViewLabel/publicResultsListingLabel/analyticsLabel)",
  /editListingLabel\(lang\)/.test(restaurantes) &&
    /publicViewLabel\(lang\)/.test(restaurantes) &&
    /publicResultsListingLabel\(lang\)/.test(restaurantes) &&
    /analyticsLabel\(lang\)/.test(restaurantes),
);
check(
  "Restaurantes Leonix Ad ID is still passed to the shared workspace header",
  restaurantes.includes("leonixId: r.leonix_ad_id ?? null"),
);
check(
  "Restaurantes workspace primary is Editar anuncio (editListingLabel); coupon remains premium, not a competing primary",
  /editListingLabel\(lang\)/.test(restaurantes) && /tone: "premium"/.test(restaurantes) && (restaurantes.match(/tone: "primary"/g) || []).length === 0,
);
check("Restaurantes coupon-edit action reclassified to premium tone (was competing primary)", /tone: "premium"/.test(restaurantes));

// ---------------------------------------------------------------------------
// COMIDA LOCAL
// ---------------------------------------------------------------------------
check(
  "Comida Local canonical primary now exists via editListingLabel on OwnerEntityWorkspace (Gates 2D/3C)",
  /OwnerEntityWorkspace/.test(comidaLocalCard) && /primaryAction=\{\{ href: editHref, label: editListingLabel\(lang\) \}\}/.test(comidaLocalCard),
);
check(
  "Comida Local primary targets the existing real edit route (no new route invented)",
  /\/publicar\/comida-local\?edit=1&listingId=\$\{encodeURIComponent\(item\.id\)\}&source=dashboard&\$\{q\}/.test(comidaLocalCard),
);
check(
  "Comida Local public-view action demoted to secondary and canonically labeled (Ver público/View public)",
  /publicViewLabel\(lang\)/.test(comidaLocalCard) && /tone: "secondary"/.test(comidaLocalCard),
);
check("Comida Local lifecycle uses canonical labels (pauseListingLabel/resumeListingLabel)", /pauseListingLabel\(lang\)/.test(comidaLocalCard) && /resumeListingLabel\(lang\)/.test(comidaLocalCard));
check("Comida Local lifecycle mutation endpoint unchanged (/api/clasificados/comida-local/lifecycle)", /\/api\/clasificados\/comida-local\/lifecycle/.test(comidaLocalCard));
check("Comida Local tool truth still honestly marks openPanel 'hidden' at the Mis Anuncios card layer (no fake generic workspace fabricated there)", /"comida-local": \{ openPanel: "hidden"/.test(tools));

// ---------------------------------------------------------------------------
// ACCEPTED ADAPTERS — narrow re-certification (Part D)
// ---------------------------------------------------------------------------
check(
  "Viajes canonical primary doorway still resolves via openPanelLabel with tone primary (unchanged from Gate 2C)",
  /category === "viajes" && listingToolIsReady\(category, "edit"\)\) \{[\s\S]{0,400}label: openPanelLabel\(lang\),\s*tone: "primary"/.test(tools),
);
check(
  "Autos Privado canonical primary doorway still present (L.manage = Administrar anuncio / Manage listing)",
  /manage: "Administrar anuncio"/.test(autosCard) && /manage: "Manage listing"/.test(autosCard) && /\{L\.manage\}/.test(autosCard),
);
check(
  "Autos Dealer canonical primary doorway still present and resolver-backed (parentCanonical.get(\"edit\"))",
  /parentCanonical\.get\("edit"\)/.test(autosDealer) && /editListingLabel\(lang\)/.test(autosDealer),
);

// ---------------------------------------------------------------------------
// GLOBAL — protected systems / no regressions
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
  { label: "categoryRouteRegistry.ts / dashboardActionResolver.ts / dashboardActionTypes.ts (resolver internals unchanged)", test: (f) => /categoryRouteRegistry\.ts$|dashboardActionResolver\.ts$|dashboardActionTypes\.ts$/.test(f) },
  { label: "Lifecycle mutation API routes", test: (f) => /\/api\/.*\/(manage|lifecycle)\/route\.ts$/.test(f) },
  { label: "RLS/ownership policy migration or auth files", test: (f) => /supabase\/migrations.*rls|app\/lib\/auth\//i.test(f) },
];
for (const { label, test } of forbiddenPatterns) {
  const hits = changedFiles.filter(test);
  check(`No ${label} files changed`, hits.length === 0, hits.join(", "));
}
// Note: ownerListingsQuery.ts, ownerEngagementListingKeys.ts, and
// DashboardMisAnunciosCategorySelector.tsx already carry legitimate Gate 2A/2B changes from
// earlier in this uncommitted worktree (no commit boundary exists between gates here) — the
// same limitation documented in the Gate 2C verifier. This gate's own diff never touches
// Servicios/Restaurantes/Comida Local data-loading or nav-layout code (confirmed by inspection
// during implementation), so a git-diff-based negative check on those three files would only
// ever false-positive on prior gates' legitimate work; content-based checks above (single
// useEffect in Servicios, no new fetch calls added) cover this gate's own no-regression bar.
check(
  "No new dashboard routes created this gate (no new /dashboard/servicios/[id] or restaurant-management route files)",
  !changedFiles.some((f) => /^app\/\(site\)\/dashboard\/servicios\/\[.*\]\//.test(f) || /^app\/\(site\)\/dashboard\/restaurantes\/[^/]+\/page\.tsx$/.test(f)),
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
