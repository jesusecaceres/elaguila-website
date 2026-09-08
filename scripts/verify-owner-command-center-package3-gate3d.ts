/**
 * Owner Command Center — Package 3, Gate 3D focused verifier.
 *
 * Scope: Viajes Negocios / Privado + Ofertas Locales flyer / coupon / AI scan-review.
 * Confirms shared Layers A/B/C, preserved staged-review and campaign semantics, and
 * no backend rewrite of Viajes review, Ofertas campaign/AI, payments, or migrations.
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

const viajes = read("app/(site)/dashboard/viajes/page.tsx");
const ofertasList = read("app/(site)/dashboard/ofertas-locales/page.tsx");
const ofertasDetail = read("app/(site)/dashboard/ofertas-locales/[id]/page.tsx");
const aiSection = read("app/(site)/dashboard/ofertas-locales/[id]/OfertasLocalesOwnerAiManageSection.tsx");
const registry = read("app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts");
const workspace = read("app/(site)/dashboard/components/OwnerEntityWorkspace.tsx");
const pageFrame = read("app/(site)/dashboard/components/OwnerProductPageFrame.tsx");
const ownerListingsQuery = read("app/(site)/dashboard/lib/ownerListingsQuery.ts");

check("OwnerEntityWorkspace still exists (Layer C)", exists("app/(site)/dashboard/components/OwnerEntityWorkspace.tsx"));
check("OwnerProductPageFrame still exists (Layer B)", exists("app/(site)/dashboard/components/OwnerProductPageFrame.tsx"));
check("Registry has explicit aiScan specialized field", /aiScan: CapabilityState/.test(registry));

// VIAJES
check("VIAJES collection uses LeonixDashboardShell workbench (Layer A)", /contentLayout="workbench"/.test(viajes));
check("VIAJES collection uses OwnerProductPageFrame (Layer B)", /<OwnerProductPageFrame/.test(viajes));
check("VIAJES collection uses OwnerEntityWorkspace (Layer C)", /<OwnerEntityWorkspace/.test(viajes));
check("VIAJES NEGOCIOS: negocios edit route preserved", /\/publicar\/viajes\/negocios/.test(viajes) && /stagedId/.test(viajes));
check("VIAJES PRIVADO: privado edit route preserved", /\/publicar\/viajes\/privado/.test(viajes));
check("VIAJES NEGOCIOS vs PRIVADO share OwnerEntityWorkspace; differ by lane payload only", /viajesLaneBadge/.test(viajes) && /lane === "private"/.test(viajes) && (viajes.match(/<OwnerEntityWorkspace/g) || []).length === 1);
check("VIAJES NEGOCIOS preview route preserved", /\/clasificados\/viajes\/preview\/negocios/.test(viajes));
check("VIAJES PRIVADO preview route preserved", /\/clasificados\/viajes\/preview\/privado/.test(viajes));
check("VIAJES public route preserved (/clasificados/viajes/oferta/{slug})", /\/clasificados\/viajes\/oferta\/\$\{/.test(viajes));
check("VIAJES results route preserved", /\/clasificados\/viajes\/resultados/.test(viajes));
check("VIAJES review-state vocabulary preserved (changes_requested / in_review / approved)", /changes_requested/.test(viajes) && /in_review/.test(viajes) && /lifecycleStatusLabel/.test(viajes));
check("VIAJES does not flatten staged states into pause/archive labels", !/pauseListingLabel/.test(viajes) && !/pauseListingLabel/.test(viajes) && /Cambios solicitados/.test(viajes));
check("VIAJES changes-requested uses caution note + resubmit", /changesNeeded/.test(viajes) && /tone: "warning"/.test(viajes) && /"resubmit"/.test(viajes));
check("VIAJES owner mutation still POSTs /api/clasificados/viajes/staged-owner", /\/api\/clasificados\/viajes\/staged-owner/.test(viajes));
check("VIAJES still loads viajes_staged_listings by owner_user_id (one query)", /from\("viajes_staged_listings"\)/.test(viajes) && (viajes.match(/from\("viajes_staged_listings"\)/g) || []).length === 1);
check("VIAJES table island removed", !/<table/.test(viajes));
check("VIAJES analytics remains unsupported (no fabricated metrics strip)", /viajes: merge\(\{[\s\S]{0,250}?analytics: "unsupported"/.test(registry));
check("VIAJES activity not fabricated as an owner feed", /viajes: merge\(\{[\s\S]{0,1200}?activity: "unsupported"/.test(registry));

// OFERTAS
check("OFERTAS FLYER/COUPON collection uses LeonixDashboardShell workbench", /contentLayout="workbench"/.test(ofertasList));
check("OFERTAS collection uses OwnerProductPageFrame", /<OwnerProductPageFrame/.test(ofertasList));
check("OFERTAS collection uses OwnerEntityWorkspace", /<OwnerEntityWorkspace/.test(ofertasList));
check("OFERTAS FLYER vs COUPON share one campaign entity (type/capability payload)", /getOfertaLocalCommercialProductForOfferType/.test(ofertasList) && /interactive_flyer/.test(ofertasList) && /coupons/.test(ofertasList));
check("OFERTAS FLYER vs COUPON share OwnerEntityWorkspace; differ by lane badge only", /offerLaneBadge/.test(ofertasList) && /Volante/.test(ofertasList) && /Cupón/.test(ofertasList) && !exists("app/(site)/dashboard/ofertas-locales-flyer/page.tsx") && !exists("app/(site)/dashboard/ofertas-locales-coupon/page.tsx"));
check("OFERTAS manage route preserved (/dashboard/ofertas-locales/{id})", /\/dashboard\/ofertas-locales\/\$\{item\.id\}/.test(ofertasList));
check("OFERTAS edit/authoring route preserved (/publicar/ofertas-locales)", /\/publicar\/ofertas-locales/.test(ofertasList));
check("OFERTAS results route preserved (/clasificados/ofertas-locales/results)", /\/clasificados\/ofertas-locales\/results/.test(ofertasList));
check("OFERTAS collection still uses one owner list fetch", (ofertasList.match(/\/api\/ofertas-locales\/owner\?lang=/g) || []).length === 1);
check("OFERTAS collection removed desktop table island", !/<table/.test(ofertasList));
check("OFERTAS collection removed gold-gradient publish island", !/from-\[#E8D48A\]/.test(ofertasList));
check("OFERTAS campaign-state display uses real displayStatus / operational next action", /item\.displayStatus/.test(ofertasList) && /ownerNextActionEs/.test(ofertasList));
check("OFERTAS detail uses OwnerEntityWorkspace (Layer C, no Layer B)", /<OwnerEntityWorkspace/.test(ofertasDetail) && !/<OwnerProductPageFrame/.test(ofertasDetail));
check("OFERTAS detail still GET/PATCHes /api/ofertas-locales/owner/{id}", /\/api\/ofertas-locales\/owner\/\$\{offerId\}/.test(ofertasDetail));
check("OFERTAS renewal specialized module preserved", /OfertasLocalesOwnerRenewalActionCenter/.test(ofertasDetail));
check("OFERTAS AI SCAN / REVIEW specialized module preserved", /OfertasLocalesOwnerAiManageSection/.test(ofertasDetail) && /submitOfertaLocalAiScan/.test(aiSection));
check("OFERTAS AI SCAN / REVIEW is hosted in OwnerEntityWorkspace specialized.children", /specialized=\{\{[\s\S]*children:/.test(ofertasDetail) && /OfertasLocalesOwnerAiManageSection/.test(ofertasDetail));
check("OFERTAS AI internals file still present and was not emptied by this gate", aiSection.length > 100 && /submitOfertaLocalAiScan/.test(aiSection));
check("OFERTAS AI scan still gated on real scan result (no fake success path rewrite)", /if \(!result\.ok\)/.test(aiSection) && /scanJobId/.test(aiSection));
check("OFERTAS analytics only render when not unavailable", /offer\.analytics && !offer\.analytics\.unavailable/.test(ofertasDetail));
check("OFERTAS developer TRUE/FALSE operational flags removed from owner UI", !/sourceReplacementAllowed \? "TRUE"/.test(ofertasDetail));
check("OFERTAS campaign/aiScan capabilities are specialized", /campaign: "specialized"/.test(registry) && /aiScan: "specialized"/.test(registry));
check("OFERTAS renew remains specialized", /"ofertas-locales": merge\(\{[\s\S]{0,700}?renew: "specialized"/.test(registry));

// SHARED
check("SHARED OWNER GRAMMAR: Viajes and Ofertas use OwnerEntityWorkspace", /<OwnerEntityWorkspace/.test(viajes) && /<OwnerEntityWorkspace/.test(ofertasList) && /<OwnerEntityWorkspace/.test(ofertasDetail));
check("SHARED OWNER GRAMMAR: no category === layout branching in OwnerEntityWorkspace", !/category\s*===/.test(workspace));
const specializedTools = read("app/(site)/dashboard/components/OwnerEntitySpecializedTools.tsx");
check("SHARED OWNER GRAMMAR: OwnerEntitySpecializedTools has no category === shell branching", !/category\s*===/.test(specializedTools));
check("ES/EN helpers exist for campaign and AI specialized titles", /export function ownerCampaignModuleTitle/.test(read("app/(site)/dashboard/lib/dashboardI18n.ts")) && /export function ownerAiReviewModuleTitle/.test(read("app/(site)/dashboard/lib/dashboardI18n.ts")));
check("No fake Viajes pause/archive flattening (pauseListingLabel absent)", !/pauseListingLabel/.test(viajes) && !/pauseListingLabel/.test(viajes) && !/archiveListingLabel/.test(viajes));
check("No per-card analytics/AI/entitlement fetch on Viajes or Ofertas collection", !/submitOfertaLocalAiScan/.test(viajes) && !/submitOfertaLocalAiScan/.test(ofertasList) && !/\/api\/ofertas-locales\/owner\/\$\{/.test(ofertasList) && (ofertasList.match(/fetch\(`\/api\/ofertas-locales\/owner/g) || []).length === 1);
check("Shared CTA labels used on Viajes (editListingLabel / publicViewLabel)", /editListingLabel/.test(viajes) && /publicViewLabel/.test(viajes));
check("Shared mobile action sheet labels passed", /mobileSheetLabels/.test(viajes) && /mobileSheetLabels/.test(ofertasList) && /mobileSheetLabels/.test(ofertasDetail));
check("Positive Viajes resubmit uses tone \"positive\"", /tone: "positive"/.test(viajes));
check("Caution Viajes changes-requested uses tone \"warning\"", /tone: "warning"/.test(viajes));
check("Terminal Viajes unpublish uses tone \"danger\"", /tone: "danger"/.test(viajes));
check("Specialized Ofertas tools use tone \"premium\"", /tone: "premium"/.test(ofertasList) && /tone: "premium"/.test(ofertasDetail));
check("No Gate 2A regression: owner listings select session cache still present", /lx_owner_listings_select_v1/.test(ownerListingsQuery));
check("OwnerEntityWorkspace still does not fetch", !/fetch\(/.test(workspace) && !/createSupabaseBrowserClient/.test(workspace));
check("OwnerProductPageFrame still presentational", !/fetch\(/.test(pageFrame) && !/createSupabaseBrowserClient/.test(pageFrame));

const changedFiles = gitDiffNameOnly();
check("No migrations in this gate", !changedFiles.some((f) => /^supabase\/migrations\//.test(f)));
const forbiddenPatterns: Array<{ label: string; test: (f: string) => boolean }> = [
  { label: "Supabase migration", test: (f) => /^supabase\/migrations\//.test(f) },
  { label: "Viajes review/moderation backend", test: (f) => /viajesStagedListingsDbServer\.ts$|api\/admin\/viajes\/|api\/clasificados\/viajes\/submit/.test(f) },
  { label: "Ofertas campaign/AI backend", test: (f) => /ofertasLocalesScanApiHandler\.ts$|ofertasLocalesRenewals\.ts$|api\/ofertas-locales\/scan/.test(f) },
  { label: "Stripe/payment/entitlement writers", test: (f) => /revenueOs|stripe|publishCheckoutCheckpoint|revenuePricingMatrix/.test(f) && !/revenueCategoryCheckoutClient/.test(f) },
  { label: "Community Trust writer", test: (f) => /leonixEndorsementServer\.ts$|leonixEndorsementRegistry\.ts$|api\/leonix-endorsements\/route\.ts$/.test(f) },
  { label: "Analytics event-writing pipeline", test: (f) => /clasificadosAnalytics|listingAnalyticsEventTypes|recordGlobalAnalytics|ofertasLocalesPublicAnalytics\.ts$/.test(f) },
  { label: "Admin OS / app/admin", test: (f) => /^app\/admin\//.test(f) },
  { label: "Recursos", test: (f) => /recursos/i.test(f) && !/OWNER_COMMAND_CENTER/.test(f) },
  { label: "Business Concierge engines", test: (f) => /businessConcierge|livingBusinessBook|healthMap|nextRightMove|diyConcierge|learningCenter/i.test(f) },
  { label: "Iglesias / Ad Branding owner pages", test: (f) => /dashboard\/iglesias|ad-branding/.test(f) },
];
for (const { label, test } of forbiddenPatterns) {
  const hits = changedFiles.filter(test);
  check(`No ${label} files changed`, hits.length === 0, hits.join(", "));
}

check(
  "No backend rewrite: Viajes staged-owner / Ofertas owner APIs still called from adapters",
  /\/api\/clasificados\/viajes\/staged-owner/.test(viajes) && /\/api\/ofertas-locales\/owner/.test(ofertasList) && /\/api\/ofertas-locales\/owner\/\$\{offerId\}/.test(ofertasDetail)
);
check("No new per-card I/O: Viajes one table query; Ofertas one collection fetch", (viajes.match(/from\("viajes_staged_listings"\)/g) || []).length === 1 && (ofertasList.match(/fetch\(`\/api\/ofertas-locales\/owner/g) || []).length === 1);

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
check("No new routes created (no new untracked page.tsx/route.ts)", untrackedNewRoutes.length === 0, untrackedNewRoutes.join(", "));

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
