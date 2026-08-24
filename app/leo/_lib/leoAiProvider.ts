/**
 * LEO-10 narrow provider adapter — native fetch, server-only.
 * Owns credential/model/timeout/response extraction only.
 * Does not own truth, governance, DB, or actions.
 */
import "server-only";

import { getLeoAiApiKey, getLeoAiModel, LEO_AI_BOUNDS } from "@/app/leo/_lib/leoAiConfig";

export type LeoAiProviderResult =
  | { ok: true; text: string; model: string }
  | { ok: false; error: string; model: string | null };

/**
 * Single chat completion request. At most one synthesis call per owner query (caller enforces).
 */
export async function callLeoAiProvider(args: {
  systemPrompt: string;
  userPayload: string;
  temperature?: number;
}): Promise<LeoAiProviderResult> {
  const apiKey = getLeoAiApiKey();
  const model = getLeoAiModel();
  if (!apiKey) {
    return { ok: false, error: "provider_unconfigured", model: null };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LEO_AI_BOUNDS.timeoutMs);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature:
          typeof args.temperature === "number" && Number.isFinite(args.temperature)
            ? Math.min(1, Math.max(0, args.temperature))
            : 0,
        max_tokens: LEO_AI_BOUNDS.maxResponseTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: args.systemPrompt },
          { role: "user", content: args.userPayload },
        ],
      }),
    });

    const body = (await res.json()) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
    };

    if (!res.ok) {
      const msg = body.error?.message?.trim() || `provider_http_${res.status}`;
      return { ok: false, error: msg.slice(0, 200), model };
    }

    const text = body.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return { ok: false, error: "empty_provider_response", model };
    }
    return { ok: true, text, model };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      error: aborted ? "provider_timeout" : "provider_request_failed",
      model,
    };
  } finally {
    clearTimeout(timer);
  }
}
