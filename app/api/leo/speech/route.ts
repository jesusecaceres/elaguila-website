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

export async function POST(req: Request) {
  try {
    const access = await resolveLeoAccess();
    if (!access.allowed) {
      const status = access.reason === "unauthenticated" ? 401 : 403;
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
        // Never log secrets or the spoken text; status code only.
        return Response.json(
          { ok: false, error: `provider_http_${res.status}`, message: "Speech synthesis failed." },
          { status: 502 },
        );
      }

      const audio = await res.arrayBuffer();
      if (!audio.byteLength) {
        return Response.json(
          { ok: false, error: "empty_provider_response", message: "Speech synthesis returned no audio." },
          { status: 502 },
        );
      }

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
      return Response.json(
        { ok: false, error: aborted ? "provider_timeout" : "provider_request_failed", message: "Speech synthesis failed." },
        { status: aborted ? 504 : 502 },
      );
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return Response.json({ ok: false, error: "internal_error", message: "Unexpected error." }, { status: 500 });
  }
}
