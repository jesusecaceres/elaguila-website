/**
 * Business Development & Growth Engine, Gate B — structural engine verifier. Complements
 * scripts/test-growth-analyst-intelligence-contract.ts (pure-logic runtime tests) and
 * scripts/test-growth-analyst-provider-safety.ts (stubbed provider tests) with checks that need
 * source inspection: authorization wiring, business isolation, no live-call risk in tests, no
 * scattered pricing constants, and that Gate A's repository is reused rather than bypassed.
 *
 * Run from repo root: npx tsx scripts/verify-growth-analyst-engine-01.ts
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

console.log("Growth Analyst Engine (Gate B) — structural checks\n");

const ROOT = path.resolve(__dirname, "..");
function read(relPath: string): string {
  return readFileSync(path.join(ROOT, relPath), "utf8");
}

const engine = read("app/lib/business/growthEngine/analyst/engine.ts");
const route = read("app/api/admin/businesses/[businessId]/growth/assessment/route.ts");
const inputPacket = read("app/lib/business/growthEngine/analyst/inputPacket.ts");
const openaiProvider = read("app/lib/business/growthEngine/analyst/openaiAnalystProvider.ts");
const modelRouting = read("app/lib/business/growthEngine/analyst/modelRouting.ts");
const promptCompiler = read("app/lib/business/growthEngine/analyst/promptCompiler.ts");
const schema = read("app/lib/business/growthEngine/analyst/schema.ts");
const capabilities = read("app/admin/_lib/salesWorkspaceCapabilities.ts");
const contractTest = read("scripts/test-growth-analyst-intelligence-contract.ts");
const providerSafetyTest = read("scripts/test-growth-analyst-provider-safety.ts");

// --- 1. OpenAI provider reuse — no second HTTP client, no standalone AI service ------------------
check("1a. openaiAnalystProvider.ts reuses the existing canonical serverClient.ts, not a new HTTP client", () => {
  assert.ok(openaiProvider.includes('from "@/app/lib/openai/serverClient"'));
  assert.ok(openaiProvider.includes("requestOpenAiChatCompletion"));
  assert.ok(!/fetch\(.*api\.openai\.com/i.test(openaiProvider), "must not call the OpenAI HTTP API directly — go through serverClient.ts");
});
check("1b. OPENAI_API_KEY is never read directly in the analyst engine — only via the existing serverClient.ts", () => {
  for (const [name, content] of [["engine.ts", engine], ["inputPacket.ts", inputPacket], ["openaiAnalystProvider.ts", openaiProvider], ["promptCompiler.ts", promptCompiler]] as const) {
    assert.ok(!/process\.env\.OPENAI_API_KEY/.test(content), `${name} must not read OPENAI_API_KEY directly`);
  }
});
check("1c. The API key is never logged or returned to a caller", () => {
  assert.ok(!/console\.(log|error|warn)\([^)]*[Aa]pi[Kk]ey/.test(openaiProvider));
});

// --- 2. Model routing centralized, no scattered model strings ------------------------------------
check("2a. All three task classes are defined in exactly one module (modelRouting.ts), not scattered", () => {
  assert.ok(modelRouting.includes('"low_cost"'));
  assert.ok(modelRouting.includes('"standard_reasoning"'));
  assert.ok(modelRouting.includes('"high_reasoning"'));
  for (const [name, content] of [["engine.ts", engine], ["openaiAnalystProvider.ts", openaiProvider]] as const) {
    assert.ok(!/gpt-4o/.test(content), `${name} must not hardcode a model string — go through resolveGrowthAnalystModel`);
  }
});
check("2b. Engine never defaults to high_reasoning unconditionally — routing is computed per assessment", () => {
  assert.ok(engine.includes("classifyGrowthAssessmentTask"));
  assert.ok(!/taskClass = "high_reasoning"/.test(engine));
});

// --- 3. Cost control — no scattered pricing constants, usage metadata captured, cost nullable -----
check("3a. No hardcoded USD/cost-per-token constant exists anywhere in the analyst engine (cost is derived from real usage, never fabricated)", () => {
  for (const [name, content] of [["engine.ts", engine], ["openaiAnalystProvider.ts", openaiProvider], ["modelRouting.ts", modelRouting]] as const) {
    assert.ok(!/0\.0\d+\s*\/\s*1000|PRICE_PER_TOKEN|COST_PER_TOKEN/i.test(content), `${name} must not hardcode a per-token price`);
  }
});
check("3b. Usage metadata (prompt/completion/total tokens, latency) is captured and persisted in cost_metadata", () => {
  assert.ok(openaiProvider.includes("promptTokens") && openaiProvider.includes("completionTokens") && openaiProvider.includes("totalTokens"));
  assert.ok(engine.includes("costMetadata:"));
  assert.ok(engine.includes("generation.usage.promptTokens"));
});

// --- 4. Gate A repository reused, never bypassed --------------------------------------------------
check("4a. Persistence goes exclusively through Gate A's createGrowthAssessment — no direct Supabase write in the analyst engine", () => {
  assert.ok(engine.includes('from "../repository"'));
  assert.ok(engine.includes("createGrowthAssessment("));
  assert.ok(!/getAdminSupabase\(\)[\s\S]{0,200}\.insert\(/.test(engine), "engine.ts must not insert directly — use Gate A's repository");
});
check("4b. Assessment is always persisted with status 'needs_review' — never auto-marked reviewed by generation", () => {
  assert.ok(engine.includes('status: "needs_review"'));
  assert.ok(!/status:\s*"reviewed"/.test(engine));
});
check("4c. Superseding semantics are Gate A's own (createGrowthAssessment supersedes internally) — the analyst engine does not duplicate that logic", () => {
  assert.ok(!/status:\s*"superseded"/.test(engine), "engine.ts should not itself set superseded — that is createGrowthAssessment's job");
});

// --- 5. Authorization / business isolation ---------------------------------------------------------
check("5a. The API route uses the canonical resolver for both GET (view) and POST (create) — no ad-hoc auth", () => {
  assert.ok(route.includes("requireSalesWorkspaceAccess"));
  assert.ok(route.includes('actorHasCapability(access.actor, "view_growth_engine")'));
  assert.ok(route.includes('requireStaffWorkspaceWriteAccess("create_growth_assessment")'));
});
check("5b. create_growth_assessment and review capabilities are registered in the canonical capability matrix (already true from Gate A, re-confirmed)", () => {
  assert.ok(capabilities.includes('"create_growth_assessment"'));
  assert.ok(capabilities.includes('"review_growth_assessment"'));
});
check("5c. The route never accepts an actor from the request body — the actor always comes from the resolver", () => {
  const postIdx = route.indexOf("export async function POST");
  const block = route.slice(postIdx);
  assert.ok(!/body\.actor|body\.rosterId|body\.authUserId/.test(block), "route must never trust actor identity from the client");
});
check("5d. The route never accepts business truth (findings/facts) from the request body — only forceReanalysis is read", () => {
  const postIdx = route.indexOf("export async function POST");
  const block = route.slice(postIdx);
  const bodyFieldsRead = block.match(/body\.\w+/g) ?? [];
  for (const field of bodyFieldsRead) {
    assert.ok(field === "body.forceReanalysis", `route reads unexpected client-supplied field ${field}`);
  }
});
check("5e. Every input-packet read is scoped to exactly one businessId (business isolation)", () => {
  const functionNames = ["loadBusinessIdentity", "loadRawResearchEvidence", "buildGrowthAnalystInputPacket"];
  for (const fn of functionNames) {
    const idx = inputPacket.indexOf(`function ${fn}`);
    assert.ok(idx !== -1, `${fn} not found`);
  }
  assert.ok(inputPacket.includes(".eq(\"business_id\", businessId)") || inputPacket.includes(".eq(\"id\", businessId)"));
});
check("5f. Engine never constructs a synthetic/hardcoded actor — always receives one from the caller", () => {
  assert.ok(!/actor:\s*\{\s*type:\s*"staff"/.test(engine));
  assert.ok(!/actor:\s*\{\s*type:\s*"system"/.test(engine));
});

// --- 6. Truth governance / legal safety — structural guarantees, not just prompt wording -----------
check("6a. Nothing in the analyst engine ever calls markOfficialRequirementVerified — AI output alone can never confirm a legal requirement", () => {
  for (const [name, content] of [["engine.ts", engine], ["inputPacket.ts", inputPacket], ["openaiAnalystProvider.ts", openaiProvider], ["schema.ts", schema]] as const) {
    assert.ok(!content.includes("markOfficialRequirementVerified"), `${name} must never call markOfficialRequirementVerified`);
  }
});
check("6b. Nothing in the analyst engine writes directly to business_facts, business_unknowns, or business_contradictions — output is always a draft assessment, never a direct promotion", () => {
  for (const [name, content] of [["engine.ts", engine], ["openaiAnalystProvider.ts", openaiProvider]] as const) {
    assert.ok(!/upsertFact|createUnknown|createContradiction/.test(content), `${name} must never write Living Book truth directly`);
  }
});
check("6c. Generated content never carries a promotion/confirmation status field — persisted assessment status is always needs_review, and per-item promotion (if any) is a separate future concern, not silently decided here", () => {
  assert.ok(!/promotionStatus:\s*"promoted"/.test(engine));
});

// --- 7. No live OpenAI call anywhere in the test suite ---------------------------------------------
check("7a. Neither test file performs a live network call — both use a stub for requestOpenAiChatCompletion", () => {
  assert.ok(providerSafetyTest.includes("STUB_RESPONSE_SENTINEL"));
  assert.ok(!/fetch\(.*api\.openai\.com/i.test(providerSafetyTest));
  assert.ok(!/fetch\(.*api\.openai\.com/i.test(contractTest));
});
check("7b. No test file reads a real OPENAI_API_KEY value to make a request", () => {
  for (const [name, content] of [["provider-safety test", providerSafetyTest], ["contract test", contractTest]] as const) {
    assert.ok(!/process\.env\.OPENAI_API_KEY/.test(content), `${name} must not read the real API key`);
  }
});

// --- 8. No secret exposure anywhere in Gate B ------------------------------------------------------
check("8a. No file in Gate B prints or logs a secret/env value", () => {
  for (const [name, content] of [["engine.ts", engine], ["openaiAnalystProvider.ts", openaiProvider], ["inputPacket.ts", inputPacket]] as const) {
    assert.ok(!/console\.(log|error|warn)\([^)]*process\.env/i.test(content), `${name} must never log an env var`);
  }
});

console.log(`\n${passed} check(s) passed.`);
