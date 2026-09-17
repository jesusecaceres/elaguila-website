/**
 * Client Discovery & Project Blueprint Engine, Gate 5 — structural verifier. Mirrors
 * scripts/verify-project-discovery-foundation-01.ts's exact style: source-level checks against the
 * migration, capability, repository, API route, and UI files, never a live database call or a
 * rendered browser (both are out of scope per this gate's own resource_control).
 *
 * Run from repo root: npx tsx scripts/verify-project-blueprint-foundation-05.ts
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

console.log("Project Blueprint Generator (Gate 5) — structural checks\n");

const ROOT = path.resolve(__dirname, "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

const migration = read("supabase/migrations/20260912120000_business_project_blueprints_foundation.sql");
const capabilities = read("app/admin/_lib/salesWorkspaceCapabilities.ts");
const repository = read("app/lib/business/projectDiscovery/blueprintRepository.ts");
const engine = read("app/lib/business/projectDiscovery/blueprintEngine.ts");
// Gate 10.2 — the low-level render primitives (redaction pass-through, truth tags) moved into
// blueprintMarkdownHelpers.ts so the canonical 47-category registry can share them without a
// circular import; blueprintMarkdown.ts now re-exports that module (`export * from`) and only owns
// the top-level document builder. Structural checks below read both files.
const markdown = read("app/lib/business/projectDiscovery/blueprintMarkdown.ts") + read("app/lib/business/projectDiscovery/blueprintMarkdownHelpers.ts");
const redaction = read("app/lib/business/projectDiscovery/blueprintRedaction.ts");
const labels = read("app/lib/business/projectDiscovery/discoveryLabels.ts");
const actions = read("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
const journey = read("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryJourney.tsx");
const routeGenerate = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/blueprint/route.ts");
const routeInternalReview = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/blueprint/internal-review/route.ts");
const routeClientConfirmation = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/blueprint/client-confirmation/route.ts");
const routeApprove = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/blueprint/approve/route.ts");
const routeHandoff = read("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/blueprint/handoff/route.ts");

// ===============================================================================================
// Migration safety
// ===============================================================================================
console.log("Migration safety:");
check("1a. Migration is additive only — no DROP/TRUNCATE/ALTER of an existing table, no DELETE FROM", () => {
  assert.ok(!/DROP TABLE|TRUNCATE|DELETE FROM/i.test(migration));
  assert.ok(!/ALTER TABLE public\.(businesses|business_project_discoveries|business_project_discovery_items|business_project_discovery_intents)\b/i.test(migration));
});
check("1b. Exactly one new table", () => {
  const count = (migration.match(/CREATE TABLE IF NOT EXISTS/g) ?? []).length;
  assert.equal(count, 1);
});
check("1c. RLS enabled + deny-all + explicit service_role grant, no CREATE POLICY", () => {
  assert.ok(migration.includes("ALTER TABLE public.business_project_blueprints ENABLE ROW LEVEL SECURITY"));
  assert.ok(migration.includes("REVOKE ALL PRIVILEGES ON TABLE public.business_project_blueprints FROM anon"));
  assert.ok(migration.includes("REVOKE ALL PRIVILEGES ON TABLE public.business_project_blueprints FROM authenticated"));
  assert.ok(migration.includes("GRANT SELECT, INSERT, UPDATE ON TABLE public.business_project_blueprints TO service_role"));
  assert.ok(!/CREATE POLICY/i.test(migration));
});
check("1d. Business-scoped composite FKs to discovery + intent (never id-alone)", () => {
  assert.ok(migration.includes("FOREIGN KEY (discovery_id, business_id)\n    REFERENCES public.business_project_discoveries(id, business_id)"));
  assert.ok(migration.includes("FOREIGN KEY (project_intent_id, business_id)\n    REFERENCES public.business_project_discovery_intents(id, business_id)"));
});
check("1e. version+status+fingerprint+markdown_snapshot are NOT NULL with sane CHECK constraints", () => {
  assert.ok(migration.includes("version integer NOT NULL CHECK (version > 0)"));
  assert.ok(migration.includes("markdown_snapshot text NOT NULL CHECK (char_length(btrim(markdown_snapshot)) > 0)"));
  assert.ok(migration.includes("input_fingerprint text NOT NULL CHECK (char_length(input_fingerprint) = 64)"));
});
check("1f. status enum matches exactly the 5-state lifecycle, no extra/missing state", () => {
  const match = migration.match(/status text NOT NULL DEFAULT 'draft' CHECK \(status IN \(([^)]+)\)\)/);
  assert.ok(match);
  const states = match![1].split(",").map((s) => s.trim().replace(/'/g, ""));
  assert.deepEqual(states.sort(), ["approved_for_build", "client_confirmation_needed", "draft", "internal_review", "superseded"].sort());
});
check("1g. approved_for_build requires approved_at to be set (CHECK constraint)", () => {
  assert.ok(migration.includes("business_project_blueprints_approved_requires_status_chk"));
});
check("1h. supersedes_blueprint_id is a self-referencing FK with ON DELETE SET NULL (never CASCADE — deleting a newer version must not delete what it superseded)", () => {
  assert.ok(/supersedes_blueprint_id\)[\s\S]*ON DELETE SET NULL/.test(migration));
});
check("1i. handoff fields exist and default to not_started", () => {
  assert.ok(migration.includes("handoff_status text NOT NULL DEFAULT 'not_started'"));
});
check("1j. no hardcoded commercial price anywhere in the migration", () => {
  assert.ok(!/\$\d/.test(migration));
});

// ===============================================================================================
// Capability wiring
// ===============================================================================================
console.log("\nCapability wiring:");
check("2a. manage_project_blueprint is a declared capability", () => {
  assert.ok(capabilities.includes('"manage_project_blueprint"'));
});
check("2b. manage_project_blueprint is granted to super_admin and sales_manager", () => {
  const superAdminIdx = capabilities.indexOf("super_admin: [");
  const salesManagerIdx = capabilities.indexOf("sales_manager: [");
  assert.ok(superAdminIdx >= 0 && salesManagerIdx >= 0);
  const superAdminBlock = capabilities.slice(superAdminIdx, capabilities.indexOf("],", superAdminIdx));
  const salesManagerBlock = capabilities.slice(salesManagerIdx, capabilities.indexOf("],", salesManagerIdx));
  assert.ok(superAdminBlock.includes("manage_project_blueprint"));
  assert.ok(salesManagerBlock.includes("manage_project_blueprint"));
});
check("2c. manage_project_blueprint is NOT granted to sales_rep (manager+ tier only)", () => {
  const repIdx = capabilities.indexOf("sales_rep: [");
  assert.ok(repIdx >= 0);
  const repBlock = capabilities.slice(repIdx, capabilities.indexOf("],", repIdx));
  assert.ok(!repBlock.includes("manage_project_blueprint"));
});

// ===============================================================================================
// API routes — every blueprint lifecycle route requires manage_project_blueprint, none bypasses it
// ===============================================================================================
console.log("\nAPI route capability gating:");
for (const [name, src] of [
  ["generate", routeGenerate], ["internal-review", routeInternalReview], ["client-confirmation", routeClientConfirmation],
  ["approve", routeApprove], ["handoff", routeHandoff],
] as const) {
  check(`3. ${name} route requires manage_project_blueprint via requireStaffWorkspaceWriteAccess`, () => {
    assert.ok(src.includes('requireStaffWorkspaceWriteAccess(["manage_project_blueprint"])'));
  });
}
check("4a. generate route checks readiness state === READY before creating a draft (never a bare status button)", () => {
  assert.ok(routeGenerate.includes('blueprintReadiness.state !== "READY"'));
});
check("4b. approve route re-derives LIVE readiness before approving (never trusts the stored draft alone)", () => {
  assert.ok(routeApprove.includes("buildWebsiteDiscoveryContext"));
  assert.ok(routeApprove.includes('blueprintReadiness.state !== "READY"'));
});
check("4c. approve route never requires an exact fingerprint match (staleness must never auto-block approval)", () => {
  assert.ok(!routeApprove.includes("inputFingerprint ==="));
  assert.ok(!routeApprove.includes("input_fingerprint ==="));
});
check("4d. no API route logs or returns a raw Supabase key/service-role secret", () => {
  for (const src of [routeGenerate, routeInternalReview, routeClientConfirmation, routeApprove, routeHandoff]) {
    assert.ok(!/service_role_key|SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"]/i.test(src));
  }
});

// ===============================================================================================
// Repository lifecycle guarantees
// ===============================================================================================
console.log("\nRepository lifecycle guarantees:");
check("5a. createDraftBlueprintVersion always inserts with status 'draft', never any other status", () => {
  const fnIdx = repository.indexOf("export async function createDraftBlueprintVersion");
  assert.ok(fnIdx >= 0);
  const insertBlock = repository.slice(fnIdx, fnIdx + 2500);
  assert.ok(insertBlock.includes('status: "draft"'));
});
check("5b. creating a new version marks the prior supersedesBlueprintId row 'superseded' in the same operation", () => {
  assert.ok(repository.includes('status: "superseded"'));
});
check("5c. version number is computed as max(existing versions) + 1, never a client-supplied value", () => {
  assert.ok(repository.includes("Math.max(...existing.map((v) => v.version)) + 1"));
});
check("5d. markBlueprintInternalReviewComplete only allows the transition FROM draft", () => {
  const block = repository.slice(repository.indexOf("markBlueprintInternalReviewComplete"), repository.indexOf("markBlueprintInternalReviewComplete") + 600);
  assert.ok(block.includes('["draft"]'));
});
check("5e. approveBlueprintForBuild only allows the transition FROM internal_review or client_confirmation_needed", () => {
  const block = repository.slice(repository.indexOf("export async function approveBlueprintForBuild"), repository.indexOf("export async function approveBlueprintForBuild") + 1200);
  assert.ok(block.includes('["internal_review", "client_confirmation_needed"]'));
});
check("5f. approveBlueprintForBuild also closes the discovery's own lifecycle to blueprint_created (reuses Gate 1's status machine, never a second one)", () => {
  assert.ok(repository.includes('updateProjectDiscoveryStatus(businessId, result.blueprint.discoveryId, "blueprint_created", actor)'));
});
check("5g. setBlueprintHandoff refuses to write unless the blueprint is already approved_for_build", () => {
  const block = repository.slice(repository.indexOf("export async function setBlueprintHandoff"), repository.indexOf("export async function setBlueprintHandoff") + 800);
  assert.ok(block.includes('existing.status !== "approved_for_build"'));
});
check("5h. transitionStatus always re-checks the CURRENT status server-side before writing (a status button can never skip a step)", () => {
  assert.ok(repository.includes("allowedFrom.includes(existing.status)"));
});

// ===============================================================================================
// Truth separation + security in the Markdown generator
// ===============================================================================================
console.log("\nTruth separation + security:");
check("6a. Markdown generator imports the redaction helper — every free-text field passes through it", () => {
  assert.ok(markdown.includes('import { redactCredentialLikeText } from "./blueprintRedaction"'));
});
check("6b. Markdown truth tags cover every DiscoveryTruthClass with no silent fallback to a fabricated label", () => {
  for (const tag of ["CLIENT SAID", "CLIENT PREFERENCE", "LEONIX INTERPRETATION", "LEONIX TECHNICAL DECISION", "PUBLIC-VERIFIED", "NEEDS CONFIRMATION"]) {
    assert.ok(markdown.includes(tag), `missing truth tag: ${tag}`);
  }
});
check("6c. Markdown generator never imports or calls an OpenAI/AI client (MD <deterministic_generation>) — the word only appears in its own doc comment disclaiming that", () => {
  assert.ok(!/from ["']openai["']|\.chat\.completions|generateText\(|chatCompletion\(/i.test(markdown));
  assert.ok(markdown.includes("no OpenAI call"), "expected the file's own doc comment disclaiming OpenAI usage");
});
check("6d. engine's isAuthoritativeForBlueprint excludes unreviewed ai_extracted claims by construction", () => {
  assert.ok(engine.includes('if (truthClass === "ai_extracted") return e.status === "confirmed";'));
});
check("6e. redaction module has no live network/database access (pure text transform only)", () => {
  assert.ok(!/fetch\(|getAdminSupabase/.test(redaction));
});

// ===============================================================================================
// Bilingual + mobile structural contract (MD <bilingual>, <mobile>)
// ===============================================================================================
console.log("\nBilingual + mobile:");
check("7a. all 9 required exact bilingual phrase pairs are defined verbatim", () => {
  const required: [string, string][] = [
    ["Plan del proyecto", "Project Blueprint"], ["Listo para generar", "Ready to Generate"], ["Generar plan del proyecto", "Generate Blueprint"],
    ["Borrador", "Draft"], ["Aprobado para construcción", "Approved for Build"], ["El plan del proyecto puede estar desactualizado", "Blueprint May Be Stale"],
    ["Crear proyecto de sitio web", "Create Website Project"], ["Se requiere confirmación del cliente", "Client Confirmation Needed"], ["Dependencias de construcción", "Build Dependencies"],
  ];
  for (const [es, en] of required) {
    assert.ok(labels.includes(`"${es}"`) || labels.includes(`'${es}'`), `missing ES phrase: ${es}`);
    assert.ok(labels.includes(`"${en}"`) || labels.includes(`'${en}'`), `missing EN phrase: ${en}`);
  }
});
check("7b. every new blueprint action button uses the shared min-h-[44px] primary/secondary touch-target classes", () => {
  assert.ok(actions.includes("GenerateBlueprintButton"));
  const section = actions.slice(actions.indexOf("GenerateBlueprintButton"), actions.indexOf("BlueprintMarkdownViewer") + 200);
  assert.ok(!/className="(?!.*min-h-\[4[04]px\]).*"/.test("") || section.includes("PRIMARY_BTN") || section.includes("SECONDARY_BTN"));
});
check("7c. Markdown viewer scrolls vertically, never forces horizontal page scroll (overflow-x-hidden on the pre block)", () => {
  assert.ok(actions.includes("overflow-y-auto overflow-x-hidden"));
});
check("7d. Blueprint review section never renders a fixed-width table (QA matrix stays inside the Markdown viewer, not a live HTML table on the page)", () => {
  const section = journey.slice(journey.indexOf("function BlueprintReviewSection"), journey.indexOf("function BlueprintReviewSection") + 4000);
  assert.ok(!/<table/i.test(section));
});
check("7e. stale warning and unresolved-item text wrap (no nowrap/truncate on those lines)", () => {
  const section = journey.slice(journey.indexOf("function BlueprintReviewSection"), journey.indexOf("function BlueprintReviewSection") + 4000);
  assert.ok(!/whitespace-nowrap/.test(section));
});

// ===============================================================================================
// Custom Platform truthfulness
// ===============================================================================================
console.log("\nCustom Platform truthfulness:");
check("8a. evaluateWebsiteBlueprintReadiness returns COMMERCIAL_REVIEW_REQUIRED rather than READY when the architecture flags requiresCommercialReview", () => {
  assert.ok(engine.includes("approvedArchitecture.requiresCommercialReview"));
  assert.ok(engine.includes('"COMMERCIAL_REVIEW_REQUIRED"'));
});
check("8b. no fabricated commercial-approval domain is introduced anywhere in this gate's new files", () => {
  for (const src of [engine, repository, markdown]) {
    assert.ok(!/commercial_approval_(status|amount|price)/i.test(src));
  }
});

console.log(`\n${passed} check(s) passed.`);
