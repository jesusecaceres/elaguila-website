/**
 * Program 7, Gate 7F — Structured response validation for the assistant provider.
 * Strict parse-then-validate: never a blind trust of provider JSON output.
 * Mirrors app/lib/business/aiResearch/briefingSynthesis.ts validation conventions.
 */

const ALLOWED_ACTION_BOUNDARIES: readonly string[] = ["READ", "EXPLAIN", "SUMMARIZE", "GUIDE", "DRAFT", "SUGGEST"];

export type ValidatedAssistantResponse = {
  replyText: string;
  suggestedActionBoundary: string | null;
};

export type ValidationResult =
  | { ok: true; value: ValidatedAssistantResponse }
  | { ok: false; error: string };

export function validateAssistantProviderJson(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Provider response is not an object." };
  }

  const obj = input as Record<string, unknown>;

  if (typeof obj.reply_text !== "string" || obj.reply_text.trim().length === 0) {
    return { ok: false, error: "Provider response is missing a valid reply_text string." };
  }

  const boundary = obj.suggested_action_boundary;
  if (boundary !== null && boundary !== undefined) {
    if (typeof boundary !== "string" || !ALLOWED_ACTION_BOUNDARIES.includes(boundary)) {
      return { ok: false, error: `Provider response has an invalid suggested_action_boundary: ${String(boundary)}` };
    }
  }

  return {
    ok: true,
    value: {
      replyText: obj.reply_text,
      suggestedActionBoundary: (boundary as string | null | undefined) ?? null,
    },
  };
}
