/**
 * Program 6, Gate 6P — AI / Creative Provider Abstraction.
 * Reuses existing Gemini provider pattern. Deterministic fallback when provider unavailable.
 * IMAGE_GENERATION is NOT a live capability.
 */

export type CreativeProviderCapability =
  | "COPY"
  | "HEADLINES"
  | "BILINGUAL_COPY"
  | "CREATIVE_BRIEF"
  | "IMAGE_BRIEF"
  | "CANVA_PROMPT"
  | "CAMPAIGN_PLAN"
  | "WEBSITE_COPY";

export const LIVE_CAPABILITIES: readonly CreativeProviderCapability[] = [
  "COPY", "HEADLINES", "BILINGUAL_COPY", "CREATIVE_BRIEF", "IMAGE_BRIEF", "CANVA_PROMPT", "CAMPAIGN_PLAN", "WEBSITE_COPY",
];

export const NON_LIVE_CAPABILITIES: readonly string[] = [
  "IMAGE_GENERATION",
];

export interface CreativeProviderInput {
  readonly prompt: string;
  readonly systemInstruction: string;
  readonly responseSchema: Record<string, unknown>;
}

export interface CreativeProviderResult {
  ok: boolean;
  failureCode?: string;
  failureReason?: string;
  output?: Record<string, unknown>;
}

export interface CreativeProvider {
  providerKey: string;
  modelKey: string;
  supports: readonly CreativeProviderCapability[];
  isConfigured(): Promise<boolean>;
  generateText(input: CreativeProviderInput): Promise<CreativeProviderResult>;
  generateImageBrief?(input: CreativeProviderInput): Promise<CreativeProviderResult>;
}

export function isCapabilityLive(capability: string): boolean {
  return (LIVE_CAPABILITIES as readonly string[]).includes(capability);
}

export function isImageGenerationLive(): boolean {
  return false;
}
