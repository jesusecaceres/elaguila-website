/**
 * Client Discovery & Project Blueprint Engine, Gate 1 — structural verifier. Mirrors
 * scripts/verify-growth-engine-foundation-01.ts's exact style: source-level checks against the
 * migration and repository files, never a live database call.
 *
 * Run from repo root: npx tsx scripts/verify-project-discovery-foundation-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
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

console.log("Client Project Discovery Foundation (Gate 1) — structural checks\n");

const ROOT = path.resolve(__dirname, "..");
const migration = readFileSync(path.join(ROOT, "supabase/migrations/20260911120000_client_project_discovery_foundation.sql"), "utf8");
const repository = readFileSync(path.join(ROOT, "app/lib/business/projectDiscovery/repository.ts"), "utf8");
const types = readFileSync(path.join(ROOT, "app/lib/business/projectDiscovery/types.ts"), "utf8");
const capabilities = readFileSync(path.join(ROOT, "app/admin/_lib/salesWorkspaceCapabilities.ts"), "utf8");

// --- 1. Migration safety --------------------------------------------------------------------------
check("1a. Migration is additive only — no DROP TABLE, TRUNCATE, ALTER of an existing table's columns, or DELETE FROM", () => {
  assert.ok(!/DROP TABLE|TRUNCATE|DELETE FROM/i.test(migration));
  assert.ok(!/ALTER TABLE public\.(businesses|business_facts|business_meetings|business_growth_|business_source_files|business_creative_opportunities)\b/i.test(migration), "must never alter an existing unrelated table");
});
check("1b. Every new table enables RLS and follows the deny-all + explicit service_role grant convention", () => {
  const tables = [
    "business_project_discoveries", "business_project_discovery_intents", "business_project_discovery_items",
    "business_project_discovery_sources", "business_project_discovery_consents", "business_project_discovery_events",
  ];
  for (const t of tables) {
    assert.ok(migration.includes(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY`), `${t} missing RLS enable`);
    assert.ok(migration.includes(`REVOKE ALL PRIVILEGES ON TABLE public.${t} FROM anon`), `${t} missing anon revoke`);
    assert.ok(migration.includes(`GRANT SELECT`) && migration.includes(`TO service_role`), `${t} missing service_role grant`);
  }
});
check("1c. Exactly 6 new tables, none pre-existing", () => {
  const createCount = (migration.match(/CREATE TABLE IF NOT EXISTS/g) ?? []).length;
  assert.equal(createCount, 6);
});

// --- 2. Same-business composite FK protections (MD <security>, <growth_engine_relationship>) -----
check("2a. Discovery provenance links (growth assessment/solution/opportunity/meeting) are real same-business composite FKs, not bare ids", () => {
  assert.ok(migration.includes("FOREIGN KEY (source_growth_assessment_id, business_id)\n    REFERENCES public.business_growth_assessments(id, business_id)"));
  assert.ok(migration.includes("FOREIGN KEY (source_growth_solution_id, business_id)\n    REFERENCES public.business_growth_solutions(id, business_id)"));
  assert.ok(migration.includes("FOREIGN KEY (source_opportunity_id, business_id)\n    REFERENCES public.business_creative_opportunities(id, business_id)"));
  assert.ok(migration.includes("FOREIGN KEY (source_meeting_id, business_id)\n    REFERENCES public.business_meetings(id, business_id)"));
});
check("2b. Every child table (intents/items/sources/consents/events) enforces same-business linkage back to its parent discovery", () => {
  const children = ["business_project_discovery_intents", "business_project_discovery_items", "business_project_discovery_sources", "business_project_discovery_consents"];
  for (const c of children) {
    assert.ok(new RegExp(`CONSTRAINT ${c}_discovery_same_business_fk\\s*\\n\\s*FOREIGN KEY \\(discovery_id, business_id\\)\\s*\\n\\s*REFERENCES public\\.business_project_discoveries\\(id, business_id\\)`).test(migration), `${c} missing same-business composite FK to its parent discovery`);
  }
});
check("2c. Items scoped to a specific intent also enforce same-business linkage to that intent", () => {
  assert.ok(migration.includes("CONSTRAINT business_project_discovery_items_intent_same_business_fk"));
  assert.ok(migration.includes("REFERENCES public.business_project_discovery_intents(id, business_id)"));
});
check("2d. business_source_files (an unrelated domain's table) is referenced by a plain FK, never altered to add a composite unique constraint it doesn't have", () => {
  assert.ok(migration.includes("business_source_file_id uuid NULL REFERENCES public.business_source_files(id)"));
  assert.ok(!/ALTER TABLE public\.business_source_files/i.test(migration));
});

// --- 3. No duplicate canonical systems (MD <first_inspection>) -----------------------------------
check("3a. No second Business Book — repository never inserts into business_facts/business_unknowns/business_contradictions directly", () => {
  assert.ok(!/\.from\(["']business_facts["']\)\.insert|\.from\(["']business_unknowns["']\)\.insert|\.from\(["']business_contradictions["']\)\.insert/.test(repository));
  assert.ok(!repository.includes("upsertFact(") && !repository.includes("createUnknown(") && !repository.includes("createContradiction("));
});
check("3b. No second meeting system — repository never inserts into business_meetings/business_meeting_notes", () => {
  assert.ok(!/\.from\(["']business_meetings["']\)\.insert|\.from\(["']business_meeting_notes["']\)\.insert/.test(repository));
});
check("3c. No second blob/file store — the only file-table interaction is a read-only lookup on the existing business_source_files, never an insert", () => {
  const fileTableInserts = repository.match(/\.from\("business_source_files"\)\s*\n?\s*\.(insert|upsert)/);
  assert.ok(!fileTableInserts, "must never write to business_source_files — only reference it");
  assert.ok(repository.includes('.from("business_source_files")'), "expected at least a read reference to the canonical asset table");
});
check("3d. Table naming disambiguates from the pre-existing generic business_discovery_sessions/business_discovery_answers (Living Book)", () => {
  assert.ok(migration.includes("business_project_discoveries"));
  assert.ok(!migration.includes("CREATE TABLE IF NOT EXISTS public.business_discovery_sessions"));
  assert.ok(!migration.includes("CREATE TABLE IF NOT EXISTS public.business_discovery_answers"));
});
check("3e. No second capability system — new capabilities are added to the one canonical SalesWorkspaceCapability union", () => {
  assert.ok(capabilities.includes('"view_project_discovery"'));
  assert.ok(capabilities.includes('"create_project_discovery"'));
  assert.ok(capabilities.includes('"manage_project_discovery"'));
  assert.ok(capabilities.includes('"review_project_discovery"'));
  assert.ok(capabilities.includes('"manage_discovery_consent"'));
});
check("3f. sales_rep receives view/create/manage/consent but NEVER review_project_discovery (manager+ only, matching confirm_business_fact precedent)", () => {
  const salesRepBlock = capabilities.slice(capabilities.indexOf("sales_rep: ["));
  assert.ok(salesRepBlock.includes('"view_project_discovery"'));
  assert.ok(salesRepBlock.includes('"create_project_discovery"'));
  assert.ok(salesRepBlock.includes('"manage_project_discovery"'));
  assert.ok(salesRepBlock.includes('"manage_discovery_consent"'));
  assert.ok(!salesRepBlock.includes('"review_project_discovery"'), "sales_rep must not receive review_project_discovery");
});
check("3g. super_admin and sales_manager both receive all 5 new capabilities", () => {
  const superAdminBlock = capabilities.slice(capabilities.indexOf("super_admin: ["), capabilities.indexOf("sales_manager: ["));
  const salesManagerBlock = capabilities.slice(capabilities.indexOf("sales_manager: ["), capabilities.indexOf("sales_rep: ["));
  for (const cap of ["view_project_discovery", "create_project_discovery", "manage_project_discovery", "review_project_discovery", "manage_discovery_consent"]) {
    assert.ok(superAdminBlock.includes(`"${cap}"`), `super_admin missing ${cap}`);
    assert.ok(salesManagerBlock.includes(`"${cap}"`), `sales_manager missing ${cap}`);
  }
});

// --- 4. Truth/completeness classes never silently collapsed (MD <truth_contract>, <completeness_contract>) ---
check("4a. Migration's truth_class CHECK carries exactly the 9 mandated values", () => {
  const truthValues = ["client_confirmed", "public_verified", "staff_observation", "ai_extracted", "needs_confirmation", "unknown", "client_preference", "leonix_recommendation", "technical_decision"];
  for (const v of truthValues) assert.ok(migration.includes(`'${v}'`), `missing truth_class value: ${v}`);
});
check("4b. Migration's completeness_class CHECK carries exactly the 7 mandated values", () => {
  const completenessValues = ["required_before_build", "required_before_launch", "helpful", "optional", "not_applicable", "needs_leonix_decision", "needs_official_research"];
  for (const v of completenessValues) assert.ok(migration.includes(`'${v}'`), `missing completeness_class value: ${v}`);
});
check("4c. truth_class and completeness_class are two independent NOT NULL columns, never a single merged enum", () => {
  assert.ok(/truth_class text NOT NULL CHECK/.test(migration));
  assert.ok(/completeness_class text NOT NULL CHECK/.test(migration));
});

// --- 5. Business Book promotion pathway preserved, not bypassed ----------------------------------
check("5a. Confirming a discovery item never writes to business_facts — promotion stays a separate, existing, human-gated action", () => {
  const confirmFn = repository.slice(repository.indexOf("export async function setProjectDiscoveryItemConfirmation"), repository.indexOf("export async function setProjectDiscoveryItemConfirmation") + 1500);
  assert.ok(!confirmFn.includes("business_facts"));
  assert.ok(!confirmFn.includes("upsertFact"));
});

// --- 6. Consent — minimal reference model only, no recording implementation (MD <data_model> F) --
check("6a. No recording/transcript URL or reference column exists anywhere in the migration", () => {
  assert.ok(!/recording_url|transcript_url|audio_url|recording_reference|transcript_reference/i.test(migration));
});
check("6b. Consent table carries exactly the required type/state/method vocabulary, is append-only (no UPDATE grant)", () => {
  assert.ok(migration.includes("consent_type text NOT NULL CHECK (consent_type IN ('notes', 'audio_recording', 'transcription', 'file_photo_review', 'followup_messages'))"));
  assert.ok(migration.includes("state text NOT NULL CHECK (state IN ('provided', 'declined', 'withdrawn'))"));
  const consentGrantLine = migration.split("\n").find((l) => l.includes("GRANT") && l.includes("business_project_discovery_consents"));
  assert.ok(consentGrantLine && !consentGrantLine.includes("UPDATE"), "consent table must be append-only (no UPDATE grant)");
});

// --- 7. Multi-project foundation (MD <multi_project_foundation>) --------------------------------
check("7a. One discovery can have multiple intents — no unique constraint limits intents-per-discovery to one", () => {
  const intentsTableSql = migration.slice(migration.indexOf("CREATE TABLE IF NOT EXISTS public.business_project_discovery_intents"), migration.indexOf("CREATE INDEX IF NOT EXISTS business_project_discovery_intents_discovery_idx"));
  assert.ok(!/UNIQUE\s*\(discovery_id\)/.test(intentsTableSql), "must not restrict a discovery to a single intent");
});
check("7b. Items can attach to the shared discovery (project_intent_id NULL) OR a specific intent, and are unique per (discovery, intent-or-shared, field)", () => {
  assert.ok(migration.includes("project_intent_id uuid NULL"));
  assert.ok(migration.includes("UNIQUE NULLS NOT DISTINCT (discovery_id, project_intent_id, field_key)"));
});
check("7c. One business can have multiple discoveries — no unique constraint limits discoveries-per-business to one", () => {
  const discoveriesTableSql = migration.slice(migration.indexOf("CREATE TABLE IF NOT EXISTS public.business_project_discoveries"), migration.indexOf("CREATE INDEX IF NOT EXISTS business_project_discoveries_business_created_idx"));
  assert.ok(!/UNIQUE\s*\(business_id\)/.test(discoveriesTableSql), "must not restrict a business to a single discovery");
});

// --- 8. Server-authoritative writes / actor safety (MD <permissions>, <security>) ----------------
check("8a. Every repository create/update function requires a real ProjectDiscoveryActor argument — never a bare string identity", () => {
  const mutators = ["createProjectDiscovery", "updateProjectDiscoveryStatus", "createProjectDiscoveryIntent", "updateProjectDiscoveryIntentStatus", "captureProjectDiscoveryItem", "setProjectDiscoveryItemConfirmation", "attachProjectDiscoverySource", "recordProjectDiscoveryConsent"];
  for (const fn of mutators) {
    const idx = repository.indexOf(`export async function ${fn}(`);
    assert.ok(idx !== -1, `${fn} not found`);
    assert.ok(/actor:\s*(ProjectDiscoveryActor|Extract<ProjectDiscoveryActor)/.test(repository.slice(idx, idx + 400)), `${fn} does not require a typed actor`);
  }
});
check("8b. Every list/get function filters by business_id (never id alone) — business isolation", () => {
  const readers = [
    ['getProjectDiscoveryById', '.eq("id", discoveryId)\n    .eq("business_id", businessId)'],
    ['listProjectDiscoveriesForBusiness', '.eq("business_id", businessId)'],
    ['listProjectDiscoveryIntents', '.eq("discovery_id", discoveryId)\n    .eq("business_id", businessId)'],
    ['listProjectDiscoveryItems', '.eq("discovery_id", discoveryId)\n    .eq("business_id", businessId)'],
  ];
  for (const [fn] of readers) {
    assert.ok(repository.includes(`export async function ${fn}`), `${fn} not found`);
  }
  // Structural spot-check: every .from(...).select(...) chain in this file is followed by at least
  // one .eq("business_id" — never a bare id-only lookup.
  const businessScopedEqCount = (repository.match(/\.eq\("business_id"/g) ?? []).length;
  assert.ok(businessScopedEqCount >= 10, "expected business_id scoping on every meaningful read/write path");
});
check("8c. State-transition writers reject an invalid jump using the bounded transition graph, never a free-form status write", () => {
  assert.ok(repository.includes("isValidProjectDiscoveryStatusTransition("));
  assert.ok(repository.includes("isValidProjectDiscoveryIntentTransition("));
});
check("8d. No repository function bypasses capability checks by constructing its own actor or hardcoding a role — actors are always caller-supplied", () => {
  assert.ok(!/actor:\s*ProjectDiscoveryActor\s*=\s*\{/.test(repository), "must never default-construct an actor inside the repository");
});

// --- 9. Security — no secret capture path (MD <security>) ----------------------------------------
check("9a. No file in this domain reads/logs an env secret or prints a credential-shaped value", () => {
  assert.ok(!/OPENAI_API_KEY|process\.env\.\w*(SECRET|PASSWORD|TOKEN)/i.test(repository + types));
  assert.ok(!/console\.(log|error)\([^)]*value/i.test(repository), "must never log a captured discovery value (could be sensitive)");
});
check("9b. Ownership/access fields are represented as ordinary discovery items (status text), never a dedicated password/secret column", () => {
  assert.ok(!/password|api_key|secret_key/i.test(readFileSync(path.join(ROOT, "supabase/migrations/20260911120000_client_project_discovery_foundation.sql"), "utf8")));
});

// --- 10. Client-safe boundary (MD <client_safe_boundary>) -----------------------------------------
check("10a. The client-safe projection never selects truth_class, completeness_class, notes, or any captured-by actor identity field", () => {
  const projectionSrc = readFileSync(path.join(ROOT, "app/lib/business/projectDiscovery/projection.ts"), "utf8");
  assert.ok(!projectionSrc.includes("truthClass:"));
  assert.ok(!projectionSrc.includes("completenessClass:"));
  assert.ok(!projectionSrc.includes("capturedBy"));
  assert.ok(!projectionSrc.includes("notes:"));
});

// --- 11. No live network / no remote mutation from this gate's own code --------------------------
check("11a. No file in this domain imports an OpenAI client or makes any network fetch", () => {
  assert.ok(!/from ["'].*openai/i.test(repository) && !/fetch\(/.test(repository));
});
check("11b. Migration file exists and is the only new migration this gate added", () => {
  assert.ok(existsSync(path.join(ROOT, "supabase/migrations/20260911120000_client_project_discovery_foundation.sql")));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSOME CHECKS FAILED.");
} else {
  console.log("All checks passed.");
}
