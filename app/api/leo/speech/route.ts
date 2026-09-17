/**
 * LEO-VOICE.1 owner-only neural text-to-speech route.
 *
 * Turns already-computed LEO response text into warm, natural speech audio
 * via OpenAI's gpt-4o-mini-tts. Output-only: no reasoning, no evidence, no
 * governance, no action execution. OPENAI_API_KEY never leaves the server.
 *
 * Generates audio ONLY on an explicit request from this route (Read aloud /
 * Hands-Free) — nothing here runs automatically or in the background.
 */
import "server-only";
import { resolveLeoAccess } from "@/app/leo/_lib/leoAccess";
import {
  LEO_TTS_BOUNDS,
  getLeoTtsModel,
  getLeoTtsVoice,
  isLeoTtsConfigured,
  LEO_TTS_VOICE_INSTRUCTIONS,
} from "@/app/leo/_lib/leoTtsConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function methodNotAllowed() {
  return Response.json(
    { ok: false, error: "method_not_allowed", message: "POST only." },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export async function GET() {
  return methodNotAllowed();
}
export async function PUT() {
  return methodNotAllowed();
}
export async function PATCH() {
  return methodNotAllowed();
}
export async function DELETE() {
  return methodNotAllowed();
}

/**
 * Minimal secret-safe structured observability (LEO-ADMIN-OS-FINAL, Phase 24).
 * Never logs API keys, the spoken text, or model output — route/outcome
 * metadata only, for diagnosability of Preview/Production TTS failures.
 */
function logLeoSpeechOutcome(meta: {
  fallbackUsed: boolean;
  failureClass:
    | "NONE"
    | "AUTH_DENIED"
    | "PROVIDER_NOT_CONFIGURED"
    | "PROVIDER_ERROR"
    | "PROVIDER_TIMEOUT"
    | "INTERNAL_ERROR";
  durationMs: number;
  providerHttpCategory?: string | null;
}) {
  console.log(
    JSON.stringify({
      route: "leo/speech",
      provider_attempted: "openai_tts",
      fallback_used: meta.fallbackUsed,
      failure_class: meta.failureClass,
      duration_ms: meta.durationMs,
      provider_http_category: meta.providerHttpCategory ?? null,
    }),
  );
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    const access = await resolveLeoAccess();
    if (!access.allowed) {
      const status = access.reason === "unauthenticated" ? 401 : 403;
      logLeoSpeechOutcome({ fallbackUsed: true, failureClass: "AUTH_DENIED", durationMs: Date.now() - startedAt });
      return Response.json({ ok: false, error: "forbidden", reason: access.reason }, { status });
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return Response.json(
        { ok: false, error: "invalid_content_type", message: "application/json required." },
        { status: 415 },
      );
    }

    let parsed: unknown;
    try {
      parsed = await req.json();
    } catch {
      return Response.json({ ok: false, error: "invalid_json", message: "Malformed JSON." }, { status: 400 });
    }

    const rawText = parsed && typeof parsed === "object" ? (parsed as { text?: unknown }).text : null;
    const text = typeof rawText === "string" ? rawText.trim() : "";
    if (!text) {
      return Response.json({ ok: false, error: "empty_text", message: "text is required." }, { status: 400 });
    }
    const bounded = text.length > LEO_TTS_BOUNDS.maxTextChars ? text.slice(0, LEO_TTS_BOUNDS.maxTextChars) : text;

    if (!isLeoTtsConfigured()) {
      logLeoSpeechOutcome({
        fallbackUsed: true,
        failureClass: "PROVIDER_NOT_CONFIGURED",
        durationMs: Date.now() - startedAt,
      });
      return Response.json(
        { ok: false, error: "provider_unconfigured", message: "Neural speech is not configured." },
        { status: 503 },
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LEO_TTS_BOUNDS.timeoutMs);
    try {
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: getLeoTtsModel(),
          voice: getLeoTtsVoice(),
          input: bounded,
          instructions: LEO_TTS_VOICE_INSTRUCTIONS,
          response_format: "mp3",
        }),
      });

      if (!res.ok || !res.body) {
        // Never log secrets or the spoken text; status code bucket only.
        logLeoSpeechOutcome({
          fallbackUsed: true,
          failureClass: "PROVIDER_ERROR",
          durationMs: Date.now() - startedAt,
          providerHttpCategory: `${Math.floor(res.status / 100)}xx`,
        });
        return Response.json(
          { ok: false, error: `provider_http_${res.status}`, message: "Speech synthesis failed." },
          { status: 502 },
        );
      }

      const audio = await res.arrayBuffer();
      if (!audio.byteLength) {
        logLeoSpeechOutcome({ fallbackUsed: true, failureClass: "PROVIDER_ERROR", durationMs: Date.now() - startedAt });
        return Response.json(
          { ok: false, error: "empty_provider_response", message: "Speech synthesis returned no audio." },
          { status: 502 },
        );
      }

      logLeoSpeechOutcome({ fallbackUsed: false, failureClass: "NONE", durationMs: Date.now() - startedAt });
      return new Response(audio, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-store",
          "Content-Length": String(audio.byteLength),
        },
      });
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      logLeoSpeechOutcome({
        fallbackUsed: true,
        failureClass: aborted ? "PROVIDER_TIMEOUT" : "PROVIDER_ERROR",
        durationMs: Date.now() - startedAt,
      });
      return Response.json(
        { ok: false, error: aborted ? "provider_timeout" : "provider_request_failed", message: "Speech synthesis failed." },
        { status: aborted ? 504 : 502 },
      );
    } finally {
      clearTimeout(timer);
    }
  } catch {
    logLeoSpeechOutcome({ fallbackUsed: true, failureClass: "INTERNAL_ERROR", durationMs: Date.now() - startedAt });
    return Response.json({ ok: false, error: "internal_error", message: "Unexpected error." }, { status: 500 });
  }
}
