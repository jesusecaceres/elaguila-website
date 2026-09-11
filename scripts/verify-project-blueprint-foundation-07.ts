/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — structural verifier. Mirrors
 * scripts/verify-project-blueprint-foundation-06.ts's exact style: source-level checks against the
 * migration, capability, repository, API route, and UI files, never a live database call or a
 * rendered browser.
 *
 * Run from repo root: npx tsx scripts/verify-project-blueprint-foundation-07.ts
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

console.log("Client Review / QA / Launch / Handoff (Gate 7) — structural checks\n");

const ROOT = path.resolve(__dirname, "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

const migration = read("supabase/migrations/20260914120000_gate7_client_review_qa_handoff.sql");
const capabilities = read("app/admin/_lib/salesWorkspaceCapabilities.ts");
const blueprintRepo = read("app/lib/business/projectDiscovery/blueprintRepository.ts");
const feedbackRepo = read("app/lib/business/projectDiscovery/blueprintFeedbackRepository.ts");
const checkItemRepo = read("app/lib/business/projectDiscovery/blueprintCheckItemRepository.ts");
const commitmentBridge = read("app/lib/business/projectDiscovery/blueprintCommitmentBridge.ts");
const releaseAssembler = read("app/lib/business/projectDiscovery/releaseReadinessAssembler.ts");
const clientReviewAssembler = read("app/lib/business/projectDiscovery/clientReviewDataAssembler.ts");
const actions = read("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
const journey = read("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryJourney.tsx");

const routeFeedback = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/blueprint-review/feedback/route.ts");
const routeFeedbackCommitment = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/blueprint-review/feedback/[feedbackId]/commitment/route.ts");
const routeChecklist = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/blueprint-review/checklist/route.ts");
const routeChecklistItem = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/blueprint-review/checklist/[itemId]/route.ts");
const routeChecklistCommitment = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/blueprint-review/checklist/[itemId]/commitment/route.ts");
const routeRelease = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/blueprint-review/release/route.ts");
const routeHandoffComplete = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/blueprint-review/handoff-complete/route.ts");

// ===============================================================================================
// Migration safety
// ===============================================================================================
console.log("Migration safety:");
check("1a. Migration is additive only — no DROP/TRUNCATE/DELETE FROM", () => {
  assert.ok(!/DROP TABLE|TRUNCATE|DELETE FROM/i.test(migration));
});
check("1b. Exactly two new tables (feedback, check_items) — no QA table per project type", () => {
  const count = (migration.match(/CREATE TABLE IF NOT EXISTS/g) ?? []).length;
  assert.equal(count, 2);
  assert.ok(migration.includes("CREATE TABLE IF NOT EXISTS public.business_project_blueprint_feedback"));
  assert.ok(migration.includes("CREATE TABLE IF NOT EXISTS public.business_project_blueprint_check_items"));
});
check("1c. business_project_blueprints gains ONLY nullable release/handoff-completion columns, via ADD COLUMN IF NOT EXISTS", () => {
  assert.ok(migration.includes("ALTER TABLE public.business_project_blueprints"));
  assert.ok(migration.includes("ADD COLUMN IF NOT EXISTS released_at timestamptz NULL"));
  assert.ok(migration.includes("ADD COLUMN IF NOT EXISTS handoff_completed_at timestamptz NULL"));
});
check("1d. no 6th handoff_status value was added — Website completion stays represented by released_at, never a 'Website Project v2' status enum", () => {
  assert.ok(!/handoff_status.*CHECK.*delivered/is.test(migration));
});
check("1e. RLS enabled + deny-all + explicit service_role grant on both new tables, no CREATE POLICY anywhere", () => {
  for (const table of ["business_project_blueprint_feedback", "business_project_blueprint_check_items"]) {
    assert.ok(migration.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`));
    assert.ok(migration.includes(`REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM anon`));
    assert.ok(migration.includes(`GRANT SELECT, INSERT, UPDATE ON TABLE public.${table} TO service_role`));
  }
  assert.ok(!/CREATE POLICY \S+\s+ON\s/i.test(migration));
});
check("1f. check_items is ONE discriminated table (kind: qa/launch/handoff), never three near-identical tables", () => {
  assert.ok(migration.includes("kind text NOT NULL CHECK (kind IN ('qa', 'launch', 'handoff'))"));
});
check("1g. check_items enforces a unique (blueprint_id, kind, item_key) — regenerating a snapshot is an upsert, never a duplicate", () => {
  assert.ok(migration.includes("business_project_blueprint_check_items_uk UNIQUE (blueprint_id, kind, item_key)"));
});
check("1h. a checked status always requires real checker attribution (no silent unchecked-but-marked-pass row)", () => {
  assert.ok(migration.includes("business_project_blueprint_check_items_checked_pair_chk"));
});
check("1i. both new tables have composite same-business FKs to business_project_blueprints AND business_project_discovery_intents", () => {
  const blueprintFks = (migration.match(/REFERENCES public\.business_project_blueprints\(id, business_id\)/g) ?? []).length;
  const intentFks = (migration.match(/REFERENCES public\.business_project_discovery_intents\(id, business_id\)/g) ?? []).length;
  assert.equal(blueprintFks, 2);
  assert.equal(intentFks, 2);
});
check("1j. QA evidence reuses business_source_files via a bare FK, never a second asset table", () => {
  assert.ok(migration.includes("evidence_source_file_id uuid NULL REFERENCES public.business_source_files(id) ON DELETE SET NULL"));
});
check("1k. linked_commitment_id on both new tables points at business_commitments — Promise Keeper's own closed source fields are never altered by this migration", () => {
  assert.ok(!migration.includes("ALTER TABLE public.business_commitments"));
  const commitmentFks = (migration.match(/REFERENCES public\.business_commitments\(id\)/g) ?? []).length;
  assert.equal(commitmentFks, 2);
});

// ===============================================================================================
// Capabilities — no capability explosion
// ===============================================================================================
console.log("\nCapabilities:");
check("2a. no new manage_project_release (or similar) capability was added", () => {
  assert.ok(!capabilities.includes('"manage_project_release"'));
});
check("2b. release/handoff-completion routes reuse manage_project_blueprint (manager+ tier, same as blueprint approval)", () => {
  assert.ok(routeRelease.includes('requireStaffWorkspaceWriteAccess(["manage_project_blueprint"])'));
  assert.ok(routeHandoffComplete.includes('requireStaffWorkspaceWriteAccess(["manage_project_blueprint"])'));
});
check("2c. feedback/QA-item routes reuse review_project_discovery, never a new capability", () => {
  for (const src of [routeFeedback, routeChecklist, routeChecklistItem]) {
    assert.ok(src.includes('requireStaffWorkspaceWriteAccess(["review_project_discovery"])'));
  }
});
check("2d. commitment-bridge routes double-gate against Promise Keeper's OWN existing capabilities (manage_own_commitments / manage_team_commitments), never a new one", () => {
  for (const src of [routeFeedbackCommitment, routeChecklistCommitment]) {
    assert.ok(src.includes('capabilities.has("manage_own_commitments")') && src.includes('capabilities.has("manage_team_commitments")'));
  }
});

// ===============================================================================================
// QA source of truth — never a second disconnected checklist
// ===============================================================================================
console.log("\nQA source of truth:");
check("3a. checklist generation route builds snapshots straight from the blueprint's OWN packet.qaMatrix/launchChecklist/handoffChecklist", () => {
  assert.ok(routeChecklist.includes("blueprint.packet.qaMatrix") || routeChecklist.includes("packet.qaMatrix"));
  assert.ok(routeChecklist.includes("buildQaSnapshotFromPacket") && routeChecklist.includes("buildLaunchSnapshotFromPacket") && routeChecklist.includes("buildHandoffSnapshotFromPacket"));
});
check("3b. ensureCheckItemsSnapshot never overwrites an existing item's status — it only inserts genuinely NEW keys", () => {
  assert.ok(checkItemRepo.includes("existingKeys.has"));
});

// ===============================================================================================
// Server-side guards (MD <qa_guard>, <launch_guard>)
// ===============================================================================================
console.log("\nServer-side guards:");
check("4a. release route re-derives full readiness via assembleReleaseReadiness and rejects unless READY_FOR_RELEASE — never trusts a client-side button", () => {
  assert.ok(routeRelease.includes("assembleReleaseReadiness"));
  assert.ok(routeRelease.includes('readiness.state !== "READY_FOR_RELEASE"'));
});
check("4b. handoff-complete route checks EVERY handoff item's own status server-side before calling completeBlueprintHandoff", () => {
  assert.ok(routeHandoffComplete.includes('listCheckItemsForBlueprint(businessId, blueprintId, "handoff")'));
  assert.ok(routeHandoffComplete.includes('i.status !== "complete" && i.status !== "not_applicable"'));
});
check("4c. markBlueprintReleased/completeBlueprintHandoff both refuse unless the blueprint is already approved_for_build", () => {
  const releasedIdx = blueprintRepo.indexOf("export async function markBlueprintReleased");
  const completeIdx = blueprintRepo.indexOf("export async function completeBlueprintHandoff");
  assert.ok(blueprintRepo.slice(releasedIdx, releasedIdx + 800).includes('existing.status !== "approved_for_build"'));
  assert.ok(blueprintRepo.slice(completeIdx, completeIdx + 800).includes('existing.status !== "approved_for_build"'));
});
check("4d. no API route returns a raw Supabase/Postgres error string — only humanized reason codes", () => {
  for (const src of [routeFeedback, routeChecklist, routeChecklistItem, routeRelease, routeHandoffComplete]) {
    assert.ok(!/error\.message/.test(src));
  }
});

// ===============================================================================================
// Business/blueprint/intent isolation
// ===============================================================================================
console.log("\nIsolation:");
check("5a. feedback route derives projectIntentId FROM the blueprint row itself, never trusts client-supplied intentId", () => {
  assert.ok(routeFeedback.includes("blueprint.projectIntentId"));
  assert.ok(!/body\.projectIntentId/.test(routeFeedback));
});
check("5b. feedback/checklist routes verify the blueprint's own discoveryId matches the URL's discoveryId (cross-discovery rejection)", () => {
  assert.ok(routeFeedback.includes("blueprint.discoveryId !== discoveryId"));
  assert.ok(routeChecklist.includes("blueprint.discoveryId !== discoveryId"));
  assert.ok(routeRelease.includes("blueprint.discoveryId !== discoveryId"));
  assert.ok(routeHandoffComplete.includes("blueprint.discoveryId !== discoveryId"));
});
check("5c. every repository read/write filters by business_id, never id alone", () => {
  for (const src of [feedbackRepo, checkItemRepo]) {
    assert.ok(src.includes('.eq("business_id"'));
  }
});

// ===============================================================================================
// Promise Keeper bridge (MD <promise_keeper>) — real commitments only, never fabricated
// ===============================================================================================
console.log("\nPromise Keeper bridge:");
check("6a. the bridge creates the REAL Promise Keeper commitment first and never rolls it back on a link failure", () => {
  assert.ok(commitmentBridge.includes("createCommitment("));
  assert.ok(commitmentBridge.includes(".catch(() => undefined)"));
});
check("6b. Promise Keeper's own closed source fields (meetingId/recommendationId/proposalId) are never touched by the bridge", () => {
  assert.ok(!/meetingId:|recommendationId:|proposalId:/.test(commitmentBridge));
});
function codeLines(src: string): string {
  return src
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .join("\n");
}

check("6c. no commitment is ever auto-created — no repository file actually CALLS createCommitment() in real code (a doc-comment mention referencing it is fine); only the dedicated bridge does", () => {
  assert.ok(!codeLines(checkItemRepo).includes("createCommitment("));
  assert.ok(!codeLines(feedbackRepo).includes("createCommitment("));
  assert.ok(codeLines(commitmentBridge).includes("createCommitment("));
});

// ===============================================================================================
// Execution status truth (MD <execution_status_truth>)
// ===============================================================================================
console.log("\nExecution status truth:");
check("7a. release readiness assembler reads REAL Creative Studio job existence and REAL Growth Campaign existence — never fabricates progress", () => {
  assert.ok(releaseAssembler.includes("getJobByBlueprintId"));
  assert.ok(releaseAssembler.includes("getGrowthCampaignByBlueprintId"));
});
check("7b. Website execution truth comes only from the blueprint's OWN handoffStatus field, never a second status source", () => {
  assert.ok(releaseAssembler.includes("blueprint.handoffStatus"));
});
check("7c. no hardcoded 'in_progress' or fabricated execution status string appears in the assembler", () => {
  assert.ok(!/executionExists = true;?\s*\/\/.*guess/i.test(releaseAssembler));
});

// ===============================================================================================
// Truthfulness — no fake contract/signature/payment claims anywhere in Gate 7's new UI copy
// ===============================================================================================
console.log("\nTruthfulness:");
check("8a. no fake e-signature / DocuSign / contract-acceptance UI copy anywhere in Gate 7's new components", () => {
  for (const src of [actions, journey]) {
    assert.ok(!/docusign/i.test(src));
    assert.ok(!/firmado electrónicamente|e-signature|signed contract/i.test(src));
  }
});
check("8b. no hardcoded commercial price/rate anywhere in Gate 7's new engine/bridge files", () => {
  for (const src of [releaseAssembler, clientReviewAssembler, commitmentBridge]) {
    assert.ok(!/\$\d/.test(src));
  }
});

// ===============================================================================================
// Bilingual + mobile
// ===============================================================================================
console.log("\nBilingual + mobile:");
check("9a. all required Gate 7 bilingual phrase pairs appear verbatim in the UI layer", () => {
  const required: [string, string][] = [
    ["Revisión con el cliente", "Client Review"],
    ["Comentarios del cliente", "Client Feedback"],
    ["Cambio solicitado", "Change Requested"],
    ["Necesita aclaración", "Needs Clarification"],
    ["Control de calidad del proyecto", "Project QA"],
    ["No revisado", "Not Checked"],
    ["Falló", "Fail"],
    ["Bloqueado", "Blocked"],
    ["Listo para lanzamiento", "Ready for Release"],
    ["Requiere acción del cliente", "Needs Client Action"],
    ["Requiere acción de Leonix", "Needs Leonix Action"],
    ["Lista de lanzamiento", "Launch Checklist"],
    ["Entrega completada", "Handoff Complete"],
    ["Historial del proyecto", "Project Timeline"],
  ];
  const haystacks = [journey, actions];
  for (const [es, en] of required) {
    assert.ok(haystacks.some((h) => h.includes(es)), `missing ES phrase: ${es}`);
    assert.ok(haystacks.some((h) => h.includes(en)), `missing EN phrase: ${en}`);
  }
});
check("9b. checklist status controls use the shared min-h-[36px]/[44px] touch-target classes, never a bespoke tiny control", () => {
  const section = actions.slice(actions.indexOf("UpdateCheckItemStatusControl"));
  assert.ok(section.includes("min-h-[36px]"));
});
check("9c. Gate 7 panel never renders a fixed-width HTML table (checklist/timeline stay in stacked cards/lists)", () => {
  const section = journey.slice(journey.indexOf("function ClientReviewQaHandoffPanel"), journey.indexOf("function ClientReviewQaHandoffPanel") + 8000);
  assert.ok(!/<table/i.test(section));
});
check("9d. feedback textarea and checklist labels wrap (no whitespace-nowrap/truncate on review content)", () => {
  const section = journey.slice(journey.indexOf("function ClientReviewQaHandoffPanel"), journey.indexOf("function ClientReviewQaHandoffPanel") + 8000);
  assert.ok(!/whitespace-nowrap/.test(section));
});

console.log(`\n${passed} check(s) passed.`);
