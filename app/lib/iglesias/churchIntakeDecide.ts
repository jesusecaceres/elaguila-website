import type { ChurchApplicationInput } from "./churchApplicationParse";
import { runChurchIntakeDeterministic } from "./churchIntakeDeterministic";
import { screenChurchApplicationWithAi } from "./churchIntakeAiAdapter";
import {
  AUTO_PUBLISH_MIN_CONFIDENCE,
  AUTO_PUBLISH_MIN_IDENTITY,
  AUTO_PUBLISH_MIN_SAFETY,
  type ChurchDuplicateCandidate,
  type ChurchIntakeResult,
} from "./churchIntakeTypes";

export function finalizeChurchIntakeDecision(
  deterministic: ChurchIntakeResult,
  ai: ChurchIntakeResult | null,
  aiUnavailable: boolean,
): ChurchIntakeResult {
  if (deterministic.decision === "BLOCK") return deterministic;
  if (deterministic.decision === "HUMAN_REVIEW") {
    return { ...deterministic, source: deterministic.source };
  }

  if (aiUnavailable || !ai) {
    return {
      decision: "HUMAN_REVIEW",
      confidence: 0.4,
      reasons: ["AI_SCREENING_UNAVAILABLE"],
      riskSignals: deterministic.riskSignals,
      identityConfidence: deterministic.identityConfidence,
      safetyConfidence: deterministic.safetyConfidence,
      attentionFields: deterministic.attentionFields,
      source: "ai_unavailable",
    };
  }

  if (ai.decision === "BLOCK") {
    return { ...ai, source: "combined", reasons: ai.reasons.slice(0, 8) };
  }
  if (ai.decision === "HUMAN_REVIEW") {
    return { ...ai, source: "combined" };
  }

  const highConfidence =
    ai.decision === "AUTO_PUBLISH" &&
    ai.confidence >= AUTO_PUBLISH_MIN_CONFIDENCE &&
    ai.identityConfidence >= AUTO_PUBLISH_MIN_IDENTITY &&
    ai.safetyConfidence >= AUTO_PUBLISH_MIN_SAFETY &&
    ai.riskSignals.length === 0;

  if (!highConfidence) {
    return {
      decision: "HUMAN_REVIEW",
      confidence: ai.confidence,
      reasons: ["AI_UNCERTAINTY", ...ai.reasons].slice(0, 8),
      riskSignals: ai.riskSignals,
      identityConfidence: ai.identityConfidence,
      safetyConfidence: ai.safetyConfidence,
      attentionFields: deterministic.attentionFields,
      source: "combined",
    };
  }

  return {
    decision: "AUTO_PUBLISH",
    confidence: ai.confidence,
    reasons: ["HIGH_CONFIDENCE_CLEAR", ...ai.reasons].slice(0, 8),
    riskSignals: [],
    identityConfidence: ai.identityConfidence,
    safetyConfidence: ai.safetyConfidence,
    attentionFields: [],
    source: "combined",
  };
}

export async function decideChurchIntake(
  input: ChurchApplicationInput,
  existing: ChurchDuplicateCandidate[],
  opts?: { aiScreen?: typeof screenChurchApplicationWithAi },
): Promise<ChurchIntakeResult> {
  const deterministic = runChurchIntakeDeterministic(input, existing);
  if (deterministic.decision !== "AUTO_PUBLISH") return deterministic;

  const screen = opts?.aiScreen ?? screenChurchApplicationWithAi;
  const ai = await screen(input);
  return finalizeChurchIntakeDecision(deterministic, ai, !ai);
}
