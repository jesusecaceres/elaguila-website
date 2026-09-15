/**
 * LEO-VOICE.1 — server-only neural text-to-speech configuration.
 * Reuses the existing OPENAI_API_KEY (no new secret). Does not touch the
 * general reasoning model path (leoAiConfig.ts / leoAiProvider.ts) — this is
 * output-only speech synthesis, never used for reasoning or governance.
 */
import "server-only";

export const LEO_TTS_BOUNDS = {
  /** Hard server-side cap regardless of caller bounding upstream. */
  maxTextChars: 2000,
  timeoutMs: 25_000,
} as const;

/** OpenAI TTS model — steerable voice + tone via `instructions`. */
export const LEO_TTS_MODEL_DEFAULT = "gpt-4o-mini-tts";

export function getLeoTtsModel(): string {
  return process.env.LEO_TTS_MODEL?.trim() || LEO_TTS_MODEL_DEFAULT;
}

/**
 * Named voice presets — intentionally just one for this gate ("friendly").
 * A larger voice-selector UI is out of scope; this keeps the door open
 * without building settings infrastructure now.
 */
export const LEO_TTS_VOICE_PRESETS = {
  friendly: "alloy",
} as const;

export type LeoTtsVoicePreset = keyof typeof LEO_TTS_VOICE_PRESETS;

export function getLeoTtsVoice(): string {
  const override = process.env.LEO_TTS_VOICE?.trim();
  return override || LEO_TTS_VOICE_PRESETS.friendly;
}

/**
 * Style steering for gpt-4o-mini-tts's `instructions` parameter.
 * Warm executive-coach tone — not an announcer, not an IVR, not theatrical.
 */
export const LEO_TTS_VOICE_INSTRUCTIONS =
  "Speak warmly and naturally, like a trusted executive coach. Friendly and " +
  "conversational, with calm confidence. Use natural pauses and phrasing. " +
  "Do not sound like an announcer, narrator, robot, or customer-service IVR. " +
  "Keep pacing at a normal, relaxed conversational speed.";

export function isLeoTtsConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
