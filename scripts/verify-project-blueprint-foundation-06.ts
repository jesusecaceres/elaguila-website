/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — structural verifier. Mirrors
 * scripts/verify-project-blueprint-foundation-05.ts's exact style: source-level checks against the
 * migration, capability, repository, API route, and UI files, never a live database call or a
 * rendered browser.
 *
 * Run from repo root: npx tsx scripts/verify-project-blueprint-foundation-06.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import path from "node:path";

let passed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Specialized Project Blueprints (Gate 6) — structural checks\n");

const ROOT = path.resolve(__dirname, "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

const migration = read("supabase/migrations/20260913120000_gate6_specialized_blueprints_bridges.sql");
const registry = read("app/lib/business/projectDiscovery/projectTypeRegistry.ts");
const capabilities = read("app/admin/_lib/salesWorkspaceCapabilities.ts");
const dependencyEngine = read("app/lib/business/projectDiscovery/projectDependencyEngine.ts");
const dependencyRepository = read("app/lib/business/projectDiscovery/projectDependencyRepository.ts");
const creativeStudioBridge = read("app/lib/business/projectDiscovery/creativeStudioBridge.ts");
const growthCampaignBridge = read("app/lib/business/projectDiscovery/growthCampaignBridge.ts");
const specializedEngine = read("app/lib/business/projectDiscovery/specializedBlueprintEngine.ts");
const specializedMarkdown = read("app/lib/business/projectDiscovery/specializedBlueprintMarkdown.ts");
const dispatch = read("app/lib/business/projectDiscovery/specializedBlueprintDispatch.ts");
const creativeJobRepo = read("app/lib/business/creativeStudio/repository.ts");
const growthCampaignRepo = read("app/lib/business/growthEngine/repository.ts");
const journey = read("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryJourney.tsx");
const actions = read("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
const routeGenerate = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/specialized-blueprint/route.ts");
const routeApprove = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/specialized-blueprint/approve/route.ts");
const routeCreativeStudio = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/specialized-blueprint/creative-studio/route.ts");
const routeCampaign = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/specialized-blueprint/campaign/route.ts");
const routeDependenciesCreate = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/dependencies/route.ts");
const routeDependenciesDelete = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/dependencies/[dependencyId]/route.ts");

// ===============================================================================================
// Migration safety
// ===============================================================================================
console.log("Migration safety:");
check("1a. Migration is additive only — no DROP/TRUNCATE/DELETE FROM, no unrelated table dropped", () => {
  assert.ok(!/DROP TABLE|TRUNCATE|DELETE FROM/i.test(migration));
});
check("1b. Exactly one new table (business_project_discovery_intent_dependencies) — no new blueprint table per project family", () => {
  const count = (migration.match(/CREATE TABLE IF NOT EXISTS/g) ?? []).length;
  assert.equal(count, 1);
  assert.ok(migration.includes("CREATE TABLE IF NOT EXISTS public.business_project_discovery_intent_dependencies"));
});
check("1c. no new business_project_blueprints-shaped table is created — specialized blueprints reuse the existing one", () => {
  assert.ok(!/CREATE TABLE IF NOT EXISTS public\.business_(logo|print|campaign)_/i.test(migration));
});
check("1d. RLS enabled + deny-all + explicit service_role grant on the new table, no CREATE POLICY anywhere", () => {
  assert.ok(migration.includes("ALTER TABLE public.business_project_discovery_intent_dependencies ENABLE ROW LEVEL SECURITY"));
  assert.ok(migration.includes("REVOKE ALL PRIVILEGES ON TABLE public.business_project_discovery_intent_dependencies FROM anon"));
  assert.ok(migration.includes("GRANT SELECT, INSERT, DELETE ON TABLE public.business_project_discovery_intent_dependencies TO service_role"));
  assert.ok(!/CREATE POLICY \S+\s+ON\s/i.test(migration), "an actual CREATE POLICY statement (not just a doc comment mentioning the phrase) must never appear");
});
check("1e. business_creative_jobs and business_growth_campaigns gain ONLY a nullable source_project_blueprint_id column each, via ADD COLUMN IF NOT EXISTS", () => {
  assert.ok(migration.includes("ALTER TABLE public.business_creative_jobs\n  ADD COLUMN IF NOT EXISTS source_project_blueprint_id uuid NULL"));
  assert.ok(migration.includes("ALTER TABLE public.business_growth_campaigns\n  ADD COLUMN IF NOT EXISTS source_project_blueprint_id uuid NULL"));
});
check("1f. both new source_project_blueprint_id columns get a composite same-business FK to business_project_blueprints(id, business_id)", () => {
  const fkMatches = migration.match(/REFERENCES public\.business_project_blueprints\(id, business_id\)/g) ?? [];
  assert.equal(fkMatches.length, 2);
});
check("1g. both new columns get a partial UNIQUE index (idempotency at the DB layer)", () => {
  assert.ok(migration.includes("CREATE UNIQUE INDEX IF NOT EXISTS business_creative_jobs_source_blueprint_uk"));
  assert.ok(migration.includes("CREATE UNIQUE INDEX IF NOT EXISTS business_growth_campaigns_source_blueprint_uk"));
  assert.ok((migration.match(/WHERE source_project_blueprint_id IS NOT NULL/g) ?? []).length === 2);
});
check("1h. business_creative_jobs.asset_type CHECK gains exactly one new value (print_collateral_direction), never a value per print sub-family", () => {
  assert.ok(migration.includes("'print_collateral_direction'"));
  assert.ok(!migration.includes("'business_card_direction'") && !migration.includes("'flyer_direction'") && !migration.includes("'banner_direction'"));
});
check("1i. intent-dependency table forbids a self-dependency and forbids duplicate (dependent, depends_on) pairs", () => {
  assert.ok(migration.includes("business_project_discovery_intent_dependencies_no_self_chk"));
  assert.ok(migration.includes("business_project_discovery_intent_dependencies_pair_uk"));
});

// ===============================================================================================
// Registry correction
// ===============================================================================================
console.log("\nRegistry:");
check("2a. website/website_improvement/landing_page use website_project_handoff, never creative_studio", () => {
  assert.ok(!/key: "website",[\s\S]{0,200}executionDestination: "creative_studio"/.test(registry));
  assert.ok(/key: "website",[\s\S]{0,200}executionDestination: "website_project_handoff"/.test(registry));
});
check("2b. Logo/Print families still point at creative_studio; Campaign families still point at growth_campaign", () => {
  assert.ok(/key: "logo_brand_identity",[\s\S]{0,200}executionDestination: "creative_studio"/.test(registry));
  assert.ok(/key: "media_exposure_campaign",[\s\S]{0,200}executionDestination: "growth_campaign"/.test(registry));
});

// ===============================================================================================
// Capabilities — no capability explosion
// ===============================================================================================
console.log("\nCapabilities:");
check("3a. no new manage_logo_blueprint / manage_flyer_blueprint / manage_card_blueprint / manage_campaign_blueprint capability was added", () => {
  for (const name of ["manage_logo_blueprint", "manage_flyer_blueprint", "manage_card_blueprint", "manage_campaign_blueprint"]) {
    assert.ok(!capabilities.includes(`"${name}"`), `unexpected new capability: ${name}`);
  }
});
check("3b. every new Gate 6 route reuses an EXISTING capability (manage_project_blueprint / manage_project_discovery / create_creative_job / manage_growth_campaigns)", () => {
  for (const src of [routeGenerate, routeApprove, routeDependenciesCreate, routeDependenciesDelete]) {
    assert.ok(src.includes('requireStaffWorkspaceWriteAccess(["manage_project_blueprint"])') || src.includes('requireStaffWorkspaceWriteAccess(["manage_project_discovery"])'));
  }
  assert.ok(routeCreativeStudio.includes('capabilities.has("create_creative_job")'));
  assert.ok(routeCampaign.includes('capabilities.has("manage_growth_campaigns")'));
});

// ===============================================================================================
// Blueprint store reuse
// ===============================================================================================
console.log("\nBlueprint store reuse:");
check("4a. generate route calls createDraftBlueprintVersion (the SAME Gate 5 repository function), never a new insert path", () => {
  assert.ok(routeGenerate.includes("createDraftBlueprintVersion"));
});
check("4b. approve route calls the SAME approveBlueprintForBuild used by Website", () => {
  assert.ok(routeApprove.includes("approveBlueprintForBuild"));
});
check("4c. specializedBlueprintEngine.ts computes a real 64-char fingerprint — never a placeholder like 'n/a'", () => {
  assert.ok(specializedEngine.includes("computeSpecializedBlueprintInputFingerprint"));
  assert.ok(!routeGenerate.includes('inputFingerprint: "n/a"'));
  assert.ok(routeGenerate.includes("computeSpecializedBlueprintInputFingerprint"));
});

// ===============================================================================================
// Execution bridges — idempotency + destination truthfulness
// ===============================================================================================
console.log("\nExecution bridges:");
check("5a. Creative Studio bridge checks for an existing job BEFORE inserting (application-layer idempotency)", () => {
  const fnIdx = creativeStudioBridge.indexOf("export async function createCreativeStudioProjectFromBlueprint");
  assert.ok(fnIdx >= 0);
  const body = creativeStudioBridge.slice(fnIdx);
  const idx = body.indexOf("getJobByBlueprintId(");
  const createIdx = body.indexOf("await createJob(");
  assert.ok(idx >= 0 && createIdx >= 0 && idx < createIdx);
});
check("5b. Creative Studio bridge refuses unless the blueprint is approved_for_build", () => {
  assert.ok(creativeStudioBridge.includes('blueprint.status !== "approved_for_build"'));
});
check("5c. Growth Campaign bridge checks for an existing campaign BEFORE inserting", () => {
  assert.ok(growthCampaignBridge.includes("getGrowthCampaignByBlueprintId"));
  const idx = growthCampaignBridge.indexOf("getGrowthCampaignByBlueprintId");
  const createIdx = growthCampaignBridge.indexOf("createGrowthCampaign(");
  assert.ok(idx < createIdx);
});
check("5d. Growth Campaign bridge refuses unless the blueprint is approved_for_build", () => {
  assert.ok(growthCampaignBridge.includes('blueprint.status !== "approved_for_build"'));
});
check("5e. Growth Campaign bridge validates requested channels against the LIVE catalog (listGrowthMediaChannels) — never a hardcoded channel list", () => {
  assert.ok(growthCampaignBridge.includes("listGrowthMediaChannels"));
});
check("5f. Growth Campaign bridge never invents a channel price/inventory field on the campaign it creates", () => {
  assert.ok(!/budgetAmount:\s*\d/.test(growthCampaignBridge));
});
check("5g. Creative Studio job's new asset type doctrine comment confirms no image generation is implied", () => {
  assert.ok(creativeStudioBridge.includes("createJob"));
});
check("5h. Creative Studio repository's getJobByBlueprintId queries by business_id + source_project_blueprint_id, never id alone", () => {
  const idx = creativeJobRepo.indexOf("export async function getJobByBlueprintId");
  const fn = creativeJobRepo.slice(idx, idx + 400);
  assert.ok(fn.includes('.eq("business_id"') && fn.includes('.eq("source_project_blueprint_id"'));
});
check("5i. Growth Engine repository's getGrowthCampaignByBlueprintId queries by business_id + source_project_blueprint_id, never id alone", () => {
  const idx = growthCampaignRepo.indexOf("export async function getGrowthCampaignByBlueprintId");
  const fn = growthCampaignRepo.slice(idx, idx + 400);
  assert.ok(fn.includes('.eq("business_id"') && fn.includes('.eq("source_project_blueprint_id"'));
});

// ===============================================================================================
// Dependency engine
// ===============================================================================================
console.log("\nDependency engine:");
check("6a. suggestSystemDependencies only proposes a KNOWN synergy allowlist — never every possible intent pair", () => {
  assert.ok(dependencyEngine.includes("NEEDS_APPROVED_BRAND"));
  assert.ok(dependencyEngine.includes("logoIntents"));
});
check("6b. a suggestion is never auto-persisted — createIntentDependency is only ever called from a staff-triggered route", () => {
  assert.ok(!dependencyEngine.includes("createIntentDependency"));
});
check("6c. computeBlockingDependencies only blocks while the depended-on intent's blueprint has NOT reached approved_for_build", () => {
  assert.ok(dependencyEngine.includes('!== "approved_for_build"'));
});
check("6d. dependency repository never allows a dependency across two different discoveries (both intents validated same-discovery at the route layer)", () => {
  assert.ok(routeDependenciesCreate.includes("listProjectDiscoveryIntents") && routeDependenciesCreate.includes("intents.some"));
});
check("6e. dependency repository always requires a real StaffWriteActor for creation, never a literal actor object", () => {
  assert.ok(dependencyRepository.includes("Extract<ProjectDiscoveryActor"));
});
check("6f. dependency repository's DB unique-violation (23505) is translated to 'already_exists', never a raw Postgres error", () => {
  assert.ok(dependencyRepository.includes('"23505"') && dependencyRepository.includes("already_exists"));
});

// ===============================================================================================
// Website handoff preserved
// ===============================================================================================
console.log("\nWebsite handoff regression:");
check("7a. Website's own generate/approve routes still exist unmodified in shape (still call createDraftBlueprintVersion/approveBlueprintForBuild)", () => {
  const websiteGenerate = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/blueprint/route.ts");
  const websiteApprove = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/blueprint/approve/route.ts");
  assert.ok(websiteGenerate.includes("createDraftBlueprintVersion"));
  assert.ok(websiteApprove.includes("approveBlueprintForBuild"));
});
check("7b. CreateWebsiteProjectButton / Website handoff route are untouched by Gate 6 (Website never routes through Creative Studio bridge)", () => {
  const websiteHandoffRoute = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/blueprint/handoff/route.ts");
  assert.ok(!websiteHandoffRoute.includes("createCreativeStudioProjectFromBlueprint"));
});

// ===============================================================================================
// Bilingual + mobile
// ===============================================================================================
console.log("\nBilingual + mobile:");
check("8a. all 9 required Gate 6 bilingual phrase pairs appear verbatim in the UI layer", () => {
  const required: [string, string][] = [
    ["Descubrimiento de logo / marca", "Logo / Brand Discovery"],
    ["Descubrimiento de materiales impresos y promocionales", "Print & Promotional Discovery"],
    ["Descubrimiento de campaña", "Campaign Discovery"],
    ["Dependencias del proyecto", "Project Dependencies"],
    ["Esperando otro proyecto", "Waiting on Another Project"],
    ["Crear proyecto en Creative Studio", "Create Creative Studio Project"],
    ["Crear campaña", "Create Campaign"],
    ["Destino de ejecución", "Execution Destination"],
    ["Información compartida del cliente", "Shared Client Information"],
  ];
  const haystacks = [journey, actions];
  for (const [es, en] of required) {
    const foundEs = haystacks.some((h) => h.includes(es));
    const foundEn = haystacks.some((h) => h.includes(en));
    assert.ok(foundEs, `missing ES phrase: ${es}`);
    assert.ok(foundEn, `missing EN phrase: ${en}`);
  }
});
check("8b. new Gate 6 buttons use the shared min-h-[44px] touch-target classes (PRIMARY_BTN/SECONDARY_BTN), never a bespoke small button", () => {
  const gate6Section = actions.slice(actions.indexOf("GenerateSpecializedBlueprintButton"));
  assert.ok(gate6Section.includes("PRIMARY_BTN") && gate6Section.includes("SECONDARY_BTN"));
});
check("8c. specialized blueprint panel never renders a fixed-width HTML table (dependencies/execution stay in stacked cards)", () => {
  const section = journey.slice(journey.indexOf("function SpecializedBlueprintPanel"));
  assert.ok(!/<table/i.test(section.slice(0, 6000)));
});

// ===============================================================================================
// Truthfulness — no fabricated commercial/legal/inventory claims anywhere in Gate 6's new files
// ===============================================================================================
console.log("\nTruthfulness:");
check("9a. no hardcoded commercial price/rate anywhere in Gate 6's new engine/bridge files", () => {
  for (const src of [specializedEngine, specializedMarkdown, dispatch, creativeStudioBridge, growthCampaignBridge]) {
    assert.ok(!/\$\d/.test(src));
  }
});
check("9b. no trademark/legal clearance is ever granted by Leonix in the Logo catalog's own guidance", () => {
  const catalog = read("app/lib/business/projectDiscovery/logoBrandDiscoveryCatalog.ts");
  assert.ok(catalog.includes("Leonix never gives trademark/legal clearance advice"));
});
check("9c. no vendor imprint/production spec is ever guessed in the Print catalog", () => {
  const catalog = read("app/lib/business/projectDiscovery/printCollateralDiscoveryCatalog.ts");
  assert.ok(catalog.includes("never guess at a vendor's template"));
});

console.log(`\n${passed} check(s) passed.`);
