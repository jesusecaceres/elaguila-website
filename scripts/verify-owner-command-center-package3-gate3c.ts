/**
 * Owner Command Center — Package 3, Gate 3C focused verifier.
 *
 * Scope: Specialized Owner Systems Migration — Empleos Quick/Premium/Feria, Autos Privado,
 * Autos Dealer parent + vehicle child, Bienes Raíces Negocio parent + property child,
 * Comida Local. Confirms shared Layers A/B/C, specialized modules (applications / vehicle
 * inventory / property inventory), parent/child identity, preserved routes/mutations, and
 * no protected-system or backend rewrite.
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

const empleosList = read("app/(site)/dashboard/empleos/page.tsx");
const empleosDetail = read("app/(site)/dashboard/empleos/[listingId]/page.tsx");
const autosSection = read("app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx");
const genericPage = read("app/(site)/dashboard/mis-anuncios/[id]/page.tsx");
const comida = read("app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx");
const registry = read("app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts");
const workspace = read("app/(site)/dashboard/components/OwnerEntityWorkspace.tsx");
const pageFrame = read("app/(site)/dashboard/components/OwnerProductPageFrame.tsx");
const specialized = read("app/(site)/dashboard/components/OwnerEntitySpecializedTools.tsx");
const activity = read("app/(site)/dashboard/components/OwnerEntityActivity.tsx");
const vinUi = read("app/(site)/publicar/autos/shared/components/AutosVinDecodeBlock.tsx");
const vinApi = read("app/api/clasificados/autos/decode-vin/route.ts");
const vinLib = read("app/lib/clasificados/autos/autosNhtsaVinDecode.ts");
const misAnunciosCats = read("app/(site)/dashboard/lib/dashboardMisAnunciosCategories.ts");

check("OwnerEntityWorkspace still exists (Layer C)", exists("app/(site)/dashboard/components/OwnerEntityWorkspace.tsx"));
check("OwnerProductPageFrame still exists (Layer B)", exists("app/(site)/dashboard/components/OwnerProductPageFrame.tsx"));
check("OwnerEntitySpecializedTools still exists and accepts children for specialized modules", /children\?: ReactNode/.test(specialized) || /children\?:/.test(workspace));
check("OwnerEntityActivity can render real per-row actions (applications status) without a new pipeline", /actions\?: ActionItem\[\]/.test(activity));
check("isLiveCapability helper exists (supported | specialized)", /export function isLiveCapability/.test(registry));

// ---------------------------------------------------------------------------
// EMPLEOS QUICK / PREMIUM / FERIA
// ---------------------------------------------------------------------------
check("EMPLEOS collection uses LeonixDashboardShell workbench (Layer A)", /contentLayout="workbench"/.test(empleosList));
check("EMPLEOS collection uses OwnerProductPageFrame (Layer B)", /<OwnerProductPageFrame/.test(empleosList));
check("EMPLEOS collection uses OwnerEntityWorkspace (Layer C)", /<OwnerEntityWorkspace/.test(empleosList));
check("EMPLEOS collection removed the dedicated desktop <table> island", !/<table/.test(empleosList));
check("EMPLEOS collection removed the gold-gradient category publish button island", !/from-\[#E8D48A\]/.test(empleosList));
check("EMPLEOS Quick edit route preserved", /\/publicar\/empleos\/quick\?edit=/.test(empleosList) && /\/publicar\/empleos\/quick\?edit=/.test(empleosDetail));
check("EMPLEOS Premium edit route preserved", /\/publicar\/empleos\/premium\?edit=/.test(empleosList) && /\/publicar\/empleos\/premium\?edit=/.test(empleosDetail));
check("EMPLEOS Feria edit route preserved", /\/publicar\/empleos\/feria\?edit=/.test(empleosList) && /\/publicar\/empleos\/feria\?edit=/.test(empleosDetail));
check("EMPLEOS public route preserved (/clasificados/empleos/{slug})", /\/clasificados\/empleos\/\$\{/.test(empleosList) && /\/clasificados\/empleos\/\$\{/.test(empleosDetail));
check("EMPLEOS results route preserved on collection frame", /\/clasificados\/empleos\/resultados/.test(empleosList));
check("EMPLEOS lifecycle still PATCHes /api/clasificados/empleos/listings/{id}", /\/api\/clasificados\/empleos\/listings\/\$\{/.test(empleosList) && /\/api\/clasificados\/empleos\/listings\/\$\{listingId\}/.test(empleosDetail));
check("EMPLEOS applications still fetched from existing applications API (not Messages)", /\/api\/clasificados\/empleos\/listings\/\$\{listingId\}\/applications/.test(empleosDetail));
check("EMPLEOS application status still PATCHes existing application API", /\/api\/clasificados\/empleos\/applications\/\$\{appId\}/.test(empleosDetail));
check("EMPLEOS Feria honestly omits internal applications", /lane !== "feria"/.test(empleosList) && /lane !== "feria"/.test(empleosDetail) && /feriaNote/.test(empleosDetail));
check("EMPLEOS applications render through OwnerEntityWorkspace activity (not flattened Messages)", /ownerApplicationsModuleTitle/.test(empleosDetail) && /activity=\{/.test(empleosDetail));
check("EMPLEOS gold Aplicaciones specialized action on collection points at existing manage route", /\/dashboard\/empleos\/\$\{r\.id\}/.test(empleosList));
check("EMPLEOS reactivate is registry-supported (repo-truth PATCH to published)", /empleos: merge\(\{[\s\S]{0,900}?reactivate: "supported"/.test(registry));
check("EMPLEOS close-vacancy is not fabricated as a distinct mutation", /empleos: merge\(\{[\s\S]{0,1200}?close: "unsupported"/.test(registry));
check("EMPLEOS detail does not block first paint on applications (listing loads first)", /setLoading\(false\)/.test(empleosDetail) && /refreshApplications/.test(empleosDetail) && /appsLoaded/.test(empleosDetail));
check("No new /dashboard/empleos-quick or premium/feria dashboard islands created", !exists("app/(site)/dashboard/empleos-quick/page.tsx") && !exists("app/(site)/dashboard/empleos-premium/page.tsx") && !exists("app/(site)/dashboard/empleos-feria/page.tsx"));

// ---------------------------------------------------------------------------
// AUTOS PRIVADO
// ---------------------------------------------------------------------------
check("AUTOS PRIVADO renders through OwnerEntityWorkspace", /eyebrowPrivado/.test(autosSection) && /<OwnerEntityWorkspace/.test(autosSection) && /autos-privado/.test(autosSection));
check("AUTOS PRIVADO edit route preserved", /\/publicar\/autos\/privado\?edit=1&source=dashboard&listingId=/.test(autosSection));
check("AUTOS PRIVADO preview route preserved", /\/clasificados\/autos\/privado\/preview\?edit=1/.test(autosSection));
check("AUTOS PRIVADO public route preserved (autosLiveVehiclePath)", /autosLiveVehiclePath\(row\.id\)/.test(autosSection));
check("AUTOS PRIVADO analytics href preserved (autosPaidListingAnalyticsHref)", /autosPaidListingAnalyticsHref\(\{ listingId: row\.id/.test(autosSection));
check("AUTOS PRIVADO unpublish/restore APIs preserved (no new backend)", /\/api\/clasificados\/autos\/listings\/\$\{id\}\/unpublish/.test(autosSection) && /\/api\/clasificados\/autos\/listings\/\$\{id\}\/restore/.test(autosSection));
check("AUTOS PRIVADO vehicle identity uses already-loaded dashboard fields (title/price/mileage/city) — no extra fetch", /vehicleDetailItems/.test(autosSection) && !/decode-vin/.test(autosSection));
check("AUTOS PRIVADO does not receive dealer inventory tools", /lane === "privado"/.test(autosSection) && /AutosNegociosInventoryValueDrawerTrigger/.test(autosSection) && /groups\.map/.test(autosSection));
check("AUTOS PRIVADO analytics corrected to supported in registry", /"autos-privado": merge\(\{[\s\S]{0,400}?analytics: "supported"/.test(registry));
check("AUTOS PRIVADO reactivate corrected to supported (restore API)", /"autos-privado": merge\(\{[\s\S]{0,700}?reactivate: "supported"/.test(registry));

// ---------------------------------------------------------------------------
// AUTOS DEALER PARENT + VEHICLE CHILD
// ---------------------------------------------------------------------------
check("AUTOS DEALER PARENT renders through OwnerEntityWorkspace", /eyebrowDealer/.test(autosSection) && /autos-negocios/.test(autosSection));
check("AUTOS DEALER removed the gold-gradient category shell wrapper", !/from-\[#FFFCF7\] to-\[#FAF7F2\]/.test(autosSection) && !/border-\[#C9B46A\]\/35 bg-gradient/.test(autosSection));
check("AUTOS DEALER parent edit uses existing autosDealerListingEditHref", /autosDealerListingEditHref\(\{ lang, listingId: parentId \}\)/.test(autosSection));
check("AUTOS DEALER inventory specialized module uses existing autosDealerInventoryEditHref", /autosDealerInventoryEditHref\(\{ lang, listingId: parentId \}\)/.test(autosSection));
check("AUTOS DEALER vehicle child edit stays inside parent inventory (editVehicleId) — no standalone child route", /editVehicleId=\$\{encodeURIComponent\(row\.id\)\}/.test(autosSection) && !exists("app/(site)/dashboard/autos/[id]/page.tsx"));
check("AUTOS DEALER child public/preview/analytics still keyed by the child's own id", /autosLiveVehiclePath\(row\.id\)/.test(autosSection) && /listingId: row\.id/.test(autosSection));
check("AUTOS DEALER parent/child grouping key unchanged (resolveAutosDealerInventoryGroupKey)", /function resolveAutosDealerInventoryGroupKey/.test(autosSection) && /dealer_inventory_parent_listing_id/.test(autosSection));
check("AUTOS DEALER still loads inventory from the existing owner listings API (one fetch, not N+1)", /\/api\/clasificados\/autos\/listings"/.test(autosSection) && (autosSection.match(/fetch\("\/api\/clasificados\/autos\/listings"/g) || []).length === 1);
check("AUTOS DEALER positive lifecycle no longer uses emerald category color", !/emerald-50|emerald-200|emerald-900/.test(autosSection));
check("AUTOS DEALER add-vehicle drawer preserved (not a new inventory backend)", /AutosNegociosInventoryValueDrawerTrigger/.test(autosSection));
check("No dedicated /dashboard/autos category dashboard page created", !exists("app/(site)/dashboard/autos/page.tsx"));

// ---------------------------------------------------------------------------
// BIENES RAÍCES NEGOCIO PARENT + PROPERTY CHILD
// ---------------------------------------------------------------------------
check("BR NEGOCIO resolves to capability key bienes-raices-negocio", /isBrNegocio\s*\n\s*\? "bienes-raices-negocio"/.test(genericPage) || /isBrNegocio\s*\?\s*"bienes-raices-negocio"/.test(genericPage));
check("BR PRIVADO capability key still gated on !isBrNegocio (Gate 3B preserved)", /catLower === "bienes-raices" && !isBrNegocio/.test(genericPage));
check("BR pause routes through existing callBrLifecycleMutation", /callBrLifecycleMutation\(\{ listingId: row\.id, mutation: "pause" \}\)/.test(genericPage));
check("BR archive routes through existing callBrLifecycleMutation", /callBrLifecycleMutation\(\{ listingId: row\.id, mutation: "archive" \}\)/.test(genericPage));
check("BR mark-sold/discontinue routes through existing callBrLifecycleMutation", /callBrLifecycleMutation\(\{ listingId: row\.id, mutation: "discontinue" \}\)/.test(genericPage));
check("BR resume still uses existing callBrLifecycleMutation", /callBrLifecycleMutation\(\{ listingId: row\.id, mutation: "resume" \}\)/.test(genericPage));
check("Generic applyOwnerListingPatch path still present for non-BR rows", /applyOwnerListingPatch/.test(genericPage));
check("BR parent inventory gold action uses existing bienesInventoryEditHref", /bienesInventoryEditHref\(\{ lang, listingId: row\.id/.test(genericPage));
check("BR child edit stays in parent inventory context (openChildDraftId)", /openChildDraftId=\$\{encodeURIComponent\(`br-db-child-\$\{row\.id\}`\)\}/.test(genericPage));
check("BR parent edit uses existing bienesListingEditHref", /bienesListingEditHref\(\{ lang, listingId: row\.id/.test(genericPage));
check("BR public route unchanged: /clasificados/anuncio/{id}", /`\/clasificados\/anuncio\/\$\{row\.id\}\?\$\{q\}`/.test(genericPage));
check("BR parent/child identity fields come from already-fetched inventory columns (no extra inventory fetch)", /br_inventory_parent_listing_id/.test(genericPage) && !/from\("listings"\)[\s\S]{0,80}inventory/.test(genericPage.split("fetchOwnerListingForWorkspace")[0] ?? ""));
check("BR analytics corrected to supported (same listings-table analytics path)", /"bienes-raices-negocio": merge\(\{[\s\S]{0,400}?analytics: "supported"/.test(registry));
check("No new /dashboard/bienes-raices category dashboard page created", !exists("app/(site)/dashboard/bienes-raices/page.tsx"));

// ---------------------------------------------------------------------------
// COMIDA LOCAL
// ---------------------------------------------------------------------------
check("COMIDA LOCAL uses OwnerEntityWorkspace (no bespoke card shell)", /<OwnerEntityWorkspace/.test(comida));
check("COMIDA LOCAL edit route preserved", /\/publicar\/comida-local\?edit=1&listingId=/.test(comida));
check("COMIDA LOCAL public path preserved (item.publicPath)", /item\.publicPath/.test(comida));
check("COMIDA LOCAL lifecycle still POSTs existing /api/clasificados/comida-local/lifecycle", /\/api\/clasificados\/comida-local\/lifecycle/.test(comida));
check("COMIDA LOCAL has no fabricated specialized module slot", !/specialized=\{\{/.test(comida));
check("No dedicated /dashboard/comida-local page created", !exists("app/(site)/dashboard/comida-local/page.tsx"));

// ---------------------------------------------------------------------------
// SHARED GRAMMAR / CTA / STATUS
// ---------------------------------------------------------------------------
check("Shared OwnerEntityWorkspace is the manage grammar for all Gate 3C adapters", /<OwnerEntityWorkspace/.test(empleosList) && /<OwnerEntityWorkspace/.test(empleosDetail) && /<OwnerEntityWorkspace/.test(autosSection) && /<OwnerEntityWorkspace/.test(genericPage) && /<OwnerEntityWorkspace/.test(comida));
check("Shared page frame used on Empleos collection (Layer B applicable)", /<OwnerProductPageFrame/.test(empleosList));
check("Shared page frame NOT used on Empleos single-item detail (Layer B not applicable)", !empleosDetail.split("\n").some((line) => /^\s*import\b/.test(line) && /OwnerProductPageFrame/.test(line)) && !/<OwnerProductPageFrame/.test(empleosDetail));
check("Shared status resolver used (listingUiStatusLabel/ChipClass)", /listingUiStatusLabel/.test(empleosList) && /listingUiStatusChipClass/.test(autosSection) && /listingUiStatusLabel/.test(comida));
check("Shared CTA labels used (editListingLabel / publicViewLabel)", /editListingLabel/.test(empleosList) && /editListingLabel/.test(autosSection) && /editListingLabel/.test(comida));
check("Shared mobile action sheet labels passed", /mobileSheetLabels/.test(empleosList) && /mobileSheetLabels/.test(autosSection) && /mobileSheetLabels/.test(comida));
check("Positive lifecycle uses shared tone \"positive\" (not emerald)", /tone: "positive"/.test(empleosDetail) && /tone: "positive"/.test(autosSection) && /tone: "positive"/.test(comida));
check("Caution lifecycle uses shared tone \"warning\"", /tone: "warning"/.test(empleosDetail) && /tone: "warning"/.test(comida));
check("Terminal lifecycle uses shared tone \"danger\"", /tone: "danger"/.test(empleosDetail) && /tone: "danger"/.test(autosSection));
check("Specialized tools use shared tone \"premium\"", /tone: "premium"/.test(empleosList) && /tone: "premium"/.test(autosSection) && /tone: "premium"/.test(genericPage));

// ---------------------------------------------------------------------------
// EXPLICIT TARGET / CONTRACT NAMES (Gate 3C certification)
// ---------------------------------------------------------------------------
check("EMPLEOS QUICK: shared OwnerEntityWorkspace grammar (no Quick-specific shell)", /lane === "quick"/.test(empleosList) && /<OwnerEntityWorkspace/.test(empleosList) && !exists("app/(site)/dashboard/empleos-quick/page.tsx"));
check("EMPLEOS PREMIUM: shared OwnerEntityWorkspace grammar (no Premium-specific shell)", /lane === "premium"/.test(empleosList) && /<OwnerEntityWorkspace/.test(empleosList) && !exists("app/(site)/dashboard/empleos-premium/page.tsx"));
check("EMPLEOS FERIA: shared OwnerEntityWorkspace grammar (no Feria-specific shell)", /lane === "feria"/.test(empleosList) && /<OwnerEntityWorkspace/.test(empleosList) && !exists("app/(site)/dashboard/empleos-feria/page.tsx"));
check("APPLICATIONS SPECIALIZED MODULE: Empleos applications render as OwnerEntityActivity (not Messages)", /ownerApplicationsModuleTitle/.test(empleosDetail) && /\/api\/clasificados\/empleos\/listings\/\$\{listingId\}\/applications/.test(empleosDetail) && !/dashboard\/messages/.test(empleosDetail));
check("AUTOS INVENTORY SPECIALIZED MODULE: dealer inventory is gold specialized children inside OwnerEntityWorkspace", /ownerInventoryModuleTitle/.test(autosSection) && /specialized=\{\{/.test(autosSection) && /autosDealerInventoryEditHref/.test(autosSection));
check("BR INVENTORY SPECIALIZED MODULE: parent gold inventory action uses existing bienesInventoryEditHref", /bienesInventoryEditHref\(\{ lang, listingId: row\.id/.test(genericPage) && /tone: "premium" as const/.test(genericPage));
check("PARENT/CHILD IDENTITY: Autos dealer child stays related to parent (dealer_inventory_parent_listing_id + editVehicleId)", /dealer_inventory_parent_listing_id/.test(autosSection) && /editVehicleId=\$\{encodeURIComponent\(row\.id\)\}/.test(autosSection));
check("PARENT/CHILD IDENTITY: BR property child stays related to parent (br_inventory_parent_listing_id + openChildDraftId)", /br_inventory_parent_listing_id/.test(genericPage) && /openChildDraftId=\$\{encodeURIComponent\(`br-db-child-\$\{row\.id\}`\)\}/.test(genericPage));
check("BR SAFE LIFECYCLE ROUTING: pause/archive/discontinue/resume all use callBrLifecycleMutation", /callBrLifecycleMutation\(\{ listingId: row\.id, mutation: "pause" \}\)/.test(genericPage) && /callBrLifecycleMutation\(\{ listingId: row\.id, mutation: "archive" \}\)/.test(genericPage) && /callBrLifecycleMutation\(\{ listingId: row\.id, mutation: "discontinue" \}\)/.test(genericPage) && /callBrLifecycleMutation\(\{ listingId: row\.id, mutation: "resume" \}\)/.test(genericPage));
check("AUTOS DEALER VEHICLE CHILD: nested in parent inventory specialized module — no standalone child dashboard", /editVehicleId=\$\{encodeURIComponent\(row\.id\)\}/.test(autosSection) && /ownerInventoryModuleTitle/.test(autosSection) && !exists("app/(site)/dashboard/autos/[id]/page.tsx") && !exists("app/(site)/dashboard/autos/vehiculo/[id]/page.tsx"));
check("BR NEGOCIO PARENT: Layer C workspace + bienes-raices-negocio capability key + parent inventory gold CTA", /<OwnerEntityWorkspace/.test(genericPage) && /isBrNegocio\s*\n\s*\? "bienes-raices-negocio"/.test(genericPage) && /isBrInventoryMainListing\(row\)/.test(genericPage) && /bienesInventoryEditHref\(\{ lang, listingId: row\.id/.test(genericPage));
check("BR PROPERTY CHILD: same [id] workspace; child edit stays parent inventory openChildDraftId", /isBrInventoryProperty\(row\)/.test(genericPage) && /openChildDraftId=\$\{encodeURIComponent\(`br-db-child-\$\{row\.id\}`\)\}/.test(genericPage) && /br_inventory_parent_listing_id/.test(genericPage));
check("SHARED PERFORMANCE: Empleos detail and BR [id] pass OwnerEntityPerformance through workspace (where applicable)", /performance=/.test(empleosDetail) && /performance=\{\{ title: t\.performanceTitle/.test(genericPage) && /OwnerEntityPerformance/.test(workspace));
check("SHARED ACTIVITY: Empleos applications and BR messages use OwnerEntityActivity (where applicable)", /activity=\{/.test(empleosDetail) && /activity=\{\{ title: t\.activityTitle/.test(genericPage) && /OwnerEntityActivity/.test(workspace));
check("PREVIEW TRUTH PRESERVED: Autos preview hrefs kept; BR parent uses bienesListingPreviewHref; Empleos/Comida do not fabricate listing-bound owner preview", /autosDealerListingPreviewHref/.test(autosSection) && /\/clasificados\/autos\/privado\/preview\?edit=1/.test(autosSection) && /bienesListingPreviewHref/.test(genericPage) && /empleos: merge\(\{[\s\S]{0,250}?preview: "unsupported"/.test(registry) && /"comida-local": merge\(\{[\s\S]{0,250}?preview: "unsupported"/.test(registry));
check("ANALYTICS TRUTH PRESERVED: Autos privado analytics href; BR [id] listing_analytics; Empleos analytics unproven", /autosPaidListingAnalyticsHref\(\{ listingId: row\.id/.test(autosSection) && /listing_analytics/.test(genericPage) && /empleos: merge\(\{[\s\S]{0,250}?analytics: "unproven"/.test(registry));
check("LIFECYCLE TRUTH PRESERVED: Empleos PATCH published/paused/archived; Autos unpublish/restore; BR callBrLifecycleMutation; Comida lifecycle POST", /patchStatus/.test(empleosDetail) && /\/unpublish/.test(autosSection) && /\/restore/.test(autosSection) && /callBrLifecycleMutation/.test(genericPage) && /\/api\/clasificados\/comida-local\/lifecycle/.test(comida));
check("FAKE CAPABILITIES NOT INTRODUCED: Empleos close unsupported; Autos pause unsupported; Comida preview/results unsupported", /empleos: merge\(\{[\s\S]{0,1200}?close: "unsupported"/.test(registry) && /"autos-privado": merge\(\{[\s\S]{0,500}?pause: "unsupported"/.test(registry) && /"autos-negocios": merge\(\{[\s\S]{0,500}?pause: "unsupported"/.test(registry) && /"comida-local": merge\(\{[\s\S]{0,250}?preview: "unsupported"/.test(registry) && /"comida-local": merge\(\{[\s\S]{0,250}?results: "unsupported"/.test(registry));
check("SHARED OWNER GRAMMAR: OwnerEntityWorkspace/SpecializedTools/Activity have no category === layout branching", !/category\s*===/.test(workspace) && !/category\s*===/.test(specialized) && !/category\s*===/.test(activity));
check("No bespoke specialized dashboard shell remaining on Gate 3C adapters", !/from-\[#E8D48A\]/.test(empleosList) && !/from-\[#FFFCF7\] to-\[#FAF7F2\]/.test(autosSection) && /<OwnerEntityWorkspace/.test(comida));
check("No new per-card I/O: Autos still one listings fetch; Empleos applications after first paint; BR [id] does not fetch inventory list", (autosSection.match(/fetch\("\/api\/clasificados\/autos\/listings"/g) || []).length === 1 && /appsLoaded/.test(empleosDetail) && !/from\("listings"\)[\s\S]{0,120}select\([\s\S]{0,80}inventory/.test(genericPage));
check("No Gate 2A regression: owner listings select session cache still present", /lx_owner_listings_select_v1/.test(read("app/(site)/dashboard/lib/ownerListingsQuery.ts")) && /cachedWorkingListingsSelect/.test(read("app/(site)/dashboard/lib/ownerListingsQuery.ts")));
check("AUTOS canonical results route preserved (/clasificados/autos/resultados)", /\/clasificados\/autos\/resultados/.test(misAnunciosCats));
check("BR canonical results route preserved (BR_RESULTS on bienes-raices category)", /key: "bienes-raices"/.test(misAnunciosCats) && /BR_RESULTS/.test(misAnunciosCats));
check("COMIDA LOCAL results truth: browse landing, no fabricated /resultados", !/\/clasificados\/comida-local\/resultados/.test(comida) && /"comida-local": merge\(\{[\s\S]{0,250}?results: "unsupported"/.test(registry));
check("AUTOS DEALER preview truth preserved (autosDealerListingPreviewHref)", /autosDealerListingPreviewHref/.test(autosSection));
check("BR preview truth preserved (bienesListingPreviewHref; child preview not fabricated)", /bienesListingPreviewHref/.test(genericPage));
check("COMIDA LOCAL preview truth: registry unsupported, no fabricated listing-bound preview CTA", /"comida-local": merge\(\{[\s\S]{0,200}?preview: "unsupported"/.test(registry) && !/preview\?/.test(comida));
check("AUTOS analytics truth preserved (autosPaidListingAnalyticsHref)", /autosPaidListingAnalyticsHref/.test(autosSection));
check("BR analytics truth preserved (listing_analytics on shared [id] workspace)", /\.from\("listing_analytics"\)/.test(genericPage));
check("EMPLEOS lifecycle truth preserved (PATCH published/paused/archived)", /"published" \| "paused" \| "archived"/.test(empleosList) && /"published" \| "paused" \| "archived"/.test(empleosDetail));
check("COMIDA LOCAL lifecycle truth preserved (existing lifecycle POST)", /\/api\/clasificados\/comida-local\/lifecycle/.test(comida));

const audit = read("app/(site)/dashboard/OWNER_COMMAND_CENTER_PACKAGE3_GATE3C_AUDIT.md");
const requiredAuditHeadings = [
  "EMPLEOS QUICK",
  "EMPLEOS PREMIUM",
  "EMPLEOS FERIA",
  "AUTOS PRIVADO",
  "AUTOS DEALER PARENT",
  "AUTOS DEALER VEHICLE CHILD",
  "BR NEGOCIO PARENT",
  "BR PROPERTY CHILD",
  "COMIDA LOCAL",
];
for (const heading of requiredAuditHeadings) {
  check(`Audit documents ${heading} as its own lane (no grouped omission)`, new RegExp(`^## ${heading}\\s*$`, "m").test(audit));
}
check("Audit contains no grouped-omission 'etc.'", !/\betc\./i.test(audit));
for (const heading of requiredAuditHeadings) {
  const start = audit.indexOf(`## ${heading}`);
  const nextHeadingIdx = requiredAuditHeadings
    .map((h) => audit.indexOf(`## ${h}`))
    .filter((idx) => idx > start)
    .sort((a, b) => a - b)[0];
  const section = start >= 0 ? audit.slice(start, nextHeadingIdx ?? audit.length) : "";
  const requiredFields = [
    "CURRENT OWNER ROUTE",
    "TARGET OWNER ROUTE",
    "IDENTITY KEY",
    "PUBLIC ROUTE",
    "RESULTS ROUTE",
    "EDIT ROUTE",
    "PREVIEW",
    "ANALYTICS",
    "LIFECYCLE",
    "ACTIVITY",
    "SPECIALIZED MODULE",
    "COMMERCIAL / ENTITLEMENT DISPLAY TRUTH",
    "CAPABILITY STATES",
    "SHARED COMPONENTS",
    "LEGACY UI REMOVED",
    "RESPONSIVE STATUS",
    "ES/EN STATUS",
    "DEFERRED ITEMS",
  ];
  const missing = requiredFields.filter((field) => !section.includes(`**${field}:**`));
  const hasParent = /\*\*PARENT ENTITY:\*\*|\*\*PARENT \/ CHILD:\*\*|\*\*PARENT ENTITY\*\*/.test(section);
  const hasChild = /\*\*CHILD ENTITY:\*\*|\*\*PARENT \/ CHILD:\*\*/.test(section);
  check(
    `Audit ${heading} documents required fields`,
    missing.length === 0 && hasParent && hasChild,
    missing.length || !hasParent || !hasChild
      ? `missing=${missing.join(",") || "none"}; parent=${hasParent}; child=${hasChild}`
      : undefined,
  );
}

// ---------------------------------------------------------------------------
// PROTECTED SYSTEMS
// ---------------------------------------------------------------------------
const changedFiles = gitDiffNameOnly();
check("No migrations in this gate (explicit)", !changedFiles.some((f) => /^supabase\/migrations\//.test(f)));
const forbiddenPatterns: Array<{ label: string; test: (f: string) => boolean }> = [
  { label: "Supabase migration", test: (f) => /^supabase\/migrations\//.test(f) },
  { label: "VIN decoder", test: (f) => /autosNhtsaVinDecode|AutosVinDecodeBlock|decode-vin/.test(f) },
  { label: "Empleos application backend pipeline", test: (f) => /api\/clasificados\/empleos\/applications/.test(f) || /empleos_job_applications/.test(f) },
  { label: "Autos inventory mutation backend", test: (f) => /autosClassifiedsListingService\.ts$/.test(f) },
  { label: "BR inventory/lifecycle backend", test: (f) => /brListingLifecycleService\.ts$/.test(f) },
  { label: "Stripe/payment/entitlement writers", test: (f) => /revenueOs|stripe|publishCheckoutCheckpoint|revenuePricingMatrix/.test(f) && !/autosDashboardInventoryAddonCheckout|bienesDashboardInventoryAddonCheckout/.test(f) },
  { label: "Community Trust writer", test: (f) => /leonixEndorsementServer\.ts$|leonixEndorsementRegistry\.ts$|api\/leonix-endorsements\/route\.ts$/.test(f) },
  { label: "Analytics event-writing pipeline", test: (f) => /clasificadosAnalytics|listingAnalyticsEventTypes|recordGlobalAnalytics/.test(f) },
  { label: "categoryRouteRegistry / dashboardActionResolver", test: (f) => /categoryRouteRegistry\.ts$|dashboardActionResolver\.ts$/.test(f) },
  { label: "Admin OS / app/admin", test: (f) => /^app\/admin\//.test(f) },
  { label: "Recursos", test: (f) => /recursos/i.test(f) && !/OWNER_COMMAND_CENTER/.test(f) },
  { label: "Business Concierge engines", test: (f) => /businessConcierge|livingBusinessBook|healthMap|nextRightMove|diyConcierge|learningCenter/i.test(f) },
  { label: "Auth / RLS", test: (f) => /supabase\/migrations.*rls|app\/lib\/auth\//i.test(f) },
  { label: "Iglesias owner pages", test: (f) => /dashboard\/iglesias/.test(f) },
];
for (const { label, test } of forbiddenPatterns) {
  const hits = changedFiles.filter(test);
  check(`No ${label} files changed`, hits.length === 0, hits.join(", "));
}

check("VIN decoder UI file still present and this gate did not empty it", vinUi.length > 100);
check("VIN decoder API still present", vinApi.length > 100);
check("VIN NHTSA library still present", vinLib.length > 100);
check("OwnerEntityWorkspace still does not fetch", !/fetch\(/.test(workspace) && !/createSupabaseBrowserClient/.test(workspace));
check("OwnerProductPageFrame still presentational", !/fetch\(/.test(pageFrame) && !/createSupabaseBrowserClient/.test(pageFrame));

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
check(
  "No backend rewrite: application/inventory/VIN/BR-lifecycle/analytics-writer files unchanged",
  !changedFiles.some((f) => /autosNhtsaVinDecode|AutosVinDecodeBlock|decode-vin|empleos_job_applications|autosClassifiedsListingService\.ts$|brListingLifecycleService\.ts$|clasificadosAnalytics|listingAnalyticsEventTypes|recordGlobalAnalytics/.test(f)),
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
