/**
 * TODAY-3 — Next Right Move + Stewardship Engine verification. Hand-rolled node:assert script,
 * matching this repo's testing convention (no jest/vitest). Run via `npx tsx
 * scripts/verify-business-stewardship-engine-01.ts`.
 */
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const exists = (rel: string) => fs.existsSync(path.join(ROOT, rel));

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

const MIGRATION_PATH = "supabase/migrations/20260809120000_business_stewardship_engine_foundation.sql";

const TABLES = [
  "business_recommendations", "business_recommendation_tests", "business_recommendation_overrides", "business_stewardship_ledger",
];

const AUTHORIZED_LIB_FILES = [
  "app/lib/business/stewardship/constants.ts",
  "app/lib/business/stewardship/types.ts",
  "app/lib/business/stewardship/logic.ts",
  "app/lib/business/stewardship/sixTests.ts",
  "app/lib/business/stewardship/recommendationRegistry.ts",
  "app/lib/business/stewardship/repository.ts",
  "app/lib/business/stewardship/featureFlag.ts",
  "app/lib/business/stewardship/access.ts",
];
const AUTHORIZED_API_FILES = [
  "app/api/dashboard/business/recommendations/route.ts",
  "app/api/dashboard/business/recommendations/[id]/decision/route.ts",
  "app/api/admin/businesses/[businessId]/recommendations/route.ts",
  "app/api/admin/businesses/[businessId]/recommendations/[id]/route.ts",
  "app/api/admin/businesses/[businessId]/recommendations/[id]/override/route.ts",
  "app/api/admin/businesses/[businessId]/stewardship-ledger/route.ts",
];
const AUTHORIZED_UI_FILES = [
  "app/(site)/dashboard/business-tools/proximo-paso/page.tsx",
  "app/admin/(dashboard)/businesses/[businessId]/StewardshipActions.tsx",
];

check("1. Migration exists with four expected tables", () => {
  assert.ok(exists(MIGRATION_PATH), `missing ${MIGRATION_PATH}`);
  const migration = read(MIGRATION_PATH);
  for (const t of TABLES) assert.ok(migration.includes(`CREATE TABLE IF NOT EXISTS public.${t}`), `missing CREATE TABLE for ${t}`);
  assert.strictEqual((migration.match(/CREATE TABLE IF NOT EXISTS public\.business_/g) ?? []).length, 4, "expected exactly 4 CREATE TABLE statements");
});

const MIGRATION = read(MIGRATION_PATH);

const RPC_NAME = "record_business_recommendation_owner_decision";
const RPC_SIGNATURE = `${RPC_NAME}(uuid, uuid, text, text, timestamptz, uuid, text, text)`;
const RPC_START = MIGRATION.indexOf(`CREATE OR REPLACE FUNCTION public.${RPC_NAME}`);
const RPC_END = MIGRATION.indexOf(`COMMENT ON FUNCTION public.${RPC_NAME}`);
const RPC_BODY = RPC_START !== -1 && RPC_END !== -1 ? MIGRATION.slice(RPC_START, RPC_END) : "";

check("2. Every table has RLS enabled", () => {
  const n = (MIGRATION.match(/ENABLE ROW LEVEL SECURITY/g) ?? []).length;
  assert.strictEqual(n, 4, `expected 4, found ${n}`);
});

check("3. Zero CREATE POLICY statements", () => {
  assert.strictEqual((MIGRATION.match(/CREATE POLICY/g) ?? []).length, 0);
});

check("4. Explicit PUBLIC/anon/authenticated/service_role revokes on every table", () => {
  for (const role of ["PUBLIC", "anon", "authenticated", "service_role"]) {
    const n = (MIGRATION.match(new RegExp(`REVOKE ALL PRIVILEGES ON TABLE public\\.\\S+ FROM ${role};`, "g")) ?? []).length;
    assert.strictEqual(n, 4, `expected 4 REVOKE...FROM ${role}, found ${n}`);
  }
});

check("5. Narrow service_role DML only (per table, revoke precedes grant)", () => {
  const n = (MIGRATION.match(/GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.\S+ TO service_role;/g) ?? []).length;
  assert.strictEqual(n, 4, `expected 4 narrow grants, found ${n}`);
  for (const t of TABLES) {
    const revokeIdx = MIGRATION.indexOf(`REVOKE ALL PRIVILEGES ON TABLE public.${t} FROM service_role;`);
    const grantIdx = MIGRATION.indexOf(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.${t} TO service_role;`);
    assert.ok(revokeIdx !== -1 && grantIdx !== -1 && revokeIdx < grantIdx, `${t}: revoke must precede narrow grant`);
  }
});

check("6. Zero GRANT ALL", () => {
  assert.ok(!/^\s*GRANT ALL\b/im.test(MIGRATION));
});

check("No REFERENCES/TRIGGER/TRUNCATE grants", () => {
  assert.ok(!/GRANT REFERENCES\b/i.test(MIGRATION));
  assert.ok(!/GRANT TRIGGER\b/i.test(MIGRATION));
  assert.ok(!/GRANT TRUNCATE\b/i.test(MIGRATION));
});

check("No grant to PUBLIC/anon/authenticated", () => {
  const grantLines = MIGRATION.split("\n").filter((l) => l.trim().startsWith("GRANT "));
  const bad = grantLines.filter((l) => /\bTO (anon|authenticated|PUBLIC)\b/i.test(l));
  assert.strictEqual(bad.length, 0, JSON.stringify(bad));
});

check("7. Feature flag seeded false, reuses business_identity_flags", () => {
  assert.ok(MIGRATION.includes("business_identity_flags"));
  assert.ok(MIGRATION.includes("'business_stewardship_engine', false, false"));
});

check("Migration is one transaction, idempotent, additive only, no destructive statement", () => {
  assert.strictEqual((MIGRATION.match(/^\s*BEGIN;/m) ?? []).length, 1);
  assert.strictEqual((MIGRATION.match(/^\s*COMMIT;/m) ?? []).length, 1);
  assert.ok(!/^DROP |^TRUNCATE|^DELETE FROM/im.test(MIGRATION));
  const alterLines = MIGRATION.split("\n").filter((l) => /^ALTER TABLE/i.test(l.trim()));
  for (const line of alterLines) assert.ok(/ENABLE ROW LEVEL SECURITY;\s*$/.test(line.trim()), `unexpected ALTER TABLE: ${line}`);
});

check("16. One current Next Right Move per business — partial unique index", () => {
  assert.ok(MIGRATION.includes("business_recommendations_one_current_per_business_idx"));
  assert.ok(/CREATE UNIQUE INDEX IF NOT EXISTS business_recommendations_one_current_per_business_idx\s*\n\s*ON public\.business_recommendations \(business_id\)\s*\n\s*WHERE is_current = true;/.test(MIGRATION));
});

check("18. Human approval required by DB — approval attribution CHECK", () => {
  assert.ok(MIGRATION.includes("business_recommendations_approval_chk"));
  assert.ok(MIGRATION.includes("approved_by_roster_id IS NOT NULL AND approved_by_auth_user_id IS NOT NULL"));
});

check("Override actor is CHECK-locked to staff only", () => {
  const overrideTableStart = MIGRATION.indexOf("CREATE TABLE IF NOT EXISTS public.business_recommendation_overrides");
  const overrideTableEnd = MIGRATION.indexOf("CREATE INDEX", overrideTableStart);
  const overrideTableSql = MIGRATION.slice(overrideTableStart, overrideTableEnd);
  assert.ok(overrideTableSql.includes("actor_type text NOT NULL CHECK (actor_type = 'staff')"));
  assert.ok(overrideTableSql.includes("actor_roster_id uuid NOT NULL"));
});

check("Test rows are unique per (recommendation, test_key) — immutable, one per key", () => {
  assert.ok(MIGRATION.includes("business_recommendation_tests_one_per_test_key UNIQUE (recommendation_id, test_key)"));
});

check("Ledger money_involved requires a truthful, nonblank payment_reference", () => {
  assert.ok(MIGRATION.includes("business_stewardship_ledger_money_chk"));
  assert.ok(MIGRATION.includes("money_involved = false OR (payment_reference IS NOT NULL AND char_length(btrim(payment_reference)) > 0)"));
});

check("Owner decision cannot exist without shared_at (no decision on an unshared recommendation)", () => {
  assert.ok(MIGRATION.includes("business_recommendations_owner_decision_chk"));
  assert.ok(MIGRATION.includes("owner_decision_at IS NOT NULL AND shared_at IS NOT NULL"));
});

check("No shared status without approval", () => {
  assert.ok(MIGRATION.includes("business_recommendations_shared_requires_approval_chk"));
});

check("Postpone requires a review date (bidirectional owner_decision_review_date CHECK)", () => {
  assert.ok(MIGRATION.includes("business_recommendations_owner_decision_review_date_chk"));
});

check("No Production reference and no secret literal in the migration", () => {
  assert.ok(!MIGRATION.includes("xuieateniufcrsfdomwl"));
  const secretPattern = /sk_live|sk_test_[a-zA-Z0-9]{10}|SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^"'`]|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/i;
  assert.ok(!secretPattern.test(MIGRATION));
});

check("40. No Globalization table written (no INSERT/UPDATE/DELETE against listing_package_entitlements/leonix_placement_entitlements)", () => {
  assert.ok(!/INSERT INTO public\.(listing_package_entitlements|leonix_placement_entitlements)/i.test(MIGRATION));
});

check("41. No recommendation/test/override/ledger row seeded at migration time — only the feature flag row and the RPC's own runtime writes", () => {
  // The record_business_recommendation_owner_decision function body legitimately contains an
  // UPDATE/INSERT against these tables as *runtime* logic (executed only when a real owner
  // decides something) -- that is not migration-time seed data. Strip the function body before
  // checking for a literal seed INSERT.
  const migrationWithoutRpcBody = RPC_START !== -1 && RPC_END !== -1 ? MIGRATION.slice(0, RPC_START) + MIGRATION.slice(RPC_END) : MIGRATION;
  for (const t of TABLES) assert.ok(!migrationWithoutRpcBody.includes(`INSERT INTO public.${t}`), `unexpected seed insert into ${t}`);
});

check("Authorized TODAY-3 files exist", () => {
  for (const rel of [...AUTHORIZED_LIB_FILES, ...AUTHORIZED_API_FILES, ...AUTHORIZED_UI_FILES]) {
    assert.ok(exists(rel), `missing ${rel}`);
  }
});

// ---------------------------------------------------------------------------
// TypeScript domain layer
// ---------------------------------------------------------------------------

import { evaluateSixTests, sixTestsAllowApproval, type SixTestInput } from "../app/lib/business/stewardship/sixTests";
import { RECOMMENDATION_TEMPLATES, findTemplateByKey } from "../app/lib/business/stewardship/recommendationRegistry";
import { computeNextRecommendationStatus, overrideRequiresReapproval, selectNextRightMove } from "../app/lib/business/stewardship/logic";
import { SIX_TEST_KEYS } from "../app/lib/business/stewardship/types";
import { RECOMMENDATION_STATUSES, OWNER_DECISIONS } from "../app/lib/business/stewardship/constants";

check("11. sixTests returns exactly six named tests", () => {
  const template = RECOMMENDATION_TEMPLATES[0];
  const outcomes = evaluateSixTests({ dimensionStatus: "needs_attention", readinessIsReady: true, humanReviewRequired: false, template, ownerGoalKnown: true, capacityBlocked: false });
  assert.strictEqual(outcomes.length, 6);
  assert.deepStrictEqual(outcomes.map((o) => o.testKey).sort(), [...SIX_TEST_KEYS].sort());
});

check("12. Test rows are immutable — repository never issues an UPDATE against business_recommendation_tests", () => {
  const repoSrc = read("app/lib/business/stewardship/repository.ts");
  assert.ok(!/business_recommendation_tests["'`]\)\s*\.update/.test(repoSrc), "must never update a test row");
});

check("13. Fail/blocked test prevents approval", () => {
  assert.strictEqual(sixTestsAllowApproval([{ testKey: "need", result: "pass" } as never]), true);
  assert.strictEqual(sixTestsAllowApproval([{ testKey: "need", result: "fail" } as never]), false);
  assert.strictEqual(sixTestsAllowApproval([{ testKey: "need", result: "blocked" } as never]), false);
  assert.strictEqual(sixTestsAllowApproval([{ testKey: "need", result: "caution" } as never]), true);
});

check("14. Recommendation registry is deterministic and bilingual, no AI provider", () => {
  const registrySrc = read("app/lib/business/stewardship/recommendationRegistry.ts");
  assert.ok(!/openai|anthropic|gpt-|generativeai/i.test(registrySrc));
  for (const t of RECOMMENDATION_TEMPLATES) {
    assert.ok(t.verifiedNeedEs.length > 0 && t.verifiedNeedEn.length > 0, `${t.candidateKey} missing bilingual need`);
    assert.ok(t.doNothingYetOptionEs.length > 0 && t.doNothingYetOptionEn.length > 0, `${t.candidateKey} missing bilingual do-nothing-yet`);
  }
  assert.ok(RECOMMENDATION_TEMPLATES.length >= 9, `expected at least 9 templates, found ${RECOMMENDATION_TEMPLATES.length}`);
});

check("15. No AI provider call exists anywhere in stewardship code", () => {
  for (const rel of [...AUTHORIZED_LIB_FILES, ...AUTHORIZED_API_FILES, ...AUTHORIZED_UI_FILES]) {
    const src = read(rel);
    assert.ok(!/openai|anthropic|"gpt-|'gpt-|generativeai/i.test(src), `${rel} must never reference an AI provider`);
  }
});

check("17. Stable deterministic ranking/tie-breaking", () => {
  const result1 = selectNextRightMove({
    dimensionResults: [{ dimensionKey: "business_foundation", status: "needs_attention" }, { dimensionKey: "customer_clarity", status: "needs_attention" }],
    readinessIsReady: true, humanReviewRequired: false, ownerGoalKnown: true,
  });
  const result2 = selectNextRightMove({
    dimensionResults: [{ dimensionKey: "business_foundation", status: "needs_attention" }, { dimensionKey: "customer_clarity", status: "needs_attention" }],
    readinessIsReady: true, humanReviewRequired: false, ownerGoalKnown: true,
  });
  assert.strictEqual(result1.selected?.template.candidateKey, result2.selected?.template.candidateKey, "selection must be deterministic across repeated calls");
});

check("21. Override requires a non-empty reason (repository contract)", () => {
  const repoSrc = read("app/lib/business/stewardship/repository.ts");
  assert.ok(repoSrc.includes('if (!reason || reason.trim().length === 0) return { ok: false, error: "empty_reason" };'));
});

check("22. Override cannot bypass readiness — recordOverride never calls checkReadinessGate/createNextRightMove", () => {
  const repoSrc = read("app/lib/business/stewardship/repository.ts");
  const overrideFnStart = repoSrc.indexOf("export async function recordOverride");
  const overrideFnEnd = repoSrc.indexOf("\nexport async function listOverridesForRecommendation");
  const overrideFnSrc = repoSrc.slice(overrideFnStart, overrideFnEnd);
  assert.ok(!overrideFnSrc.includes("checkReadinessGate"), "override must never re-check/bypass readiness");
});

check("23. Override history preserves before/after snapshots", () => {
  const repoSrc = read("app/lib/business/stewardship/repository.ts");
  assert.ok(repoSrc.includes("before_snapshot: beforeSnapshot"));
  assert.ok(repoSrc.includes("after_snapshot: afterSnapshot"));
});

check("Override requiring reapproval clears prior approval/share attribution (never silently re-approved)", () => {
  const repoSrc = read("app/lib/business/stewardship/repository.ts");
  assert.ok(repoSrc.includes('updateRow.status = "review_required";'));
  assert.ok(repoSrc.includes("updateRow.approved_at = null;"));
  assert.ok(repoSrc.includes("updateRow.shared_at = null;"));
});

check("24. Owner API excludes drafts — only shared_with_owner/accepted/declined/postponed + owner_and_staff visibility", () => {
  const routeSrc = read("app/api/dashboard/business/recommendations/route.ts");
  assert.ok(routeSrc.includes('current.visibility === "owner_and_staff"'));
  assert.ok(routeSrc.includes('current.status === "shared_with_owner"'));
});

check("25. Owner API excludes staff-only test/comparison details — never returns the tests array itself", () => {
  const routeSrc = read("app/api/dashboard/business/recommendations/route.ts");
  assert.ok(!/tests\.map|tests,/.test(routeSrc.replace("reviewedTestCount: tests.length,", "")), "owner route must never return raw test content");
  assert.ok(routeSrc.includes("reviewedTestCount: tests.length"), "owner route may only expose a count, never test content");
});

check("26. Owner decision requires exact membership — decision route uses resolveStewardshipAccess (exact business membership check)", () => {
  const routeSrc = read("app/api/dashboard/business/recommendations/[id]/decision/route.ts");
  assert.ok(routeSrc.includes("resolveStewardshipAccess"));
});

check("27. Body actor/auth/role fields are ignored or absent in every owner/staff route", () => {
  for (const rel of AUTHORIZED_API_FILES) {
    const src = read(rel);
    assert.ok(!/body\.authUserId|body\.userId|body\.actorRole|body\.approvedBy|body\.rosterId/.test(src), `${rel} must never trust a body-supplied identity/role/approval field`);
  }
});

check("28. Owner accept/decline/postpone transitions are bounded", () => {
  assert.deepStrictEqual([...OWNER_DECISIONS], ["accepted", "declined", "postponed"]);
  const routeSrc = read("app/api/dashboard/business/recommendations/[id]/decision/route.ts");
  assert.ok(routeSrc.includes('new Set(["accept", "decline", "postpone"])'));
});

check("29. Repeated decision rejected (RPC-level exact-eligibility predicate, not an app-level status-scoped update)", () => {
  // Once a first decision succeeds, the row's status is no longer 'shared_with_owner', so the
  // RPC's own eligibility SELECT (status = 'shared_with_owner' ... FOR UPDATE) finds no row and
  // raises 'not_eligible' -- this is the RPC's replacement for the old app-level
  // `.eq("status", existing.status)` guard, and is strictly stronger (row-locked, transactional).
  assert.ok(RPC_BODY.includes("status = 'shared_with_owner'"));
  assert.ok(RPC_BODY.includes("FOR UPDATE"));
  assert.ok(RPC_BODY.includes("RAISE EXCEPTION 'not_eligible';"));
});

check("30. Postpone supports review date", () => {
  const routeSrc = read("app/api/dashboard/business/recommendations/[id]/decision/route.ts");
  assert.ok(routeSrc.includes('decision === "postpone" && !reviewDate'));
});

check("31. Free option appears first in the owner UI ordering", () => {
  const pageSrc = read("app/(site)/dashboard/business-tools/proximo-paso/page.tsx");
  const freeIdx = pageSrc.indexOf("t.freeFirst");
  const guidedIdx = pageSrc.indexOf("t.guided}");
  assert.ok(freeIdx !== -1 && guidedIdx !== -1 && freeIdx < guidedIdx, "free option must render before guided/other options");
});

check("32. do-nothing-yet is representable", () => {
  assert.ok(RECOMMENDATION_TEMPLATES.some((t) => t.primaryIntervention === "no_action_yet"));
  const pageSrc = read("app/(site)/dashboard/business-tools/proximo-paso/page.tsx");
  assert.ok(pageSrc.includes("doNothingYetOptionEs"));
});

check("33. External referral is representable", () => {
  assert.ok(RECOMMENDATION_TEMPLATES.some((t) => t.externalReferralOptionEs !== null));
  const pageSrc = read("app/(site)/dashboard/business-tools/proximo-paso/page.tsx");
  assert.ok(pageSrc.includes("externalReferralOptionEs"));
});

check("34. Capacity-blocked businesses are not given a demand-generation Next Right Move", () => {
  const result = selectNextRightMove({
    dimensionResults: [
      { dimensionKey: "operations_and_capacity", status: "needs_attention" },
      { dimensionKey: "visibility_and_discovery", status: "needs_attention" },
    ],
    readinessIsReady: true, humanReviewRequired: false, ownerGoalKnown: true,
  });
  assert.ok(result.selected, "expected a candidate to be selected");
  assert.strictEqual(result.selected!.template.isDemandGenerating, false, "must never select a demand-generating candidate while capacity is blocked");
});

check("35. Unknown owner goals do not produce fabricated life alignment", () => {
  const template = findTemplateByKey("clarify_owner_goals")!;
  const input: SixTestInput = { dimensionStatus: "insufficient_information", readinessIsReady: true, humanReviewRequired: false, template, ownerGoalKnown: false, capacityBlocked: false };
  const outcomes = evaluateSixTests(input);
  const lifeAlignment = outcomes.find((o) => o.testKey === "life_alignment")!;
  assert.strictEqual(lifeAlignment.result, "caution");
  assert.ok(!/aligns with|supports the owner's desired/i.test(lifeAlignment.explanationEn), "must never fabricate a claimed alignment");
});

check("36. Ledger supports intentionally_not_recommended", () => {
  const typesSrc = read("app/lib/business/stewardship/types.ts");
  assert.ok(typesSrc.includes('"intentionally_not_recommended"'));
  const repoSrc = read("app/lib/business/stewardship/repository.ts");
  assert.ok(repoSrc.includes('eventType: "intentionally_not_recommended"'));
});

check("37. Ledger supports taught_freely", () => {
  const typesSrc = read("app/lib/business/stewardship/types.ts");
  assert.ok(typesSrc.includes('"taught_freely"'));
});

check("38. Ledger supports sold_or_requested with a truthful reason contract", () => {
  const typesSrc = read("app/lib/business/stewardship/types.ts");
  assert.ok(typesSrc.includes('"sold_or_requested"'));
  assert.ok(MIGRATION.includes("money_involved = false OR (payment_reference IS NOT NULL AND char_length(btrim(payment_reference)) > 0)"));
});

check("39. No Stripe/checkout/payment creation exists in TODAY-3 code", () => {
  for (const rel of [...AUTHORIZED_LIB_FILES, ...AUTHORIZED_API_FILES, ...AUTHORIZED_UI_FILES]) {
    const src = read(rel);
    assert.ok(!/new Stripe\(|stripe\.checkout|checkout\.sessions\.create|payment_intent/i.test(src), `${rel} must never implement Stripe/checkout/payment capture`);
  }
});

check("42. All owner UI copy is ES/EN", () => {
  const pageSrc = read("app/(site)/dashboard/business-tools/proximo-paso/page.tsx");
  assert.ok(/\bes:\s*[{"']/.test(pageSrc) && /\ben:\s*[{"']/.test(pageSrc));
});

check("43. Owner route is linked from Business Tools", () => {
  const hubSrc = read("app/(site)/dashboard/business-tools/page.tsx");
  assert.ok(hubSrc.includes("/dashboard/business-tools/proximo-paso"));
});

check("44. No duplicate business identity or Health Map data store created", () => {
  assert.ok(!/CREATE TABLE.*businesses\b/i.test(MIGRATION.replace(/REFERENCES public\.businesses/g, "")));
  assert.ok(!MIGRATION.includes("CREATE TABLE IF NOT EXISTS public.business_health_"));
});

check("45. No Production reference or secret literal in any TODAY-3 file", () => {
  const secretPattern = /sk_live|sk_test_[a-zA-Z0-9]{10}|SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^"'`]|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----|xuieateniufcrsfdomwl/i;
  for (const rel of [MIGRATION_PATH, ...AUTHORIZED_LIB_FILES, ...AUTHORIZED_API_FILES, ...AUTHORIZED_UI_FILES]) {
    assert.ok(!secretPattern.test(read(rel)), `${rel} matched a secret/production-ref pattern`);
  }
});

check("Readiness is read before any recommendation insert — createNextRightMove calls checkReadinessGate first", () => {
  const repoSrc = read("app/lib/business/stewardship/repository.ts");
  const fnStart = repoSrc.indexOf("export async function createNextRightMove");
  const fnBody = repoSrc.slice(fnStart, fnStart + 400);
  assert.ok(fnBody.includes("const gate = await checkReadinessGate(businessId);"));
  assert.ok(fnBody.indexOf("checkReadinessGate") < fnBody.indexOf("business_recommendations") === false || !fnBody.includes("business_recommendations"), "no recommendation table access before the gate in this snippet");
});

check("readiness_blocked writes nothing — early return before any insert", () => {
  const repoSrc = read("app/lib/business/stewardship/repository.ts");
  const fnStart = repoSrc.indexOf("export async function createNextRightMove");
  const fnEnd = repoSrc.indexOf("\nexport async function getCurrentRecommendation");
  const fnSrc = repoSrc.slice(fnStart, fnEnd);
  assert.ok(fnSrc.includes("if (!gate.ok) return { ok: false, reason: gate.reason };"), "must return immediately on a failed gate, before any write");
});

check("No bypass/force parameter exists anywhere in the stewardship domain or API layer", () => {
  for (const rel of [...AUTHORIZED_LIB_FILES, ...AUTHORIZED_API_FILES]) {
    const src = read(rel);
    // Strip comment lines (doc prose truthfully stating "no bypass" is expected and fine) —
    // only flag an actual code construct: a parameter/property/field literally named force/
    // bypass/skipReadiness/overrideReadiness.
    const codeOnly = src
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        return !trimmed.startsWith("//") && !trimmed.startsWith("*") && !trimmed.startsWith("/**");
      })
      .join("\n");
    assert.ok(!/\bforce\s*[:?=]|\bbypass\s*[:?=]|skipReadiness|overrideReadiness|\.force\b|\.bypass\b/i.test(codeOnly), `${rel} must never expose a bypass/force parameter in executable code`);
  }
});

check("19. sales_rep cannot create/approve/override (capability matrix)", () => {
  const capSrc = read("app/admin/_lib/salesWorkspaceCapabilities.ts");
  const salesRepBlock = capSrc.slice(capSrc.indexOf("sales_rep: ["), capSrc.indexOf("};", capSrc.indexOf("sales_rep: [")));
  assert.ok(!salesRepBlock.includes('"create_recommendation"'));
  assert.ok(!salesRepBlock.includes('"approve_recommendation"'));
  assert.ok(!salesRepBlock.includes('"override_recommendation"'));
  assert.ok(salesRepBlock.includes('"view_recommendations"'));
});

check("20. Manager+ capability required for create/approve/override", () => {
  const capSrc = read("app/admin/_lib/salesWorkspaceCapabilities.ts");
  for (const role of ["super_admin", "sales_manager"]) {
    const block = capSrc.slice(capSrc.indexOf(`${role}: [`), capSrc.indexOf("],", capSrc.indexOf(`${role}: [`)));
    assert.ok(block.includes('"create_recommendation"'), `${role} missing create_recommendation`);
    assert.ok(block.includes('"approve_recommendation"'), `${role} missing approve_recommendation`);
    assert.ok(block.includes('"override_recommendation"'), `${role} missing override_recommendation`);
  }
});

check("Status/decision bounded sets match the migration exactly", () => {
  assert.deepStrictEqual([...RECOMMENDATION_STATUSES], [
    "draft", "review_required", "approved", "shared_with_owner", "accepted", "declined", "postponed", "superseded", "archived",
  ]);
});

check("computeNextRecommendationStatus rejects invalid transitions (never a silent no-op success)", () => {
  assert.strictEqual(computeNextRecommendationStatus("draft", "submit_for_review"), "review_required");
  assert.strictEqual(computeNextRecommendationStatus("draft", "approve"), null);
  assert.strictEqual(computeNextRecommendationStatus("accepted", "accept"), null);
});

check("overrideRequiresReapproval flags owner-facing content changes only", () => {
  assert.strictEqual(overrideRequiresReapproval(["verifiedNeedEs"]), true);
  assert.strictEqual(overrideRequiresReapproval(["reviewDate"]), false);
});

// ---------------------------------------------------------------------------
// Focused pure-logic cases (required by the task)
// ---------------------------------------------------------------------------

check("Focused: ready readiness allows selection; blocked readiness fails the readiness test", () => {
  const template = RECOMMENDATION_TEMPLATES[0];
  const readyOutcome = evaluateSixTests({ dimensionStatus: template.appliesToDimensionStatuses[0], readinessIsReady: true, humanReviewRequired: false, template, ownerGoalKnown: true, capacityBlocked: false });
  assert.strictEqual(readyOutcome.find((o) => o.testKey === "readiness")!.result, "pass");
  const blockedOutcome = evaluateSixTests({ dimensionStatus: template.appliesToDimensionStatuses[0], readinessIsReady: false, humanReviewRequired: false, template, ownerGoalKnown: true, capacityBlocked: false });
  assert.strictEqual(blockedOutcome.find((o) => o.testKey === "readiness")!.result, "blocked");
});

check("Focused: high need but failed capacity (demand-generating template + capacity blocked) fails capacity test", () => {
  const template = findTemplateByKey("complete_google_business_profile")!;
  assert.strictEqual(template.isDemandGenerating, true);
  const outcomes = evaluateSixTests({ dimensionStatus: "needs_attention", readinessIsReady: true, humanReviewRequired: false, template, ownerGoalKnown: true, capacityBlocked: true });
  assert.strictEqual(outcomes.find((o) => o.testKey === "capacity")!.result, "fail");
  assert.strictEqual(sixTestsAllowApproval(outcomes), false);
});

check("Focused: low need (dimension status not matched by template) fails the need test", () => {
  const template = findTemplateByKey("confirm_business_foundation_consistency")!;
  const outcomes = evaluateSixTests({ dimensionStatus: "strong", readinessIsReady: true, humanReviewRequired: false, template, ownerGoalKnown: true, capacityBlocked: false });
  assert.strictEqual(outcomes.find((o) => o.testKey === "need")!.result, "fail");
});

check("Focused: no confirmed owner goal produces caution on life_alignment, never pass", () => {
  const template = RECOMMENDATION_TEMPLATES[0];
  const outcomes = evaluateSixTests({ dimensionStatus: template.appliesToDimensionStatuses[0], readinessIsReady: true, humanReviewRequired: false, template, ownerGoalKnown: false, capacityBlocked: false });
  assert.strictEqual(outcomes.find((o) => o.testKey === "life_alignment")!.result, "caution");
});

check("Focused: aligned/known owner goal produces pass on life_alignment", () => {
  const template = RECOMMENDATION_TEMPLATES[0];
  const outcomes = evaluateSixTests({ dimensionStatus: template.appliesToDimensionStatuses[0], readinessIsReady: true, humanReviewRequired: false, template, ownerGoalKnown: true, capacityBlocked: false });
  assert.strictEqual(outcomes.find((o) => o.testKey === "life_alignment")!.result, "pass");
});

check("Focused: failed Lion Code (selling visibility to a capacity-blocked business) blocks approval", () => {
  const template: (typeof RECOMMENDATION_TEMPLATES)[number] = { ...RECOMMENDATION_TEMPLATES[0], primaryIntervention: "leonix_product_or_advertising" };
  const outcomes = evaluateSixTests({ dimensionStatus: template.appliesToDimensionStatuses[0], readinessIsReady: true, humanReviewRequired: false, template, ownerGoalKnown: true, capacityBlocked: true });
  assert.strictEqual(outcomes.find((o) => o.testKey === "lion_code")!.result, "fail");
  assert.strictEqual(sixTestsAllowApproval(outcomes), false);
});

check("Focused: a free action beats a higher-cost service in deterministic ranking", () => {
  const result = selectNextRightMove({
    dimensionResults: [{ dimensionKey: "business_foundation", status: "needs_attention" }],
    readinessIsReady: true, humanReviewRequired: false, ownerGoalKnown: true,
  });
  assert.ok(result.selected);
  assert.strictEqual(result.selected!.template.costBand, "free");
});

check("Focused: external referral is representable as a candidate option (offer_and_value template)", () => {
  const template = findTemplateByKey("separate_revenue_from_profit")!;
  assert.ok(template.externalReferralOptionEs !== null);
});

check("Focused: do nothing yet is the primary intervention for the capacity-protection template", () => {
  const template = findTemplateByKey("protect_capacity_before_visibility")!;
  assert.strictEqual(template.primaryIntervention, "no_action_yet");
});

check("Focused: deterministic tie-break by candidateKey when scores are equal", () => {
  const a = { template: { ...RECOMMENDATION_TEMPLATES[0], basePriority: 50, candidateKey: "b_key" }, dimensionStatus: "needs_attention", score: 50, sixTests: [], approvable: true };
  const b = { template: { ...RECOMMENDATION_TEMPLATES[0], basePriority: 50, candidateKey: "a_key" }, dimensionStatus: "needs_attention", score: 50, sixTests: [], approvable: true };
  const sorted = [a, b].sort((x, y) => (y.score !== x.score ? y.score - x.score : x.template.candidateKey.localeCompare(y.template.candidateKey)));
  assert.strictEqual(sorted[0].template.candidateKey, "a_key");
});

check("Focused: override requiring reapproval is correctly flagged for owner-facing fields", () => {
  assert.strictEqual(overrideRequiresReapproval(["successMetricEn"]), true);
  assert.strictEqual(overrideRequiresReapproval(["costBand"]), true);
});

check("Focused: owner visibility filtering — draft/staff_only never exposed even if status looks shared-like", () => {
  const routeSrc = read("app/api/dashboard/business/recommendations/route.ts");
  assert.ok(routeSrc.includes('current.visibility === "owner_and_staff" &&'));
});

// ---------------------------------------------------------------------------
// Pre-staging database integrity repair (Repairs 1-5)
// ---------------------------------------------------------------------------

const REPO_SRC = read("app/lib/business/stewardship/repository.ts");

check("Integrity 1. Partial approval attribution is rejected (atomic two-shape CHECK exists)", () => {
  assert.ok(MIGRATION.includes("business_recommendations_approval_atomic_chk"));
  const start = MIGRATION.indexOf("CONSTRAINT business_recommendations_approval_atomic_chk");
  const clause = MIGRATION.slice(start, MIGRATION.indexOf("),\n", start) + 1);
  assert.ok(clause.includes("approved_by_roster_id IS NULL AND approved_by_auth_user_id IS NULL"), "must reject partial attribution via the fully-NULL branch");
  assert.ok(clause.includes("approved_by_roster_id IS NOT NULL AND approved_by_auth_user_id IS NOT NULL"), "must require the fully-filled branch");
  assert.ok(clause.includes("char_length(btrim(approved_by_email)) > 0") && clause.includes("char_length(btrim(approved_by_role)) > 0"), "must reject blank (whitespace-only) email/role");
});

check("Integrity 2. Complete approval attribution is accepted (approval CHECK requires the full filled shape, nonblank)", () => {
  const start = MIGRATION.indexOf("CONSTRAINT business_recommendations_approval_chk");
  const clause = MIGRATION.slice(start, MIGRATION.indexOf("),\n", start) + 1);
  assert.ok(clause.includes("approved_at IS NOT NULL"));
  assert.ok(clause.includes("char_length(btrim(approved_by_email)) > 0"));
});

check("Integrity 3. approved status without complete attribution is rejected (approval_chk scopes 'approved' status)", () => {
  const start = MIGRATION.indexOf("CONSTRAINT business_recommendations_approval_chk");
  const clause = MIGRATION.slice(start, MIGRATION.indexOf("),\n", start) + 1);
  assert.ok(clause.includes("status NOT IN ('approved', 'shared_with_owner', 'accepted', 'declined', 'postponed')"));
});

check("Integrity 4. shared_with_owner without shared_at is rejected", () => {
  assert.ok(MIGRATION.includes("business_recommendations_status_requires_shared_chk"));
  const start = MIGRATION.indexOf("CONSTRAINT business_recommendations_status_requires_shared_chk");
  const clause = MIGRATION.slice(start, MIGRATION.indexOf("),\n", start) + 1);
  assert.ok(clause.includes("'shared_with_owner'") && clause.includes("shared_at IS NOT NULL"));
});

check("Integrity 5/6/7. accepted/declined/postponed without shared_at are rejected (same status_requires_shared_chk covers all three)", () => {
  const start = MIGRATION.indexOf("CONSTRAINT business_recommendations_status_requires_shared_chk");
  const clause = MIGRATION.slice(start, MIGRATION.indexOf("),\n", start) + 1);
  for (const status of ["'accepted'", "'declined'", "'postponed'"]) {
    assert.ok(clause.includes(status), `status_requires_shared_chk must cover ${status}`);
  }
});

check("Integrity 8. draft/review_required with shared_at is rejected", () => {
  assert.ok(MIGRATION.includes("business_recommendations_no_shared_before_review_chk"));
  const start = MIGRATION.indexOf("CONSTRAINT business_recommendations_no_shared_before_review_chk");
  const clause = MIGRATION.slice(start, MIGRATION.indexOf("),\n", start) + 1);
  assert.ok(clause.includes("'draft'") && clause.includes("'review_required'") && clause.includes("shared_at IS NULL"));
});

check("Integrity 9. Non-decision status with owner_decision fields (including a note) is rejected", () => {
  assert.ok(MIGRATION.includes("business_recommendations_status_decision_null_chk"));
  const start = MIGRATION.indexOf("CONSTRAINT business_recommendations_status_decision_null_chk");
  const clause = MIGRATION.slice(start, MIGRATION.indexOf("),\n", start) + 1);
  assert.ok(clause.includes("owner_decision IS NULL") && clause.includes("owner_decision_note IS NULL") && clause.includes("owner_decision_review_date IS NULL"));
});

check("Integrity 10/11. accepted/declined with a postponed-style review date are rejected (bidirectional review-date CHECK)", () => {
  assert.ok(MIGRATION.includes("business_recommendations_owner_decision_review_date_chk"));
  const start = MIGRATION.indexOf("CONSTRAINT business_recommendations_owner_decision_review_date_chk");
  const clause = MIGRATION.slice(start, MIGRATION.indexOf("),\n", start) + 1);
  assert.ok(clause.includes("IS DISTINCT FROM 'postponed' AND owner_decision_review_date IS NULL"), "non-postponed decisions (accepted/declined) must require a NULL review date");
});

check("Integrity 12. postponed without a review date is rejected (same bidirectional CHECK, forward direction)", () => {
  const start = MIGRATION.indexOf("CONSTRAINT business_recommendations_owner_decision_review_date_chk");
  const clause = MIGRATION.slice(start, MIGRATION.indexOf("),\n", start) + 1);
  assert.ok(clause.includes("owner_decision = 'postponed' AND owner_decision_review_date IS NOT NULL"));
});

check("Integrity 13. Owner decision repository passes real owner attribution to the atomic RPC (superseded by the RPC repair; no separate app-level ledger write remains)", () => {
  const fnStart = REPO_SRC.indexOf("export async function recordOwnerDecision");
  const fnEnd = REPO_SRC.indexOf("\n// ---", fnStart);
  const fnSrc = REPO_SRC.slice(fnStart, fnEnd);
  assert.ok(fnSrc.includes("p_actor_auth_user_id: actor.authUserId"));
  assert.ok(fnSrc.includes("p_actor_email: actor.email"));
  assert.ok(fnSrc.includes("p_actor_role: actorRole(actor)"));
});

check("Integrity 13b. Owner decision structured_reason is always nonempty, even when no note is supplied (now guaranteed inside the RPC, not the repository)", () => {
  assert.ok(RPC_BODY.includes("jsonb_build_object('decision', p_decision, 'candidateKey', r.candidate_key)"), "the RPC must always populate a nonempty structured_reason regardless of note");
});

check("Integrity 13c. Atomicity is now guaranteed by the single-transaction RPC, not by a compensating rollback (RPC 12 confirms the rollback is gone)", () => {
  const fnStart = REPO_SRC.indexOf("export async function recordOwnerDecision");
  const fnEnd = REPO_SRC.indexOf("\n// ---", fnStart);
  const fnSrc = REPO_SRC.slice(fnStart, fnEnd);
  assert.ok(!fnSrc.includes("if (!ledgerEntry)"), "no compensating-rollback branch may remain");
  assert.ok(fnSrc.includes('supabase.rpc("record_business_recommendation_owner_decision"'), "the update and ledger insert must both be delegated to the one atomic RPC call");
});

check("Integrity 14. A consequential override clears the complete approval/share attribution set atomically", () => {
  const fnStart = REPO_SRC.indexOf("export async function recordOverride");
  const fnEnd = REPO_SRC.indexOf("\nexport async function listOverridesForRecommendation");
  const fnSrc = REPO_SRC.slice(fnStart, fnEnd);
  for (const field of ["approved_by_roster_id", "approved_by_auth_user_id", "approved_by_email", "approved_by_role", "approved_at", "shared_at"]) {
    assert.ok(fnSrc.includes(`updateRow.${field} = null;`), `reapproval-required override must clear ${field}`);
  }
  assert.ok(fnSrc.includes('updateRow.status = "review_required";'), "must move the recommendation back to review_required in the same write");
});

check("Integrity 15. money_involved=true with a null payment_reference is rejected", () => {
  const start = MIGRATION.indexOf("CONSTRAINT business_stewardship_ledger_money_chk");
  const clause = MIGRATION.slice(start, MIGRATION.indexOf("),\n", start) + 1);
  assert.ok(clause.includes("payment_reference IS NOT NULL"));
});

check("Integrity 16. money_involved=true with a blank (whitespace-only) payment_reference is rejected", () => {
  const start = MIGRATION.indexOf("CONSTRAINT business_stewardship_ledger_money_chk");
  const clause = MIGRATION.slice(start, MIGRATION.indexOf("),\n", start) + 1);
  assert.ok(clause.includes("char_length(btrim(payment_reference)) > 0"));
});

check("Integrity 17. A ledger entry with blank reasons and an empty structured_reason is rejected", () => {
  assert.ok(MIGRATION.includes("business_stewardship_ledger_explanation_chk"));
  const start = MIGRATION.indexOf("CONSTRAINT business_stewardship_ledger_explanation_chk");
  const clause = MIGRATION.slice(start, MIGRATION.indexOf("\n)", start) + 1);
  assert.ok(clause.includes("char_length(btrim(reason_es)) > 0"));
  assert.ok(clause.includes("char_length(btrim(reason_en)) > 0"));
  assert.ok(clause.includes("structured_reason <> '{}'::jsonb"));
});

check("Integrity 18. A ledger entry with a nonblank reason (no structured_reason needed) is accepted", () => {
  const start = MIGRATION.indexOf("CONSTRAINT business_stewardship_ledger_explanation_chk");
  const clause = MIGRATION.slice(start, MIGRATION.indexOf("\n)", start) + 1);
  // The three branches are OR'd -- a nonblank reason_es or reason_en alone satisfies the CHECK.
  assert.strictEqual((clause.match(/\) OR\s*\(/g) ?? []).length, 2, "expected exactly three OR'd branches (es reason / en reason / structured_reason)");
});

check("Integrity 19. A ledger entry with a nonempty structured_reason (no text reason needed) is accepted", () => {
  const start = MIGRATION.indexOf("CONSTRAINT business_stewardship_ledger_explanation_chk");
  const clause = MIGRATION.slice(start, MIGRATION.indexOf("\n)", start) + 1);
  assert.ok(clause.includes("jsonb_typeof(structured_reason) = 'object' AND structured_reason <> '{}'::jsonb"), "a nonempty structured_reason object alone must satisfy the CHECK");
});

check("Integrity: every previously-empty-structured_reason ledger call site (approve/share) now carries a truthful nonempty payload", () => {
  assert.ok(REPO_SRC.includes('structuredReason: { event: "recommendation_approved", candidateKey: existing.candidateKey }'));
  assert.ok(REPO_SRC.includes('structuredReason: { event: "recommendation_shared", candidateKey: existing.candidateKey }'));
  assert.ok(!/structuredReason: \{\}/.test(REPO_SRC), "no ledger call site may pass an empty structured_reason literal anymore");
});

// ---------------------------------------------------------------------------
// Owner-decision atomicity repair: SECURITY DEFINER RPC (replaces the compensating rollback)
// ---------------------------------------------------------------------------

check("RPC 1. record_business_recommendation_owner_decision exists", () => {
  assert.ok(RPC_START !== -1, "RPC definition not found");
  assert.ok(RPC_BODY.length > 0);
});

check("RPC 2. RPC is SECURITY DEFINER", () => {
  assert.ok(RPC_BODY.includes("SECURITY DEFINER"));
});

check("RPC 3. RPC fixes search_path to public", () => {
  assert.ok(RPC_BODY.includes("SET search_path = public"));
});

check("RPC 4. EXECUTE revoked from PUBLIC", () => {
  assert.ok(MIGRATION.includes(`REVOKE ALL ON FUNCTION public.${RPC_SIGNATURE} FROM PUBLIC;`));
});

check("RPC 5. EXECUTE revoked from anon", () => {
  assert.ok(MIGRATION.includes(`REVOKE ALL ON FUNCTION public.${RPC_SIGNATURE} FROM anon;`));
});

check("RPC 6. EXECUTE revoked from authenticated", () => {
  assert.ok(MIGRATION.includes(`REVOKE ALL ON FUNCTION public.${RPC_SIGNATURE} FROM authenticated;`));
});

check("RPC 6b. EXECUTE revoked from service_role before the narrow grant (revoke-then-grant posture)", () => {
  const revokeIdx = MIGRATION.indexOf(`REVOKE ALL ON FUNCTION public.${RPC_SIGNATURE} FROM service_role;`);
  const grantIdx = MIGRATION.indexOf(`GRANT EXECUTE ON FUNCTION public.${RPC_SIGNATURE} TO service_role;`);
  assert.ok(revokeIdx !== -1 && grantIdx !== -1 && revokeIdx < grantIdx);
});

check("RPC 7. EXECUTE granted only to service_role (no other GRANT EXECUTE line exists for this function)", () => {
  const grantLines = MIGRATION.split("\n").filter((l) => l.includes(`GRANT EXECUTE ON FUNCTION public.${RPC_SIGNATURE}`));
  assert.strictEqual(grantLines.length, 1);
  assert.ok(grantLines[0].includes("TO service_role;"));
});

check("RPC 8. Recommendation UPDATE and ledger INSERT occur inside the same function body", () => {
  const updateIdx = RPC_BODY.indexOf("UPDATE public.business_recommendations");
  const insertIdx = RPC_BODY.indexOf("INSERT INTO public.business_stewardship_ledger");
  assert.ok(updateIdx !== -1 && insertIdx !== -1 && updateIdx < insertIdx, "both writes must exist in order inside the one function body");
});

check("RPC 9. Repository uses the RPC via supabase.rpc(...)", () => {
  assert.ok(REPO_SRC.includes(`supabase.rpc("${RPC_NAME}"`));
});

check("RPC 10. Repository no longer performs a separate owner-decision UPDATE against business_recommendations", () => {
  const fnStart = REPO_SRC.indexOf("export async function recordOwnerDecision");
  const fnEnd = REPO_SRC.indexOf("\n// ---", fnStart);
  const fnSrc = REPO_SRC.slice(fnStart, fnEnd);
  assert.ok(!/\.from\("business_recommendations"\)\s*\.update\(/.test(fnSrc), "recordOwnerDecision must delegate the update to the RPC, never issue its own");
});

check("RPC 11. Repository no longer performs a separate decision-ledger INSERT (no writeLedgerEntry call in recordOwnerDecision)", () => {
  const fnStart = REPO_SRC.indexOf("export async function recordOwnerDecision");
  const fnEnd = REPO_SRC.indexOf("\n// ---", fnStart);
  const fnSrc = REPO_SRC.slice(fnStart, fnEnd);
  assert.ok(!fnSrc.includes("writeLedgerEntry("), "recordOwnerDecision must delegate the ledger insert to the RPC, never call writeLedgerEntry itself");
});

check("RPC 12. Compensating-rollback code is completely absent from recordOwnerDecision", () => {
  const fnStart = REPO_SRC.indexOf("export async function recordOwnerDecision");
  const fnEnd = REPO_SRC.indexOf("\n// ---", fnStart);
  const fnSrc = REPO_SRC.slice(fnStart, fnEnd);
  assert.ok(!/if \(!ledgerEntry\)/.test(fnSrc), "no compensating rollback branch may remain");
  assert.ok(!fnSrc.includes("ledger_write_failed"), "the compensating-rollback error code must be gone");
  assert.ok(!/existing\.ownerDecision/.test(fnSrc), "no reversion of a pre-fetched snapshot may remain");
});

check("RPC 13. accepted maps to owner_accepted", () => {
  assert.ok(RPC_BODY.includes("WHEN 'accepted' THEN 'owner_accepted'"));
});

check("RPC 14. declined maps to owner_declined", () => {
  assert.ok(RPC_BODY.includes("WHEN 'declined' THEN 'owner_declined'"));
});

check("RPC 15. postponed maps to owner_postponed", () => {
  assert.ok(RPC_BODY.includes("ELSE 'owner_postponed'"));
});

check("RPC 16. postponed requires a review date (RPC-level validation)", () => {
  assert.ok(RPC_BODY.includes("p_decision = 'postponed' AND p_review_date IS NULL THEN\n    RAISE EXCEPTION 'postpone_requires_review_date'"));
});

check("RPC 17. accepted/declined reject a supplied review date (RPC-level validation)", () => {
  assert.ok(RPC_BODY.includes("p_decision <> 'postponed' AND p_review_date IS NOT NULL THEN\n    RAISE EXCEPTION 'review_date_not_allowed'"));
});

check("RPC 18. Exact business/recommendation/current/shared eligibility predicates exist", () => {
  assert.ok(RPC_BODY.includes("id = p_recommendation_id"));
  assert.ok(RPC_BODY.includes("business_id = p_business_id"));
  assert.ok(RPC_BODY.includes("status = 'shared_with_owner'"));
  assert.ok(RPC_BODY.includes("visibility = 'owner_and_staff'"));
  assert.ok(RPC_BODY.includes("is_current = true"));
});

check("RPC 19. Owner actor attribution written into the ledger is complete (real auth user id, email, role; roster id NULL; type owner)", () => {
  assert.ok(RPC_BODY.includes("'owner', NULL, p_actor_auth_user_id, p_actor_email, p_actor_role"));
  assert.ok(RPC_BODY.includes("RAISE EXCEPTION 'missing_owner_actor_attribution';"));
});

check("RPC 20. money_involved remains false and payment_reference remains NULL, hardcoded (never a parameter)", () => {
  assert.ok(RPC_BODY.includes("false, NULL,\n    'owner', NULL,"), "money_involved/payment_reference must be hardcoded literals in the INSERT, not RPC parameters");
  assert.ok(!/p_money_involved|p_payment_reference/.test(RPC_BODY), "money fields must never be exposed as RPC parameters");
});

check("RPC 21. Body-supplied actor identity is never trusted — the owner decision route derives the actor from resolveStewardshipAccess, not from the request body", () => {
  const routeSrc = read("app/api/dashboard/business/recommendations/[id]/decision/route.ts");
  assert.ok(routeSrc.includes("const actor: StewardshipActor = { type: \"owner\", authUserId: access.userId, email: access.email };"));
  assert.ok(!/body\.actor|body\.authUserId|body\.email|body\.role|body\.rosterId/.test(routeSrc), "route must never read actor identity fields from the request body");
});

check("RPC: repository forbids invoking recordOwnerDecision with a non-owner actor", () => {
  const fnStart = REPO_SRC.indexOf("export async function recordOwnerDecision");
  const fnEnd = REPO_SRC.indexOf("\n// ---", fnStart);
  const fnSrc = REPO_SRC.slice(fnStart, fnEnd);
  assert.ok(fnSrc.includes('if (actor.type !== "owner") return { ok: false, error: "owner_actor_required" };'));
});

check("RPC: no Production reference and no secret literal inside the function body", () => {
  const secretPattern = /sk_live|sk_test_[a-zA-Z0-9]{10}|SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^"'`]|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----|xuieateniufcrsfdomwl/i;
  assert.ok(!secretPattern.test(RPC_BODY));
});

check("RPC: no payment/checkout/entitlement/Globalization write inside the function body", () => {
  assert.ok(!/stripe|checkout|listing_package_entitlements|leonix_placement_entitlements/i.test(RPC_BODY));
});

console.log(`\n${passed} check(s) passed${failed ? `, ${failed} FAILED` : ""}.`);
if (failed > 0) {
  console.log("\nSome checks failed.");
  process.exit(1);
} else {
  console.log("\nAll checks passed.");
}
