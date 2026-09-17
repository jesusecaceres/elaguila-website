/**
 * Business Development Analyst — intelligence contract tests. Covers the structured-output
 * schema validator, model routing, the pure cache decision, and the prompt compiler's
 * business-specific content threading — the deterministic, code-level parts of the "intelligence
 * contract" that do not require a live OpenAI call. These files carry no "server-only" marker
 * (they touch no secret/database/network — see each file's own doc comment) so they import
 * directly under plain tsx, same as scripts/test-growth-engine-domain-logic.ts.
 *
 * Semantic behavior that genuinely depends on the model's own compliance with instructions (e.g.
 * "does the model actually ask a membership-retention question") is NOT testable without a live
 * call and is explicitly out of scope here, per the mission's own "Evaluate semantics, not exact
 * wording... Do not call live OpenAI in normal automated tests" instruction. What IS tested here:
 * (a) the schema strictly accepts well-formed output and rejects every malformed shape a model
 * could produce, (b) routing/caching decisions are correct pure functions, and (c) the prompt this
 * repository sends to the model actually contains the business-specific signals and doctrine
 * instructions the MD requires — i.e., that OUR code gives the model what it needs to behave
 * correctly, which is the deterministic half of the contract.
 *
 * Run from repo root: npx tsx scripts/test-growth-analyst-intelligence-contract.ts
 */
import { strict as assert } from "node:assert";
import { validateGrowthAssessmentJson } from "../app/lib/business/growthEngine/analyst/schema";
import { classifyGrowthAssessmentTask, resolveGrowthAnalystModel } from "../app/lib/business/growthEngine/analyst/modelRouting";
import { shouldUseCachedAssessment } from "../app/lib/business/growthEngine/analyst/cacheDecision";
import { buildGrowthAssessmentPrompt } from "../app/lib/business/growthEngine/analyst/promptCompiler";
import type { GrowthAnalystInputPacket } from "../app/lib/business/growthEngine/analyst/inputPacket";
import type { CockpitBriefing, CockpitBriefingItem } from "../app/lib/business/meetingStudio/types";

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

console.log("Growth Analyst Intelligence Contract — targeted checks\n");

// =================================================================================================
// 1. SCHEMA VALIDATOR
// =================================================================================================
function validContentFixture(overrides: Record<string, unknown> = {}) {
  return {
    summary_es: "Resumen.",
    summary_en: "Summary.",
    found: [],
    known: [],
    unknown: [],
    needs_verification: [],
    weak_or_missing: [],
    questions_to_ask: [],
    risks_constraints: [],
    growth_opportunities: [],
    possible_solutions: [],
    media_mix: [],
    priorities_dependencies: [],
    measurement_plan: [],
    next_right_move_es: "Siguiente paso.",
    next_right_move_en: "Next step.",
    ...overrides,
  };
}

check("schema: a fully well-formed minimal response validates", () => {
  const result = validateGrowthAssessmentJson(validContentFixture());
  assert.equal(result.ok, true);
});
check("schema: rejects a non-object payload", () => {
  assert.equal(validateGrowthAssessmentJson("just a string").ok, false);
  assert.equal(validateGrowthAssessmentJson(null).ok, false);
  assert.equal(validateGrowthAssessmentJson([1, 2, 3]).ok, false);
});
check("schema: rejects missing bilingual summary", () => {
  const { summary_en, ...rest } = validContentFixture();
  void summary_en;
  assert.equal(validateGrowthAssessmentJson(rest).ok, false);
});
check("schema: rejects missing next_right_move", () => {
  const { next_right_move_es, ...rest } = validContentFixture();
  void next_right_move_es;
  assert.equal(validateGrowthAssessmentJson(rest).ok, false);
});
check("schema: rejects a finding item missing text_en", () => {
  const result = validateGrowthAssessmentJson(validContentFixture({ found: [{ text_es: "x", evidence_refs: [] }] }));
  assert.equal(result.ok, false);
});
check("schema: accepts a finding item with omitted evidence_refs (defaults to empty array)", () => {
  const result = validateGrowthAssessmentJson(validContentFixture({ found: [{ text_es: "x", text_en: "y" }] }));
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value.whatFound[0].evidenceRefs, []);
});
check("schema: rejects a finding item whose evidence_refs is not a string array", () => {
  const result = validateGrowthAssessmentJson(validContentFixture({ found: [{ text_es: "x", text_en: "y", evidence_refs: [1, 2] }] }));
  assert.equal(result.ok, false);
});
check("schema: rejects a possible_solutions item with an out-of-enum provider_class (truth governance: Leonix/partner/external is a closed set)", () => {
  const result = validateGrowthAssessmentJson(
    validContentFixture({ possible_solutions: [{ text_es: "x", text_en: "y", provider_class: "leonix_always_the_answer", category: "ads" }] }),
  );
  assert.equal(result.ok, false);
});
check("schema: accepts each of the three real provider_class values", () => {
  for (const providerClass of ["leonix_provides", "leonix_coordinates_partner", "external_professional_required"]) {
    const result = validateGrowthAssessmentJson(
      validContentFixture({ possible_solutions: [{ text_es: "x", text_en: "y", provider_class: providerClass, category: "ads" }] }),
    );
    assert.equal(result.ok, true, `expected ${providerClass} to validate`);
  }
});
check("schema: rejects a possible_solutions item missing category", () => {
  const result = validateGrowthAssessmentJson(validContentFixture({ possible_solutions: [{ text_es: "x", text_en: "y", provider_class: "leonix_provides" }] }));
  assert.equal(result.ok, false);
});
check("schema: rejects a media_mix item missing channel_key", () => {
  const result = validateGrowthAssessmentJson(validContentFixture({ media_mix: [{ text_es: "x", text_en: "y" }] }));
  assert.equal(result.ok, false);
});
check("schema: accepts a well-formed media_mix item", () => {
  const result = validateGrowthAssessmentJson(validContentFixture({ media_mix: [{ text_es: "x", text_en: "y", channel_key: "radio", evidence_refs: [] }] }));
  assert.equal(result.ok, true);
});
check("schema: rejects when a required array field is not an array at all", () => {
  const result = validateGrowthAssessmentJson(validContentFixture({ questions_to_ask: "not an array" }));
  assert.equal(result.ok, false);
});
check("schema: legal/licensing item can be expressed as needs_verification with provider_class external_professional_required, and the schema itself never assigns a 'confirmed' state to it (schema has no such field at all — confirmation lives only in Gate A's separate official-requirements table)", () => {
  const result = validateGrowthAssessmentJson(
    validContentFixture({
      needs_verification: [{ text_es: "Verificar licencia de negocio.", text_en: "Verify business license.", evidence_refs: [] }],
      possible_solutions: [{ text_es: "Consultar a un abogado.", text_en: "Consult an attorney.", provider_class: "external_professional_required", category: "legal_licensing" }],
    }),
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.ok(!("state" in result.value));
    assert.ok(!("humanVerified" in result.value));
  }
});

// =================================================================================================
// 2. MODEL ROUTING
// =================================================================================================
check("routing: first assessment -> high_reasoning", () => {
  assert.equal(classifyGrowthAssessmentTask({ isFirstAssessment: true, hasUnresolvedContradictions: false, roadmapType: "established" }), "high_reasoning");
});
check("routing: unresolved contradiction -> high_reasoning", () => {
  assert.equal(classifyGrowthAssessmentTask({ isFirstAssessment: false, hasUnresolvedContradictions: true, roadmapType: "established" }), "high_reasoning");
});
check("routing: startup roadmap -> high_reasoning (comprehensive startup roadmap per MD §18)", () => {
  assert.equal(classifyGrowthAssessmentTask({ isFirstAssessment: false, hasUnresolvedContradictions: false, roadmapType: "startup" }), "high_reasoning");
});
check("routing: routine established re-assessment, no contradictions -> standard_reasoning (never defaults to high for every request)", () => {
  assert.equal(classifyGrowthAssessmentTask({ isFirstAssessment: false, hasUnresolvedContradictions: false, roadmapType: "established" }), "standard_reasoning");
});
check("routing: resolveGrowthAnalystModel returns a real default for each task class", () => {
  for (const taskClass of ["low_cost", "standard_reasoning", "high_reasoning"] as const) {
    const model = resolveGrowthAnalystModel(taskClass);
    assert.ok(typeof model === "string" && model.length > 0, `${taskClass} must resolve to a non-empty model string`);
  }
});
check("routing: env override wins over the default for each task class, and only that class is affected", () => {
  const original = { low: process.env.OPENAI_GROWTH_LOW_COST_MODEL, std: process.env.OPENAI_GROWTH_STANDARD_MODEL, high: process.env.OPENAI_GROWTH_HIGH_REASONING_MODEL };
  try {
    process.env.OPENAI_GROWTH_LOW_COST_MODEL = "test-low-model";
    assert.equal(resolveGrowthAnalystModel("low_cost"), "test-low-model");
    assert.notEqual(resolveGrowthAnalystModel("standard_reasoning"), "test-low-model");
  } finally {
    if (original.low === undefined) delete process.env.OPENAI_GROWTH_LOW_COST_MODEL;
    else process.env.OPENAI_GROWTH_LOW_COST_MODEL = original.low;
  }
});

// =================================================================================================
// 3. CACHE DECISION
// =================================================================================================
check("cache: no current assessment -> never cached", () => {
  assert.equal(shouldUseCachedAssessment(null, "hash-a", false), false);
});
check("cache: matching hash, reviewed status, no forced re-analysis -> CACHE HIT", () => {
  assert.equal(shouldUseCachedAssessment({ status: "reviewed", inputHash: "hash-a" }, "hash-a", false), true);
});
check("cache: matching hash but status is 'draft' -> never a valid cache target", () => {
  assert.equal(shouldUseCachedAssessment({ status: "draft", inputHash: "hash-a" }, "hash-a", false), false);
});
check("cache: matching hash, needs_review status -> CACHE HIT (needs_review is a valid non-draft state)", () => {
  assert.equal(shouldUseCachedAssessment({ status: "needs_review", inputHash: "hash-a" }, "hash-a", false), true);
});
check("cache: mismatched hash (business truth changed) -> not cached, real re-analysis needed", () => {
  assert.equal(shouldUseCachedAssessment({ status: "reviewed", inputHash: "hash-old" }, "hash-new", false), false);
});
check("cache: EXPLICIT RE-ANALYSIS bypasses even a matching-hash cache", () => {
  assert.equal(shouldUseCachedAssessment({ status: "reviewed", inputHash: "hash-a" }, "hash-a", true), false);
});

// =================================================================================================
// 4. PROMPT COMPILER — business-specific content threading
// =================================================================================================
function emptyCockpitBriefing(overrides: Partial<CockpitBriefing> = {}): CockpitBriefing {
  return {
    businessId: "b1",
    businessName: "Test",
    primaryLanguage: "es",
    truthClasses: { confirmed: [], ownerStated: [], staffObservation: [], systemDerived: [], aiInference: [], unknown: [], contradiction: [] },
    healthMap: null,
    recommendation: null,
    researchFreshness: null,
    entitlements: null,
    commitments: null,
    whatNotToSell: [],
    suggestedTopics: [],
    generatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function briefingItem(key: string, value: string): CockpitBriefingItem {
  return { key, label: key, value, source: "test", lastVerifiedAt: null };
}

function minimalPacket(overrides: Partial<GrowthAnalystInputPacket> = {}): GrowthAnalystInputPacket {
  return {
    businessId: "b1",
    businessIdentity: { displayName: "Test Business", broadBusinessType: "health_beauty_wellness", businessStage: "operating", locationHint: "San Jose, CA", primaryLanguage: "es" },
    roadmapType: "established",
    cockpitBriefing: emptyCockpitBriefing(),
    rawResearchEvidence: [],
    approvedOpportunities: [],
    currentFollowUp: null,
    activeCampaigns: [],
    outcomeHistory: [],
    ...overrides,
  };
}

check("prompt: always instructs the model that AI output is draft/inference, never confirmed fact (truth governance)", () => {
  const { systemInstruction } = buildGrowthAssessmentPrompt(minimalPacket());
  assert.ok(/DRAFT/.test(systemInstruction));
  assert.ok(/never confirmed fact|never auto-promoted/i.test(systemInstruction));
});
check("prompt: always instructs the model never to state a legal/licensing conclusion as confirmed (legal/licensing safety, applies regardless of roadmap type)", () => {
  const established = buildGrowthAssessmentPrompt(minimalPacket({ roadmapType: "established" })).systemInstruction;
  const startup = buildGrowthAssessmentPrompt(minimalPacket({ roadmapType: "startup" })).systemInstruction;
  for (const instruction of [established, startup]) {
    assert.ok(/NEVER state a license\/legal requirement as confirmed fact|official research/i.test(instruction));
  }
});
check("prompt: always instructs the model that radio/partner media may never claim confirmed commercial terms (radio honesty)", () => {
  const { systemInstruction } = buildGrowthAssessmentPrompt(minimalPacket());
  assert.ok(/[Rr]adio/.test(systemInstruction));
  assert.ok(/terms require confirmation|commercial terms/i.test(systemInstruction));
});
check("prompt: startup roadmap packet gets startup-specific step guidance (WAR FITNESS is NOT this — established test below), and the STARTUP fixture includes the startup roadmap keys", () => {
  const { systemInstruction } = buildGrowthAssessmentPrompt(minimalPacket({ roadmapType: "startup" }));
  assert.ok(/IDEA\/STARTUP/.test(systemInstruction));
  assert.ok(/business_model/.test(systemInstruction));
  assert.ok(/NEEDS OFFICIAL RESEARCH/.test(systemInstruction));
});
check("prompt: established roadmap packet gets established-specific step guidance, not the startup checklist", () => {
  const { systemInstruction } = buildGrowthAssessmentPrompt(minimalPacket({ roadmapType: "established" }));
  assert.ok(/ESTABLISHED business/.test(systemInstruction));
  assert.ok(/understand/.test(systemInstruction));
  assert.ok(!/IDEA\/STARTUP/.test(systemInstruction));
});
check("prompt: WAR FITNESS fixture — membership/promotion signals present in cockpit briefing are actually threaded into the serialized input the model receives", () => {
  const packet = minimalPacket({
    businessIdentity: { displayName: "War Fitness Bay Area", broadBusinessType: "health_beauty_wellness", businessStage: "operating", locationHint: "San Jose, CA", primaryLanguage: "es" },
    cockpitBriefing: emptyCockpitBriefing({
      truthClasses: {
        confirmed: [briefingItem("membership_classes", "Group fitness classes and memberships offered"), briefingItem("current_promotion", "September membership special detected on website")],
        ownerStated: [], staffObservation: [], systemDerived: [], aiInference: [], unknown: [], contradiction: [],
      },
    }),
  });
  const { prompt } = buildGrowthAssessmentPrompt(packet);
  assert.ok(prompt.includes("War Fitness Bay Area"));
  assert.ok(prompt.includes("membership_classes"));
  assert.ok(prompt.includes("September membership special"));
});
check("prompt: questions-engine guidance always instructs deriving questions from actual findings, never generic boilerplate", () => {
  const { systemInstruction } = buildGrowthAssessmentPrompt(minimalPacket());
  assert.ok(/never generic boilerplate/i.test(systemInstruction));
  assert.ok(/membership/i.test(systemInstruction));
  assert.ok(/website.*already known|already known.*website/i.test(systemInstruction));
});
check("prompt: LOW-INFORMATION fixture — an empty cockpit briefing and no research evidence still produces a valid, non-empty prompt (never throws on sparse input)", () => {
  const packet = minimalPacket({ rawResearchEvidence: [], approvedOpportunities: [], currentFollowUp: null, activeCampaigns: [], outcomeHistory: [] });
  const { systemInstruction, prompt } = buildGrowthAssessmentPrompt(packet);
  assert.ok(systemInstruction.length > 0);
  assert.ok(prompt.length > 0);
});
check("prompt: CONTRADICTION fixture — a business-book contradiction is passed through into the serialized input verbatim, never silently dropped", () => {
  const packet = minimalPacket({
    cockpitBriefing: emptyCockpitBriefing({
      truthClasses: {
        confirmed: [], ownerStated: [], staffObservation: [], systemDerived: [], aiInference: [], unknown: [],
        contradiction: [briefingItem("hours_conflict", "Website says open Sundays; owner said closed Sundays")],
      },
    }),
  });
  const { prompt } = buildGrowthAssessmentPrompt(packet);
  assert.ok(prompt.includes("hours_conflict"));
  assert.ok(prompt.includes("Website says open Sundays"));
});
check("prompt: PROFESSIONAL SERVICE fixture — trust/conversion signals thread through, and category is preserved for the model to reason with (not overwritten by a retail-generic template)", () => {
  const packet = minimalPacket({
    businessIdentity: { displayName: "Rivera Law Group", broadBusinessType: "professional_services", businessStage: "operating", locationHint: "San Jose, CA", primaryLanguage: "es" },
    cockpitBriefing: emptyCockpitBriefing({
      truthClasses: {
        confirmed: [briefingItem("services", "Immigration law consultations, Spanish and English")],
        ownerStated: [briefingItem("capacity_concern", "Limited intake capacity mentioned in last meeting")],
        staffObservation: [], systemDerived: [], aiInference: [], unknown: [], contradiction: [],
      },
    }),
  });
  const { prompt } = buildGrowthAssessmentPrompt(packet);
  assert.ok(prompt.includes("Rivera Law Group"));
  assert.ok(prompt.includes("professional_services"));
  assert.ok(prompt.includes("Immigration law consultations"));
  assert.ok(prompt.includes("Limited intake capacity"));
});
check("prompt: RESTAURANT fixture — capacity/catering signals and an active campaign thread through without inventing a service not present in the input", () => {
  const packet = minimalPacket({
    businessIdentity: { displayName: "El Buen Sabor", broadBusinessType: "food_hospitality", businessStage: "operating", locationHint: "San Jose, CA", primaryLanguage: "es" },
    cockpitBriefing: emptyCockpitBriefing({
      truthClasses: {
        confirmed: [briefingItem("catering", "Catering services mentioned on Instagram")],
        ownerStated: [], staffObservation: [], systemDerived: [], aiInference: [], unknown: [], contradiction: [],
      },
    }),
    activeCampaigns: [{ objectiveEs: "Aumentar pedidos de catering", objectiveEn: "Increase catering orders", status: "live" }],
  });
  const { prompt } = buildGrowthAssessmentPrompt(packet);
  assert.ok(prompt.includes("El Buen Sabor"));
  assert.ok(prompt.includes("Catering services"));
  assert.ok(prompt.includes("Aumentar pedidos de catering"));
  // Never silently injects an unrelated invented service string into the compiled prompt.
  assert.ok(!prompt.includes("valet parking"));
});
check("prompt: only the declared, real Gate A media channel keys are offered to the model — never an invented channel", () => {
  const { prompt } = buildGrowthAssessmentPrompt(minimalPacket());
  for (const key of ["business_hub", "website_digital", "monthly_print", "weekly_digital", "newsletter", "leonix_social", "qr_cta_ecosystem", "radio"]) {
    assert.ok(prompt.includes(key), `expected channel key ${key} to be offered to the model`);
  }
});
check("prompt: instructs the model not to recommend Leonix by default, and to say so when the business is not ready", () => {
  const { systemInstruction } = buildGrowthAssessmentPrompt(minimalPacket());
  assert.ok(/Do not recommend Leonix by default/i.test(systemInstruction));
  assert.ok(/not ready for promotion/i.test(systemInstruction));
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll checks passed.");
}
