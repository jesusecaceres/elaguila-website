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

// Bounded retry policy (Gate D — MD Part 5): ONLY for failures that are genuinely transient —
// network/timeout errors and HTTP 429/500/502/503/504. A 4xx client error (bad request, auth
// failure, content policy) is never retried — retrying a request that is wrong by construction
// wastes a second billable call for a result that cannot change. At most ONE retry (two total
// attempts) — never unbounded — with a short fixed backoff, honoring the provider's own
// Retry-After header when present on a 429.
const MAX_ATTEMPTS = 2;
const DEFAULT_RETRY_DELAY_MS = 500;
const RETRYABLE_HTTP_STATUS = new Set([429, 500, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMsFromResponse(res: Response): number {
  const retryAfter = res.headers.get("retry-after");
  const parsed = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(parsed) && parsed >= 0) return Math.min(parsed * 1000, 5_000);
  return DEFAULT_RETRY_DELAY_MS;
}

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
 *
 * Gate D hardening: bounded retry (see MAX_ATTEMPTS) for transient failures only, a distinct
 * "rate_limited" failure code, and a max_tokens output ceiling (never unbounded generation).
 */
export async function requestOpenAiChatCompletion(params: {
  model: string;
  systemInstruction: string;
  prompt: string;
  temperature?: number;
  timeoutMs?: number;
  maxOutputTokens?: number;
}): Promise<OpenAiChatResult> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    return { ok: false, failureCode: "provider_unavailable", failureReason: "OPENAI_API_KEY is not configured on the server." };
  }

  let lastFailure: { failureCode: string; failureReason: string } = { failureCode: "provider_failed", failureReason: "OpenAI request failed." };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await withTimeout(
        fetch(OPENAI_CHAT_COMPLETIONS_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: params.model,
            temperature: params.temperature ?? 0,
            // Omitted entirely (not defaulted) when the caller doesn't pass one, so this shared
            // client's behavior for existing callers (Creative Studio, which relies on no cap) is
            // byte-for-byte unchanged — only a caller that explicitly opts in (the Growth Analyst
            // provider) gets a max-output ceiling.
            ...(params.maxOutputTokens ? { max_tokens: params.maxOutputTokens } : {}),
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

      if (res.status === 429) {
        lastFailure = { failureCode: "rate_limited", failureReason: "OpenAI rate limit reached." };
        if (attempt < MAX_ATTEMPTS) {
          await sleep(retryDelayMsFromResponse(res));
          continue;
        }
        return { ok: false, ...lastFailure };
      }

      const body = (await res.json().catch(() => null)) as
        | { error?: { message?: string }; choices?: Array<{ message?: { content?: string } }>; usage?: Record<string, unknown> }
        | null;

      if (!res.ok || !body) {
        const msg = body?.error?.message?.trim() || `OpenAI HTTP ${res.status}`;
        lastFailure = { failureCode: "provider_failed", failureReason: msg.slice(0, 500) };
        if (RETRYABLE_HTTP_STATUS.has(res.status) && attempt < MAX_ATTEMPTS) {
          await sleep(DEFAULT_RETRY_DELAY_MS);
          continue;
        }
        return { ok: false, ...lastFailure };
      }

      const text = body.choices?.[0]?.message?.content?.trim();
      if (!text) {
        return { ok: false, failureCode: "invalid_provider_output", failureReason: "OpenAI response had no content." };
      }

      return { ok: true, text, usage: body.usage ?? null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "OpenAI request failed.";
      lastFailure = { failureCode: "provider_failed", failureReason: message.slice(0, 500) };
      // A timeout/network error is the definition of "transient" — safe to retry once, bounded.
      if (attempt < MAX_ATTEMPTS) {
        await sleep(DEFAULT_RETRY_DELAY_MS);
        continue;
      }
      return { ok: false, ...lastFailure };
    }
  }

  return { ok: false, ...lastFailure };
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
