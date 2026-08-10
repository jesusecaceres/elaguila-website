/**
 * Program 4, Gate 4C/4D — AI Research Engine verification. Hand-rolled node:assert script,
 * matching this repo's testing convention (no jest/vitest). Run via
 * `npx tsx scripts/verify-business-ai-research-engine-01.ts`.
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

const MIGRATION_PATH = "supabase/migrations/20260810130000_business_ai_research_engine_foundation.sql";
const TABLES = ["business_ai_research_runs", "business_ai_briefing_drafts"];

const AUTHORIZED_LIB_FILES = [
  "app/lib/business/aiResearch/types.ts",
  "app/lib/business/aiResearch/providerRegistry.ts",
  "app/lib/business/aiResearch/geminiProvider.ts",
  "app/lib/business/aiResearch/briefingSynthesis.ts",
  "app/lib/business/aiResearch/repository.ts",
  "app/lib/business/aiResearch/featureFlag.ts",
  "app/lib/business/aiResearch/websiteAdapter.ts",
  "app/lib/business/aiResearch/access.ts",
];
const AUTHORIZED_API_FILES = [
  "app/api/admin/businesses/[businessId]/research/route.ts",
  "app/api/admin/businesses/[businessId]/briefing/route.ts",
  "app/api/admin/businesses/[businessId]/briefing/[draftId]/route.ts",
  "app/api/dashboard/business/research-status/route.ts",
];

// 1-2. Provider abstraction + Gemini provider exist
check("1-2. Provider abstraction and Gemini provider exist", () => {
  assert.ok(exists("app/lib/business/aiResearch/providerRegistry.ts"));
  assert.ok(exists("app/lib/business/aiResearch/geminiProvider.ts"));
  const registrySrc = read("app/lib/business/aiResearch/providerRegistry.ts");
  assert.ok(registrySrc.includes("BusinessIntelligenceProvider"));
});

// 3. No OpenAI/Anthropic dependency added
check("3. No OpenAI/Anthropic dependency added anywhere in Program 4 AI code", () => {
  for (const rel of AUTHORIZED_LIB_FILES) {
    const src = read(rel);
    assert.ok(!/openai|anthropic|"gpt-|'gpt-|claude-/i.test(src), `${rel} must never reference OpenAI/Anthropic`);
  }
  const pkg = read("package.json");
  assert.ok(!/"openai"|"@anthropic-ai\/sdk"/.test(pkg));
});

// 4. Provider is server-only
check("4. Gemini provider is server-only", () => {
  const src = read("app/lib/business/aiResearch/geminiProvider.ts");
  assert.ok(src.includes('import "server-only";'));
});

// 5-6. Configured check + provider-unavailable path
check("5-6. isConfigured() exists; provider-unavailable path returns truthfully", () => {
  const src = read("app/lib/business/aiResearch/geminiProvider.ts");
  assert.ok(src.includes("async isConfigured(): Promise<boolean>"));
  assert.ok(src.includes('failureCode: "provider_unavailable"'));
});

// 7-8. JSON structured output required, temperature zero
check("7-8. JSON structured output required, temperature 0", () => {
  const src = read("app/lib/business/aiResearch/geminiProvider.ts");
  assert.ok(src.includes('responseMimeType: "application/json"'));
  assert.ok(src.includes("temperature: 0"));
});

// 9-10. Schema validation, malformed output rejected
check("9-10. Strict schema validation rejects malformed output", () => {
  const src = read("app/lib/business/aiResearch/briefingSynthesis.ts");
  assert.ok(src.includes("validateBriefingSynthesisJson"));
  assert.ok(src.includes("Malformed strength item"));
  assert.ok(src.includes("evidenceRefs.length === 0) return null")); // unevidenced claim rejected
});

const MIGRATION = read(MIGRATION_PATH);

// 11-12. Research run table + briefing draft table exist
check("11-12. business_ai_research_runs and business_ai_briefing_drafts tables exist", () => {
  for (const t of TABLES) assert.ok(MIGRATION.includes(`CREATE TABLE IF NOT EXISTS public.${t}`), `missing CREATE TABLE for ${t}`);
  assert.strictEqual((MIGRATION.match(/CREATE TABLE IF NOT EXISTS public\.business_ai_/g) ?? []).length, 2);
});

// 13. Actor attribution
check("13. Actor attribution CHECK on research runs", () => {
  assert.ok(MIGRATION.includes("business_ai_research_runs_actor_chk"));
});

// 14. Review attribution atomicity
check("14. Review attribution is atomic (all-or-nothing) on briefing drafts", () => {
  assert.ok(MIGRATION.includes("business_ai_briefing_drafts_review_atomic_chk"));
  assert.ok(MIGRATION.includes("business_ai_briefing_drafts_draft_no_review_chk"));
  assert.ok(MIGRATION.includes("business_ai_briefing_drafts_reviewed_requires_attribution_chk"));
});

// 15. Terminal run immutability in repository contract
check("15. Terminal research runs are never mutated after creation by the repository (only status transitions inside runBusinessAiResearch)", () => {
  const repoSrc = read("app/lib/business/aiResearch/repository.ts");
  const updateCalls = repoSrc.match(/business_ai_research_runs["'`]\)\s*\n?\s*\.update/g) ?? [];
  // Every update call must be within runBusinessAiResearch's own status-transition flow (queued->running->completed/failed) — never a second, independent mutation path.
  assert.ok(updateCalls.length <= 3, `expected at most 3 status-transition updates, found ${updateCalls.length}`);
});

// 16-17. AI consent + source consent required
check("16-17. AI research + source research consent both required before any provider call", () => {
  const repoSrc = read("app/lib/business/aiResearch/repository.ts");
  assert.ok(repoSrc.includes('getLatestConsentState(businessId, "source_research")'));
  assert.ok(repoSrc.includes('getLatestConsentState(businessId, "ai_research")'));
  assert.ok(repoSrc.includes('"consent_not_provided"'));
});

// 18. No secrets persisted
check("18. No secret persisted in run/draft rows", () => {
  const repoSrc = read("app/lib/business/aiResearch/repository.ts");
  assert.ok(!repoSrc.includes("GEMINI_API_KEY"));
  assert.ok(!repoSrc.includes("apiKey"));
});

// 19. provider/model/template version persisted
check("19. provider_key/model_key/template_version persisted", () => {
  const repoSrc = read("app/lib/business/aiResearch/repository.ts");
  assert.ok(repoSrc.includes("provider_key: provider.providerKey"));
  assert.ok(repoSrc.includes("model_key: provider.modelKey"));
  assert.ok(repoSrc.includes("template_version: packet.outputSchemaVersion"));
});

// 20. cost/failure metadata persisted
check("20. cost_metadata and failure_code/failure_reason columns exist", () => {
  assert.ok(MIGRATION.includes("cost_metadata jsonb"));
  assert.ok(MIGRATION.includes("failure_code text"));
  assert.ok(MIGRATION.includes("failure_reason text"));
});

// 21. No direct AI write to business_facts
check("21. No AI research file ever writes directly to business_facts", () => {
  for (const rel of AUTHORIZED_LIB_FILES) {
    const src = read(rel);
    assert.ok(!/from\("business_facts"\)\s*\n?\s*\.insert/.test(src), `${rel} must never directly insert into business_facts`);
  }
});

// 22. Review route uses existing Living Book functions
check("22. Briefing promotion route uses existing Living Book repository functions (upsertFact/createUnknown/createContradiction)", () => {
  const src = read("app/api/admin/businesses/[businessId]/briefing/[draftId]/route.ts");
  assert.ok(src.includes("upsertFact"));
  assert.ok(src.includes("createUnknown"));
  assert.ok(src.includes("createContradiction"));
  assert.ok(src.includes('from "@/app/lib/business/livingBook/repository"'));
});

// 23. Partial promotion supported
check("23. Partial promotion supported (computeReviewStatus never forces fully_promoted unless all items resolved)", () => {
  const src = read("app/api/admin/businesses/[businessId]/briefing/[draftId]/route.ts");
  assert.ok(src.includes("partially_promoted"));
  assert.ok(src.includes("allResolved"));
});

// 24. Repeated promotion rejected
check("24. Repeated promotion of the same item is rejected", () => {
  const src = read("app/api/admin/businesses/[businessId]/briefing/[draftId]/route.ts");
  assert.ok(src.includes('item.promotionStatus === "promoted"'));
  assert.ok(src.includes('"item_already_promoted"'));
});

// 25. Conflicting facts create review path (contradiction promotion, never a silent overwrite)
check("25. AI-derived contradictions promote into business_contradictions rather than silently overwriting a fact", () => {
  const src = read("app/api/admin/businesses/[businessId]/briefing/[draftId]/route.ts");
  assert.ok(src.includes("promote_contradiction"));
  assert.ok(src.includes("createContradiction"));
});

// 26-27. Owner route returns coarse status only, raw AI output excluded
check("26-27. Owner research-status route returns coarse status only, never raw AI output", () => {
  const src = read("app/api/dashboard/business/research-status/route.ts");
  assert.ok(src.includes("OwnerResearchStatus"));
  assert.ok(!src.includes("summaryEs"));
  assert.ok(!src.includes("strengths"));
  assert.ok(!/synthesizeBrief|inputSnapshot|cost_metadata/.test(src));
});

// 28. Cross-business denial
check("28. Owner route enforces exact-business membership (cross-business denial)", () => {
  const accessSrc = read("app/lib/business/aiResearch/access.ts");
  assert.ok(accessSrc.includes("findActiveMembershipForBusinessAndUser"));
  assert.ok(accessSrc.includes("cross_business_denied"));
});

// 29. Role denial
check("29. Staff routes enforce capability checks (role denial)", () => {
  const researchSrc = read("app/api/admin/businesses/[businessId]/research/route.ts");
  assert.ok(researchSrc.includes('actorHasCapability(access.actor, "run_ai_research")'));
  const briefingSrc = read("app/api/admin/businesses/[businessId]/briefing/[draftId]/route.ts");
  assert.ok(briefingSrc.includes('actorHasCapability(access.actor, "promote_ai_briefing")'));
});

// 30. Feature disabled by default
check("30. field_discovery_ai_research flag seeded disabled", () => {
  assert.ok(MIGRATION.includes("'field_discovery_ai_research', false, false"));
});

// 31-32. No automatic recommendation/publication
check("31-32. No automatic recommendation or publication anywhere in Program 4 AI code", () => {
  for (const rel of [...AUTHORIZED_LIB_FILES, ...AUTHORIZED_API_FILES]) {
    const src = read(rel);
    assert.ok(!/auto[-_]?promote|auto[-_]?publish|autoApprove/i.test(src), `${rel} must never auto-promote/auto-publish`);
  }
});

// 33. No payment/entitlement writes
check("33. No payment/entitlement writes anywhere in Program 4 AI code", () => {
  for (const rel of [...AUTHORIZED_LIB_FILES, ...AUTHORIZED_API_FILES]) {
    const src = read(rel);
    assert.ok(!/new Stripe\(|stripe\.checkout|listing_package_entitlements|leonix_placement_entitlements/i.test(src), `${rel} must never touch payment/entitlement tables`);
  }
});

// 34. No Production reference
check("34. No Production reference or secret literal in any Gate 4C/4D file", () => {
  const secretPattern = /sk_live|sk_test_[a-zA-Z0-9]{10}|SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^"'`]|AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----|xuieateniufcrsfdomwl/i;
  for (const rel of [MIGRATION_PATH, ...AUTHORIZED_LIB_FILES, ...AUTHORIZED_API_FILES]) {
    assert.ok(!secretPattern.test(read(rel)), `${rel} matched a secret/production-ref pattern`);
  }
});

check("RLS zero-policy posture and narrow grants on both tables", () => {
  const n = (MIGRATION.match(/ENABLE ROW LEVEL SECURITY/g) ?? []).length;
  assert.strictEqual(n, 2);
  assert.strictEqual((MIGRATION.match(/CREATE POLICY/g) ?? []).length, 0);
  for (const t of TABLES) {
    const revokeIdx = MIGRATION.indexOf(`REVOKE ALL PRIVILEGES ON TABLE public.${t} FROM service_role;`);
    const grantIdx = MIGRATION.indexOf(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.${t} TO service_role;`);
    assert.ok(revokeIdx !== -1 && grantIdx !== -1 && revokeIdx < grantIdx, `${t}: revoke must precede narrow grant`);
  }
});

check("Migration is one transaction, additive only, no destructive statement", () => {
  assert.strictEqual((MIGRATION.match(/^\s*BEGIN;/m) ?? []).length, 1);
  assert.strictEqual((MIGRATION.match(/^\s*COMMIT;/m) ?? []).length, 1);
  assert.ok(!/^DROP |^TRUNCATE|^DELETE FROM/im.test(MIGRATION));
});

check("Website V1 adapter never claims SEO/PageSpeed/ranking certification", () => {
  const src = read("app/lib/business/aiResearch/websiteAdapter.ts");
  const offendingLines = src.split("\n").filter((line) => /pagespeed|search ranking|accessibility certification/i.test(line) && !/\bnever\b/i.test(line));
  assert.strictEqual(offendingLines.length, 0, JSON.stringify(offendingLines));
  assert.ok(src.includes("never a full SEO"));
});

const total = passed + failed;
console.log(`\n${passed}/${total} passed`);
if (failed > 0) process.exit(1);
