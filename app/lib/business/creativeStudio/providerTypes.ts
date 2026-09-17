/**
 * Program 6, Gate 6P — AI / Creative Provider Abstraction.
 * Reuses existing Gemini provider pattern; Package A adds OpenAI as a second provider.
 * Deterministic fallback when provider unavailable.
 *
 * Package A, Gate 10 — IMAGE_GENERATION reconciliation. Pixel image generation is bounded and
 * OPT-IN, never blindly flipped live: `isImageGenerationLive()` is true only when an OpenAI key
 * is configured on the server AND the OPENAI_IMAGE_GENERATION_ENABLED env flag is explicitly set.
 * Generated images always enter the existing business_creative_assets review lifecycle
 * (approval_state defaults to "pending") — never auto-approved, never auto-published.
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

export interface CreativeImageProviderInput {
  readonly prompt: string;
  readonly size?: string;
}

export interface CreativeImageProviderResult {
  ok: boolean;
  failureCode?: string;
  failureReason?: string;
  /** Raw image bytes as base64 — the caller is responsible for uploading to Leonix-controlled storage. */
  imageBase64?: string;
  revisedPrompt?: string | null;
}

export interface CreativeProvider {
  providerKey: string;
  modelKey: string;
  supports: readonly CreativeProviderCapability[];
  isConfigured(): Promise<boolean>;
  generateText(input: CreativeProviderInput): Promise<CreativeProviderResult>;
  generateImageBrief?(input: CreativeProviderInput): Promise<CreativeProviderResult>;
  /** Bounded, opt-in pixel generation — see isImageGenerationLive(). Not implemented by Gemini. */
  generateImage?(input: CreativeImageProviderInput): Promise<CreativeImageProviderResult>;
}

export function isCapabilityLive(capability: string): boolean {
  return (LIVE_CAPABILITIES as readonly string[]).includes(capability);
}

/**
 * Never blindly flipped live. Requires BOTH an explicit opt-in flag and a configured OpenAI key —
 * absence of either means image generation reports NOT LIVE, truthfully, everywhere it is checked.
 */
export function isImageGenerationLive(): boolean {
  const optIn = (process.env.OPENAI_IMAGE_GENERATION_ENABLED ?? "").trim().toLowerCase();
  const enabled = optIn === "true" || optIn === "1";
  if (!enabled) return false;
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
