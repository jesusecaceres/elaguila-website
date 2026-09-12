/**
 * Business Development & Growth Engine, Gate D — bounded LIVE OpenAI smoke test (MD Part 15).
 *
 * NOT part of the automated regression suite and NEVER auto-executed by any test runner or CI
 * step — this script must be run manually, on purpose, by someone who has confirmed
 * OPENAI_API_KEY is intentionally available in the environment they are running it in.
 *
 * Makes AT MOST ONE real OpenAI request (generateGrowthAssessmentContent — the exact same
 * production code path Gate B/D already harden, no second/ad-hoc client), against a fully
 * synthetic, deterministic "War Fitness"-style fixture — no production customer data, no image
 * generation, no database read or write (this script never imports the repository layer or
 * Supabase client). The request itself already carries the Gate D reliability hardening: a bounded
 * retry policy (at most one retry, only for transient failures — see app/lib/openai/serverClient.ts)
 * and a max-output-token ceiling (see modelRouting.ts's resolveGrowthAnalystMaxOutputTokens) — this
 * script adds no additional retry loop of its own.
 *
 * Same scratch-copy technique as scripts/test-growth-analyst-provider-safety.ts: openaiAnalystProvider.ts
 * and serverClient.ts both carry "server-only" markers that throw when imported outside Next's own
 * bundler — this script copies the REAL, unmodified source into a scratch dir and strips only that
 * import line (never reimplements any generation/HTTP logic). Unlike the provider-safety test, the
 * real serverClient.ts is copied through untouched (not stubbed) — this script's entire purpose is
 * to exercise the real network call.
 *
 * Safety:
 *   - Checks isGrowthAnalystProviderConfigured() FIRST. If OPENAI_API_KEY is not present, this
 *     prints the exact blocker and exits 0 (not a failure — "not run" is the correct, honest
 *     outcome, not an error) WITHOUT attempting any network call.
 *   - Never logs, prints, or otherwise exposes the API key value itself — only whether it is
 *     configured (a boolean).
 *   - No retry beyond the one already bounded inside serverClient.ts; this script does not loop.
 *
 * Run from repo root (only when you intend a real, billable OpenAI call):
 *   npx tsx scripts/smoke-test-growth-analyst-live-openai.ts
 */
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { GrowthAnalystInputPacket } from "../app/lib/business/growthEngine/analyst/inputPacket";

const ROOT = path.resolve(__dirname, "..");
const scratchDir = mkdtempSync(path.join(tmpdir(), "growth-analyst-live-smoke-"));
const scratchGrowthEngineDir = path.join(scratchDir, "growthEngine");
const scratchOpenaiDir = path.join(scratchDir, "openai");

cpSync(path.join(ROOT, "app/lib/business/growthEngine"), scratchGrowthEngineDir, { recursive: true });
cpSync(path.join(ROOT, "app/lib/openai"), scratchOpenaiDir, { recursive: true });

for (const relFile of ["openai/serverClient.ts", "growthEngine/analyst/openaiAnalystProvider.ts"]) {
  const file = path.join(scratchDir, relFile);
  let source = readFileSync(file, "utf8");
  source = source.replace('import "server-only";\n\n', "");
  source = source.replaceAll("@/app/lib/openai/serverClient", pathToFileURL(path.join(scratchOpenaiDir, "serverClient.ts")).href);
  writeFileSync(file, source, "utf8");
}

const providerModulePromise = import(pathToFileURL(path.join(scratchGrowthEngineDir, "analyst", "openaiAnalystProvider.ts")).href);

const SYNTHETIC_WAR_FITNESS_PACKET: GrowthAnalystInputPacket = {
  businessId: "smoke-test-synthetic-business",
  businessIdentity: {
    displayName: "Synthetic Test Gym (Smoke Test Fixture)",
    broadBusinessType: "health_beauty_wellness",
    businessStage: "operating",
    locationHint: "San Jose, CA",
    primaryLanguage: "es",
  },
  roadmapType: "established",
  cockpitBriefing: {
    businessId: "smoke-test-synthetic-business",
    businessName: "Synthetic Test Gym (Smoke Test Fixture)",
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
  rawResearchEvidence: [
    { sourceType: "website", sourceUrl: "https://example-synthetic-gym.test", observedAt: new Date().toISOString(), claim: "Offers monthly and annual memberships.", requiresConfirmation: false },
    { sourceType: "google_places", sourceUrl: null, observedAt: new Date().toISOString(), claim: "September enrollment promotion mentioned on Google profile.", requiresConfirmation: true },
  ],
  approvedOpportunities: [],
  currentFollowUp: null,
  activeCampaigns: [],
  outcomeHistory: [],
};

async function main(): Promise<void> {
  console.log("Growth Analyst — bounded LIVE OpenAI smoke test\n");

  const { isGrowthAnalystProviderConfigured, generateGrowthAssessmentContent } = await providerModulePromise;

  if (!isGrowthAnalystProviderConfigured()) {
    console.log("NOT RUN — OPENAI_API_KEY is not configured in this environment.");
    console.log("This is the correct, honest outcome when the key is absent — no network call was attempted.");
    process.exitCode = 0;
    return;
  }

  console.log("OPENAI_API_KEY is configured. Making exactly ONE live request (standard_reasoning task class, synthetic fixture)...\n");

  const result = await generateGrowthAssessmentContent(SYNTHETIC_WAR_FITNESS_PACKET, "standard_reasoning");

  if (!result.ok) {
    console.error(`LIVE CALL FAILED — failureCode: ${result.failureCode}`);
    console.error(`failureReason: ${result.failureReason}`);
    if (result.usage) console.log("Usage metadata (even on failure):", result.usage);
    process.exitCode = 1;
    return;
  }

  console.log("LIVE CALL SUCCEEDED.\n");
  console.log("Usage metadata:", result.usage);
  console.log("\n--- Structured content checks ---");
  const c = result.content;
  console.log(`summary present: ${Boolean(c.summaryEs && c.summaryEn)}`);
  console.log(`next_right_move present: ${Boolean(c.nextRightMoveEs && c.nextRightMoveEn)}`);
  console.log(`questions_to_ask count: ${c.clientQuestions.length}`);
  console.log(`possible_solutions count: ${c.suggestedSolutions.length}`);
  console.log(`media_mix count: ${c.recommendedMediaMix.length}`);
  console.log(`possible_solutions provider classes: ${[...new Set(c.suggestedSolutions.map((s: { providerClass: string }) => s.providerClass))].join(", ") || "(none)"}`);

  console.log(`\nManual review reminder: confirm no invented metrics, no confirmed-legal-fact claims, and media_mix (if any) only uses real channel keys — this script checks structure/shape only, not semantic truth governance (that is the prompt's own job, verified by scripts/test-growth-analyst-intelligence-contract.ts).`);

  console.log("\nThis script never persisted anything — generateOrGetGrowthAssessment/createGrowthAssessment were not called.");
}

main()
  .catch((err) => {
    console.error("UNEXPECTED FAILURE:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => {
    rmSync(scratchDir, { recursive: true, force: true });
  });
