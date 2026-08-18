/**
 * LEO-10 centralized server-only credential + model configuration.
 */
import "server-only";

export {
  LEO_AI_BOUNDS,
  LEO_AI_ELIGIBLE_INTENTS,
  LEO_AI_POLICY_NOTES,
  isLeoAiIntentEligible,
  type LeoAiEligibleIntent,
} from "@/app/leo/_lib/leoAiBounds";

/**
 * Credential lookup — reuses existing Leonix OpenAI env used by Admin moderation.
 * Optional LEO_AI_MODEL overrides model; never logged.
 */
export function getLeoAiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || null;
}

export function getLeoAiModel(): string {
  return (
    process.env.LEO_AI_MODEL?.trim() ||
    process.env.OPENAI_MODERATION_MODEL?.trim() ||
    "gpt-4o-mini"
  );
}

export function isLeoAiConfigured(): boolean {
  return Boolean(getLeoAiApiKey());
}
