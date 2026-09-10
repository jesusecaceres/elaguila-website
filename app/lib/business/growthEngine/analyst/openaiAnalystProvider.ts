/**
 * Business Development Analyst — OpenAI provider adapter. Reuses the existing canonical
 * server-only OpenAI client (app/lib/openai/serverClient.ts) exactly — no second HTTP client, no
 * standalone AI service. Never called from client code; this file has no route/action of its own.
 */
import "server-only";

import { isOpenAiConfigured, requestOpenAiChatCompletion } from "@/app/lib/openai/serverClient";
import { resolveGrowthAnalystMaxOutputTokens, resolveGrowthAnalystModel, type GrowthAnalystTaskClass } from "./modelRouting";
import { validateGrowthAssessmentJson, type GrowthAssessmentGeneratedContent } from "./schema";
import { buildGrowthAssessmentPrompt } from "./promptCompiler";
import type { GrowthAnalystInputPacket } from "./inputPacket";

export type GrowthAnalystUsageMetadata = {
  providerKey: "openai";
  modelKey: string;
  taskClass: GrowthAnalystTaskClass;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  latencyMs: number;
};

export type GrowthAnalystGenerationResult =
  | { ok: true; content: GrowthAssessmentGeneratedContent; usage: GrowthAnalystUsageMetadata }
  | { ok: false; failureCode: string; failureReason: string; usage: GrowthAnalystUsageMetadata | null };

export function isGrowthAnalystProviderConfigured(): boolean {
  return isOpenAiConfigured();
}

function extractTokenCounts(usage: Record<string, unknown> | null): { prompt: number | null; completion: number | null; total: number | null } {
  if (!usage) return { prompt: null, completion: null, total: null };
  const prompt = typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : null;
  const completion = typeof usage.completion_tokens === "number" ? usage.completion_tokens : null;
  const total = typeof usage.total_tokens === "number" ? usage.total_tokens : null;
  return { prompt, completion, total };
}

/**
 * Single generation call. Never throws — every failure path (unconfigured, timeout, HTTP error,
 * malformed JSON, schema validation failure) returns a normalized `{ ok: false }` result with
 * whatever usage metadata is safely available, so the caller can persist a bounded failure reason
 * without a corrupt assessment ever reaching business_growth_assessments.
 */
export async function generateGrowthAssessmentContent(
  packet: GrowthAnalystInputPacket,
  taskClass: GrowthAnalystTaskClass,
): Promise<GrowthAnalystGenerationResult> {
  const modelKey = resolveGrowthAnalystModel(taskClass);
  const startedAt = Date.now();

  if (!isGrowthAnalystProviderConfigured()) {
    return {
      ok: false,
      failureCode: "provider_unavailable",
      failureReason: "OPENAI_API_KEY is not configured on the server.",
      usage: { providerKey: "openai", modelKey, taskClass, promptTokens: null, completionTokens: null, totalTokens: null, latencyMs: 0 },
    };
  }

  const { systemInstruction, prompt } = buildGrowthAssessmentPrompt(packet);

  const result = await requestOpenAiChatCompletion({
    model: modelKey,
    systemInstruction,
    prompt,
    temperature: 0,
    maxOutputTokens: resolveGrowthAnalystMaxOutputTokens(),
  });
  const latencyMs = Date.now() - startedAt;

  if (!result.ok) {
    return {
      ok: false,
      failureCode: result.failureCode,
      failureReason: result.failureReason,
      usage: { providerKey: "openai", modelKey, taskClass, promptTokens: null, completionTokens: null, totalTokens: null, latencyMs },
    };
  }

  const tokenCounts = extractTokenCounts(result.usage);
  const usage: GrowthAnalystUsageMetadata = {
    providerKey: "openai",
    modelKey,
    taskClass,
    promptTokens: tokenCounts.prompt,
    completionTokens: tokenCounts.completion,
    totalTokens: tokenCounts.total,
    latencyMs,
  };

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    return { ok: false, failureCode: "invalid_provider_output", failureReason: "OpenAI response was not valid JSON.", usage };
  }

  const validated = validateGrowthAssessmentJson(parsed);
  if (!validated.ok) {
    return { ok: false, failureCode: "invalid_provider_output", failureReason: validated.error, usage };
  }

  return { ok: true, content: validated.value, usage };
}
