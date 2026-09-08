/**
 * Package A — narrow, shared server-only OpenAI client.
 *
 * Reuses the same conventions already proven in app/admin/_lib/listingAiModerationEngine.ts
 * (fetch to api.openai.com, OPENAI_API_KEY read server-side only, bounded error messages, JSON
 * response_format). This file only extracts the generic request/response plumbing so Creative
 * Studio does not duplicate it — it does not move or change moderation behavior.
 *
 * The API key is never logged, never returned to the caller, and never exposed to the browser
 * (this module is `server-only` and is only imported from server-only Creative Studio files).
 */
import "server-only";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";
const DEFAULT_TIMEOUT_MS = 30_000;

export function getOpenAiApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key || null;
}

export function isOpenAiConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

export type OpenAiChatResult =
  | { ok: true; text: string; usage: Record<string, unknown> | null }
  | { ok: false; failureCode: string; failureReason: string };

/**
 * Minimal chat-completions call. JSON-mode only (Creative Studio always requests structured
 * output). Never throws — every failure path (missing key, timeout, HTTP error, malformed body)
 * returns a normalized `{ ok: false }` result so callers can persist a bounded failure reason.
 */
export async function requestOpenAiChatCompletion(params: {
  model: string;
  systemInstruction: string;
  prompt: string;
  temperature?: number;
  timeoutMs?: number;
}): Promise<OpenAiChatResult> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    return { ok: false, failureCode: "provider_unavailable", failureReason: "OPENAI_API_KEY is not configured on the server." };
  }

  try {
    const res = await withTimeout(
      fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: params.model,
          temperature: params.temperature ?? 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: params.systemInstruction },
            { role: "user", content: params.prompt },
          ],
        }),
      }),
      params.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      "OpenAI request timed out.",
    );

    const body = (await res.json().catch(() => null)) as
      | { error?: { message?: string }; choices?: Array<{ message?: { content?: string } }>; usage?: Record<string, unknown> }
      | null;

    if (!res.ok || !body) {
      const msg = body?.error?.message?.trim() || `OpenAI HTTP ${res.status}`;
      return { ok: false, failureCode: "provider_failed", failureReason: msg.slice(0, 500) };
    }

    const text = body.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return { ok: false, failureCode: "invalid_provider_output", failureReason: "OpenAI response had no content." };
    }

    return { ok: true, text, usage: body.usage ?? null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "OpenAI request failed.";
    return { ok: false, failureCode: "provider_failed", failureReason: message.slice(0, 500) };
  }
}

export type OpenAiImageResult =
  | { ok: true; imageBase64: string; revisedPrompt: string | null }
  | { ok: false; failureCode: string; failureReason: string };

/**
 * Minimal image-generation call. Returns base64 image data (never a third-party URL — the caller
 * uploads it to Leonix-controlled storage). Never throws.
 */
export async function requestOpenAiImageGeneration(params: {
  model: string;
  prompt: string;
  size?: string;
  timeoutMs?: number;
}): Promise<OpenAiImageResult> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    return { ok: false, failureCode: "provider_unavailable", failureReason: "OPENAI_API_KEY is not configured on the server." };
  }

  try {
    const res = await withTimeout(
      fetch(OPENAI_IMAGES_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: params.model,
          prompt: params.prompt,
          size: params.size ?? "1024x1536",
          n: 1,
        }),
      }),
      params.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      "OpenAI image request timed out.",
    );

    const body = (await res.json().catch(() => null)) as
      | { error?: { message?: string }; data?: Array<{ b64_json?: string; revised_prompt?: string }> }
      | null;

    if (!res.ok || !body) {
      const msg = body?.error?.message?.trim() || `OpenAI HTTP ${res.status}`;
      return { ok: false, failureCode: "provider_failed", failureReason: msg.slice(0, 500) };
    }

    const image = body.data?.[0];
    if (!image?.b64_json) {
      return { ok: false, failureCode: "invalid_provider_output", failureReason: "OpenAI image response had no image data." };
    }

    return { ok: true, imageBase64: image.b64_json, revisedPrompt: image.revised_prompt ?? null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "OpenAI image request failed.";
    return { ok: false, failureCode: "provider_failed", failureReason: message.slice(0, 500) };
  }
}
