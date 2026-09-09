/**
 * LEO-19D — Pure config-presence probe (no server-only).
 * Does not expose secret values; only boolean presence for runtime truth.
 */
export function isLeoAiCredentialPresent(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
