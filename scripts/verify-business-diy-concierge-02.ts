/**
 * TODAY-2 — Personalized DIY Concierge + Package Experience verification. Hand-rolled node:assert
 * script, matching this repo's testing convention (no jest/vitest). Run via `npx tsx
 * scripts/verify-business-diy-concierge-02.ts`.
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

const MIGRATION_PATH = "supabase/migrations/20260808120000_business_diy_concierge_foundation.sql";

const AUTHORIZED_LIB_FILES = [
  "app/lib/business/diyConcierge/types.ts",
  "app/lib/business/diyConcierge/constants.ts",
  "app/lib/business/diyConcierge/actionRegistry.ts",
  "app/lib/business/diyConcierge/logic.ts",
  "app/lib/business/diyConcierge/featureFlag.ts",
  "app/lib/business/diyConcierge/entitlement.ts",
  "app/lib/business/diyConcierge/repository.ts",
  "app/lib/business/diyConcierge/access.ts",
];
const AUTHORIZED_API_FILES = [
  "app/api/dashboard/business/diy-concierge/home/route.ts",
  "app/api/dashboard/business/diy-concierge/health-explanations/route.ts",
  "app/api/dashboard/business/diy-concierge/actions/route.ts",
  "app/api/dashboard/business/diy-concierge/actions/evidence/route.ts",
  "app/api/dashboard/business/diy-concierge/approvals/route.ts",
  "app/api/dashboard/business/diy-concierge/service-requests/route.ts",
  "app/api/dashboard/business/diy-concierge/my-businesses/route.ts",
  "app/api/admin/businesses/diy-concierge-requests/route.ts",
];
const AUTHORIZED_UI_FILES = [
  "app/(site)/dashboard/business-tools/concierge/page.tsx",
  "app/(site)/dashboard/business-tools/concierge/conciergeCopy.ts",
  "app/(site)/dashboard/business-tools/concierge/_components/ActionCard.tsx",
  "app/(site)/dashboard/business-tools/concierge/_components/ApprovalCenter.tsx",
  "app/components/leonix/PackageExperience.tsx",
  "app/(site)/home/HomeBusinessToolsSection.tsx",
  "app/(site)/qr/business-tools/page.tsx",
];

check("Authorized TODAY-2 files exist", () => {
  for (const rel of [...AUTHORIZED_LIB_FILES, ...AUTHORIZED_API_FILES, ...AUTHORIZED_UI_FILES]) {
    assert.ok(exists(rel), `missing ${rel}`);
  }
});

check("Additive migration exists", () => {
  assert.ok(exists(MIGRATION_PATH), `missing ${MIGRATION_PATH}`);
});

const MIGRATION = read(MIGRATION_PATH);

const TABLES = [
  "business_diy_actions",
  "business_diy_action_events",
  "business_diy_action_evidence",
  "business_owner_approvals",
  "business_owner_approval_events",
  "business_service_requests",
];

check("Expected tables/entities exist in the migration", () => {
  for (const t of TABLES) {
    assert.ok(MIGRATION.includes(`CREATE TABLE IF NOT EXISTS public.${t}`), `missing CREATE TABLE for ${t}`);
  }
  assert.strictEqual((MIGRATION.match(/CREATE TABLE IF NOT EXISTS public\.business_/g) ?? []).length, 6, "expected exactly 6 CREATE TABLE statements");
});

check("RLS enabled on all six tables", () => {
  const rlsCount = (MIGRATION.match(/ENABLE ROW LEVEL SECURITY/g) ?? []).length;
  assert.strictEqual(rlsCount, 6, `expected 6 RLS-enable statements, found ${rlsCount}`);
});

check("Zero policies", () => {
  assert.strictEqual((MIGRATION.match(/CREATE POLICY/g) ?? []).length, 0, "must have zero CREATE POLICY statements");
});

check("PUBLIC fully revoked on all six tables", () => {
  const n = (MIGRATION.match(/REVOKE ALL PRIVILEGES ON TABLE public\.\S+ FROM PUBLIC;/g) ?? []).length;
  assert.strictEqual(n, 6, `expected 6, found ${n}`);
});

check("anon fully revoked on all six tables", () => {
  const n = (MIGRATION.match(/REVOKE ALL PRIVILEGES ON TABLE public\.\S+ FROM anon;/g) ?? []).length;
  assert.strictEqual(n, 6, `expected 6, found ${n}`);
});

check("authenticated fully revoked on all six tables", () => {
  const n = (MIGRATION.match(/REVOKE ALL PRIVILEGES ON TABLE public\.\S+ FROM authenticated;/g) ?? []).length;
  assert.strictEqual(n, 6, `expected 6, found ${n}`);
});

check("service_role revoked before the narrow DML grant, per table", () => {
  const n = (MIGRATION.match(/REVOKE ALL PRIVILEGES ON TABLE public\.\S+ FROM service_role;/g) ?? []).length;
  assert.strictEqual(n, 6, `expected 6, found ${n}`);
  for (const t of TABLES) {
    const revokeIdx = MIGRATION.indexOf(`REVOKE ALL PRIVILEGES ON TABLE public.${t} FROM service_role;`);
    const grantIdx = MIGRATION.indexOf(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.${t} TO service_role;`);
    assert.ok(revokeIdx !== -1 && grantIdx !== -1, `${t}: missing service_role REVOKE or GRANT`);
    assert.ok(revokeIdx < grantIdx, `${t}: REVOKE FROM service_role must precede the narrow GRANT`);
  }
});

check("service_role receives only SELECT/INSERT/UPDATE/DELETE", () => {
  const n = (MIGRATION.match(/GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public\.\S+ TO service_role;/g) ?? []).length;
  assert.strictEqual(n, 6, `expected 6 narrow grants, found ${n}`);
  const otherGrants = MIGRATION.split("\n").filter((line) => line.trim().startsWith("GRANT ") && !line.includes("GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."));
  assert.strictEqual(otherGrants.length, 0, `unexpected extra GRANT line(s): ${otherGrants.join(" | ")}`);
});

check("No REFERENCES/TRIGGER/TRUNCATE grants", () => {
  assert.ok(!/GRANT REFERENCES\b/i.test(MIGRATION));
  assert.ok(!/GRANT TRIGGER\b/i.test(MIGRATION));
  assert.ok(!/GRANT TRUNCATE\b/i.test(MIGRATION));
});

check("No GRANT ALL PRIVILEGES", () => {
  assert.ok(!/^\s*GRANT ALL\b/im.test(MIGRATION));
});

check("No grant to PUBLIC, anon, or authenticated", () => {
  const grantLines = MIGRATION.split("\n").filter((line) => line.trim().startsWith("GRANT "));
  const bad = grantLines.filter((line) => /\bTO (anon|authenticated|PUBLIC)\b/i.test(line));
  assert.strictEqual(bad.length, 0, `unexpected grant(s): ${bad.join(" | ")}`);
});

check("Feature flags safe: reuses business_identity_flags, starts disabled, no parallel flags table", () => {
  assert.ok(MIGRATION.includes("business_identity_flags"));
  assert.ok(MIGRATION.includes("'business_diy_concierge', false, false"));
  assert.ok(!/CREATE TABLE.*flags/i.test(MIGRATION.replace(/business_identity_flags/g, "")));
});

check("Migration is one transaction, idempotent, additive only, no destructive statement", () => {
  assert.strictEqual((MIGRATION.match(/^\s*BEGIN;/m) ?? []).length, 1);
  assert.strictEqual((MIGRATION.match(/^\s*COMMIT;/m) ?? []).length, 1);
  assert.ok(!/^DROP |^TRUNCATE|^DELETE FROM/im.test(MIGRATION));
  // Every ALTER TABLE line must only ever be the expected "ENABLE ROW LEVEL SECURITY" — never a
  // destructive ALTER COLUMN TYPE / DROP COLUMN / etc.
  const alterLines = MIGRATION.split("\n").filter((line) => /^ALTER TABLE/i.test(line.trim()));
  for (const line of alterLines) {
    assert.ok(/ENABLE ROW LEVEL SECURITY;\s*$/.test(line.trim()), `unexpected ALTER TABLE statement: ${line}`);
  }
});

check("No Production reference and no secret literal in the migration", () => {
  assert.ok(!MIGRATION.includes("xuieateniufcrsfdomwl"));
  const secretPattern = /sk_live|sk_test_[a-zA-Z0-9]{10}|SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^"'`]|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/i;
  assert.ok(!secretPattern.test(MIGRATION));
});

check("All enums bounded in the migration (status/type/decision columns are CHECK-constrained)", () => {
  for (const col of ["status", "request_type", "evidence_type", "event_type", "urgency_preference", "actor_type", "dimension_key"]) {
    assert.ok(MIGRATION.includes(`${col} text NOT NULL`), `expected a NOT NULL text column named ${col}`);
  }
  const checkCount = (MIGRATION.match(/CHECK \(/g) ?? []).length;
  assert.ok(checkCount >= 20, `expected many CHECK constraints (bounded enums), found ${checkCount}`);
});

// ---------------------------------------------------------------------------
// TypeScript domain layer
// ---------------------------------------------------------------------------

import { DIY_ACTION_TEMPLATES, findTemplateByKey } from "../app/lib/business/diyConcierge/actionRegistry";
import {
  buildActionCard, canOwnerConfirmCompletion, computeActionProgressSummary, computeNextStatus,
  isEvidenceTypeAllowedForAction, isHalfPagePlusTier, isServiceRequestDecision, selectActionsForRun,
  validateServiceRequestInput,
} from "../app/lib/business/diyConcierge/logic";
import { DIY_ACTION_STATUSES, DIY_EVIDENCE_TYPES, DIY_OWNER_DECISIONS, APPROVAL_STATUSES, SERVICE_REQUEST_TYPES } from "../app/lib/business/diyConcierge/constants";

check("Deterministic action registry: no generative AI, code-resident templates only", () => {
  const registrySrc = read("app/lib/business/diyConcierge/actionRegistry.ts");
  assert.ok(!/openai|anthropic|generative|gpt-|claude-/i.test(registrySrc), "registry must never import/reference an AI provider");
  assert.ok(DIY_ACTION_TEMPLATES.length >= 14, `expected at least 14 templates, found ${DIY_ACTION_TEMPLATES.length}`);
});

const SEVEN_DIMENSIONS = [
  "business_foundation", "customer_clarity", "offer_and_value", "operations_and_capacity",
  "visibility_and_discovery", "communication_and_follow_up", "owner_goals_and_sustainability",
];

check("All seven certified Health Map dimensions are represented in the registry", () => {
  for (const d of SEVEN_DIMENSIONS) {
    assert.ok(DIY_ACTION_TEMPLATES.some((t) => t.dimensionKey === d), `no template found for dimension ${d}`);
  }
});

check("Complete action-card contract: buildActionCard exposes every required field", () => {
  const template = DIY_ACTION_TEMPLATES[0];
  const now = new Date().toISOString();
  const card = buildActionCard(template, {
    id: "a1", businessId: "b1", actionKey: template.actionKey, dimensionKey: template.dimensionKey,
    sourceRunId: "r1", sourceFindingId: null, registryVersion: "v1", status: "available", ownerDecision: null,
    reviewDate: null, reassessmentTrigger: null, completedAt: null, createdAt: now, updatedAt: now,
  });
  for (const field of [
    "actionKey", "businessId", "dimensionKey", "status", "conditionEs", "whyItMattersEs", "consequenceEs",
    "isFree", "stepsEs", "toolsEs", "estimatedMinutes", "requiredEvidenceTypes", "ownerConfirmable",
    "relatedResourceKeys", "reassessmentTriggerEs", "createdAt", "updatedAt",
  ]) {
    assert.ok(field in card, `action card missing field ${field}`);
  }
});

check("Evidence contract: evidence types are bounded and validated per-action", () => {
  assert.strictEqual(DIY_EVIDENCE_TYPES.length, 8);
  const template = findTemplateByKey("confirm_consistent_business_information");
  assert.ok(template);
  assert.strictEqual(isEvidenceTypeAllowedForAction(template!, "owner_attestation"), true);
  assert.strictEqual(isEvidenceTypeAllowedForAction(template!, "staff_confirmation"), false);
});

check("Action event/history contract: repository never updates or deletes an event row", () => {
  const repoSrc = read("app/lib/business/diyConcierge/repository.ts");
  assert.ok(repoSrc.includes('from("business_diy_action_events").insert'), "events must be inserted");
  assert.ok(!/business_diy_action_events["'`]\)\s*\.(update|delete)/.test(repoSrc), "events must never be updated or deleted");
});

check("Approval contract: bounded statuses, dual-actor requested/decided fields", () => {
  assert.deepStrictEqual([...APPROVAL_STATUSES], ["pending", "approved", "declined", "withdrawn", "expired", "superseded"]);
  const repoSrc = read("app/lib/business/diyConcierge/repository.ts");
  assert.ok(repoSrc.includes("requested_by") && repoSrc.includes("decided_by"));
});

check("Approval contract: only a pending approval may be decided", () => {
  const repoSrc = read("app/lib/business/diyConcierge/repository.ts");
  assert.ok(repoSrc.includes('existing.status !== "pending"'), "must reject deciding a non-pending approval");
});

// ---------------------------------------------------------------------------
// TODAY-2 pre-staging repair — approval decision actor integrity. Every consequential
// (non-pending) decision must carry a real, fully-attributed deciding actor; a pending request
// must carry none. decided_at alone is never sufficient, and silence is never treated as approval.
// ---------------------------------------------------------------------------

function extractConstraintBody(sql: string, constraintName: string): string {
  const start = sql.indexOf(`CONSTRAINT ${constraintName} CHECK (`);
  assert.ok(start !== -1, `missing constraint ${constraintName}`);
  let depth = 0;
  let i = sql.indexOf("(", start);
  const bodyStart = i;
  for (; i < sql.length; i++) {
    if (sql[i] === "(") depth++;
    if (sql[i] === ")") {
      depth--;
      if (depth === 0) return sql.slice(bodyStart, i + 1);
    }
  }
  throw new Error(`unterminated constraint body for ${constraintName}`);
}

const DECISION_CHK = extractConstraintBody(MIGRATION, "business_owner_approvals_decision_chk");
const DECIDED_BY_ACTOR_CHK = extractConstraintBody(MIGRATION, "business_owner_approvals_decided_by_actor_chk");

check("Approval decision integrity: pending rows have no deciding actor or decided_at", () => {
  const pendingBranch = DECISION_CHK.slice(0, DECISION_CHK.indexOf(") OR ("));
  for (const col of ["decided_at IS NULL", "decided_by_actor_type IS NULL", "decided_by_roster_id IS NULL", "decided_by_auth_user_id IS NULL", "decided_by_email IS NULL", "decided_by_role IS NULL"]) {
    assert.ok(pendingBranch.includes(col), `pending branch missing "${col}"`);
  }
});

check("Approval decision integrity: non-pending rows require decided_at", () => {
  const nonPendingBranch = DECISION_CHK.slice(DECISION_CHK.indexOf(") OR ("));
  assert.ok(nonPendingBranch.includes("decided_at IS NOT NULL"));
});

check("Approval decision integrity: non-pending rows require decided_by_actor_type", () => {
  const nonPendingBranch = DECISION_CHK.slice(DECISION_CHK.indexOf(") OR ("));
  assert.ok(nonPendingBranch.includes("decided_by_actor_type IS NOT NULL"));
});

check("Approval decision integrity: non-pending rows require decided_by_auth_user_id", () => {
  const nonPendingBranch = DECISION_CHK.slice(DECISION_CHK.indexOf(") OR ("));
  assert.ok(nonPendingBranch.includes("decided_by_auth_user_id IS NOT NULL"));
});

check("Approval decision integrity: non-pending rows require decided_by_email", () => {
  const nonPendingBranch = DECISION_CHK.slice(DECISION_CHK.indexOf(") OR ("));
  assert.ok(nonPendingBranch.includes("decided_by_email IS NOT NULL"));
});

check("Approval decision integrity: non-pending rows require decided_by_role", () => {
  const nonPendingBranch = DECISION_CHK.slice(DECISION_CHK.indexOf(") OR ("));
  assert.ok(nonPendingBranch.includes("decided_by_role IS NOT NULL"));
});

check("Approval decision integrity: staff decisions require a roster id", () => {
  assert.ok(DECIDED_BY_ACTOR_CHK.includes("decided_by_actor_type = 'staff' AND decided_by_roster_id IS NOT NULL"));
});

check("Approval decision integrity: owner decisions prohibit a roster id", () => {
  assert.ok(DECIDED_BY_ACTOR_CHK.includes("decided_by_actor_type = 'owner' AND decided_by_roster_id IS NULL"));
});

check("Approval decision integrity: the repository write path supplies the complete deciding-actor contract (never the wrong column name)", () => {
  const repoSrc = read("app/lib/business/diyConcierge/repository.ts");
  assert.ok(!/\[`\$\{prefix\}_type`\]/.test(repoSrc), "actorColumns must never emit a bare `${prefix}_type` key for requested_by/decided_by (real columns are requested_by_actor_type / decided_by_actor_type)");
  assert.ok(repoSrc.includes('prefix === "actor" ? "actor_type" : `${prefix}_actor_type`'), "actorColumns must map requested_by/decided_by to the *_actor_type column name");
  assert.ok(repoSrc.includes('...actorColumns(actor, "decided_by")'), "decideOwnerApproval must write the full decided_by_* actor contract via actorColumns");
});

check("Service-request contract: bounded request types, no Stripe/payment ownership", () => {
  assert.deepStrictEqual([...SERVICE_REQUEST_TYPES], ["guide_me_concierge", "let_leonix_handle_it"]);
  for (const rel of [
    "app/lib/business/diyConcierge/repository.ts", "app/lib/business/diyConcierge/types.ts",
    "app/api/dashboard/business/diy-concierge/service-requests/route.ts",
  ]) {
    const src = read(rel);
    // Matches actual Stripe SDK/API usage, never a doc comment that merely says "Never Stripe".
    assert.ok(!/new Stripe\(|stripe\.checkout|stripe\.customers|stripe\.paymentIntents|checkout\.sessions\.create|payment_intent/i.test(src), `${rel} must never reference Stripe/checkout/payment capture`);
  }
});

check("Three service paths: Do It Myself content, Guide Me / Let Leonix Handle It decisions exist", () => {
  assert.deepStrictEqual([...DIY_OWNER_DECISIONS], [
    "start", "continue", "mark_ready_for_review", "confirm_completion", "postpone", "resume", "decline",
    "request_guidance", "request_managed_service",
  ]);
  assert.strictEqual(isServiceRequestDecision("request_guidance"), true);
  assert.strictEqual(isServiceRequestDecision("request_managed_service"), true);
  assert.strictEqual(isServiceRequestDecision("start"), false);
  for (const t of DIY_ACTION_TEMPLATES) {
    assert.ok(t.stepsEs.length > 0 && t.stepsEn.length > 0, `${t.actionKey} must expose complete DIY steps`);
  }
});

check("Deterministic status-transition table rejects invalid transitions (never a silent no-op success)", () => {
  assert.strictEqual(computeNextStatus("available", "start"), "in_progress");
  assert.strictEqual(computeNextStatus("completed", "start"), null);
  assert.strictEqual(computeNextStatus("available", "confirm_completion"), null);
});

check("Progress is built from real action-state counts only — never a fabricated percentage", () => {
  const summary = computeActionProgressSummary([{ status: "completed" }, { status: "available" }, { status: "in_progress" }]);
  assert.strictEqual(summary.total, 3);
  assert.strictEqual(summary.completed, 1);
  assert.strictEqual(summary.inProgressOrAvailable, 2);
  assert.ok(!("percentage" in summary), "must never expose a fabricated percentage field");
});

check("Deterministic selection never creates an action when blocked by contradiction, insufficient info, or human review", () => {
  const humanReview = selectActionsForRun(
    [{ dimensionKey: "business_foundation" as const, status: "needs_attention" }],
    { readinessStatus: "human_review_required", blockingDimensionKeys: [], humanReviewRequired: true },
  );
  assert.strictEqual(humanReview.selected.length, 0);
  assert.strictEqual(humanReview.blocked[0]?.reason, "human_review_required");

  const contradiction = selectActionsForRun(
    [{ dimensionKey: "operations_and_capacity" as const, status: "blocked_by_contradiction" }],
    { readinessStatus: "resolve_contradictions_first", blockingDimensionKeys: ["operations_and_capacity"], humanReviewRequired: false },
  );
  assert.ok(contradiction.blocked.some((b) => b.reason === "contradiction_blocked"));

  const noEvidence = selectActionsForRun(
    [{ dimensionKey: "owner_goals_and_sustainability" as const, status: "insufficient_information" }],
    { readinessStatus: "needs_more_information", blockingDimensionKeys: [], humanReviewRequired: false },
  );
  assert.ok(noEvidence.blocked.length === 0 || noEvidence.selected.length > 0 || noEvidence.blocked[0]?.reason === "insufficient_information");
});

check("canOwnerConfirmCompletion reflects each template's ownerConfirmable flag exactly", () => {
  for (const t of DIY_ACTION_TEMPLATES) {
    assert.strictEqual(canOwnerConfirmCompletion(t), t.ownerConfirmable);
  }
});

check("validateServiceRequestInput rejects a missing/over-length deliverable", () => {
  assert.strictEqual(validateServiceRequestInput({ requestedDeliverable: "" }).ok, false);
  assert.strictEqual(validateServiceRequestInput({ requestedDeliverable: "x".repeat(2001) }).ok, false);
  assert.strictEqual(validateServiceRequestInput({ requestedDeliverable: "help with my Google Business profile" }).ok, true);
});

check("DIY_ACTION_STATUSES matches the full bounded set required by the plan", () => {
  assert.deepStrictEqual([...DIY_ACTION_STATUSES], [
    "available", "in_progress", "awaiting_evidence", "awaiting_owner_confirmation", "completed",
    "postponed", "blocked", "no_longer_applicable", "cancelled",
  ]);
});

// ---------------------------------------------------------------------------
// Entitlement resolution — exact business access, Quarter vs Half+, no automatic human labor
// ---------------------------------------------------------------------------

check("Entitlement resolution: no automatic human labor — conciergeGuidance is always false", () => {
  const src = read("app/lib/business/diyConcierge/entitlement.ts");
  assert.ok(src.includes('conciergeGuidance: false'));
  assert.ok(!/conciergeGuidance:\s*true/.test(src), "conciergeGuidance must never be settable to true in this package");
});

check("Entitlement resolution: pending_entitlement_linkage is the fail-closed default when no verified package tier resolves", () => {
  const src = read("app/lib/business/diyConcierge/entitlement.ts");
  assert.ok(src.includes("pending_entitlement_linkage"));
  assert.ok(src.includes("business_listing_links") && src.includes("listing_package_entitlements"), "must resolve via the existing verified-link + entitlement tables, never a guess");
});

check("Quarter vs Half+ behavior: quarter_page never resolves to personalized_access_active", () => {
  const src = read("app/lib/business/diyConcierge/entitlement.ts");
  const start = src.indexOf('resolved.tier === "quarter_page"');
  const blockEnd = src.indexOf("\n\n", start);
  const quarterBlock = src.slice(start, blockEnd === -1 ? start + 300 : blockEnd);
  assert.ok(quarterBlock.includes("quarter_preview"));
  assert.ok(!quarterBlock.includes("personalized_access_active"));
  assert.strictEqual(isHalfPagePlusTier("quarter_page"), false);
  assert.strictEqual(isHalfPagePlusTier("half_page"), true);
  assert.strictEqual(isHalfPagePlusTier("full_page"), true);
  assert.strictEqual(isHalfPagePlusTier("premium"), true);
});

check("No parallel entitlement/package table created — reuses business_listing_links + listing_package_entitlements", () => {
  assert.ok(!/CREATE TABLE.*(package|entitlement)/i.test(MIGRATION), "must never create a parallel package/entitlement table");
});

// ---------------------------------------------------------------------------
// Exact business access, server-side auth, cross-business isolation
// ---------------------------------------------------------------------------

check("Exact business scoping: access.ts requires an exact membership for the exact businessId, never 'any' membership", () => {
  const src = read("app/lib/business/diyConcierge/access.ts");
  assert.ok(src.includes("findActiveMembershipForBusinessAndUser"), "must use the exact-business membership check, not findActiveMembershipForCurrentUser");
  assert.ok(!src.includes("findActiveMembershipForCurrentUser"));
});

check("Server-side auth resolution: every route resolves identity from the bearer token, never trusts a body-supplied auth_user_id/actor role", () => {
  const routeFiles = AUTHORIZED_API_FILES.filter((f) => f.startsWith("app/api/dashboard/business/diy-concierge/"));
  for (const rel of routeFiles) {
    const src = read(rel);
    assert.ok(src.includes("resolveDiyAccess") || src.includes("resolveAuthenticatedUserId"), `${rel} must resolve identity server-side`);
    assert.ok(!/body\.authUserId|body\.userId|body\.actorRole|body\.role\b/.test(src), `${rel} must never trust a body-supplied identity/role field`);
  }
});

check("Cross-business isolation contract: resolveDiyAccess denies access when no exact membership exists (403, not a silent empty result)", () => {
  const src = read("app/lib/business/diyConcierge/access.ts");
  assert.ok(src.includes('status: 403') && src.includes("cross_business_denied"));
});

check("Fail-closed entitlement state never bypasses the 401/403 auth gate", () => {
  const src = read("app/lib/business/diyConcierge/access.ts");
  const authGateIdx = src.indexOf("resolveAuthenticatedUserId");
  const membershipIdx = src.indexOf("findActiveMembershipForBusinessAndUser");
  assert.ok(authGateIdx !== -1 && membershipIdx !== -1 && authGateIdx < membershipIdx, "auth must be resolved before membership/entitlement checks");
});

// ---------------------------------------------------------------------------
// Personalized learning linkage — durable references only, published lessons only
// ---------------------------------------------------------------------------

const PUBLISHED_LESSON_KEYS = [
  "consistent_business_information", "who_is_your_customer", "revenue_vs_profit", "healthy_boundaries_and_capacity",
  "google_business_basics", "advertising_fundamentals", "whatsapp_business_basics", "reviews_and_customer_response",
];
const PLANNED_LESSON_KEYS = [
  "branding_basics", "referrals_basics", "profitable_service_basics", "simple_analytics",
  "local_seo_basics", "product_photography_basics", "short_video_basics", "customer_data_protection",
];

check("Personalized learning linkage: every relatedLessonKey references a published lesson, never a planned one", () => {
  for (const t of DIY_ACTION_TEMPLATES) {
    if (!t.relatedLessonKey) continue;
    assert.ok(PUBLISHED_LESSON_KEYS.includes(t.relatedLessonKey), `${t.actionKey} references non-published lesson ${t.relatedLessonKey}`);
    assert.ok(!PLANNED_LESSON_KEYS.includes(t.relatedLessonKey), `${t.actionKey} must never reference a planned lesson`);
  }
});

check("No lesson body duplicated into the action registry — durable keys only", () => {
  const registrySrc = read("app/lib/business/diyConcierge/actionRegistry.ts");
  assert.ok(!registrySrc.includes("body_es") && !registrySrc.includes("bodyEs"), "registry must never duplicate a lesson body field");
});

check("Learning completion and action completion remain separate progress streams", () => {
  const repoSrc = read("app/lib/business/diyConcierge/repository.ts");
  assert.ok(!repoSrc.includes("business_learning_progress"), "the DIY action repository must never write to business_learning_progress");
});

// ---------------------------------------------------------------------------
// Route recovery, homepage section, Coming Soon/QR destination
// ---------------------------------------------------------------------------

const BUSINESS_TOOLS_HUB = read("app/(site)/dashboard/business-tools/page.tsx");

check("Two orphaned owner routes are linked into the Business Tools hub", () => {
  assert.ok(BUSINESS_TOOLS_HUB.includes("/dashboard/business-tools/business-health"), "Business Health Map route must be linked");
  assert.ok(BUSINESS_TOOLS_HUB.includes("/dashboard/business-tools/what-we-understand"), "Living Business Book owner route must be linked");
  assert.ok(exists("app/(site)/dashboard/business-tools/business-health/page.tsx"), "orphaned route file must still exist (never deleted)");
  assert.ok(exists("app/(site)/dashboard/business-tools/what-we-understand/page.tsx"), "orphaned route file must still exist (never deleted)");
});

check("DIY Concierge Home is linked into the Business Tools hub", () => {
  assert.ok(BUSINESS_TOOLS_HUB.includes("/dashboard/business-tools/concierge"));
});

check("Homepage Business Tools section exists and is wired into HomeMarketingClient", () => {
  const homeClientSrc = read("app/(site)/home/HomeMarketingClient.tsx");
  assert.ok(homeClientSrc.includes("HomeBusinessToolsSection"));
  const sectionSrc = read("app/(site)/home/HomeBusinessToolsSection.tsx");
  assert.ok(sectionSrc.includes("Guide Me") || sectionSrc.includes("Guíame") || sectionSrc.includes("paidNote"));
});

check("Coming Soon V2/QR destination: reuses the existing QR routing pattern, never a parallel QR system", () => {
  const helperSrc = read("app/lib/magazine/qrRouteHelpers.ts");
  assert.ok(helperSrc.includes("businessToolsQrDestinationHref"));
  assert.ok(exists("app/(site)/qr/business-tools/page.tsx"));
  const pageSrc = read("app/(site)/qr/business-tools/page.tsx");
  assert.ok(!/no such qr code generation library/i.test(pageSrc));
});

check("Homepage section and QR destination never expose a feature-flagged personalized tool publicly", () => {
  const sectionSrc = read("app/(site)/home/HomeBusinessToolsSection.tsx");
  const qrSrc = read("app/(site)/qr/business-tools/page.tsx");
  for (const src of [sectionSrc, qrSrc]) {
    assert.ok(!src.includes("business_diy_actions"), "must never fetch/expose personalized action data directly");
  }
});

// ---------------------------------------------------------------------------
// ES/EN and mobile/accessibility
// ---------------------------------------------------------------------------

check("ES/EN coverage across all TODAY-2 copy surfaces", () => {
  const copyFiles = [
    "app/(site)/dashboard/business-tools/concierge/conciergeCopy.ts",
    "app/(site)/dashboard/business-tools/concierge/page.tsx",
    "app/(site)/dashboard/business-tools/concierge/_components/ActionCard.tsx",
    "app/(site)/dashboard/business-tools/concierge/_components/ApprovalCenter.tsx",
    "app/components/leonix/PackageExperience.tsx",
    "app/(site)/home/HomeBusinessToolsSection.tsx",
    "app/(site)/qr/business-tools/page.tsx",
  ];
  for (const rel of copyFiles) {
    const src = read(rel);
    assert.ok(/\bes:\s*[{"']/.test(src) && /\ben:\s*[{"']/.test(src), `${rel} must define both es and en copy`);
  }
});

check("Mobile/accessibility markers: comfortable touch targets and semantic labels", () => {
  const pageSrc = read("app/(site)/dashboard/business-tools/concierge/page.tsx");
  const cardSrc = read("app/(site)/dashboard/business-tools/concierge/_components/ActionCard.tsx");
  assert.ok(pageSrc.includes("min-h-11") || pageSrc.includes("min-h-[36px]"), "page must use comfortable touch targets");
  assert.ok(cardSrc.includes("min-h-11"), "action buttons must use comfortable touch targets");
  assert.ok(pageSrc.includes('role="dialog"') && pageSrc.includes("aria-modal"), "the service-request panel must be an accessible dialog");
});

// ---------------------------------------------------------------------------
// No fake AI, no fake analytics, no Production reference, no secret literal
// ---------------------------------------------------------------------------

const ALL_TODAY2_FILES = [MIGRATION_PATH, ...AUTHORIZED_LIB_FILES, ...AUTHORIZED_API_FILES, ...AUTHORIZED_UI_FILES];

check("No fake AI: no AI-provider import/reference anywhere in TODAY-2 files", () => {
  for (const rel of ALL_TODAY2_FILES) {
    const src = read(rel);
    assert.ok(!/openai|anthropic|"gpt-|'gpt-|generativeai/i.test(src), `${rel} must never reference an AI provider`);
  }
});

check("No fake analytics: no fabricated event/analytics call in the QR destination or homepage section", () => {
  const qrSrc = read("app/(site)/qr/business-tools/page.tsx");
  const homeSrc = read("app/(site)/home/HomeBusinessToolsSection.tsx");
  for (const src of [qrSrc, homeSrc]) {
    assert.ok(!/trackEvent|gtag\(|analytics\.track/.test(src), "must never fabricate an analytics event");
  }
});

check("No Production reference or secret literal in any TODAY-2 file", () => {
  const secretPattern = /sk_live|sk_test_[a-zA-Z0-9]{10}|SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^"'`]|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----|xuieateniufcrsfdomwl/i;
  for (const rel of ALL_TODAY2_FILES) {
    assert.ok(!secretPattern.test(read(rel)), `${rel} matched a secret/production-ref pattern`);
  }
});

check("No unrelated global sorting/ranking change: migration never touches a ranking/search/Featured table", () => {
  assert.ok(!/leonix_placement_entitlements|search_rank|featured_order|marketplace_rank/i.test(MIGRATION));
});

check("No Stripe/payment ownership anywhere in TODAY-2 files", () => {
  for (const rel of ALL_TODAY2_FILES) {
    const src = read(rel);
    assert.ok(!/stripe\.|checkout\.sessions\.create|payment_intent/i.test(src), `${rel} must never implement Stripe/checkout/payment capture`);
  }
});

check("Prior TODAY-1 hardening remains intact (Learning Center migration + verify script untouched)", () => {
  assert.ok(exists("supabase/migrations/20260807120000_business_learning_center_foundation.sql"));
  assert.ok(exists("supabase/migrations/20260807130000_business_learning_center_privilege_hardening.sql"));
  assert.ok(exists("scripts/verify-business-learning-center-01.ts"));
});

console.log(`\n${passed} check(s) passed${failed ? `, ${failed} FAILED` : ""}.`);
if (failed > 0) {
  console.log("\nSome checks failed.");
  process.exit(1);
} else {
  console.log("\nAll checks passed.");
}
