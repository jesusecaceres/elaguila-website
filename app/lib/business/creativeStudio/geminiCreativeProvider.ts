/**
 * Program 6, Gate 6P — Gemini creative provider implementation.
 * Reuses the exact configuration conventions from Program 4's geminiProvider.ts:
 * temperature 0, responseMimeType "application/json", strict parse-then-validate.
 * Server-only; GEMINI_API_KEY is read only here, never persisted, never logged.
 */
import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CreativeProvider, CreativeProviderInput, CreativeProviderResult } from "./providerTypes";

const GEMINI_ENV_KEY = "GEMINI_API_KEY" as const;

export function isGeminiCreativeConfigured(): boolean {
  return Boolean(process.env[GEMINI_ENV_KEY]?.trim());
}

function getGeminiApiKey(): string | null {
  const key = process.env[GEMINI_ENV_KEY]?.trim();
  return key || null;
}

export function getCreativeGeminiModel(): string {
  return process.env.CREATIVE_GEMINI_MODEL?.trim() || process.env.FIELD_DISCOVERY_GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

export function createGeminiCreativeProvider(): CreativeProvider {
  return {
    providerKey: "gemini",
    modelKey: getCreativeGeminiModel(),
    supports: ["COPY", "HEADLINES", "BILINGUAL_COPY", "CREATIVE_BRIEF", "IMAGE_BRIEF", "CANVA_PROMPT", "CAMPAIGN_PLAN", "WEBSITE_COPY"],
    async isConfigured(): Promise<boolean> {
      return isGeminiCreativeConfigured();
    },
    async generateText(input: CreativeProviderInput): Promise<CreativeProviderResult> {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        return { ok: false, failureCode: "provider_unavailable", failureReason: "GEMINI_API_KEY is not configured on the server." };
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: getCreativeGeminiModel(),
          generationConfig: { responseMimeType: "application/json", temperature: 0 },
          systemInstruction: input.systemInstruction,
        });

        const result = await model.generateContent([{ text: input.prompt }]);
        const responseText = result.response.text();

        let parsed: unknown;
        try {
          parsed = JSON.parse(responseText);
        } catch {
          return { ok: false, failureCode: "invalid_provider_output", failureReason: "Gemini response was not valid JSON." };
        }

        return { ok: true, output: parsed as Record<string, unknown> };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gemini request failed.";
        return { ok: false, failureCode: "provider_failed", failureReason: message.slice(0, 500) };
      }
    },
  };
}
