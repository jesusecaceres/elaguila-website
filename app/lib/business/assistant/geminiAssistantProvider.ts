/**
 * Program 7, Gate 7F — Gemini assistant provider implementation.
 * Reuses the exact configuration/JSON-output conventions proven in
 * app/lib/business/aiResearch/geminiProvider.ts (temperature 0, responseMimeType
 * "application/json", strict parse-then-validate, never a blind JSON.parse trust).
 * Server-only; GEMINI_API_KEY is read only here, never persisted, never logged.
 *
 * Fails closed: if the API key is not configured, or the response is not valid JSON,
 * or the response fails structural validation, the assistant returns a truthful
 * failure — never a fabricated or partially-trusted response.
 */
import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { validateAssistantProviderJson } from "./responseValidation";
import type { AssistantProvider, AssistantProviderResponse } from "./providerRegistry";

const GEMINI_ENV_KEY = "GEMINI_API_KEY" as const;

export function isAssistantGeminiConfigured(): boolean {
  return Boolean(process.env[GEMINI_ENV_KEY]?.trim());
}

function getGeminiApiKey(): string | null {
  const key = process.env[GEMINI_ENV_KEY]?.trim();
  return key || null;
}

export function getAssistantGeminiModel(): string {
  return process.env.ASSISTANT_GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

function buildAssistantPrompt(prompt: string, contextSummary: string): string {
  return [
    "You are the Leonix Business Concierge Assistant, bounded to ONE specific business context.",
    "You may only READ, EXPLAIN, SUMMARIZE, GUIDE, DRAFT, or SUGGEST. You must NEVER claim to update a fact,",
    "resolve a contradiction, approve a recommendation, accept a proposal, charge, grant an entitlement,",
    "publish content, or send an external message. If asked to do any of those, explain that a human must do it.",
    "Never fabricate business facts not present in the context below.",
    "Respond with strict JSON only, matching exactly this shape (no markdown, no prose outside the JSON):",
    JSON.stringify({ reply_text: "string", suggested_action_boundary: "READ|EXPLAIN|SUMMARIZE|GUIDE|DRAFT|SUGGEST|null" }),
    "Business context summary (read-only truth, never invent beyond this):",
    contextSummary,
    "User message:",
    prompt,
  ].join("\n\n");
}

export function createGeminiAssistantProvider(): AssistantProvider {
  return {
    providerKey: "gemini",
    modelKey: getAssistantGeminiModel(),
    async isConfigured(): Promise<boolean> {
      return isAssistantGeminiConfigured();
    },
    async respond(prompt: string, contextSummary: string): Promise<AssistantProviderResponse> {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        return { ok: false, failureCode: "provider_unavailable", failureReason: "GEMINI_API_KEY is not configured on the server." };
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: getAssistantGeminiModel(),
          generationConfig: { responseMimeType: "application/json", temperature: 0 },
        });

        const result = await model.generateContent([{ text: buildAssistantPrompt(prompt, contextSummary) }]);
        const responseText = result.response.text();

        let parsed: unknown;
        try {
          parsed = JSON.parse(responseText);
        } catch {
          return { ok: false, failureCode: "invalid_provider_output", failureReason: "Gemini response was not valid JSON." };
        }

        const validated = validateAssistantProviderJson(parsed);
        if (!validated.ok) {
          return { ok: false, failureCode: "invalid_provider_output", failureReason: validated.error };
        }
        return { ok: true, replyText: validated.value.replyText, suggestedActionBoundary: validated.value.suggestedActionBoundary };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gemini request failed.";
        return { ok: false, failureCode: "provider_failed", failureReason: message.slice(0, 500) };
      }
    },
  };
}
