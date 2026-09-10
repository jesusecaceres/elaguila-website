/**
 * Program 6, Gate 6P — Creative provider registry.
 * Single place that declares provider truth. Gemini remains the default provider; OpenAI
 * (Package A) is an additional, explicitly-selectable provider — never a silent replacement.
 * Deterministic fallback produces structured production packets without a provider.
 */
import "server-only";

import type { CreativeProvider } from "./providerTypes";

export const KNOWN_CREATIVE_PROVIDER_KEYS = ["gemini", "openai"] as const;
export type KnownCreativeProviderKey = (typeof KNOWN_CREATIVE_PROVIDER_KEYS)[number];

export function isKnownCreativeProviderKey(key: string): key is KnownCreativeProviderKey {
  return (KNOWN_CREATIVE_PROVIDER_KEYS as readonly string[]).includes(key);
}

let geminiProviderSingleton: CreativeProvider | null = null;
let openaiProviderSingleton: CreativeProvider | null = null;

async function getGeminiProvider(): Promise<CreativeProvider> {
  if (!geminiProviderSingleton) {
    const { createGeminiCreativeProvider } = await import("./geminiCreativeProvider");
    geminiProviderSingleton = createGeminiCreativeProvider();
  }
  return geminiProviderSingleton;
}

async function getOpenAiProvider(): Promise<CreativeProvider> {
  if (!openaiProviderSingleton) {
    const { createOpenAiCreativeProvider } = await import("./openaiCreativeProvider");
    openaiProviderSingleton = createOpenAiCreativeProvider();
  }
  return openaiProviderSingleton;
}

/** No invisible provider switching: returns null for anything not explicitly registered here. */
export async function resolveCreativeProvider(providerKey: string): Promise<CreativeProvider | null> {
  if (providerKey === "gemini") return getGeminiProvider();
  if (providerKey === "openai") return getOpenAiProvider();
  return null;
}

/** Global default remains Gemini. A job/route must explicitly request "openai" to use it. */
export async function getDefaultCreativeProvider(): Promise<CreativeProvider> {
  return getGeminiProvider();
}

/** Truthful availability map for staff-facing provider selection UI — never claims an unconfigured provider is available. */
export async function getConfiguredCreativeProviders(): Promise<Record<KnownCreativeProviderKey, boolean>> {
  const [gemini, openai] = await Promise.all([getGeminiProvider(), getOpenAiProvider()]);
  const [geminiConfigured, openaiConfigured] = await Promise.all([gemini.isConfigured(), openai.isConfigured()]);
  return { gemini: geminiConfigured, openai: openaiConfigured };
}

export const DETERMINISTIC_FALLBACK_KEY = "deterministic_fallback";

export function isDeterministicFallback(providerKey: string): boolean {
  return providerKey === DETERMINISTIC_FALLBACK_KEY;
}
