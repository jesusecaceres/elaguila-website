/**
 * Business Development Analyst — provider-adapter safety tests using a deterministic stub, never
 * a live OpenAI call. Same scratch-copy technique as scripts/test-admin-bootstrap-session-security.ts
 * and scripts/test-staff-bootstrap-session-precedence.ts: the real source of
 * app/lib/business/growthEngine/ is copied into a scratch dir (preserving its relative-import
 * structure so schema.ts / modelRouting.ts / promptCompiler.ts / roadmapCatalog.ts / types.ts run
 * completely unmodified), and only openaiAnalystProvider.ts's "server-only" marker is stripped and
 * its import of the real app/lib/openai/serverClient.ts is redirected to a small in-memory stub
 * module whose requestOpenAiChatCompletion() return value this test fully controls. The actual
 * generation/validation logic under test (generateGrowthAssessmentContent) is never reimplemented.
 *
 * Run from repo root: npx tsx scripts/test-growth-analyst-provider-safety.ts
 */
import { strict as assert } from "node:assert";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

let passed = 0;
async function check(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Growth Analyst Provider Safety — deterministic stub tests\n");

const ROOT = path.resolve(__dirname, "..");
const scratchDir = mkdtempSync(path.join(tmpdir(), "growth-analyst-provider-test-"));
const scratchGrowthEngineDir = path.join(scratchDir, "growthEngine");

cpSync(path.join(ROOT, "app/lib/business/growthEngine"), scratchGrowthEngineDir, { recursive: true });

// --- Stub module standing in for app/lib/openai/serverClient.ts --------------------------------
const STUB_RESPONSE_SENTINEL = "__TEST_STUB_RESPONSE__";
const stubServerClientSource = `
export function isOpenAiConfigured() {
  return (globalThis as any).${STUB_RESPONSE_SENTINEL}?.configured ?? true;
}
export async function requestOpenAiChatCompletion(_params: unknown) {
  const stub = (globalThis as any).${STUB_RESPONSE_SENTINEL};
  if (!stub) throw new Error("test stub not configured");
  return stub.chatResult;
}
`;
const stubServerClientFile = path.join(scratchDir, "stubServerClient.ts");
writeFileSync(stubServerClientFile, stubServerClientSource, "utf8");
const stubServerClientUrl = pathToFileURL(stubServerClientFile).href;

// --- Patch the scratch copy of openaiAnalystProvider.ts -----------------------------------------
const providerFile = path.join(scratchGrowthEngineDir, "analyst", "openaiAnalystProvider.ts");
let providerSource = readFileSync(providerFile, "utf8");
const beforeStrip = providerSource;
providerSource = providerSource.replace('import "server-only";\n\n', "");
assert.notEqual(providerSource, beforeStrip, 'expected to find and strip `import "server-only";` in openaiAnalystProvider.ts');
providerSource = providerSource.replaceAll("@/app/lib/openai/serverClient", stubServerClientUrl);
writeFileSync(providerFile, providerSource, "utf8");

async function main() {
  const providerMod = await import(pathToFileURL(providerFile).href);
  const { generateGrowthAssessmentContent, isGrowthAnalystProviderConfigured } = providerMod;

  const minimalPacket = {
    businessId: "b1",
    businessIdentity: { displayName: "Test Business", broadBusinessType: "health_beauty_wellness", businessStage: "operating", locationHint: "San Jose, CA", primaryLanguage: "es" },
    roadmapType: "established",
    cockpitBriefing: {
      businessId: "b1",
      businessName: "Test Business",
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
    },
    rawResearchEvidence: [],
    approvedOpportunities: [],
    currentFollowUp: null,
    activeCampaigns: [],
    outcomeHistory: [],
  };

  function setStub(value: { configured?: boolean; chatResult: unknown }) {
    (globalThis as any)[STUB_RESPONSE_SENTINEL] = value;
  }

  const VALID_CONTENT_JSON = JSON.stringify({
    summary_es: "Resumen.",
    summary_en: "Summary.",
    found: [{ text_es: "Encontrado.", text_en: "Found.", evidence_refs: ["website"] }],
    known: [],
    unknown: [],
    needs_verification: [],
    weak_or_missing: [],
    questions_to_ask: [{ text_es: "Pregunta?", text_en: "Question?", evidence_refs: [] }],
    risks_constraints: [],
    growth_opportunities: [],
    possible_solutions: [{ text_es: "Solucion.", text_en: "Solution.", evidence_refs: [], provider_class: "leonix_provides", category: "digital_presence" }],
    media_mix: [{ text_es: "Canal.", text_en: "Channel.", evidence_refs: [], channel_key: "business_hub" }],
    priorities_dependencies: [],
    measurement_plan: [],
    next_right_move_es: "Siguiente paso.",
    next_right_move_en: "Next step.",
  });

  // --- Provider unavailable -------------------------------------------------------------------
  await check("A. Provider not configured -> ok:false provider_unavailable, no throw", async () => {
    setStub({ configured: false, chatResult: { ok: true, text: VALID_CONTENT_JSON, usage: null } });
    const result = await generateGrowthAssessmentContent(minimalPacket, "standard_reasoning");
    assert.equal(result.ok, false);
    assert.equal(result.failureCode, "provider_unavailable");
  });

  // --- Valid structured output --------------------------------------------------------------
  await check("B. Well-formed JSON response validates and returns typed content", async () => {
    setStub({ configured: true, chatResult: { ok: true, text: VALID_CONTENT_JSON, usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 } } });
    const result = await generateGrowthAssessmentContent(minimalPacket, "standard_reasoning");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.content.summaryEs, "Resumen.");
      assert.equal(result.content.suggestedSolutions[0].providerClass, "leonix_provides");
      assert.equal(result.usage.promptTokens, 100);
      assert.equal(result.usage.totalTokens, 150);
      assert.equal(result.usage.taskClass, "standard_reasoning");
    }
  });

  // --- Invalid provider output: malformed JSON -----------------------------------------------
  await check("C. Non-JSON response text -> ok:false invalid_provider_output, no corrupt content returned", async () => {
    setStub({ configured: true, chatResult: { ok: true, text: "not json at all", usage: null } });
    const result = await generateGrowthAssessmentContent(minimalPacket, "standard_reasoning");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.failureCode, "invalid_provider_output");
  });

  // --- Invalid provider output: wrong provider_class value ----------------------------------
  await check("D. A provider_class outside the closed 3-value enum is rejected, not silently accepted", async () => {
    const badJson = JSON.stringify({
      ...JSON.parse(VALID_CONTENT_JSON),
      possible_solutions: [{ text_es: "x", text_en: "x", evidence_refs: [], provider_class: "leonix_definitely_does_this", category: "x" }],
    });
    setStub({ configured: true, chatResult: { ok: true, text: badJson, usage: null } });
    const result = await generateGrowthAssessmentContent(minimalPacket, "standard_reasoning");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.failureCode, "invalid_provider_output");
  });

  // --- Invalid provider output: missing required bilingual field -----------------------------
  await check("E. Missing next_right_move_en is rejected (bilingual requirement enforced)", async () => {
    const parsed = JSON.parse(VALID_CONTENT_JSON);
    delete parsed.next_right_move_en;
    setStub({ configured: true, chatResult: { ok: true, text: JSON.stringify(parsed), usage: null } });
    const result = await generateGrowthAssessmentContent(minimalPacket, "standard_reasoning");
    assert.equal(result.ok, false);
  });

  // --- Provider HTTP/timeout failure passthrough ----------------------------------------------
  await check("F. A provider-level failure (e.g. timeout) passes through as provider_failed, never miscategorized as invalid output", async () => {
    setStub({ configured: true, chatResult: { ok: false, failureCode: "provider_failed", failureReason: "OpenAI request timed out." } });
    const result = await generateGrowthAssessmentContent(minimalPacket, "standard_reasoning");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.failureCode, "provider_failed");
  });

  await check("G. isGrowthAnalystProviderConfigured reflects the stubbed configuration state truthfully", async () => {
    setStub({ configured: false, chatResult: { ok: true, text: VALID_CONTENT_JSON, usage: null } });
    assert.equal(isGrowthAnalystProviderConfigured(), false);
    setStub({ configured: true, chatResult: { ok: true, text: VALID_CONTENT_JSON, usage: null } });
    assert.equal(isGrowthAnalystProviderConfigured(), true);
  });

  console.log(`\n${passed} check(s) passed.`);
  if (process.exitCode) {
    console.error("\nSome checks FAILED.");
  } else {
    console.log("\nAll checks passed.");
  }
}

void main();
