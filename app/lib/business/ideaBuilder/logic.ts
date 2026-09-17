/**
 * Pure Idea Builder decision logic -- deliberately NOT "server-only" so it is directly
 * unit-testable. Every function here is descriptive/educational only: it must never claim market
 * demand exists, that the business will be profitable, that the idea is "validated", a financial
 * outcome, or a guaranteed recommendation. It reports completion state and suggests further
 * education -- nothing more.
 */
import { MAX_TEXT_FIELD_LENGTH } from "./constants";
import { READINESS_QUESTIONS } from "./questionRegistry";
import type { IdeaBuilderPath, IdeaDraft, IdeaDraftPatch, ReadinessAnswers, ReadinessCategory } from "./types";

export type DraftValidationResult = { ok: true } | { ok: false; errors: string[] };

const VALID_PATHS: readonly IdeaBuilderPath[] = ["have_business", "thinking_about_starting"];

export function validateDraftPatch(patch: IdeaDraftPatch): DraftValidationResult {
  const errors: string[] = [];
  if (patch.path !== undefined && !VALID_PATHS.includes(patch.path)) errors.push("invalid_path");
  for (const field of ["ideaDescription", "customerDefinition", "problemDefinition", "simpleOffer"] as const) {
    const value = patch[field];
    if (value !== undefined && value !== null && value.length > MAX_TEXT_FIELD_LENGTH) errors.push(`${field}_too_long`);
  }
  if (patch.language !== undefined && patch.language !== "es" && patch.language !== "en") errors.push("invalid_language");
  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}

/** Descriptive completion state -- filled fields count, not a quality judgment. */
export function computeDraftCompletionState(draft: Pick<IdeaDraft, "ideaDescription" | "customerDefinition" | "problemDefinition" | "simpleOffer" | "readinessAnswers">): {
  requiredFieldsFilled: number;
  requiredFieldsTotal: number;
  readinessAnswered: number;
  readinessTotal: number;
  isComplete: boolean;
} {
  const requiredValues = [draft.ideaDescription, draft.customerDefinition, draft.problemDefinition, draft.simpleOffer];
  const requiredFieldsFilled = requiredValues.filter((v) => typeof v === "string" && v.trim().length > 0).length;
  const readinessAnswered = READINESS_QUESTIONS.filter((q) => isAnswered(draft.readinessAnswers, q.key)).length;
  return {
    requiredFieldsFilled,
    requiredFieldsTotal: requiredValues.length,
    readinessAnswered,
    readinessTotal: READINESS_QUESTIONS.length,
    isComplete: requiredFieldsFilled === requiredValues.length && readinessAnswered === READINESS_QUESTIONS.length,
  };
}

function isAnswered(answers: ReadinessAnswers, key: string): boolean {
  const value = answers[key];
  return value !== undefined && value !== null && value !== "";
}

export type ReadinessSummaryByCategory = { category: ReadinessCategory; answered: number; total: number };

/**
 * Purely descriptive readiness summary: how many readiness questions were answered, grouped by
 * category, plus which lesson capability keys to suggest next. This is education, not a
 * validation verdict -- it never claims the idea will succeed or that demand exists.
 */
export function buildEducationalReadinessSummary(draft: Pick<IdeaDraft, "readinessAnswers">): {
  byCategory: ReadinessSummaryByCategory[];
  suggestedNextCapabilityKeys: string[];
} {
  const categories: ReadinessCategory[] = ["startup_readiness", "technology_readiness", "visibility_basics", "communication_basics"];
  const byCategory = categories.map((category) => {
    const questionsInCategory = READINESS_QUESTIONS.filter((q) => q.category === category);
    const answered = questionsInCategory.filter((q) => isAnswered(draft.readinessAnswers, q.key)).length;
    return { category, answered, total: questionsInCategory.length };
  });

  // Suggest lessons tied to unanswered (or "no") questions first -- the owner has not yet built
  // that capability. Deduplicated, deterministic order matching questionRegistry order.
  const suggestedNextCapabilityKeys: string[] = [];
  for (const q of READINESS_QUESTIONS) {
    const answered = isAnswered(draft.readinessAnswers, q.key);
    const answeredNo = draft.readinessAnswers[q.key] === false;
    if ((!answered || answeredNo) && !suggestedNextCapabilityKeys.includes(q.relatedCapabilityKey)) {
      suggestedNextCapabilityKeys.push(q.relatedCapabilityKey);
    }
  }

  return { byCategory, suggestedNextCapabilityKeys };
}
