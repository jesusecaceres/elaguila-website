/**
 * Focused tests for Gate BCO-5A (Living Business Book + Discovery foundation). Same hand-rolled
 * node:assert convention as every other verify-*.ts script in this repo. Deterministic-logic and
 * question-registry checks are real unit tests (pure functions/data, no DB dependency); migration
 * and route-wiring checks are source-level structural proof — this sandbox has no raw-SQL
 * execution or live staging access for this specific package this session.
 * Run from repo root: npx tsx scripts/verify-living-business-book-01.ts
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

console.log("Living Business Book foundation (Gate BCO-5A) — focused tests\n");

function read(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

// --- Deterministic logic (real unit tests) ----------------------------------------------------
import { deriveFactFreshness, computeBookCompleteness, isVerifiedTruth, requiresManagerReviewToOverwrite, shapeFactsForOwnerView, shapeUnknownsForOwnerView } from "../app/lib/business/livingBook/logic";
import type { BusinessFact, BusinessUnknown } from "../app/lib/business/livingBook/types";

check("deriveFactFreshness: null last_verified_at is 'unknown', never silently 'fresh' or 'stale'", () => {
  assert.equal(deriveFactFreshness(null, "2026-08-04T00:00:00Z"), "unknown");
});
check("deriveFactFreshness: within 90 days is 'fresh', 91-270 is 'aging', beyond is 'stale'", () => {
  assert.equal(deriveFactFreshness("2026-07-20T00:00:00Z", "2026-08-04T00:00:00Z"), "fresh");
  assert.equal(deriveFactFreshness("2026-01-01T00:00:00Z", "2026-08-04T00:00:00Z"), "aging");
  assert.equal(deriveFactFreshness("2024-01-01T00:00:00Z", "2026-08-04T00:00:00Z"), "stale");
});

function fact(overrides: Partial<{ status: string; sourceClass: string; lastVerifiedAt: string | null }> = {}) {
  return { status: "active", sourceClass: "staff_observation", lastVerifiedAt: null, ...overrides };
}

check("computeBookCompleteness: counts confirmed facts (owner_confirmed source), owner statements, open unknowns, unresolved contradictions, and stale facts independently", () => {
  const result = computeBookCompleteness({
    facts: [fact({ sourceClass: "owner_confirmed" }), fact({ sourceClass: "owner_statement" }), fact({ status: "superseded", sourceClass: "owner_confirmed" }), fact({ lastVerifiedAt: "2024-01-01T00:00:00Z" })],
    unknowns: [{ status: "open" }, { status: "answered" }],
    contradictions: [{ status: "open" }, { status: "resolved" }],
    discoveryAnswered: 3,
    discoveryTotal: 10,
    nowIso: "2026-08-04T00:00:00Z",
  });
  assert.equal(result.confirmedFactCount, 1, "only the ACTIVE owner_confirmed fact counts, not the superseded one");
  assert.equal(result.ownerStatementCount, 1);
  assert.equal(result.openUnknownCount, 1);
  assert.equal(result.unresolvedContradictionCount, 1);
  assert.equal(result.staleFactCount, 1);
  assert.deepEqual(result.discoveryProgress, { answered: 3, total: 10 });
});

check("isVerifiedTruth: only owner_confirmed/staff_confirmed confirmation states or an owner_confirmed source count as verified truth — an ai_inference or owner_statement never does", () => {
  assert.ok(isVerifiedTruth("owner_confirmed", "staff_observation"));
  assert.ok(isVerifiedTruth("unconfirmed", "owner_confirmed"));
  assert.equal(isVerifiedTruth("unconfirmed", "ai_inference"), false);
  assert.equal(isVerifiedTruth("unconfirmed", "owner_statement"), false);
});

check("requiresManagerReviewToOverwrite: only a sensitive + already-trusted (confirmed) fact requires manager review to overwrite — a standard or not-yet-confirmed fact does not", () => {
  assert.equal(requiresManagerReviewToOverwrite(null), false);
  assert.equal(requiresManagerReviewToOverwrite({ sensitivity: "standard", confirmationState: "owner_confirmed" }), false);
  assert.equal(requiresManagerReviewToOverwrite({ sensitivity: "sensitive", confirmationState: "unconfirmed" }), false);
  assert.ok(requiresManagerReviewToOverwrite({ sensitivity: "sensitive", confirmationState: "owner_confirmed" }));
  assert.ok(requiresManagerReviewToOverwrite({ sensitivity: "sensitive", confirmationState: "staff_confirmed" }));
});

check("shapeFactsForOwnerView: the owner NEVER sees a sensitive fact even if visibility says owner_and_staff — sensitivity is the stronger, non-overridable gate", () => {
  const facts = [
    { status: "active", visibility: "owner_and_staff", sensitivity: "standard" },
    { status: "active", visibility: "owner_and_staff", sensitivity: "sensitive" },
    { status: "active", visibility: "staff_only", sensitivity: "standard" },
    { status: "superseded", visibility: "owner_and_staff", sensitivity: "standard" },
  ] as unknown as BusinessFact[];
  const shaped = shapeFactsForOwnerView(facts);
  assert.equal(shaped.length, 1, "only the active, owner_and_staff, standard-sensitivity fact should survive");
});

check("shapeUnknownsForOwnerView: only open, owner_and_staff unknowns are shown to the owner", () => {
  const unknowns = [
    { status: "open", visibility: "owner_and_staff" },
    { status: "open", visibility: "staff_only" },
    { status: "answered", visibility: "owner_and_staff" },
  ] as unknown as BusinessUnknown[];
  assert.equal(shapeUnknownsForOwnerView(unknowns).length, 1);
});

// --- Question registry (real data checks) -------------------------------------------------------
import { DISCOVERY_QUESTIONS, findQuestionByKey, nextUnansweredQuestionKey } from "../app/lib/business/livingBook/questionRegistry";

check("Question registry: every key is unique", () => {
  const keys = DISCOVERY_QUESTIONS.map((q) => q.key);
  assert.equal(new Set(keys).size, keys.length);
});
check("Question registry: every question has non-empty ES and EN text", () => {
  for (const q of DISCOVERY_QUESTIONS) {
    assert.ok(q.es.trim().length > 0, `${q.key} missing ES text`);
    assert.ok(q.en.trim().length > 0, `${q.key} missing EN text`);
  }
});
check("Question registry: every category from the mandate is represented", () => {
  const categories = new Set(DISCOVERY_QUESTIONS.map((q) => q.category));
  for (const c of ["business_and_owner_goals", "customers_and_market", "products_and_services", "operations_and_capacity", "visibility_and_communication", "challenges_and_readiness"]) {
    assert.ok(categories.has(c as never), `missing category ${c}`);
  }
});
check("Question registry: sensitive questions explain why Leonix asks and are never required", () => {
  for (const q of DISCOVERY_QUESTIONS.filter((q) => q.sensitive)) {
    assert.ok(q.whyWeAsk, `${q.key} is sensitive but has no whyWeAsk explanation`);
    assert.equal(q.required, false, `${q.key} is sensitive and must not be required`);
  }
});
check("Question registry: findQuestionByKey / nextUnansweredQuestionKey behave correctly", () => {
  assert.equal(findQuestionByKey("does_not_exist"), null);
  assert.ok(findQuestionByKey(DISCOVERY_QUESTIONS[0].key));
  const allAnswered = new Set(DISCOVERY_QUESTIONS.map((q) => q.key));
  assert.equal(nextUnansweredQuestionKey(allAnswered), null);
  assert.equal(nextUnansweredQuestionKey(new Set()), DISCOVERY_QUESTIONS[0].key);
});

// --- Migration structural proof -------------------------------------------------------------------
const MIGRATION_PATH = "supabase/migrations/20260804180000_living_business_book_foundation.sql";
const migrationText = read(MIGRATION_PATH);
const BOOK_TABLES = [
  "business_facts", "business_evidence", "business_unknowns", "business_contradictions",
  "business_corrections", "business_discovery_sessions", "business_discovery_answers", "business_book_audit_log",
];

check("Migration: all eight Living Business Book tables are defined, additive (CREATE TABLE IF NOT EXISTS)", () => {
  for (const t of BOOK_TABLES) {
    assert.ok(migrationText.includes(`CREATE TABLE IF NOT EXISTS public.${t}`), `missing table ${t}`);
  }
});
check("Migration: every table references public.businesses(id) with ON DELETE CASCADE (or a session_id chain that itself cascades)", () => {
  for (const t of ["business_facts", "business_evidence", "business_unknowns", "business_contradictions", "business_corrections", "business_discovery_sessions", "business_discovery_answers", "business_book_audit_log"]) {
    const idx = migrationText.indexOf(`CREATE TABLE IF NOT EXISTS public.${t}`);
    const nextTableIdx = migrationText.indexOf("CREATE TABLE IF NOT EXISTS public.", idx + 1);
    const block = migrationText.slice(idx, nextTableIdx === -1 ? migrationText.length : nextTableIdx);
    assert.ok(block.includes("business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE"), `${t} missing business_id FK+cascade`);
  }
});
check("Migration: the required 9 source classes are all present in business_facts.source_class CHECK", () => {
  for (const sc of ["owner_confirmed", "owner_statement", "staff_observation", "public_source_observation", "connected_account_observation", "leonix_listing_observation", "imported_record", "ai_inference", "system_derived"]) {
    assert.ok(migrationText.includes(`'${sc}'`), `missing source class ${sc}`);
  }
});
check("Migration: business_facts has a partial unique index guaranteeing at most one ACTIVE fact per (business, fact_key) — the supersession invariant", () => {
  assert.ok(migrationText.includes("business_facts_one_active_per_key"));
  assert.ok(/WHERE status = 'active'/.test(migrationText));
});
check("Migration: business_contradictions can never resolve without an explanation and a real staff actor (CHECK-enforced, not just app-trusted)", () => {
  assert.ok(migrationText.includes("business_contradictions_resolution_chk"));
  assert.ok(migrationText.includes("resolution IS NOT NULL AND resolved_at IS NOT NULL AND resolved_by_roster_id IS NOT NULL"));
});
check("Migration: business_corrections can never be decided without a real staff actor (CHECK-enforced)", () => {
  assert.ok(migrationText.includes("business_corrections_decision_chk"));
  assert.ok(migrationText.includes("decided_at IS NOT NULL AND decided_by_roster_id IS NOT NULL"));
});
check("Migration: every dual-actor column set enforces staff-requires-roster-id / owner-requires-null-roster-id via a CHECK, never trusting actor_type alone", () => {
  const actorChecks = migrationText.match(/CONSTRAINT \w+_actor_chk CHECK/g) ?? [];
  assert.ok(actorChecks.length >= 7, `expected at least 7 actor-shape CHECK constraints across the 8 tables, found ${actorChecks.length}`);
});
check("Migration: business_book_audit_log covers all 16 required action types", () => {
  for (const action of ["fact_created", "fact_updated", "fact_confirmed", "fact_rejected", "fact_superseded", "evidence_added", "unknown_created", "unknown_resolved", "contradiction_created", "contradiction_resolved", "correction_requested", "correction_accepted", "correction_declined", "discovery_started", "discovery_answer_recorded", "discovery_completed"]) {
    assert.ok(migrationText.includes(`'${action}'`), `missing audit action ${action}`);
  }
});
check("Migration: grant hardening matches the owner-proven Gate BCO-4A.6/4A.7 pattern exactly — REVOKE FROM PUBLIC then explicit SELECT/INSERT/UPDATE/DELETE to service_role, never GRANT ALL PRIVILEGES", () => {
  assert.ok(!/^GRANT ALL PRIVILEGES/m.test(migrationText), "must not depend on GRANT ALL PRIVILEGES as an actual statement (the phrase may still appear inside an explanatory comment)");
  for (const t of BOOK_TABLES) {
    assert.ok(migrationText.includes(`REVOKE ALL PRIVILEGES ON TABLE public.${t} FROM PUBLIC;`), `missing REVOKE FROM PUBLIC for ${t}`);
    assert.ok(migrationText.includes(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.${t} TO service_role;`), `missing explicit service_role DML grant for ${t}`);
  }
  const grantLines = migrationText.split("\n").filter((line) => line.trim().startsWith("GRANT "));
  for (const line of grantLines) {
    assert.ok(!/\bTO\b.*\b(anon|authenticated|PUBLIC)\b/i.test(line), `GRANT line must never target anon/authenticated/PUBLIC: ${line}`);
  }
});
check("Migration: RLS enabled on all eight tables, zero policies", () => {
  for (const t of BOOK_TABLES) {
    assert.ok(migrationText.includes(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;`), `missing RLS enable for ${t}`);
  }
  assert.ok(!/CREATE POLICY/i.test(migrationText));
});
check("Migration: no destructive statement, no production reference, no seeded business data (the flag-row insert is the one intentional, idempotent seed)", () => {
  assert.ok(!/DROP TABLE|DROP COLUMN|ALTER COLUMN .* TYPE|TRUNCATE|DELETE FROM/i.test(migrationText));
  assert.ok(!migrationText.includes("xuieateniufcrsfdomwl"));
  const inserts = migrationText.match(/INSERT INTO/gi) ?? [];
  assert.equal(inserts.length, 1, "the only INSERT should be the living_business_book flag row");
  assert.ok(migrationText.includes("'living_business_book', false, false, '{}'"));
});

// --- Capability matrix extension ------------------------------------------------------------------
const capsText = read("app/admin/_lib/salesWorkspaceCapabilities.ts");
const BOOK_CAPS = ["view_business_book", "view_private_business_facts", "create_business_fact", "confirm_business_fact", "create_evidence", "manage_unknowns", "resolve_contradictions", "conduct_discovery", "review_owner_corrections", "view_business_history"];

check("Capability matrix: all 10 Living Business Book capabilities are defined in the SAME matrix as Sales Workspace — not a parallel capability system", () => {
  for (const cap of BOOK_CAPS) {
    assert.ok(capsText.includes(`"${cap}"`), `missing capability ${cap}`);
  }
});

import { capabilitiesForRole } from "../app/admin/_lib/salesWorkspaceCapabilities";
check("Capability matrix: super_admin and sales_manager hold all 10 Living Business Book capabilities; sales_rep holds exactly the 6 propose-only capabilities and none of the 4 review/confirm ones", () => {
  const superCaps = capabilitiesForRole("super_admin");
  const managerCaps = capabilitiesForRole("sales_manager");
  const repCaps = capabilitiesForRole("sales_rep");
  for (const cap of BOOK_CAPS) {
    assert.ok(superCaps.has(cap as never), `super_admin missing ${cap}`);
    assert.ok(managerCaps.has(cap as never), `sales_manager missing ${cap}`);
  }
  const repShouldHave = ["view_business_book", "create_business_fact", "manage_unknowns", "create_evidence", "conduct_discovery", "view_business_history"];
  const repShouldNotHave = ["view_private_business_facts", "confirm_business_fact", "resolve_contradictions", "review_owner_corrections"];
  for (const cap of repShouldHave) assert.ok(repCaps.has(cap as never), `sales_rep missing ${cap}`);
  for (const cap of repShouldNotHave) assert.equal(repCaps.has(cap as never), false, `sales_rep must NOT have ${cap}`);
});

// --- Repository actor-attribution enforcement (structural) -----------------------------------------
const repoText = read("app/lib/business/livingBook/repository.ts");
check("Repository: every write function requires a LivingBookActor argument — no function accepts a bare actor email/id string", () => {
  for (const fn of ["upsertFact", "confirmFact", "addEvidence", "createUnknown", "resolveUnknown", "createContradiction", "resolveContradiction", "submitCorrection", "decideCorrection", "startDiscoverySession", "recordDiscoveryAnswer", "completeDiscoverySession"]) {
    assert.ok(repoText.includes(`export async function ${fn}(`), `${fn} not found`);
  }
  assert.ok(!/\(actorEmail: string/.test(repoText), "no write function's parameter list may accept a bare actorEmail: string (a return-type field of the same name is fine)");
});
check("Repository: every mutation writes to business_book_audit_log via writeBookAuditLog()", () => {
  const auditCallCount = (repoText.match(/await writeBookAuditLog\(actor,/g) ?? []).length;
  assert.ok(auditCallCount >= 12, `expected at least 12 audit-log call sites across all mutation types, found ${auditCallCount}`);
});
check("Repository: no placeholder actor string anywhere", () => {
  for (const forbidden of ["unattributed@leonix-admin", "system@leonix-admin", "UNATTRIBUTED_ACTOR", '"anonymous"']) {
    assert.ok(!repoText.includes(forbidden), `repository.ts must not contain "${forbidden}"`);
  }
});
check("Repository: contradiction creation/resolution and correction decisions are typed to accept only a staff actor (Extract<LivingBookActor, {type:'staff'}>) — an owner can never resolve a contradiction or decide their own correction", () => {
  assert.ok(repoText.includes('createContradiction(input: CreateContradictionInput, actor: Extract<LivingBookActor, { type: "staff" }>)'));
  assert.ok(repoText.includes('resolveContradiction('));
  assert.ok(repoText.includes('decideCorrection('));
  const resolveSig = repoText.slice(repoText.indexOf("export async function resolveContradiction"), repoText.indexOf("export async function resolveContradiction") + 400);
  assert.ok(resolveSig.includes('Extract<LivingBookActor, { type: "staff" }>'));
  const decideSig = repoText.slice(repoText.indexOf("export async function decideCorrection"), repoText.indexOf("export async function decideCorrection") + 400);
  assert.ok(decideSig.includes('Extract<LivingBookActor, { type: "staff" }>'));
});

// --- Staff API route capability gating (structural) ------------------------------------------------
const bookRoutesDir = "app/api/admin/businesses/[businessId]/book";
const routeCapabilityMap: Record<string, string> = {
  "route.ts": "view_business_book",
  "facts/route.ts": "create_business_fact",
  "facts/[factId]/route.ts": "confirm_business_fact",
  "evidence/route.ts": "create_evidence",
  "unknowns/route.ts": "manage_unknowns",
  "unknowns/[unknownId]/route.ts": "manage_unknowns",
  "contradictions/route.ts": "resolve_contradictions",
  "contradictions/[contradictionId]/route.ts": "resolve_contradictions",
  "discovery/route.ts": "conduct_discovery",
  "discovery/[sessionId]/route.ts": "conduct_discovery",
};
check("Staff Living Business Book API: every route calls requireSalesWorkspaceAccess() and checks the correct capability before touching the repository", () => {
  for (const [rel, capability] of Object.entries(routeCapabilityMap)) {
    const text = read(`${bookRoutesDir}/${rel}`);
    assert.ok(text.includes("requireSalesWorkspaceAccess()"), `${rel} does not call requireSalesWorkspaceAccess()`);
    assert.ok(text.includes(`actorHasCapability(access.actor, "${capability}")`), `${rel} does not check capability ${capability}`);
    assert.ok(text.includes("denialStatusCode(access.reason)"), `${rel} does not use denialStatusCode()`);
  }
});
check("Staff API: fact creation independently re-checks confirm_business_fact before allowing an overwrite of an already-trusted sensitive fact (defense in depth beyond the base create_business_fact capability)", () => {
  const factsRoute = read(`${bookRoutesDir}/facts/route.ts`);
  assert.ok(factsRoute.includes("requiresManagerReviewToOverwrite"));
  assert.ok(factsRoute.includes('actorHasCapability(access.actor, "confirm_business_fact")'));
});
check("Owner-facing API never uses the staff service-role gate — it uses the bearer-token/RLS-membership pattern instead, and never trusts a caller-supplied business id", () => {
  const ownerRoute = read("app/api/dashboard/business/book/route.ts");
  assert.ok(ownerRoute.includes("resolveAuthenticatedUserId"));
  assert.ok(ownerRoute.includes("findActiveMembershipForCurrentUser"));
  assert.ok(!ownerRoute.includes("requireSalesWorkspaceAccess"));
});
check("Owner corrections API only allows owner_confirms/owner_corrects/owner_rejects — never staff_clarification_request — and never lets the owner decide (accept/decline) a correction themselves", () => {
  const ownerCorrections = read("app/api/dashboard/business/book/corrections/route.ts");
  assert.ok(ownerCorrections.includes('new Set<string>(["owner_confirms", "owner_corrects", "owner_rejects"])'));
  assert.ok(!ownerCorrections.includes("decideCorrection"));
});

// --- No secret / no production reference ------------------------------------------------------------
const GATE5_FILES = [
  "app/lib/business/livingBook/types.ts", "app/lib/business/livingBook/constants.ts", "app/lib/business/livingBook/logic.ts",
  "app/lib/business/livingBook/questionRegistry.ts", "app/lib/business/livingBook/repository.ts", "app/lib/business/livingBook/featureFlag.ts",
  "app/admin/_lib/livingBookActor.ts", "app/admin/_lib/livingBookVisibility.ts", "app/admin/_lib/salesWorkspaceCapabilities.ts",
  MIGRATION_PATH,
];
check("No secret pattern or the production Supabase ref appears in any Gate BCO-5A file", () => {
  const secretPattern = /sk_live|sk_test_[a-zA-Z0-9]{10}|SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^"'`]|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----|xuieateniufcrsfdomwl/i;
  for (const rel of GATE5_FILES) {
    assert.ok(!secretPattern.test(read(rel)), `${rel} matched a secret/production-ref pattern`);
  }
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
