/**
 * Program 7, Gate 7F — Business Concierge Assistant provider abstraction.
 * LOCKED: Gemini is the only live provider for V1, mirroring the AI Research Engine's
 * providerRegistry.ts pattern exactly (Program 4, Gate 4C). Any other provider key must
 * report isConfigured() === false and must never be claimed live.
 */
import "server-only";

export type AssistantProviderResponse =
  | { ok: true; replyText: string; suggestedActionBoundary: string | null }
  | { ok: false; failureCode: "provider_unavailable" | "invalid_provider_output" | "provider_failed"; failureReason: string };

export type AssistantProvider = {
  providerKey: string;
  modelKey: string;
  isConfigured(): Promise<boolean>;
  respond(prompt: string, contextSummary: string): Promise<AssistantProviderResponse>;
};

let geminiAssistantProviderSingleton: AssistantProvider | null = null;

/** Lazily constructed to avoid importing @google/generative-ai in any code path that never needs it. */
async function getGeminiAssistantProvider(): Promise<AssistantProvider> {
  if (!geminiAssistantProviderSingleton) {
    const { createGeminiAssistantProvider } = await import("./geminiAssistantProvider");
    geminiAssistantProviderSingleton = createGeminiAssistantProvider();
  }
  return geminiAssistantProviderSingleton;
}

/** Only "gemini" resolves to a real provider in V1 — every other key is explicitly unsupported. */
export async function resolveAssistantProvider(providerKey: string): Promise<AssistantProvider | null> {
  if (providerKey === "gemini") return getGeminiAssistantProvider();
  return null;
}

export async function getDefaultAssistantProvider(): Promise<AssistantProvider> {
  return getGeminiAssistantProvider();
}
