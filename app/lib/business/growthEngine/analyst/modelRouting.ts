/**
 * Business Development Analyst — model routing (MD §18: "Model Routing / CFO Cost Control").
 * One centralized seam for model selection — no model string is ever hardcoded anywhere else in
 * the analyst engine. Env-var overrides follow the exact convention already proven by
 * FIELD_DISCOVERY_GEMINI_MODEL / OPENAI_CREATIVE_MODEL / OPENAI_IMAGE_MODEL
 * (process.env.X?.trim() || "default"). Deliberately has no "server-only" marker — it reads no
 * secret (the model name env vars are not sensitive) and makes no network/database call.
 */
export type GrowthAnalystTaskClass = "low_cost" | "standard_reasoning" | "high_reasoning";

const DEFAULT_MODEL_BY_CLASS: Readonly<Record<GrowthAnalystTaskClass, string>> = {
  // Extraction, classification, small summaries, missing-field detection, routine normalization.
  low_cost: "gpt-4o-mini",
  // Normal Business Development Assessment, research synthesis, question generation, solution
  // mapping, meeting-prep support.
  standard_reasoning: "gpt-4o-mini",
  // Complex first-time assessment, contradictory evidence, difficult strategy, comprehensive
  // startup roadmap, complex campaign/media strategy.
  high_reasoning: "gpt-4o",
};

const ENV_VAR_BY_CLASS: Readonly<Record<GrowthAnalystTaskClass, string>> = {
  low_cost: "OPENAI_GROWTH_LOW_COST_MODEL",
  standard_reasoning: "OPENAI_GROWTH_STANDARD_MODEL",
  high_reasoning: "OPENAI_GROWTH_HIGH_REASONING_MODEL",
};

export function resolveGrowthAnalystModel(taskClass: GrowthAnalystTaskClass): string {
  const envVar = ENV_VAR_BY_CLASS[taskClass];
  return process.env[envVar]?.trim() || DEFAULT_MODEL_BY_CLASS[taskClass];
}

/**
 * Gate D (MD Part 5 "max-output controls") — a single centralized output-token ceiling for every
 * Growth Analyst generation, same env-override convention as the model selection above. This is
 * intentionally NOT the shared serverClient.ts's default (that file changes nothing for its other
 * caller, Creative Studio) — only the Growth Analyst provider opts into a cap, here.
 */
const DEFAULT_MAX_OUTPUT_TOKENS = 4_000;

export function resolveGrowthAnalystMaxOutputTokens(): number {
  const raw = process.env.OPENAI_GROWTH_MAX_OUTPUT_TOKENS?.trim();
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_MAX_OUTPUT_TOKENS;
}

/**
 * Deterministic task-class classifier — never scattered inline at call sites. A first-ever
 * assessment, any unresolved Business Book contradiction, or a startup/idea roadmap all warrant
 * the more careful (and more expensive) reasoning tier; a routine re-assessment of an established
 * business with no open contradictions uses the standard tier. Never defaults to high_reasoning
 * for every request — that would defeat the point of routing.
 */
export function classifyGrowthAssessmentTask(input: {
  isFirstAssessment: boolean;
  hasUnresolvedContradictions: boolean;
  roadmapType: "startup" | "established";
}): GrowthAnalystTaskClass {
  if (input.isFirstAssessment || input.hasUnresolvedContradictions || input.roadmapType === "startup") {
    return "high_reasoning";
  }
  return "standard_reasoning";
}
