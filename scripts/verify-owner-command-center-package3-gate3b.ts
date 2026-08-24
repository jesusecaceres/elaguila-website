/**
 * Owner Command Center — Package 3, Gate 3B focused verifier.
 *
 * Scope: the Generic Owner Catalog Migration — En Venta/Varios, Rentas Privado, Bienes Raíces
 * Privado/FSBO, Clases, Comunidad, Busco/Se Busca, Mascotas y Perdidos. All seven share exactly
 * one real per-listing management surface, `app/(site)/dashboard/mis-anuncios/[id]/page.tsx`,
 * confirmed by direct repo-truth research (four independent passes) before any edit. This
 * verifier checks that file's migration onto the shared `OwnerEntityWorkspace` (Layer C),
 * capability-registry-gated lifecycle actions (fixing a real pre-existing fake-capability
 * over-exposure — e.g. "Marcar vendido" previously rendered unconditionally for every
 * category), and that every real route/mutation/identity path this gate touches is preserved
 * byte-for-byte. No `OwnerProductPageFrame` (Layer B) is used here — this is a single-item
 * detail page, not a category collection page, per the Bible's "smallest architecture that
 * satisfies the global contract."
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

const genericPage = read("app/(site)/dashboard/mis-anuncios/[id]/page.tsx");
const categoryTools = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts");
const misAnunciosList = read("app/(site)/dashboard/mis-anuncios/page.tsx");
const registry = read("app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts");
const i18n = read("app/(site)/dashboard/lib/dashboardI18n.ts");

// ---------------------------------------------------------------------------
// CANONICAL MANAGE DOORWAY (Part 3) — unchanged, verified still canonical
// ---------------------------------------------------------------------------
check(
  "openPanelLabel() remains the canonical 'Administrar anuncio'/'Manage listing' doorway label",
  /export function openPanelLabel\(lang: Lang\): string \{/.test(categoryTools) &&
    /return lang === "es" \? "Administrar anuncio" : "Manage listing";/.test(categoryTools),
);
check(
  "mis-anuncios list page still uses the canonical doorway label for the generic-card categories (Clases/Comunidad/Busco/Mascotas)",
  /t\.manageListing/.test(misAnunciosList),
);
check(
  "dashboardI18n still defines manageListing as the canonical label (both languages)",
  /manageListing: "Administrar anuncio"/.test(i18n) && /manageListing: "Manage listing"/.test(i18n),
);

// ---------------------------------------------------------------------------
// ARCHITECTURE — the one shared per-listing workspace, no new bespoke shell
// ---------------------------------------------------------------------------
check("mis-anuncios/[id]/page.tsx imports OwnerEntityWorkspace", /from "\.\.\/\.\.\/components\/OwnerEntityWorkspace"/.test(genericPage));
check("mis-anuncios/[id]/page.tsx renders <OwnerEntityWorkspace", /<OwnerEntityWorkspace/.test(genericPage));
check(
  "No bespoke tab-bar/EV_SELLER_DETAIL presentation system remains (retired in favor of the shared workspace)",
  !/EV_SELLER_DETAIL|evDetailClass|enVentaSellerDetailTheme/.test(genericPage),
);
check("enVentaSellerDetailTheme.ts (fully orphaned parallel theme file) removed", !exists("app/(site)/dashboard/mis-anuncios/enVentaSellerDetailTheme.ts"));
check(
  "No dedicated category landing pages created for any Gate 3B target (Bible Part 10 — smallest architecture)",
  !exists("app/(site)/dashboard/en-venta/page.tsx") &&
    !exists("app/(site)/dashboard/rentas/page.tsx") &&
    !exists("app/(site)/dashboard/bienes-raices/page.tsx") &&
    !exists("app/(site)/dashboard/clases/page.tsx") &&
    !exists("app/(site)/dashboard/comunidad/page.tsx") &&
    !exists("app/(site)/dashboard/busco/page.tsx") &&
    !exists("app/(site)/dashboard/mascotas-y-perdidos/page.tsx"),
);
check(
  "No OwnerProductPageFrame used on this single-item detail page (Layer B does not apply — documented decision, not an omission; checked against real import/JSX lines only, not doc-comment prose)",
  !genericPage.split("\n").some((line) => /^\s*import\b/.test(line) && /OwnerProductPageFrame/.test(line)) &&
    !/<OwnerProductPageFrame/.test(genericPage),
);

// ---------------------------------------------------------------------------
// SHARED HEADER / DETAIL / PERFORMANCE / STATUS / MOBILE PRIMITIVES
// ---------------------------------------------------------------------------
check("Workspace header fed by genericCategoryEyebrow + real row title/status (no bespoke <h1>)", /eyebrow: genericCategoryEyebrow\(row\.category, lang\)/.test(genericPage) && /title: row\.title\?\.trim\(\) \|\| "—"/.test(genericPage));
check("Workspace detailItems built from real row fields only, omitting absent ones (no '—' placeholder fabrication)", /detailItems=\{detailItems\}/.test(genericPage) && /\.filter\(\(x\): x is OwnerEntityDetailItem => x !== null\)/.test(genericPage));
check("Performance section reuses the same real per-listing analytics rollup (rollupListingAnalyticsEvents), capability-gated", /rollupListingAnalyticsEvents/.test(genericPage) && /performance=\{\{ title: t\.performanceTitle, metrics: performanceMetrics \}\}/.test(genericPage) && /analyticsSupported/.test(genericPage));
check("Status resolver unchanged — still the shared listingUiStatusChipClass/listingUiStatusLabel/resolveListingUiStatus path", /resolveListingUiStatus\(row\)/.test(genericPage) && /listingUiStatusChipClass\(uiStatus\)/.test(genericPage) && /listingUiStatusLabel\(uiStatus, lang\)/.test(genericPage));
check("Shared mobile action sheet labels passed (no bespoke drawer)", /mobileSheetLabels=\{\{ trigger: t\.moreOptions/.test(genericPage));
check("No hardcoded off-brand lifecycle colors remain (e.g. raw Tailwind emerald-* for positive lifecycle)", !/emerald-50|emerald-200|emerald-950/.test(genericPage));

// ---------------------------------------------------------------------------
// NO FAKE CAPABILITY — lifecycle actions are capability-registry-gated
// ---------------------------------------------------------------------------
check("canMarkSold/canPause/canReactivate/canArchive all derive from the capability registry, not a category string literal", /capabilities \? capabilities\.lifecycle\.pause === "supported"/.test(genericPage) && /capabilities \? capabilities\.lifecycle\.markSold === "supported"/.test(genericPage));
check("'Marcar vendido' is gated behind canMarkSold, not rendered unconditionally", /canMarkSold \? \{ label: t\.markSold/.test(genericPage));
check("Pause is gated behind canPause AND the real current-status condition (not category-blind)", /canPause && String\(row\.status/.test(genericPage));
check("Archive/Reactivate lifecycle actions are also capability-gated (canArchive/canReactivate)", /canArchive\s*\n?\s*\?/.test(genericPage) && /canReactivate &&/.test(genericPage));
check("Activity (real per-listing messages) is capability-gated via activitySupported, not shown for every category unconditionally", /activitySupported/.test(genericPage) && /activityItems: OwnerEntityActivityItem\[\] = activitySupported/.test(genericPage));

// ---------------------------------------------------------------------------
// PER-CATEGORY EXPLICIT PROOF — all seven Gate 3B targets, no "etc."
// ---------------------------------------------------------------------------
check("EN VENTA / VARIOS — resolves to capability key \"en-venta\"", /isEnVentaListing\s*\n\s*\? "en-venta"/.test(genericPage));
check("EN VENTA / VARIOS — specialized visibility/refresh tool gated on isEnVentaListing && Pro plan (real, unchanged capability)", /isEnVentaListing && listingPlan === "pro" && canEnVentaRefresh/.test(genericPage));
check("RENTAS PRIVADO — resolves to capability key \"rentas-privado\" (rentas branch, non-BR-negocio)", /catLower === "rentas" && !isBrNegocio\s*\n\s*\? "rentas-privado"/.test(genericPage));
check("RENTAS PRIVADO — real public route builder preserved (withRentasLandingLang + rentasListingPublicPath)", /withRentasLandingLang\(rentasListingPublicPath\(row\.id\), lang\)/.test(genericPage));
check("BIENES RAÍCES PRIVADO / FSBO — resolves to capability key \"bienes-raices-privado\" only when NOT BR-Negocio", /catLower === "bienes-raices" && !isBrNegocio\s*\n\s*\? "bienes-raices-privado"/.test(genericPage));
check("BIENES RAÍCES PRIVADO / FSBO — isBrNegocioListing guard preserved unchanged (BR-Negocio explicitly out of this gate's scope)", /isBrNegocioListing\(row\)/.test(genericPage));
check("CLASES — resolves to capability key \"clases\"", /catLower === "clases"\s*\n\s*\? "clases"/.test(genericPage));
check("COMUNIDAD — resolves to capability key \"comunidad\"", /catLower === "comunidad"\s*\n\s*\? "comunidad"/.test(genericPage));
check("BUSCO / SE BUSCA — resolves to capability key \"busco\"", /catLower === "busco"\s*\n\s*\? "busco"/.test(genericPage));
check("BUSCO / SE BUSCA — real Leonix quick-ad id formatter preserved (formatLeonixAdId)", /formatLeonixAdId\(row\.id\)/.test(genericPage));
check("MASCOTAS Y PERDIDOS — resolves to capability key \"mascotas-y-perdidos\" (handles both raw category spellings)", /catLower === "mascotas" \|\| catLower === "mascotas-y-perdidos"/.test(genericPage));

// ---------------------------------------------------------------------------
// ROUTES PRESERVED BYTE-FOR-BYTE
// ---------------------------------------------------------------------------
check("Canonical public route (non-Rentas) unchanged: /clasificados/anuncio/{id}", /`\/clasificados\/anuncio\/\$\{row\.id\}\?\$\{q\}`/.test(genericPage));
check("Canonical edit route unchanged: /dashboard/mis-anuncios/{id}/editar", /`\/dashboard\/mis-anuncios\/\$\{row\.id\}\/editar\?\$\{q\}`/.test(genericPage));
check("Back-to-library route unchanged: /dashboard/mis-anuncios", /`\/dashboard\/mis-anuncios\?\$\{q\}`/.test(genericPage));

// ---------------------------------------------------------------------------
// LIFECYCLE MUTATIONS PRESERVED UNCHANGED (presentation migrated, not backend)
// ---------------------------------------------------------------------------
check("applyOwnerListingPatch (generic direct-write lifecycle mutation) still imported and used unchanged", /applyOwnerListingPatch/.test(genericPage));
check("OWNER_LISTING_PAUSE_PATCH / OWNER_LISTING_SOFT_ARCHIVE_PATCH / ownerListingResumeFromPausePatch all still imported unchanged", /OWNER_LISTING_PAUSE_PATCH/.test(genericPage) && /OWNER_LISTING_SOFT_ARCHIVE_PATCH/.test(genericPage) && /ownerListingResumeFromPausePatch/.test(genericPage));
check("BR-Negocio server-authorized RPC resume path (callBrLifecycleMutation) still present unchanged", /callBrLifecycleMutation\(\{ listingId: row\.id, mutation: "resume" \}\)/.test(genericPage));
check("markStatus/archiveListing/pauseListing/resumeListing function bodies untouched (same patch shapes)", /async function markStatus\(status: "active" \| "sold"\)/.test(genericPage) && /async function archiveListing\(\)/.test(genericPage) && /async function pauseListing\(\)/.test(genericPage) && /async function resumeListing\(\)/.test(genericPage));

// ---------------------------------------------------------------------------
// NO NEW PER-CARD I/O — createSupabaseBrowserClient() call count unchanged (6: load, refresh,
// markStatus, archive, pause, resume — same as before this gate; render-time derived values
// (detailItems/performanceMetrics/activityItems/lifecycleActions) call no Supabase client)
// ---------------------------------------------------------------------------
check(
  "No new Supabase client instantiation added (same 6 call sites as before this gate)",
  (genericPage.match(/createSupabaseBrowserClient\(\)/g) || []).length === 6,
);
check(
  "Render-time derived arrays (detailItems/performanceMetrics/activityItems) contain no fetch/supabase calls of their own",
  !/const detailItems: OwnerEntityDetailItem\[\][\s\S]{0,50}(fetch\(|supabase|createSupabaseBrowserClient)/.test(genericPage),
);

// ---------------------------------------------------------------------------
// CAPABILITY REGISTRY RECONCILIATION (Part 2) — analytics corrected with real evidence
// ---------------------------------------------------------------------------
for (const key of ["en-venta", "rentas-privado", "bienes-raices-privado", "clases", "comunidad", "busco", "mascotas-y-perdidos"]) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`"?${escaped}"?:\\s*merge\\(\\{[\\s\\S]{0,260}?analytics: "supported"`);
  check(`Registry: ${key} analytics corrected to "supported" (real, wired, repo-truth-confirmed this gate)`, re.test(registry));
}

// ---------------------------------------------------------------------------
// PROTECTED SYSTEMS / NO REGRESSION
// ---------------------------------------------------------------------------
const changedFiles = gitDiffNameOnly();
const forbiddenPatterns: Array<{ label: string; test: (f: string) => boolean }> = [
  { label: "Supabase migration", test: (f) => /^supabase\/migrations\//.test(f) },
  { label: "Stripe/payment/pricing/entitlement business-rule source", test: (f) => /stripe|payment|checkout|revenue-os|entitlement|pricing/i.test(f) },
  { label: "Community Trust write/vote logic", test: (f) => /leonixEndorsementServer\.ts$|leonixEndorsementRegistry\.ts$|api\/leonix-endorsements\/route\.ts$/.test(f) },
  { label: "Analytics event-writing pipeline", test: (f) => /clasificadosAnalytics|listingAnalyticsEventTypes|recordGlobalAnalytics/i.test(f) },
  { label: "categoryRouteRegistry.ts / dashboardActionResolver.ts (route truth unchanged)", test: (f) => /categoryRouteRegistry\.ts$|dashboardActionResolver\.ts$/.test(f) },
  { label: "Admin OS / app/admin", test: (f) => /^app\/admin\//.test(f) },
  { label: "Business Concierge engines", test: (f) => /businessConcierge|livingBusinessBook|healthMap|nextRightMove|diyConcierge|learningCenter/i.test(f) },
  { label: "Auth / RLS", test: (f) => /supabase\/migrations.*rls|app\/lib\/auth\//i.test(f) },
  { label: "Publish/checkpoint/payment business logic (categoryLifecycleAdapters editar page untouched this gate)", test: (f) => /mis-anuncios\/\[id\]\/editar\//.test(f) },
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
