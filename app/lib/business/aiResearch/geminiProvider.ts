/**
 * Program 4, Gate 4C — Gemini provider implementation. Reuses the exact configuration/JSON-output
 * conventions proven in app/lib/ofertas-locales/ofertasLocalesGeminiConfig.ts and
 * ofertasLocalesGeminiPageExtractor.ts (temperature 0, responseMimeType "application/json",
 * strict parse-then-validate, never a blind JSON.parse trust). Does NOT import any Ofertas
 * Locales domain function — only the low-level GoogleGenerativeAI client conventions are reused.
 * Server-only; GEMINI_API_KEY is read only here, never persisted, never logged.
 */
import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { validateBriefingSynthesisJson } from "./briefingSynthesis";
import type { BusinessIntelligenceProvider } from "./providerRegistry";
import type { AiBriefingSynthesisResult, AiResearchInputPacket } from "./types";

const GEMINI_ENV_KEY = "GEMINI_API_KEY" as const;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env[GEMINI_ENV_KEY]?.trim());
}

function getGeminiApiKey(): string | null {
  const key = process.env[GEMINI_ENV_KEY]?.trim();
  return key || null;
}

export function getFieldDiscoveryGeminiModel(): string {
  return process.env.FIELD_DISCOVERY_GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

function buildSynthesisPrompt(input: AiResearchInputPacket): string {
  return [
    "You are producing a DRAFT business-intelligence briefing for internal staff review only.",
    "This output is an inference, never a confirmed fact. Every claim must cite evidence_refs from the input data below.",
    "Never fabricate a phone number, address, price, review score, ranking, or SEO/PageSpeed claim not present in the input.",
    "Respond with strict JSON only, matching exactly this shape (no markdown, no prose outside the JSON):",
    JSON.stringify({
      summary_es: "string",
      summary_en: "string",
      strengths: [{ claim_es: "string", claim_en: "string", evidence_refs: [{ source_type: "string", source_id: "string|null", excerpt: "string|null" }], confidence: "low|medium|high", requires_confirmation: true, source_types: ["string"], reasoning_summary: "string", prohibited_claim_flags: ["string"] }],
      opportunities: "same shape as strengths",
      contradictions: [{ description_es: "string", description_en: "string", evidence_refs: [], recommended_confirmation_question_es: "string", recommended_confirmation_question_en: "string" }],
      unknowns: [{ question_es: "string", question_en: "string", why_needed_es: "string", why_needed_en: "string", priority: "low|medium|high", related_dimension_key: "string|null" }],
      limitations: ["string"],
    }),
    "Prohibited claims (never assert these unless directly evidenced in the input): " + input.prohibitedClaims.join("; "),
    "Lion Code rules (never violate): " + input.lionCodeRules.join("; "),
    "Input data:",
    JSON.stringify(input),
  ].join("\n\n");
}

export function createGeminiBusinessIntelligenceProvider(): BusinessIntelligenceProvider {
  return {
    providerKey: "gemini",
    modelKey: getFieldDiscoveryGeminiModel(),
    async isConfigured(): Promise<boolean> {
      return isGeminiConfigured();
    },
    async synthesizeBrief(input: AiResearchInputPacket): Promise<AiBriefingSynthesisResult> {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        return { ok: false, failureCode: "provider_unavailable", failureReason: "GEMINI_API_KEY is not configured on the server." };
      }

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: getFieldDiscoveryGeminiModel(),
          generationConfig: { responseMimeType: "application/json", temperature: 0 },
        });

        const result = await model.generateContent([{ text: buildSynthesisPrompt(input) }]);
        const responseText = result.response.text();

        let parsed: unknown;
        try {
          parsed = JSON.parse(responseText);
        } catch {
          return { ok: false, failureCode: "invalid_provider_output", failureReason: "Gemini response was not valid JSON." };
        }

        const validated = validateBriefingSynthesisJson(parsed);
        if (!validated.ok) {
          return { ok: false, failureCode: "invalid_provider_output", failureReason: validated.error };
        }
        return validated.value;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gemini request failed.";
        return { ok: false, failureCode: "provider_failed", failureReason: message.slice(0, 500) };
      }
    },
  };
}
