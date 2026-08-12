/**
 * Program 6, Gate 6P — Creative provider registry.
 * Single place that declares provider truth. Gemini is the only live provider for V1.
 * Deterministic fallback produces structured production packets without a provider.
 */
import "server-only";

import type { CreativeProvider } from "./providerTypes";

let geminiProviderSingleton: CreativeProvider | null = null;

async function getGeminiProvider(): Promise<CreativeProvider> {
  if (!geminiProviderSingleton) {
    const { createGeminiCreativeProvider } = await import("./geminiCreativeProvider");
    geminiProviderSingleton = createGeminiCreativeProvider();
  }
  return geminiProviderSingleton;
}

export async function resolveCreativeProvider(providerKey: string): Promise<CreativeProvider | null> {
  if (providerKey === "gemini") return getGeminiProvider();
  return null;
}

export async function getDefaultCreativeProvider(): Promise<CreativeProvider> {
  return getGeminiProvider();
}

export const DETERMINISTIC_FALLBACK_KEY = "deterministic_fallback";

export function isDeterministicFallback(providerKey: string): boolean {
  return providerKey === DETERMINISTIC_FALLBACK_KEY;
}
