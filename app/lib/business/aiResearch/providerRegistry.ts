/**
 * Program 4, Gate 4C — AI provider abstraction. LOCKED: Gemini is the only live provider for V1.
 * Any other provider key must report isConfigured() === false and must never be claimed live —
 * this registry is the single place that truth is declared.
 */
import "server-only";

import type { AiBriefingSynthesisResult, AiResearchInputPacket } from "./types";

export type BusinessIntelligenceProvider = {
  providerKey: string;
  modelKey: string;
  isConfigured(): Promise<boolean>;
  synthesizeBrief(input: AiResearchInputPacket): Promise<AiBriefingSynthesisResult>;
};

let geminiProviderSingleton: BusinessIntelligenceProvider | null = null;

/** Lazily constructed to avoid importing @google/generative-ai in any code path that never needs it. */
async function getGeminiProvider(): Promise<BusinessIntelligenceProvider> {
  if (!geminiProviderSingleton) {
    const { createGeminiBusinessIntelligenceProvider } = await import("./geminiProvider");
    geminiProviderSingleton = createGeminiBusinessIntelligenceProvider();
  }
  return geminiProviderSingleton;
}

/** Only "gemini" resolves to a real provider in V1 — every other key is explicitly unsupported. */
export async function resolveBusinessIntelligenceProvider(providerKey: string): Promise<BusinessIntelligenceProvider | null> {
  if (providerKey === "gemini") return getGeminiProvider();
  return null;
}

export async function getDefaultBusinessIntelligenceProvider(): Promise<BusinessIntelligenceProvider> {
  return getGeminiProvider();
}
