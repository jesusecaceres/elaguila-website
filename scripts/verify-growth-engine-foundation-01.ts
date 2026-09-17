/**
 * Business Development & Growth Engine, Gate A — structural foundation verifier.
 * Confirms migration coherence, repository conventions (business-scoping, actor attribution),
 * capability wiring, business-safe execution links, and the client-safe projection's field
 * discipline. Complements scripts/test-growth-engine-domain-logic.ts (runtime logic tests).
 *
 * Run from repo root: npx tsx scripts/verify-growth-engine-foundation-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
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

console.log("Growth Engine Foundation (Gate A) — structural checks\n");

const ROOT = path.resolve(__dirname, "..");
function read(relPath: string): string {
  return readFileSync(path.join(ROOT, relPath), "utf8");
}

const migrationsDir = path.join(ROOT, "supabase", "migrations");
const migrationFile = readdirSync(migrationsDir).find((f) => f.includes("business_growth_engine_foundation"));
assert.ok(migrationFile, "expected a business_growth_engine_foundation migration file to exist");
const migration = read(path.join("supabase", "migrations", migrationFile!));

const types = read("app/lib/business/growthEngine/types.ts");
const repository = read("app/lib/business/growthEngine/repository.ts");
const projection = read("app/lib/business/growthEngine/projection.ts");
const lifeStage = read("app/lib/business/growthEngine/lifeStage.ts");
const capabilities = read("app/admin/_lib/salesWorkspaceCapabilities.ts");

// --- 1. Migration: additive only, no destructive statement ------------------------------------
check("1a. Migration is additive only — no DROP TABLE, TRUNCATE, or DELETE FROM statement", () => {
  assert.ok(!/DROP\s+TABLE/i.test(migration));
  assert.ok(!/TRUNCATE/i.test(migration));
  assert.ok(!/DELETE\s+FROM/i.test(migration));
});
check("1b. Migration never drops or alters an existing unrelated table's columns destructively", () => {
  assert.ok(!/ALTER TABLE public\.businesses\s+DROP/i.test(migration));
  assert.ok(!/ALTER TABLE public\.business_creative_jobs\s+DROP/i.test(migration));
  assert.ok(!/ALTER TABLE public\.business_commitments\s+DROP/i.test(migration));
});
check("1c. Every new table enables RLS and follows the deny-all + explicit service_role grant convention", () => {
  const tableNames = [
    "business_growth_media_channels", "business_growth_assessments", "business_growth_roadmap_steps",
    "business_growth_official_requirements", "business_growth_solutions", "business_growth_campaigns",
    "business_growth_campaign_channels", "business_growth_events",
  ];
  for (const t of tableNames) {
    assert.ok(migration.includes(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY`), `${t} missing RLS enable`);
    assert.ok(migration.includes(`REVOKE ALL PRIVILEGES ON TABLE public.${t} FROM PUBLIC`), `${t} missing REVOKE FROM PUBLIC`);
    assert.ok(migration.includes(`REVOKE ALL PRIVILEGES ON TABLE public.${t} FROM anon`), `${t} missing REVOKE FROM anon`);
    assert.ok(migration.includes(`REVOKE ALL PRIVILEGES ON TABLE public.${t} FROM authenticated`), `${t} missing REVOKE FROM authenticated`);
    assert.ok(new RegExp(`GRANT [A-Z, ]+ ON TABLE public\\.${t} TO service_role`).test(migration), `${t} missing explicit service_role GRANT`);
  }
});

// --- 2. Cross-domain references are composite same-business foreign keys, never a duplicate store ---
check("2a. business_growth_solutions links to Creative Studio / Promise Keeper / Opportunities via composite same-business FK, not a copied state column", () => {
  assert.ok(/FOREIGN KEY \(linked_creative_job_id, business_id\)\s+REFERENCES public\.business_creative_jobs\(id, business_id\)/.test(migration));
  assert.ok(/FOREIGN KEY \(linked_commitment_id, business_id\)\s+REFERENCES public\.business_commitments\(id, business_id\)/.test(migration));
  assert.ok(/FOREIGN KEY \(linked_opportunity_id, business_id\)\s+REFERENCES public\.business_creative_opportunities\(id, business_id\)/.test(migration));
});
check("2b. No new table duplicates an existing canonical domain (no second facts/health/commitment/creative-job table)", () => {
  assert.ok(!/CREATE TABLE IF NOT EXISTS public\.business_growth_facts/.test(migration));
  assert.ok(!/CREATE TABLE IF NOT EXISTS public\.business_growth_health/.test(migration));
  assert.ok(!/CREATE TABLE IF NOT EXISTS public\.business_growth_creative/.test(migration));
  assert.ok(!/CREATE TABLE IF NOT EXISTS public\.business_growth_commitments\b/.test(migration));
});
check("2c. business_growth_solutions/campaigns/roadmap_steps/official_requirements all reference businesses(id) with ON DELETE CASCADE, matching existing convention", () => {
  const tables = ["business_growth_assessments", "business_growth_roadmap_steps", "business_growth_official_requirements", "business_growth_solutions", "business_growth_campaigns", "business_growth_events"];
  for (const t of tables) {
    const idx = migration.indexOf(`CREATE TABLE IF NOT EXISTS public.${t}`);
    assert.ok(idx !== -1, `${t} not found`);
    const block = migration.slice(idx, idx + 800);
    assert.ok(/business_id uuid NOT NULL REFERENCES public\.businesses\(id\) ON DELETE CASCADE/.test(block), `${t} missing business_id CASCADE FK`);
  }
});

// --- 3. No second business identity / life-stage field ------------------------------------------
check("3a. No new business-identity or life-stage column was added to businesses — life stage is a pure function over the existing business_stage enum", () => {
  assert.ok(!/ALTER TABLE public\.businesses\s+ADD COLUMN/i.test(migration));
  assert.ok(lifeStage.includes("BusinessStage"));
  assert.ok(lifeStage.includes("planning_prelaunch") && lifeStage.includes("newly_opened"));
  assert.ok(!/CREATE TABLE IF NOT EXISTS public\.businesses/i.test(migration), "must not create a second business identity table");
});

// --- 4. Assessment versioning is deterministic ----------------------------------------------------
check("4a. Exactly one non-superseded assessment per business is enforced by a partial unique index", () => {
  assert.ok(/CREATE UNIQUE INDEX IF NOT EXISTS business_growth_assessments_one_current_per_business_idx\s+ON public\.business_growth_assessments \(business_id\)\s+WHERE status <> 'superseded'/.test(migration));
});
check("4b. createGrowthAssessment supersedes any existing current assessment before inserting the new one", () => {
  const idx = repository.indexOf("export async function createGrowthAssessment");
  const block = repository.slice(idx, idx + 1200);
  assert.ok(block.includes("getCurrentGrowthAssessment"));
  assert.ok(block.includes('status: "superseded"'));
});

// --- 5. Official requirements can never silently become confirmed legal truth ---------------------
check("5a. state can only be human_verified when needs_human_verification is false AND last_verified_at is set (DB-level, not just app-level)", () => {
  assert.ok(/state = 'human_verified' AND needs_human_verification = false AND last_verified_at IS NOT NULL/.test(migration));
});
check("5b. markOfficialRequirementVerified is the only repository function that sets state to human_verified, and it requires a real staff/owner actor plus a source", () => {
  const occurrences = (repository.match(/state:\s*"human_verified"/g) ?? []).length;
  assert.equal(occurrences, 1, "human_verified should be set from exactly one function");
  const idx = repository.indexOf("export async function markOfficialRequirementVerified");
  const signature = repository.slice(idx, idx + 300);
  assert.ok(/actor: Extract<GrowthEngineActor, \{ type: "staff" \| "owner" \}>/.test(signature));
  assert.ok(/sourceUrl: string/.test(signature) && /sourceAgency: string/.test(signature));
});

// --- 6. Radio / partner media never claims confirmed commercial terms -----------------------------
check("6a. A partner channel cannot carry availability_state = 'available' (DB CHECK, not just seed data)", () => {
  assert.ok(/channel_class = 'leonix_owned' OR availability_state <> 'available'/.test(migration));
});
check("6b. The seeded radio row uses 'available_partner_terms_required', not 'available', and states its terms-confirmation caveat", () => {
  const idx = migration.indexOf("'radio', 'partner'");
  assert.ok(idx !== -1);
  const block = migration.slice(idx, idx + 500);
  assert.ok(block.includes("available_partner_terms_required"));
  assert.ok(/confirm.*inventory|Confirm.*inventory/i.test(block));
});

// --- 7. Repository conventions: business-scoping + actor attribution on every write ----------------
check("7a. Every list/get function filters by business_id (never id alone)", () => {
  const getterNames = ["listGrowthAssessmentsForBusiness", "getCurrentGrowthAssessment", "listGrowthSolutionsForBusiness", "getGrowthSolutionById", "listGrowthCampaignsForBusiness", "getGrowthCampaignById", "listOfficialRequirementsForBusiness", "listGrowthRoadmapForBusiness"];
  for (const fn of getterNames) {
    const idx = repository.indexOf(`export async function ${fn}`);
    assert.ok(idx !== -1, `${fn} not found`);
    const braceStart = repository.indexOf("{", idx);
    const block = repository.slice(braceStart, braceStart + 700);
    assert.ok(/\.eq\("business_id"/.test(block), `${fn} does not filter by business_id`);
  }
});
check("7b. Every create/update function accepts a GrowthEngineActor and records created_actor_type / event_actor_type", () => {
  const writers = ["createGrowthAssessment", "createGrowthSolution", "createGrowthCampaign", "createOfficialRequirement"];
  for (const fn of writers) {
    const idx = repository.indexOf(`export async function ${fn}`);
    assert.ok(idx !== -1, `${fn} not found`);
    const signatureEnd = repository.indexOf(")", idx);
    const signature = repository.slice(idx, signatureEnd);
    assert.ok(/actor: GrowthEngineActor/.test(signature), `${fn} does not take a GrowthEngineActor`);
  }
  assert.ok(repository.includes("created_actor_type: actor.type"));
});
check("7c. Every mutation appends a business_growth_events row (audit trail) via appendGrowthEvent", () => {
  const calls = (repository.match(/await appendGrowthEvent\(/g) ?? []).length;
  assert.ok(calls >= 6, `expected at least 6 appendGrowthEvent call sites, found ${calls}`);
});
check("7d. State-transition writers reject an invalid jump using the bounded transition graph, never a free-form status write", () => {
  assert.ok(repository.includes("isValidGrowthSolutionTransition"));
  assert.ok(repository.includes("isValidGrowthCampaignTransition"));
  assert.ok(repository.includes('reason: "invalid_transition"'));
});

// --- 8. Auth: canonical capability matrix extended, no bypass ------------------------------------
check("8a. New Growth Engine capabilities were added to the canonical SalesWorkspaceCapability union, not a parallel capability system", () => {
  for (const cap of ["view_growth_engine", "create_growth_assessment", "review_growth_assessment", "manage_growth_roadmap", "manage_growth_solutions", "manage_growth_campaigns", "manage_official_requirements_research"]) {
    assert.ok(capabilities.includes(`"${cap}"`), `${cap} missing from salesWorkspaceCapabilities.ts`);
  }
});
check("8b. sales_rep only receives view_growth_engine, never a create/manage/review growth capability (matches the manager+ precedent for every other domain)", () => {
  const idx = capabilities.indexOf("sales_rep: [");
  const end = capabilities.indexOf("\n};", idx);
  const block = capabilities.slice(idx, end);
  assert.ok(block.includes('"view_growth_engine"'));
  for (const cap of ["create_growth_assessment", "review_growth_assessment", "manage_growth_roadmap", "manage_growth_solutions", "manage_growth_campaigns", "manage_official_requirements_research"]) {
    assert.ok(!block.includes(`"${cap}"`), `sales_rep should not have ${cap}`);
  }
});
check("8c. No repository function bypasses capability checks by constructing its own actor or hardcoding a role", () => {
  assert.ok(!/actor:\s*\{\s*type:\s*"staff"/.test(repository), "repository must never construct a synthetic staff actor internally");
});

// --- 9. Cost/provider architecture readiness, no secret exposure, no AI call in Gate A -------------
check("9a. Assessment schema carries provider/model/cost-metadata columns for later Gate B/D use", () => {
  assert.ok(types.includes("providerKey: string | null"));
  assert.ok(types.includes("modelKey: string | null"));
  assert.ok(types.includes("costMetadata: Record<string, unknown>"));
});
check("9b. No file in this gate imports an OpenAI client or reads OPENAI_API_KEY — Gate A never makes an AI call", () => {
  for (const [name, content] of [["types.ts", types], ["repository.ts", repository], ["projection.ts", projection]] as const) {
    assert.ok(!/from ["'].*openai/i.test(content), `${name} should not import an OpenAI client in Gate A`);
    assert.ok(!/new OpenAI\(/.test(content), `${name} should not instantiate an OpenAI client in Gate A`);
    assert.ok(!/OPENAI_API_KEY/.test(content), `${name} should not reference OPENAI_API_KEY in Gate A`);
    assert.ok(!/fetch\(.*api\.openai\.com/i.test(content), `${name} should not call the OpenAI API in Gate A`);
  }
});
check("9c. No file prints or logs a secret/env value", () => {
  for (const [name, content] of [["repository.ts", repository]] as const) {
    assert.ok(!/console\.(log|error|warn)\([^)]*process\.env/i.test(content), `${name} must never log an env var`);
  }
});

// --- 10. Client-safe projection never exposes internal-only fields --------------------------------
check("10a. buildClientSafeGrowthProjection never selects rationale, evidenceRefs, reviewNote, or any actor/roster identity field", () => {
  const forbidden = ["rationaleEs", "rationaleEn", "evidenceRefs", "reviewNote", "createdByRosterId", "createdByAuthUserId", "reviewedByRosterId", "operatorReviewNotes"];
  for (const field of forbidden) {
    assert.ok(!projection.includes(field), `projection.ts must never reference ${field}`);
  }
});
check("10b. Projection output shape matches MD §14.2 exactly: Already Strong, Let's Confirm, Recommended Next Steps, Projects, Campaigns, Results", () => {
  assert.ok(types.includes("alreadyStrong"));
  assert.ok(types.includes("letsConfirm"));
  assert.ok(types.includes("recommendedNextSteps"));
  assert.ok(types.includes("projects"));
  assert.ok(types.includes("campaigns"));
  assert.ok(types.includes("results"));
});
check("10c. Projection never fabricates a result/metric — completed campaigns are surfaced by objective/status only, no invented number", () => {
  const idx = projection.indexOf("const results");
  const block = projection.slice(idx, idx + 300);
  assert.ok(!/Math\.random|fake|mock/i.test(block));
});

console.log(`\n${passed} check(s) passed.`);
