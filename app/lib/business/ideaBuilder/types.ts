/**
 * TODAY-1 — Idea Builder types. Supports two entrepreneur paths: someone who already has a
 * business, and someone thinking about starting one. Never claims market demand, profitability,
 * validation, or a guaranteed outcome -- see logic.ts.
 */

export type IdeaBuilderPath = "have_business" | "thinking_about_starting";

export type IdeaDraftStatus = "in_progress" | "completed" | "abandoned";

export type IdeaDraftLanguage = "es" | "en";

export type ReadinessAnswerValue = boolean | string | null;

export type ReadinessAnswers = Record<string, ReadinessAnswerValue>;

export type IdeaDraft = {
  id: string;
  authUserId: string;
  intentId: string;
  path: IdeaBuilderPath;
  ideaDescription: string | null;
  customerDefinition: string | null;
  problemDefinition: string | null;
  simpleOffer: string | null;
  readinessAnswers: ReadinessAnswers;
  language: IdeaDraftLanguage;
  status: IdeaDraftStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IdeaDraftPatch = Partial<
  Pick<IdeaDraft, "path" | "ideaDescription" | "customerDefinition" | "problemDefinition" | "simpleOffer" | "readinessAnswers" | "language">
>;

export type ReadinessCategory = "startup_readiness" | "technology_readiness" | "visibility_basics" | "communication_basics";
