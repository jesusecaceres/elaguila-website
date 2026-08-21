/**
 * Package A — OpenAI creative provider implementation.
 * Implements the EXISTING CreativeProvider contract (providerTypes.ts) exactly like
 * geminiCreativeProvider.ts — same shape, same fallback-safe behavior. Gemini is unchanged and
 * remains the default provider; OpenAI is an additional, explicitly-selectable provider.
 *
 * Server-only; OPENAI_API_KEY is read only via app/lib/openai/serverClient.ts, never persisted,
 * never logged, never returned to the browser.
 */
import "server-only";

import { isOpenAiConfigured, requestOpenAiChatCompletion, requestOpenAiImageGeneration } from "@/app/lib/openai/serverClient";
import type {
  CreativeImageProviderInput, CreativeImageProviderResult, CreativeProvider, CreativeProviderInput, CreativeProviderResult,
} from "./providerTypes";

/**
 * Kept separate from OPENAI_MODERATION_MODEL (app/admin/_lib/listingAiModerationEngine.ts) so
 * creative-generation model choice/cost tuning never collides with moderation configuration.
 */
export function getCreativeOpenAiModel(): string {
  return process.env.OPENAI_CREATIVE_MODEL?.trim() || "gpt-4o-mini";
}

export function isOpenAiCreativeConfigured(): boolean {
  return isOpenAiConfigured();
}

/** Kept separate from text/brief model configuration — image cost/behavior tuning is independent. */
export function getCreativeOpenAiImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1";
}

async function generateOpenAiImage(input: CreativeImageProviderInput): Promise<CreativeImageProviderResult> {
  const result = await requestOpenAiImageGeneration({
    model: getCreativeOpenAiImageModel(),
    prompt: input.prompt,
    size: input.size,
  });
  if (!result.ok) {
    return { ok: false, failureCode: result.failureCode, failureReason: result.failureReason };
  }
  return { ok: true, imageBase64: result.imageBase64, revisedPrompt: result.revisedPrompt };
}

async function generateOpenAiText(input: CreativeProviderInput): Promise<CreativeProviderResult> {
  const result = await requestOpenAiChatCompletion({
    model: getCreativeOpenAiModel(),
    systemInstruction: input.systemInstruction,
    prompt: input.prompt,
  });

  if (!result.ok) {
    return { ok: false, failureCode: result.failureCode, failureReason: result.failureReason };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    return { ok: false, failureCode: "invalid_provider_output", failureReason: "OpenAI response was not valid JSON." };
  }

  return { ok: true, output: parsed as Record<string, unknown> };
}

export function createOpenAiCreativeProvider(): CreativeProvider {
  return {
    providerKey: "openai",
    modelKey: getCreativeOpenAiModel(),
    supports: ["COPY", "HEADLINES", "BILINGUAL_COPY", "CREATIVE_BRIEF", "IMAGE_BRIEF", "CANVA_PROMPT", "CAMPAIGN_PLAN", "WEBSITE_COPY"],
    async isConfigured(): Promise<boolean> {
      return isOpenAiCreativeConfigured();
    },
    generateText: generateOpenAiText,
    // IMAGE_BRIEF reuses generateText — it is a text description of a desired image, never pixel
    // generation.
    generateImageBrief: generateOpenAiText,
    // Bounded, opt-in pixel generation. Callers MUST check providerTypes.isImageGenerationLive()
    // before invoking this — it is false unless OPENAI_IMAGE_GENERATION_ENABLED is explicitly set
    // on top of a configured OPENAI_API_KEY. Gemini does not implement generateImage.
    generateImage: generateOpenAiImage,
  };
}
