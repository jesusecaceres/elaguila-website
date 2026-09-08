/**
 * Owner Command Center — Final Engineering Reconciliation verifier.
 *
 * Whole-product contract: Layers A/B/C, shared shell/frame/workspace, capability registry,
 * canonical routes, specialized families, Account Command Center, Business Concierge owner
 * boundary, Community Trust / external reputation separation, CTA/status semantics,
 * Gate 2A I/O doctrine, protected systems, and no fake truth.
 *
 * This is not a clone of any single prior gate.
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

function gitStatusShort(): string[] {
  try {
    return execSync("git status --short", { cwd: ROOT, encoding: "utf8" })
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function hasWorkbench(src: string): boolean {
  return /contentLayout="workbench"/.test(src);
}

function withoutComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

const shell = read("app/(site)/dashboard/components/LeonixDashboardShell.tsx");
const theme = read("app/(site)/dashboard/lib/dashboardLeonixTheme.ts");
const i18n = read("app/(site)/dashboard/lib/dashboardI18n.ts");
const registry = read("app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts");
const pageFrame = read("app/(site)/dashboard/components/OwnerProductPageFrame.tsx");
const workspace = read("app/(site)/dashboard/components/OwnerEntityWorkspace.tsx");
const header = read("app/(site)/dashboard/components/OwnerEntityHeader.tsx");
const detailGrid = read("app/(site)/dashboard/components/OwnerEntityDetailGrid.tsx");
const performance = read("app/(site)/dashboard/components/OwnerEntityPerformance.tsx");
const communityTrust = read("app/(site)/dashboard/components/OwnerEntityCommunityTrust.tsx");
const externalRep = read("app/(site)/dashboard/components/OwnerEntityExternalReputation.tsx");
const activity = read("app/(site)/dashboard/components/OwnerEntityActivity.tsx");
const specialized = read("app/(site)/dashboard/components/OwnerEntitySpecializedTools.tsx");
const mobileSheet = read("app/(site)/dashboard/components/DashboardMobileActionSheet.tsx");
const actionBar = read("app/(site)/dashboard/components/DashboardListingActionBar.tsx");
const commandCenter = read("app/(site)/dashboard/components/OwnerAccountCommandCenter.tsx");
const needsAttention = read("app/(site)/dashboard/components/OwnerNeedsAttention.tsx");
const accountPerf = read("app/(site)/dashboard/components/OwnerAccountPerformance.tsx");
const entitiesPreview = read("app/(site)/dashboard/components/OwnerManagedEntitiesPreview.tsx");
const recentActivity = read("app/(site)/dashboard/components/OwnerRecentActivity.tsx");
const growth = read("app/(site)/dashboard/components/OwnerBusinessGrowthEntry.tsx");
const conciergeHome = read("app/(site)/dashboard/components/BusinessConciergeOwnerHome.tsx");
const ownerListingsQuery = read("app/(site)/dashboard/lib/ownerListingsQuery.ts");
const categoryTools = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts");
const actionResolver = read("app/lib/listingIdentity/dashboardActionResolver.ts");

const dashboard = read("app/(site)/dashboard/page.tsx");
const misAnuncios = read("app/(site)/dashboard/mis-anuncios/page.tsx");
const genericEntity = read("app/(site)/dashboard/mis-anuncios/[id]/page.tsx");
const servicios = read("app/(site)/dashboard/servicios/page.tsx");
const restaurantes = read("app/(site)/dashboard/restaurantes/page.tsx");
const empleosList = read("app/(site)/dashboard/empleos/page.tsx");
const empleosDetail = read("app/(site)/dashboard/empleos/[listingId]/page.tsx");
const viajes = read("app/(site)/dashboard/viajes/page.tsx");
const ofertasList = read("app/(site)/dashboard/ofertas-locales/page.tsx");
const ofertasDetail = read("app/(site)/dashboard/ofertas-locales/[id]/page.tsx");
const businessTools = read("app/(site)/dashboard/business-tools/page.tsx");
const autosSection = read("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");
const comida = read("app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx");

const drafts = read("app/(site)/dashboard/drafts/page.tsx");
const analytics = read("app/(site)/dashboard/analytics/page.tsx");
const analyticsListing = read("app/(site)/dashboard/analytics/listing/page.tsx");
const messages = read("app/(site)/dashboard/mensajes/page.tsx");
const notifications = read("app/(site)/dashboard/notificaciones/page.tsx");
const profile = read("app/(site)/dashboard/perfil/page.tsx");
const security = read("app/(site)/dashboard/seguridad/page.tsx");
const recent = read("app/(site)/dashboard/vistos-recientes/page.tsx");
const saved = read("app/(site)/dashboard/guardados/page.tsx");
const savedSearches = read("app/(site)/dashboard/busquedas-guardadas/page.tsx");

// ---------------------------------------------------------------------------
// PACKAGE 1 — SHARED SHELL
// ---------------------------------------------------------------------------
check("PACKAGE 1: LeonixDashboardShell exists", exists("app/(site)/dashboard/components/LeonixDashboardShell.tsx"));
check("PACKAGE 1: shell exposes contentLayout workbench|default", /contentLayout\?: "default" \| "workbench"/.test(shell));
check("PACKAGE 1: single canonical theme LX_DASH", /export const LX_DASH = \{/.test(theme) && !exists("app/(site)/dashboard/lib/dashboardAltTheme.ts"));
check("PACKAGE 1: mobile drawer state exists", /mobileNavOpen/.test(shell));
check("PACKAGE 1: /dashboard/messages aliases /dashboard/mensajes", /\/dashboard\/mensajes/.test(read("app/(site)/dashboard/messages/page.tsx")));

// ---------------------------------------------------------------------------
// GATE 2A — PERFORMANCE CONTRACT
// ---------------------------------------------------------------------------
check("GATE 2A: session-scoped listings SELECT cache key intact", /lx_owner_listings_select_v1/.test(ownerListingsQuery));
check(
  "GATE 2A: cache is sessionStorage only (not localStorage)",
  /sessionStorage/.test(ownerListingsQuery) && !/localStorage\.(getItem|setItem|removeItem)/.test(withoutComments(ownerListingsQuery)),
);
check("GATE 2A: tiered SELECT shrink on missing columns remains", /missingListingsColumnName/.test(ownerListingsQuery) && /stripSelectColumn/.test(ownerListingsQuery));
check("GATE 2A: workspace/frame still presentational (no fetch)", !/fetch\(/.test(workspace) && !/fetch\(/.test(pageFrame) && !/createSupabaseBrowserClient/.test(workspace));
check("GATE 2A: no per-card fetch inside OwnerEntityPerformance", !/fetch\(/.test(performance) && !/createSupabaseBrowserClient/.test(performance));
check("GATE 2A: Community Trust component does not fetch", !/fetch\(/.test(communityTrust));
check("GATE 2A: Autos dealer inventory still one listings fetch", (autosSection.match(/fetch\("\/api\/clasificados\/autos\/listings"/g) || []).length === 1);
check("GATE 2A: Viajes still one staged-listings query", (viajes.match(/from\("viajes_staged_listings"\)/g) || []).length === 1);
check("GATE 2A: Empleos detail does not block first paint on applications", /setLoading\(false\)/.test(empleosDetail) && /refreshApplications/.test(empleosDetail));

// ---------------------------------------------------------------------------
// GATE 2B — CATEGORY NAVIGATION + LISTING FOLDER CARD
// ---------------------------------------------------------------------------
check("GATE 2B: mis-anuncios list uses LeonixDashboardShell workbench", /<LeonixDashboardShell/.test(misAnuncios) && hasWorkbench(misAnuncios));
check("GATE 2B: mis-anuncios list uses DashboardCategoryListingCard (folder, not Layer B)", /DashboardCategoryListingCard/.test(misAnuncios) && !/<OwnerProductPageFrame/.test(misAnuncios));
check("GATE 2B: DashboardMobileActionSheet exists", exists("app/(site)/dashboard/components/DashboardMobileActionSheet.tsx") && /triggerLabel/.test(mobileSheet));

// ---------------------------------------------------------------------------
// GATE 2C — CANONICAL ADMINISTRAR
// ---------------------------------------------------------------------------
check("GATE 2C: openPanelLabel remains Administrar anuncio / Manage listing", /return lang === "es" \? "Administrar anuncio" : "Manage listing"/.test(categoryTools));
check("GATE 2C: dashboardI18n manageListing bilingual", /manageListing: "Administrar anuncio"/.test(i18n) && /manageListing: "Manage listing"/.test(i18n));
check("GATE 2C: resolveDashboardActions remains route-truth owner", /export function resolveDashboardActions/.test(actionResolver));
check("GATE 2C: no new duplicate /dashboard/autos page", !exists("app/(site)/dashboard/autos/page.tsx"));
check("GATE 2C: no new duplicate empleos-lane dashboards", !exists("app/(site)/dashboard/empleos-quick/page.tsx") && !exists("app/(site)/dashboard/empleos-premium/page.tsx") && !exists("app/(site)/dashboard/empleos-feria/page.tsx"));

// ---------------------------------------------------------------------------
// GLOBAL LAYER A
// ---------------------------------------------------------------------------
const layerAPages: Array<[string, string]> = [
  ["ACCOUNT /dashboard", dashboard],
  ["mis-anuncios list", misAnuncios],
  ["generic entity mis-anuncios/[id]", genericEntity],
  ["servicios", servicios],
  ["restaurantes", restaurantes],
  ["empleos list", empleosList],
  ["empleos detail", empleosDetail],
  ["viajes", viajes],
  ["ofertas list", ofertasList],
  ["ofertas detail", ofertasDetail],
  ["business-tools", businessTools],
  ["drafts", drafts],
  ["analytics", analytics],
  ["analytics listing", analyticsListing],
  ["mensajes", messages],
  ["notificaciones", notifications],
  ["perfil", profile],
  ["seguridad", security],
  ["vistos-recientes", recent],
  ["guardados", saved],
  ["busquedas-guardadas", savedSearches],
];
for (const [label, src] of layerAPages) {
  check(`LAYER A: ${label} uses LeonixDashboardShell`, /<LeonixDashboardShell/.test(src));
  check(`LAYER A: ${label} uses contentLayout=workbench`, hasWorkbench(src));
}
check("LAYER A: shell still owns mobile drawer (not category nav)", /mobileNavOpen/.test(shell) && !/categoryMobileNav/.test(servicios) && !/categoryMobileNav/.test(empleosList));
check("LAYER A: no second dashboard theme file", !exists("app/(site)/dashboard/lib/dashboardGreenTheme.ts") && !exists("app/(site)/dashboard/lib/dashboardBlueTheme.ts"));

// ---------------------------------------------------------------------------
// GLOBAL LAYER B
// ---------------------------------------------------------------------------
check("LAYER B: OwnerProductPageFrame exists", exists("app/(site)/dashboard/components/OwnerProductPageFrame.tsx"));
check("LAYER B: frame owns loading/empty/error rhythm", /loadingLabel/.test(pageFrame) && /emptyLabel/.test(pageFrame) && /error/.test(pageFrame));
check("LAYER B: servicios collection uses OwnerProductPageFrame", /<OwnerProductPageFrame/.test(servicios));
check("LAYER B: restaurantes collection uses OwnerProductPageFrame", /<OwnerProductPageFrame/.test(restaurantes));
check("LAYER B: empleos collection uses OwnerProductPageFrame", /<OwnerProductPageFrame/.test(empleosList));
check("LAYER B: viajes collection uses OwnerProductPageFrame", /<OwnerProductPageFrame/.test(viajes));
check("LAYER B: ofertas collection uses OwnerProductPageFrame", /<OwnerProductPageFrame/.test(ofertasList));
check("LAYER B: generic entity page correctly omits Layer B (single-item)", !/<OwnerProductPageFrame/.test(genericEntity));
check("LAYER B: empleos detail correctly omits collection frame", !/<OwnerProductPageFrame/.test(empleosDetail));
check("LAYER B: ofertas detail correctly omits collection frame", !/<OwnerProductPageFrame/.test(ofertasDetail));
check("LAYER B: Account Command Center is not a product-page frame", !/<OwnerProductPageFrame/.test(dashboard));
check("LAYER B: frame does not fetch or mutate", !/createSupabaseBrowserClient/.test(pageFrame) && !/\.from\(/.test(pageFrame));

// ---------------------------------------------------------------------------
// GLOBAL LAYER C
// ---------------------------------------------------------------------------
check("LAYER C: OwnerEntityWorkspace exists", exists("app/(site)/dashboard/components/OwnerEntityWorkspace.tsx"));
check("LAYER C: canonical anatomy imports header/performance/trust/reputation/activity/tools", /OwnerEntityHeader/.test(workspace) && /OwnerEntityPerformance/.test(workspace) && /OwnerEntityCommunityTrust/.test(workspace) && /OwnerEntityExternalReputation/.test(workspace) && /OwnerEntityActivity/.test(workspace) && /OwnerEntitySpecializedTools/.test(workspace));
check("LAYER C: mobile overflow uses DashboardMobileActionSheet", /DashboardMobileActionSheet/.test(workspace));
check("LAYER C: servicios uses OwnerEntityWorkspace", /<OwnerEntityWorkspace/.test(servicios));
check("LAYER C: restaurantes uses OwnerEntityWorkspace", /<OwnerEntityWorkspace/.test(restaurantes));
check("LAYER C: empleos list+detail use OwnerEntityWorkspace", /<OwnerEntityWorkspace/.test(empleosList) && /<OwnerEntityWorkspace/.test(empleosDetail));
check("LAYER C: viajes uses OwnerEntityWorkspace", /<OwnerEntityWorkspace/.test(viajes));
check("LAYER C: ofertas list+detail use OwnerEntityWorkspace", /<OwnerEntityWorkspace/.test(ofertasList) && /<OwnerEntityWorkspace/.test(ofertasDetail));
check("LAYER C: generic catalog entity uses OwnerEntityWorkspace", /<OwnerEntityWorkspace/.test(genericEntity));
check("LAYER C: autos privado+dealer use OwnerEntityWorkspace", (/<OwnerEntityWorkspace/g.exec(autosSection) || []).length >= 1 && /eyebrowPrivado/.test(autosSection) && /eyebrowDealer/.test(autosSection));
check("LAYER C: comida local uses OwnerEntityWorkspace", /<OwnerEntityWorkspace/.test(comida));
check(
  "LAYER C: workspace never builds hrefs from the registry",
  !/ownerEntityCapabilityRegistry/.test(withoutComments(workspace)) &&
    !/getOwnerEntityCapabilities/.test(withoutComments(workspace)) &&
    !/from ["'][^"']*categoryRouteRegistry/.test(withoutComments(workspace)),
);

// ---------------------------------------------------------------------------
// SHARED FAMILY CONTRACTS
// ---------------------------------------------------------------------------
check("SHARED: OwnerEntityHeader exists", header.length > 0);
check("SHARED: OwnerEntityDetailGrid exists", detailGrid.length > 0);
check("SHARED: OwnerEntityPerformance renders nothing when metrics empty", /if \(metrics\.length === 0\) return null/.test(performance));
check(
  "SHARED: OwnerEntityCommunityTrust is read-only (no vote writer)",
  /READ ONLY/.test(communityTrust) &&
    !/toggleLeonixEndorsementVote/.test(withoutComments(communityTrust)) &&
    !/\/api\/leonix-endorsements/.test(withoutComments(communityTrust)) &&
    !/fetch\(/.test(withoutComments(communityTrust)),
);
check(
  "SHARED: Community Trust has no star rating",
  !/star/i.test(withoutComments(communityTrust)) && !/rating/i.test(withoutComments(communityTrust)),
);
check("SHARED: OwnerEntityExternalReputation renders nothing without real links", /if \(links\.length === 0\) return null/.test(externalRep));
check(
  "SHARED: external reputation stays separate from Community Trust",
  !/OwnerEntityCommunityTrust/.test(withoutComments(externalRep)) && !/endorsement/i.test(withoutComments(externalRep)),
);
check("SHARED: OwnerEntityActivity does not fetch", !/fetch\(/.test(activity) && /already-real activity records/.test(activity));
check("SHARED: specialized tools accept children + gold-role actions", /children\?: ReactNode/.test(specialized) && /tone: "premium"/.test(specialized));
check("SHARED: CTA tones include primary/positive/warning/danger/premium", /"primary" \| "secondary" \| "subtle" \| "positive" \| "warning" \| "danger" \| "premium"/.test(actionBar));
check("SHARED: theme burgundy primary + green positive + amber warning + red danger + gold premium", /btnPrimary:/.test(theme) && /btnPositive:/.test(theme) && /btnWarning:/.test(theme) && /btnDanger:/.test(theme) && /btnPremium:/.test(theme));

// ---------------------------------------------------------------------------
// CAPABILITY REGISTRY
// ---------------------------------------------------------------------------
const familyKeys = [
  "servicios",
  "restaurantes",
  "en-venta",
  "autos-privado",
  "autos-negocios",
  "bienes-raices-privado",
  "bienes-raices-negocio",
  "rentas-privado",
  "rentas-negocio",
  "empleos",
  "clases",
  "comunidad",
  "busco",
  "mascotas-y-perdidos",
  "comida-local",
  "ofertas-locales",
  "viajes",
  "iglesias",
];
for (const key of familyKeys) {
  const quoted = key.includes("-") ? `"${key}"` : key;
  check(`REGISTRY: family ${key} is declared`, new RegExp(`${quoted}: merge\\(`).test(registry) || new RegExp(`${quoted}: merge\\(`).test(registry));
}
check("REGISTRY: capability states are supported|unsupported|unproven|specialized", /export type CapabilityState = "supported" \| "unsupported" \| "unproven" \| "specialized"/.test(registry));
check("REGISTRY: isLiveCapability is supported|specialized only", /state === "supported" \|\| state === "specialized"/.test(registry));
check("REGISTRY: iglesias owner workspace honestly unsupported", /iglesias: merge\(\{[\s\S]{0,400}?edit: "unsupported"/.test(registry));
check("REGISTRY: restaurantes preview honestly unsupported", /restaurantes: merge\(\{[\s\S]{0,250}?preview: "unsupported"/.test(registry));
check("REGISTRY: viajes analytics honestly unsupported", /viajes: merge\(\{[\s\S]{0,250}?analytics: "unsupported"/.test(registry));
check("REGISTRY: ofertas campaign+aiScan are specialized", /"ofertas-locales": merge\(\{[\s\S]{0,900}?campaign: "specialized"[\s\S]{0,80}?aiScan: "specialized"/.test(registry));
check("REGISTRY: empleos applications specialized (not fake generic)", /empleos: merge\(\{[\s\S]{0,900}?applications: "specialized"/.test(registry));
check("REGISTRY: autos-negocios inventory specialized", /"autos-negocios": merge\(\{[\s\S]{0,900}?inventory: "specialized"/.test(registry));
check("REGISTRY: bienes-raices-negocio inventory+lifecycle specialized", /"bienes-raices-negocio": merge\(\{[\s\S]{0,500}?pause: "specialized"[\s\S]{0,400}?inventory: "specialized"/.test(registry));
check("REGISTRY: adapters gate with isLiveCapability", /isLiveCapability\(capabilities/.test(empleosList) && /isLiveCapability\(capabilities/.test(viajes) && /isLiveCapability\(capabilities/.test(ofertasList));

// ---------------------------------------------------------------------------
// GENERIC / SPECIALIZED / STAGED / CAMPAIGN FAMILIES
// ---------------------------------------------------------------------------
check("GENERIC: En Venta/Clases/Comunidad/Busco/Mascotas share mis-anuncios/[id]", /<OwnerEntityWorkspace/.test(genericEntity) && /en-venta/.test(genericEntity));
check("GENERIC: BR Privado still distinct from BR Negocio key", /bienes-raices-negocio/.test(genericEntity) && /bienes-raices-privado/.test(registry));
check("SERVICIOS: Layer A/B/C composer", hasWorkbench(servicios) && /<OwnerProductPageFrame/.test(servicios) && /<OwnerEntityWorkspace/.test(servicios));
check("RESTAURANTES: Layer A/B/C composer", hasWorkbench(restaurantes) && /<OwnerProductPageFrame/.test(restaurantes) && /<OwnerEntityWorkspace/.test(restaurantes));
check("COMIDA LOCAL: workspace adapter exists (no dedicated /dashboard/comida-local island)", /<OwnerEntityWorkspace/.test(comida) && !exists("app/(site)/dashboard/comida-local/page.tsx"));
check("EMPLEOS: Quick/Premium/Feria edit routes preserved", /\/publicar\/empleos\/quick\?edit=/.test(empleosList) && /\/publicar\/empleos\/premium\?edit=/.test(empleosList) && /\/publicar\/empleos\/feria\?edit=/.test(empleosList));
check("EMPLEOS: applications stay on applications API", /\/api\/clasificados\/empleos\/listings\/\$\{listingId\}\/applications/.test(empleosDetail));
check("EMPLEOS: Feria omits internal applications", /lane !== "feria"/.test(empleosList) && /lane !== "feria"/.test(empleosDetail));
check("AUTOS PRIVADO: edit/preview/public identity preserved", /\/publicar\/autos\/privado\?edit=1/.test(autosSection) && /autosLiveVehiclePath\(row\.id\)/.test(autosSection));
check("AUTOS DEALER: parent/child grouping key preserved", /dealer_inventory_parent_listing_id/.test(autosSection) && /editVehicleId=\$\{encodeURIComponent\(row\.id\)\}/.test(autosSection));
check("BR NEGOCIO: safe canonical lifecycle client", /callBrLifecycleMutation\(\{ listingId: row\.id, mutation: "pause" \}\)/.test(genericEntity) && /callBrLifecycleMutation\(\{ listingId: row\.id, mutation: "resume" \}\)/.test(genericEntity) && /callBrLifecycleMutation\(\{ listingId: row\.id, mutation: "archive" \}\)/.test(genericEntity) && /callBrLifecycleMutation\(\{ listingId: row\.id, mutation: "discontinue" \}\)/.test(genericEntity));
check("BR NEGOCIO: child edit stays in parent inventory context", /openChildDraftId=\$\{encodeURIComponent\(`br-db-child-\$\{row\.id\}`\)\}/.test(genericEntity));
check("VIAJES: staged review vocabulary preserved", /changes_requested/.test(viajes) && /in_review/.test(viajes) && /lifecycle_status === "approved"/.test(viajes) && /"resubmit"/.test(viajes));
check("VIAJES: does not flatten to generic pause/archive labels", !/pauseListingLabel/.test(viajes) && /Cambios solicitados/.test(viajes));
check("VIAJES: mutation still POSTs staged-owner API", /\/api\/clasificados\/viajes\/staged-owner/.test(viajes));
check("OFERTAS: campaign manage route preserved", /\/dashboard\/ofertas-locales\/\$\{item\.id\}/.test(ofertasList) || /\/dashboard\/ofertas-locales\/\$\{/.test(ofertasList));
check("OFERTAS: campaign + AI remain specialized modules", /ownerCampaignModuleTitle/.test(ofertasDetail) || /#ofertas-campaign-tools/.test(ofertasDetail));
check("OFERTAS: no separate flyer/coupon dashboard islands", !exists("app/(site)/dashboard/ofertas-locales-flyer/page.tsx") && !exists("app/(site)/dashboard/ofertas-locales-coupon/page.tsx"));

// ---------------------------------------------------------------------------
// ACCOUNT COMMAND CENTER + BUSINESS CONCIERGE
// ---------------------------------------------------------------------------
check("ACCOUNT: /dashboard uses OwnerAccountCommandCenter", /<OwnerAccountCommandCenter/.test(dashboard));
check("ACCOUNT: anatomy Needs Attention + Performance + Preview + Activity + Growth", /<OwnerNeedsAttention/.test(dashboard) && /<OwnerAccountPerformance/.test(dashboard) && /<OwnerManagedEntitiesPreview/.test(dashboard) && /<OwnerRecentActivity/.test(dashboard) && /<OwnerBusinessGrowthEntry/.test(dashboard));
check("ACCOUNT: publish CTA is /publicar + btnPrimary", /\/publicar/.test(commandCenter) && /btnPrimary/.test(commandCenter));
check("ACCOUNT: not a duplicate Mis Anuncios page", !/<DashboardCategoryListingCard/.test(dashboard) && /seeAllListings/.test(i18n));
check("ACCOUNT: recent activity admits no persisted account feed", /does not yet persist an account activity log/.test(i18n) || /a[uú]n no tiene una bit[aá]cora/.test(i18n));
check("ACCOUNT: degraded analytics uses em dash not fake zero", /viewsUnavailable/.test(accountPerf) && /analyticsDegraded/.test(accountPerf));
check("CONCIERGE: /dashboard/business-tools uses BusinessConciergeOwnerHome", /<BusinessConciergeOwnerHome/.test(businessTools));
check("CONCIERGE: identity is listing+owner, not public.businesses.id selector", /public\.businesses\.id/.test(i18n) && /identityMissing/.test(conciergeHome));
check("CONCIERGE: no fake health score", !/healthScore/.test(conciergeHome) && /healthUnsupported/.test(i18n));
check("CONCIERGE: no second Living Business Book / NRM / DIY engine import", !/livingBusinessBook|healthMapEngine|nextRightMoveEngine|diyConciergeEngine/.test(conciergeHome) && !/livingBusinessBook|healthMapEngine|nextRightMoveEngine/.test(businessTools));
check("CONCIERGE: business-tools still reads restaurantes/servicios inventory", /fetchOwnerRestaurantListings/.test(businessTools) && /fetchOwnerServiciosListings/.test(businessTools));
check("CONCIERGE: growth entry points at existing /dashboard/business-tools", /\/dashboard\/business-tools/.test(growth));
check("CONCIERGE: no invented /aprender or idea-builder routes", !exists("app/(site)/dashboard/aprender/page.tsx") && !exists("app/(site)/dashboard/idea-builder/page.tsx") && !exists("app/(site)/dashboard/proximo-paso/page.tsx"));

// ---------------------------------------------------------------------------
// COPY / I18N
// ---------------------------------------------------------------------------
check("ES/EN: accountCommandCenterCopy has both languages", /Centro de comando/.test(i18n) && /Command center/.test(i18n));
check("ES/EN: businessConciergeHubCopy has both languages", /Inteligencia de negocio/.test(i18n) && /Business Concierge/.test(i18n));
check("ES/EN: no owner-facing Formulario primary CTA in shared workspace", !/Formulario/.test(workspace) && !/Formulario/.test(pageFrame) && !/Formulario/.test(commandCenter));
check("ES/EN: owner copy avoids raw TRUE/FALSE operational flags", !/\bTRUE\b/.test(commandCenter) && !/\bFALSE\b/.test(conciergeHome));

// ---------------------------------------------------------------------------
// PROTECTED SYSTEMS / MIGRATIONS / THIS-GATE DIFF
// ---------------------------------------------------------------------------
const changedFiles = gitDiffNameOnly();
const statusLines = gitStatusShort();
const allTouched = Array.from(
  new Set([
    ...changedFiles,
    ...statusLines.map((l) => l.replace(/^[MADRCU?!\s]+/, "").replace(/\\/g, "/").trim()),
  ]),
);

check("NO MIGRATION: git diff has no supabase/migrations", !allTouched.some((f) => /^supabase\/migrations\//.test(f)));
check("NO MIGRATION: no untracked migration files", !statusLines.some((l) => /supabase\/migrations\//.test(l)));

const forbiddenPatterns: Array<{ label: string; test: (f: string) => boolean }> = [
  { label: "app/admin", test: (f) => /^app\/admin\//.test(f) },
  { label: "VIN decoder", test: (f) => /autosNhtsaVinDecode|AutosVinDecodeBlock|decode-vin/.test(f) },
  { label: "Stripe/payment writers", test: (f) => /revenueOs|publishCheckoutCheckpoint|revenuePricingMatrix/.test(f) },
  { label: "Community Trust writer", test: (f) => /leonixEndorsementServer\.ts$|leonixEndorsementRegistry\.ts$|api\/leonix-endorsements\/route\.ts$/.test(f) },
  { label: "Analytics event writers", test: (f) => /clasificadosAnalytics|listingAnalyticsEventTypes|recordGlobalAnalytics/.test(f) },
  { label: "categoryRouteRegistry / dashboardActionResolver", test: (f) => /categoryRouteRegistry\.ts$|dashboardActionResolver\.ts$/.test(f) },
  { label: "Auth / RLS", test: (f) => /supabase\/migrations.*rls|app\/lib\/auth\//i.test(f) },
  { label: "Viajes moderation backend", test: (f) => /viajes.*moderat|api\/.*viajes.*review/i.test(f) && !/dashboard\/viajes/.test(f) },
  { label: "Ofertas campaign backend", test: (f) => /api\/ofertas-locales/.test(f) },
  { label: "AI provider backend", test: (f) => /generative-ai|documentai/.test(f) && !/Owner/.test(f) },
  { label: "Recursos", test: (f) => /recursos/i.test(f) && !/OWNER_COMMAND_CENTER/.test(f) },
  { label: "Iglesias / Ad Branding owner pages", test: (f) => /dashboard\/iglesias|ad-branding/.test(f) },
  { label: "Living Business Book / Health Map / NRM engines", test: (f) => /livingBusinessBook|healthMapEngine|nextRightMoveEngine|diyConciergeEngine|assistantMemory/i.test(f) },
];
for (const { label, test } of forbiddenPatterns) {
  const hits = allTouched.filter(test);
  check(`PROTECTED: no ${label} files touched this gate`, hits.length === 0, hits.join(", "));
}

let untrackedNewRoutes: string[] = [];
try {
  untrackedNewRoutes = statusLines
    .filter((l) => l.startsWith("??"))
    .map((l) => l.slice(2).trim().replace(/\\/g, "/"))
    .filter((f) => /page\.tsx$|route\.ts$/.test(f));
} catch {
  /* ignore */
}
check("No new untracked page.tsx / route.ts", untrackedNewRoutes.length === 0, untrackedNewRoutes.join(", "));

check(
  "FINAL AUDIT artifact exists",
  exists("app/(site)/dashboard/OWNER_COMMAND_CENTER_FINAL_RECONCILIATION_AUDIT.md"),
);
check(
  "npm script verify:owner-command-center:final is registered",
  /"verify:owner-command-center:final"/.test(read("package.json")),
);

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
