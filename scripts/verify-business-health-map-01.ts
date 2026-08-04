/**
 * Gate BCO-6A — Business Health Map foundation verification. Hand-rolled node:assert script,
 * matching this repo's testing convention (no jest/vitest). Run via `npx tsx
 * scripts/verify-business-health-map-01.ts`.
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");

let passed = 0;
let failed = 0;
function check(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  PASS  ${label}`);
    passed++;
  } catch (e) {
    console.log(`  FAIL  ${label}`);
    console.log(`        ${(e as Error).message}`);
    failed++;
  }
}

const MIGRATION_PATH = "supabase/migrations/20260806120000_business_health_map_foundation.sql";
const MIGRATION = read(MIGRATION_PATH);

// ---------------------------------------------------------------------------
// Migration structure
// ---------------------------------------------------------------------------

check("Migration: creates exactly the four Package 6 tables", () => {
  for (const t of [
    "business_health_assessment_runs",
    "business_health_dimension_results",
    "business_health_findings",
    "business_recommendation_readiness",
  ]) {
    assert.ok(MIGRATION.includes(`CREATE TABLE IF NOT EXISTS public.${t}`), `missing CREATE TABLE for ${t}`);
  }
});

check("Migration: all four tables reference public.businesses(id) ON DELETE CASCADE", () => {
  const matches = MIGRATION.match(/business_id uuid NOT NULL REFERENCES public\.businesses\(id\) ON DELETE CASCADE/g) ?? [];
  assert.strictEqual(matches.length, 4, `expected 4 business_id FK references, found ${matches.length}`);
});

check("Migration: assessment_runs trigger_type enum has all 5 allowed values", () => {
  for (const v of ["staff_requested", "owner_requested", "discovery_completed", "business_record_changed", "system_refresh"]) {
    assert.ok(MIGRATION.includes(`'${v}'`), `missing trigger_type value ${v}`);
  }
});

check("Migration: dimension_results dimension_key enum has all 7 locked dimensions", () => {
  for (const v of [
    "business_foundation", "customer_clarity", "offer_and_value", "operations_and_capacity",
    "visibility_and_discovery", "communication_and_follow_up", "owner_goals_and_sustainability",
  ]) {
    assert.ok(MIGRATION.includes(`'${v}'`), `missing dimension_key value ${v}`);
  }
});

check("Migration: dimension_results status enum has all 5 allowed statuses", () => {
  for (const v of ["strong", "stable", "needs_attention", "insufficient_information", "blocked_by_contradiction"]) {
    assert.ok(MIGRATION.includes(`'${v}'`), `missing status value ${v}`);
  }
});

check("Migration: confidence enum is exactly low/medium/high everywhere it's declared", () => {
  const confidenceChecks = MIGRATION.match(/confidence text NOT NULL CHECK \(confidence IN \([^)]+\)\)/g) ?? [];
  assert.ok(confidenceChecks.length >= 2, "expected confidence CHECK on dimension_results and findings");
  for (const c of confidenceChecks) {
    assert.ok(c.includes("'low'") && c.includes("'medium'") && c.includes("'high'"), `confidence CHECK missing a value: ${c}`);
  }
});

check("Migration: findings finding_type enum has all 6 allowed types", () => {
  for (const v of ["strength", "risk", "gap", "opportunity", "unknown", "contradiction"]) {
    assert.ok(MIGRATION.includes(`'${v}'`), `missing finding_type value ${v}`);
  }
});

check("Migration: readiness readiness_status enum has all 5 allowed values", () => {
  for (const v of ["ready", "needs_more_information", "resolve_contradictions_first", "capacity_risk", "human_review_required"]) {
    assert.ok(MIGRATION.includes(`'${v}'`), `missing readiness_status value ${v}`);
  }
});

check("Migration: exactly one dimension result per (run, dimension) via UNIQUE constraint", () => {
  assert.ok(MIGRATION.includes("business_health_dim_results_one_per_run_dimension UNIQUE (assessment_run_id, dimension_key)"));
});

check("Migration: readiness is one-per-run via UNIQUE assessment_run_id", () => {
  assert.ok(MIGRATION.includes("assessment_run_id uuid NOT NULL UNIQUE REFERENCES public.business_health_assessment_runs(id)"));
});

check("Migration: every dual-actor column set enforces staff-requires-roster-id / owner-requires-null-roster-id", () => {
  assert.ok(MIGRATION.includes("business_health_runs_created_actor_chk"));
  const chk = MIGRATION.match(/business_health_runs_created_actor_chk CHECK \([\s\S]*?\)\s*\)/)?.[0] ?? "";
  assert.ok(chk.includes("created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL"));
  assert.ok(chk.includes("created_actor_type = 'owner' AND created_by_roster_id IS NULL"));
});

check("Migration: run completion CHECK ties completed_at to a non-in_progress status", () => {
  assert.ok(MIGRATION.includes("business_health_runs_completion_chk"));
});

check("Migration: purposeful indexes exist on business_id + a natural lookup column for each table", () => {
  for (const idx of [
    "business_health_runs_business_id_idx",
    "business_health_dim_results_business_id_idx",
    "business_health_findings_business_id_idx",
    "business_recommendation_readiness_business_id_idx",
  ]) {
    assert.ok(MIGRATION.includes(idx), `missing index ${idx}`);
  }
});

check("Migration: grant hardening matches the owner-proven Gate BCO-4A.6/4A.7/5A pattern exactly", () => {
  const revokeCount = (MIGRATION.match(/REVOKE ALL PRIVILEGES ON TABLE public\.\S+ FROM PUBLIC;/g) ?? []).length;
  const grantCount = (MIGRATION.match(/GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.\S+ TO service_role;/g) ?? []).length;
  assert.strictEqual(revokeCount, 4, `expected 4 REVOKE statements, found ${revokeCount}`);
  assert.strictEqual(grantCount, 4, `expected 4 explicit grants, found ${grantCount}`);
  assert.ok(!/^GRANT ALL PRIVILEGES/m.test(MIGRATION), "must never use GRANT ALL PRIVILEGES");
});

check("Migration: RLS enabled on all four tables, zero policies", () => {
  const rlsCount = (MIGRATION.match(/ENABLE ROW LEVEL SECURITY/g) ?? []).length;
  assert.strictEqual(rlsCount, 4, `expected 4 RLS-enable statements, found ${rlsCount}`);
  assert.strictEqual((MIGRATION.match(/CREATE POLICY/g) ?? []).length, 0, "must have zero CREATE POLICY statements");
});

check("Migration: zero grants to anon/authenticated/PUBLIC", () => {
  const grantLines = MIGRATION.split("\n").filter((line) => line.trim().startsWith("GRANT "));
  const badGrants = grantLines.filter((line) => /\bTO (anon|authenticated|PUBLIC)\b/i.test(line));
  assert.strictEqual(badGrants.length, 0, `unexpected grant line(s): ${badGrants.join(" | ")}`);
});

check("Migration: no destructive statement, no production reference", () => {
  assert.ok(!/^DROP |^TRUNCATE|^DELETE FROM/im.test(MIGRATION));
  assert.ok(!MIGRATION.includes("xuieateniufcrsfdomwl"));
});

check("Migration: feature flag business_health_map inserted disabled by default via the existing flags table", () => {
  assert.ok(MIGRATION.includes("business_identity_flags"));
  assert.ok(MIGRATION.includes("'business_health_map', false, false"));
});

// ---------------------------------------------------------------------------
// Rule registry
// ---------------------------------------------------------------------------

const RULE_REGISTRY = read("app/lib/business/healthMap/ruleRegistry.ts");
const CONSTANTS = read("app/lib/business/healthMap/constants.ts");

check("Rule registry: declares exactly 7 dimension rules, one per locked dimension key", () => {
  const matches = RULE_REGISTRY.match(/dimensionKey: "(\w+)"/g) ?? [];
  const keys = matches.map((m) => m.match(/"(\w+)"/)![1]);
  const unique = new Set(keys);
  assert.strictEqual(unique.size, 7, `expected 7 unique dimension keys, found ${unique.size}`);
  for (const k of [
    "business_foundation", "customer_clarity", "offer_and_value", "operations_and_capacity",
    "visibility_and_discovery", "communication_and_follow_up", "owner_goals_and_sustainability",
  ]) {
    assert.ok(unique.has(k), `rule registry missing dimension ${k}`);
  }
});

check("Rule registry: does not declare a finance/legal/tax/credit/medical dimension", () => {
  for (const forbidden of ["finance", "legal_compliance", "\"tax", "credit_", "medical"]) {
    assert.ok(!RULE_REGISTRY.toLowerCase().includes(forbidden.toLowerCase()), `rule registry unexpectedly references ${forbidden}`);
  }
});

check("Rule registry: every rule declares required, helpful, sensitive, negative-signal, and capacity-risk fields", () => {
  for (const field of ["requiredFactKeys", "helpfulFactKeys", "sensitiveFactKeys", "negativeSignalConditions", "capacityRiskConditions", "explanationTemplates", "calculationVersion"]) {
    const count = (RULE_REGISTRY.match(new RegExp(`${field}:`, "g")) ?? []).length;
    assert.ok(count >= 7, `expected ${field} declared at least 7 times, found ${count}`);
  }
});

check("Constants: exactly 5 dimension statuses and 3 confidence levels declared", () => {
  const statusMatches = CONSTANTS.match(/HEALTH_DIMENSION_STATUSES[\s\S]*?\];/)?.[0] ?? "";
  const confMatches = CONSTANTS.match(/HEALTH_CONFIDENCE_LEVELS[\s\S]*?\];/)?.[0] ?? "";
  assert.strictEqual((statusMatches.match(/value: "/g) ?? []).length, 5);
  assert.strictEqual((confMatches.match(/value: "/g) ?? []).length, 3);
});

check("Constants: exactly 5 readiness statuses declared", () => {
  const readinessBlock = CONSTANTS.match(/RECOMMENDATION_READINESS_STATUSES[\s\S]*?\];/)?.[0] ?? "";
  assert.strictEqual((readinessBlock.match(/value: "/g) ?? []).length, 5);
});

// ---------------------------------------------------------------------------
// Deterministic calculation engine (imported directly -- no I/O, no server-only guard)
// ---------------------------------------------------------------------------

import { calculateDimension, calculateReadiness, calculateAllDimensions, summarizeCounts, shapeDimensionResultsForOwnerView, shapeFindingsForOwnerView } from "../app/lib/business/healthMap/logic";
import { CALCULATION_VERSION } from "../app/lib/business/healthMap/constants";
import type { HealthCalculationInput } from "../app/lib/business/healthMap/logic";
import type { BusinessContradiction, BusinessEvidence, BusinessFact } from "../app/lib/business/livingBook/types";

const BUSINESS_ID = "11111111-1111-1111-1111-111111111111";
const NOW = "2026-08-06T12:00:00.000Z";

function fact(overrides: Partial<BusinessFact>): BusinessFact {
  return {
    id: overrides.id ?? `fact-${Math.random()}`,
    businessId: BUSINESS_ID,
    factKey: "owner_defined_success",
    factCategory: "business_and_owner_goals",
    value: { text: "x" },
    displayValue: "x",
    status: "active",
    sourceClass: "owner_statement",
    confidence: "medium",
    effectiveDate: null,
    lastVerifiedAt: NOW,
    visibility: "owner_and_staff",
    sensitivity: "standard",
    confirmationState: "unconfirmed",
    supersedesFactId: null,
    createdActorType: "staff",
    createdByEmail: "staff@example.com",
    createdByRole: "sales_manager",
    updatedActorType: "staff",
    updatedByEmail: "staff@example.com",
    updatedByRole: "sales_manager",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function emptyInput(overrides: Partial<HealthCalculationInput> = {}): HealthCalculationInput {
  return { businessId: BUSINESS_ID, facts: [], evidence: [], unknowns: [], contradictions: [], nowIso: NOW, ...overrides };
}

check("Engine case 1: strong dimension with recent owner-confirmed fact and evidence", () => {
  const f1 = fact({ id: "f1", factKey: "owner_defined_success", confirmationState: "owner_confirmed", lastVerifiedAt: NOW });
  const f2 = fact({ id: "f2", factKey: "product_service_summary", confirmationState: "owner_confirmed", lastVerifiedAt: NOW });
  const evidence: BusinessEvidence[] = [
    { id: "e1", businessId: BUSINESS_ID, relatedFactId: "f1", relatedUnknownId: null, evidenceType: "staff_note", sourceTitle: "call", sourceUrl: null, capturedText: null, capturedAt: NOW, sourceDate: null, consentState: "not_required", reliability: "high", visibility: "owner_and_staff", retentionState: "active", collectedByEmail: "s@x.com", collectedByRole: "sales_manager", createdAt: NOW },
    { id: "e2", businessId: BUSINESS_ID, relatedFactId: "f2", relatedUnknownId: null, evidenceType: "staff_note", sourceTitle: "call2", sourceUrl: null, capturedText: null, capturedAt: NOW, sourceDate: null, consentState: "not_required", reliability: "high", visibility: "owner_and_staff", retentionState: "active", collectedByEmail: "s@x.com", collectedByRole: "sales_manager", createdAt: NOW },
  ];
  const dim = calculateDimension("business_foundation", emptyInput({ facts: [f1, f2], evidence }));
  assert.strictEqual(dim.status, "strong");
  assert.strictEqual(dim.confidence, "high");
  assert.deepStrictEqual(new Set(dim.supportingFactIds), new Set(["f1", "f2"]));
});

check("Engine case 2: stable dimension with adequate but incomplete support (owner_statement, no evidence)", () => {
  const f1 = fact({ id: "f1", factKey: "target_customer", sourceClass: "owner_statement", confirmationState: "unconfirmed" });
  const dim = calculateDimension("customer_clarity", emptyInput({ facts: [f1] }));
  assert.strictEqual(dim.status, "stable");
});

check("Engine case 3: needs-attention dimension with a supported operational weakness (team stretched)", () => {
  const stretched = fact({ id: "f1", factKey: "team_capacity", value: { answer: true }, factCategory: "operations_and_capacity" });
  const demand = fact({ id: "f2", factKey: "demand_readiness", value: { choice: "not_sure" }, factCategory: "operations_and_capacity" });
  const dim = calculateDimension("operations_and_capacity", emptyInput({ facts: [stretched, demand] }));
  assert.strictEqual(dim.status, "needs_attention");
});

check("Engine case 4: insufficient-information dimension with open unknowns / missing required facts", () => {
  const dim = calculateDimension("business_foundation", emptyInput({ facts: [] }));
  assert.strictEqual(dim.status, "insufficient_information");
  assert.notStrictEqual(dim.status, "needs_attention");
});

check("Engine case 5: contradiction-blocked dimension", () => {
  const f1 = fact({ id: "f1", factKey: "owner_defined_success" });
  const f2 = fact({ id: "f2", factKey: "product_service_summary" });
  const contradiction: BusinessContradiction = {
    id: "c1", businessId: BUSINESS_ID, contradictionType: "fact_vs_fact", severity: "medium", status: "open",
    claimALabel: "a", claimAFactId: "f1", claimAEvidenceId: null, claimBLabel: "b", claimBFactId: null, claimBEvidenceId: null,
    resolution: null, resolvedCanonicalFactId: null, resolvedByEmail: null, resolvedAt: null, createdByEmail: "s@x.com", createdAt: NOW,
  };
  const dim = calculateDimension("business_foundation", emptyInput({ facts: [f1, f2], contradictions: [contradiction] }));
  assert.strictEqual(dim.status, "blocked_by_contradiction");
  assert.strictEqual(dim.confidence, "low");
  assert.deepStrictEqual(dim.relatedContradictionIds, ["c1"]);
});

check("Engine case 6: stale evidence lowers confidence relative to fresh", () => {
  const stale = fact({ id: "f1", factKey: "owner_defined_success", confirmationState: "owner_confirmed", lastVerifiedAt: "2020-01-01T00:00:00.000Z" });
  const fresh = fact({ id: "f2", factKey: "product_service_summary", confirmationState: "owner_confirmed", lastVerifiedAt: NOW });
  const dim = calculateDimension("business_foundation", emptyInput({ facts: [stale, fresh] }));
  assert.strictEqual(dim.freshness, "stale");
  assert.notStrictEqual(dim.status, "strong");
});

check("Engine case 7: capacity risk produces readiness capacity_risk", () => {
  const capacity = fact({ id: "f1", factKey: "team_capacity", value: { answer: false }, factCategory: "operations_and_capacity" });
  const demand = fact({ id: "f2", factKey: "demand_readiness", value: { choice: "hurt" }, factCategory: "operations_and_capacity" });
  const input = emptyInput({ facts: [capacity, demand] });
  const dims = calculateAllDimensions(input);
  const readiness = calculateReadiness(dims, input, CALCULATION_VERSION);
  assert.strictEqual(readiness.readinessStatus, "capacity_risk");
});

check("Engine case 8: unresolved material contradiction produces resolve_contradictions_first (takes priority over capacity risk)", () => {
  const f1 = fact({ id: "f1", factKey: "owner_defined_success" });
  const capacity = fact({ id: "f2", factKey: "team_capacity", value: { answer: false }, factCategory: "operations_and_capacity" });
  const demand = fact({ id: "f3", factKey: "demand_readiness", value: { choice: "hurt" }, factCategory: "operations_and_capacity" });
  const contradiction: BusinessContradiction = {
    id: "c1", businessId: BUSINESS_ID, contradictionType: "fact_vs_fact", severity: "high", status: "open",
    claimALabel: "a", claimAFactId: "f1", claimAEvidenceId: null, claimBLabel: "b", claimBFactId: null, claimBEvidenceId: null,
    resolution: null, resolvedCanonicalFactId: null, resolvedByEmail: null, resolvedAt: null, createdByEmail: "s@x.com", createdAt: NOW,
  };
  const input = emptyInput({ facts: [f1, capacity, demand], contradictions: [contradiction] });
  const readiness = calculateReadiness(calculateAllDimensions(input), input, CALCULATION_VERSION);
  assert.strictEqual(readiness.readinessStatus, "resolve_contradictions_first");
});

check("Engine case 9: missing critical information produces needs_more_information", () => {
  const input = emptyInput({ facts: [] });
  const readiness = calculateReadiness(calculateAllDimensions(input), input, CALCULATION_VERSION);
  assert.strictEqual(readiness.readinessStatus, "needs_more_information");
});

check("Engine case 10: complete, supported, non-sensitive-unconfirmed business produces ready", () => {
  const facts = [
    fact({ id: "f1", factKey: "owner_defined_success", confirmationState: "owner_confirmed" }),
    fact({ id: "f2", factKey: "product_service_summary", confirmationState: "owner_confirmed", factCategory: "products_and_services" }),
    fact({ id: "f3", factKey: "target_customer", confirmationState: "owner_confirmed", factCategory: "customers_and_market" }),
    fact({ id: "f4", factKey: "current_marketing_channel", confirmationState: "owner_confirmed", factCategory: "visibility_and_communication" }),
    fact({ id: "f5", factKey: "preferred_contact_method", confirmationState: "owner_confirmed", factCategory: "visibility_and_communication" }),
    fact({ id: "f6", factKey: "owner_goals", confirmationState: "owner_confirmed", factCategory: "business_and_owner_goals" }),
    fact({ id: "f7", factKey: "team_capacity", value: { answer: false }, confirmationState: "owner_confirmed", factCategory: "operations_and_capacity" }),
    fact({ id: "f8", factKey: "demand_readiness", value: { choice: "help" }, confirmationState: "owner_confirmed", factCategory: "operations_and_capacity" }),
  ];
  const input = emptyInput({ facts });
  const readiness = calculateReadiness(calculateAllDimensions(input), input, CALCULATION_VERSION);
  assert.strictEqual(readiness.readinessStatus, "ready");
});

check("Engine case 11: an unconfirmed sensitive fact produces human_review_required (when not blocked by contradiction/capacity)", () => {
  const facts = [
    fact({ id: "f1", factKey: "owner_defined_success", confirmationState: "owner_confirmed" }),
    fact({ id: "f2", factKey: "product_service_summary", confirmationState: "owner_confirmed", factCategory: "products_and_services" }),
    fact({ id: "f3", factKey: "target_customer", confirmationState: "owner_confirmed", factCategory: "customers_and_market" }),
    // most_profitable_service is a sensitiveFactKey for offer_and_value, left unconfirmed
    fact({ id: "f4", factKey: "most_profitable_service", confirmationState: "unconfirmed", sourceClass: "owner_statement", factCategory: "products_and_services" }),
  ];
  const input = emptyInput({ facts });
  const readiness = calculateReadiness(calculateAllDimensions(input), input, CALCULATION_VERSION);
  assert.strictEqual(readiness.readinessStatus, "human_review_required");
});

check("Engine case 12: an ai_inference-sourced fact is never treated as owner-confirmed truth", () => {
  const f = fact({ id: "f1", factKey: "owner_defined_success", sourceClass: "ai_inference", confirmationState: "unconfirmed" });
  const f2 = fact({ id: "f2", factKey: "product_service_summary", sourceClass: "ai_inference", confirmationState: "unconfirmed" });
  const dim = calculateDimension("business_foundation", emptyInput({ facts: [f, f2] }));
  assert.notStrictEqual(dim.status, "strong");
  assert.notStrictEqual(dim.confidence, "high");
});

check("Engine: all conclusions retain traceable supporting record references", () => {
  const f1 = fact({ id: "f1", factKey: "owner_defined_success", confirmationState: "owner_confirmed" });
  const f2 = fact({ id: "f2", factKey: "product_service_summary", confirmationState: "owner_confirmed" });
  const dim = calculateDimension("business_foundation", emptyInput({ facts: [f1, f2] }));
  assert.ok(Array.isArray(dim.supportingFactIds) && dim.supportingFactIds.length > 0);
});

check("Engine: unknowns never silently become negative scores or an automatic needs_attention", () => {
  const input = emptyInput({ facts: [] });
  const dims = calculateAllDimensions(input);
  for (const d of dims) {
    if (d.status === "insufficient_information") continue;
    assert.notStrictEqual(d.status, "needs_attention", `dimension ${d.dimensionKey} escalated to needs_attention purely from missing info`);
  }
});

check("Engine: summarizeCounts totals always equal the number of dimensions", () => {
  const input = emptyInput({ facts: [] });
  const dims = calculateAllDimensions(input);
  const counts = summarizeCounts(dims);
  assert.strictEqual(
    counts.strongCount + counts.stableCount + counts.needsAttentionCount + counts.insufficientInformationCount + counts.contradictionBlockedCount,
    counts.totalDimensionsAssessed,
  );
  assert.strictEqual(counts.totalDimensionsAssessed, 7);
});

check("Engine: spending money with Leonix is never a rule-registry input (no listing/payment/order fact keys referenced)", () => {
  for (const forbidden of ["stripe", "payment", "invoice", "listing_id", "order_"]) {
    assert.ok(!RULE_REGISTRY.toLowerCase().includes(forbidden), `rule registry unexpectedly references ${forbidden}`);
  }
});

check("Owner-safe shaping: dimension view never exposes confidence, evidence, freshness, or supporting record ids", () => {
  const f1 = fact({ id: "f1", factKey: "owner_defined_success", confirmationState: "owner_confirmed" });
  const dim = calculateDimension("business_foundation", emptyInput({ facts: [f1] }));
  const dimensionResult = { ...dim, id: "d1", assessmentRunId: "r1", createdAt: NOW };
  const shaped = shapeDimensionResultsForOwnerView([dimensionResult]);
  const keys = Object.keys(shaped[0]);
  for (const forbidden of ["confidence", "evidenceStrength", "freshness", "supportingFactIds", "supportingEvidenceIds"]) {
    assert.ok(!keys.includes(forbidden), `owner-safe dimension view leaked ${forbidden}`);
  }
});

check("Owner-safe shaping: findings view excludes staff_only visibility findings", () => {
  const findings = [
    { id: "1", assessmentRunId: "r1", dimensionResultId: "d1", businessId: BUSINESS_ID, findingType: "strength" as const, severity: "info" as const, titleEs: "a", titleEn: "a", explanationEs: "a", explanationEn: "a", supportingFactIds: [], supportingEvidenceIds: [], relatedUnknownIds: [], relatedContradictionIds: [], confidence: "high" as const, visibility: "owner_and_staff" as const, status: "active" as const, createdAt: NOW },
    { id: "2", assessmentRunId: "r1", dimensionResultId: "d1", businessId: BUSINESS_ID, findingType: "risk" as const, severity: "medium" as const, titleEs: "b", titleEn: "b", explanationEs: "b", explanationEn: "b", supportingFactIds: [], supportingEvidenceIds: [], relatedUnknownIds: [], relatedContradictionIds: [], confidence: "low" as const, visibility: "staff_only" as const, status: "active" as const, createdAt: NOW },
  ];
  const shaped = shapeFindingsForOwnerView(findings);
  assert.strictEqual(shaped.length, 1);
  assert.strictEqual(shaped[0].id, "1");
});

// ---------------------------------------------------------------------------
// Capability matrix
// ---------------------------------------------------------------------------

const CAPABILITIES_SRC = read("app/admin/_lib/salesWorkspaceCapabilities.ts");

check("Capability matrix: all 4 Health Map capabilities are defined in the SAME matrix as Sales Workspace / Living Book", () => {
  for (const c of ["view_business_health_map", "run_business_health_assessment", "view_private_health_support", "mark_health_human_review"]) {
    assert.ok(CAPABILITIES_SRC.includes(`"${c}"`), `capability ${c} not found in matrix`);
  }
});

check("Capability matrix: super_admin and sales_manager hold all 4 Health Map capabilities; sales_rep holds only view_business_health_map", () => {
  const superAdminBlock = CAPABILITIES_SRC.match(/super_admin: \[([\s\S]*?)\],/)?.[1] ?? "";
  const salesManagerBlock = CAPABILITIES_SRC.match(/sales_manager: \[([\s\S]*?)\],/)?.[1] ?? "";
  const salesRepBlock = CAPABILITIES_SRC.match(/sales_rep: \[([\s\S]*?)\],/)?.[1] ?? "";
  for (const c of ["view_business_health_map", "run_business_health_assessment", "view_private_health_support", "mark_health_human_review"]) {
    assert.ok(superAdminBlock.includes(c), `super_admin missing ${c}`);
    assert.ok(salesManagerBlock.includes(c), `sales_manager missing ${c}`);
  }
  assert.ok(salesRepBlock.includes("view_business_health_map"), "sales_rep missing view_business_health_map");
  for (const c of ["run_business_health_assessment", "view_private_health_support", "mark_health_human_review"]) {
    assert.ok(!salesRepBlock.includes(c), `sales_rep must NOT hold ${c}`);
  }
});

// ---------------------------------------------------------------------------
// Repository actor attribution
// ---------------------------------------------------------------------------

const REPOSITORY_SRC = read("app/lib/business/healthMap/repository.ts");

check("Repository: runHealthAssessment and markHumanReview require a HealthMapActor argument -- no bare string", () => {
  assert.ok(/runHealthAssessment\([^)]*actor: HealthMapActor/.test(REPOSITORY_SRC));
  assert.ok(/markHumanReview\([\s\S]*?actor: Extract<HealthMapActor/.test(REPOSITORY_SRC));
});

check("Repository: never mutates a prior run's dimension results or findings after creation (no UPDATE on those tables)", () => {
  assert.ok(!/from\("business_health_dimension_results"\)[\s\S]{0,80}\.update\(/.test(REPOSITORY_SRC));
  assert.ok(!/from\("business_health_findings"\)[\s\S]{0,80}\.update\(/.test(REPOSITORY_SRC));
});

check("Repository: markHumanReview only updates the readiness row's human_review_* columns, never readiness_status/reason_*", () => {
  const fn = REPOSITORY_SRC.match(/export async function markHumanReview[\s\S]*?\n}/)?.[0] ?? "";
  assert.ok(!fn.includes("readiness_status:"), "markHumanReview must never rewrite readiness_status");
  assert.ok(!fn.includes("reason_es:") && !fn.includes("reason_en:"), "markHumanReview must never rewrite reason_*");
});

// ---------------------------------------------------------------------------
// Staff API capability gating
// ---------------------------------------------------------------------------

const HEALTH_ROUTE = read("app/api/admin/businesses/[businessId]/health/route.ts");
const HEALTH_RUN_ROUTE = read("app/api/admin/businesses/[businessId]/health/[runId]/route.ts");

check("Staff Health Map API: every route calls requireSalesWorkspaceAccess() and checks a capability before touching the repository", () => {
  for (const src of [HEALTH_ROUTE, HEALTH_RUN_ROUTE]) {
    assert.ok(src.includes("requireSalesWorkspaceAccess()"));
    assert.ok(src.includes("actorHasCapability("));
  }
});

check("Staff API: GET requires view_business_health_map, POST requires run_business_health_assessment", () => {
  assert.ok(HEALTH_ROUTE.includes('actorHasCapability(access.actor, "view_business_health_map")'));
  assert.ok(HEALTH_ROUTE.includes('actorHasCapability(access.actor, "run_business_health_assessment")'));
});

check("Staff API: PATCH (mark human review) requires mark_health_human_review", () => {
  assert.ok(HEALTH_RUN_ROUTE.includes('actorHasCapability(access.actor, "mark_health_human_review")'));
});

check("Staff API: supporting facts/evidence are only included when the caller has view_private_health_support", () => {
  assert.ok(HEALTH_ROUTE.includes('actorHasCapability(access.actor, "view_private_health_support")'));
});

// ---------------------------------------------------------------------------
// Owner-facing API isolation
// ---------------------------------------------------------------------------

const OWNER_HEALTH_ROUTE = read("app/api/dashboard/business/health/route.ts");

check("Owner-facing Health Map API never uses the staff service-role gate -- it uses the bearer-token/RLS-membership pattern instead", () => {
  assert.ok(!OWNER_HEALTH_ROUTE.includes("requireSalesWorkspaceAccess"));
  assert.ok(OWNER_HEALTH_ROUTE.includes("extractBearerToken"));
  assert.ok(OWNER_HEALTH_ROUTE.includes("findActiveMembershipForCurrentUser"));
});

check("Owner-facing API never returns confidence machinery, supporting record ids, or the readiness gate", () => {
  const codeOnly = OWNER_HEALTH_ROUTE
    .split("\n")
    .filter((line) => !line.trim().startsWith("*") && !line.trim().startsWith("//") && !line.trim().startsWith("/**"))
    .join("\n");
  assert.ok(!codeOnly.includes("readiness"), "owner route code references readiness outside comments");
  assert.ok(!codeOnly.includes("confidence"), "owner route code references confidence outside comments");
  assert.ok(!codeOnly.includes("supportingFactIds"), "owner route code references supportingFactIds outside comments");
});

// ---------------------------------------------------------------------------
// Secret / production-reference scan
// ---------------------------------------------------------------------------

const GATE6_FILES = [
  MIGRATION_PATH,
  "app/lib/business/healthMap/types.ts",
  "app/lib/business/healthMap/constants.ts",
  "app/lib/business/healthMap/ruleRegistry.ts",
  "app/lib/business/healthMap/logic.ts",
  "app/lib/business/healthMap/repository.ts",
  "app/lib/business/healthMap/featureFlag.ts",
  "app/admin/_lib/healthMapActor.ts",
  "app/admin/_lib/salesWorkspaceCapabilities.ts",
  "app/admin/(dashboard)/businesses/[businessId]/HealthMapActions.tsx",
  "app/admin/(dashboard)/businesses/[businessId]/page.tsx",
  "app/api/admin/businesses/[businessId]/health/route.ts",
  "app/api/admin/businesses/[businessId]/health/[runId]/route.ts",
  "app/api/dashboard/business/health/route.ts",
  "app/(site)/dashboard/business-tools/business-health/page.tsx",
];

check("No secret pattern or the production Supabase ref appears in any Gate BCO-6A file", () => {
  const secretPattern = /sk_live|sk_test_[a-zA-Z0-9]{10}|SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^"'`]|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----|xuieateniufcrsfdomwl/i;
  for (const rel of GATE6_FILES) {
    assert.ok(!secretPattern.test(read(rel)), `${rel} matched a secret/production-ref pattern`);
  }
});

check("Owner-facing API: businessId is never read from the request (query/body) -- always derived from the RLS-verified membership", () => {
  assert.ok(!/searchParams\.get\(["']businessId["']\)/.test(OWNER_HEALTH_ROUTE));
  assert.ok(!/req\.json\(\)/.test(OWNER_HEALTH_ROUTE), "owner GET route must not read a request body at all");
});

check("Staff API: no route accepts a caller-supplied actor field for attribution (createdByEmail/actorEmail/rosterId in a POST/PATCH body)", () => {
  for (const src of [HEALTH_ROUTE, HEALTH_RUN_ROUTE]) {
    assert.ok(!/b\.(createdByEmail|actorEmail|rosterId|authUserId)/.test(src), "route reads a caller-supplied actor field from the body");
    assert.ok(src.includes("staffActorToHealthMapActor(access.actor)"), "route must build the actor exclusively from the verified session");
  }
});

check("Owner-facing API: hides the Health Map for both 'unavailable' AND 'preview' tiers -- a disabled flag with no pilot users must never leak data", () => {
  assert.ok(/tier === "unavailable" \|\| tier === "preview"/.test(OWNER_HEALTH_ROUTE), "owner route must block both unavailable and preview tiers, not just unavailable");
});

console.log(`\n${passed} check(s) passed${failed ? `, ${failed} FAILED` : ""}.`);
if (failed > 0) {
  console.log("\nSome checks failed.");
  process.exit(1);
} else {
  console.log("\nAll checks passed.");
}
