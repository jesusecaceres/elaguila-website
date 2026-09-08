import "server-only";

/**
 * Recursos Spanish Bridge — Gate ES-3A/B/C. Same AI Gateway shape as
 * app/lib/recursos/intake/aiProposalAdapter.ts (no new provider abstraction): Vercel AI Gateway,
 * strict system prompt, structured JSON only, temperature 0, 12s timeout, fail-closed to null on
 * any error/timeout/unavailability, no retries.
 *
 * CRITICAL doctrine difference from aiProposalAdapter.ts: this adapter is a TRANSLATOR, not a
 * field extractor. Input is already-verified resource truth (never raw scraped HTML/PDF text,
 * never unverified candidate prose) — it only ever rephrases meaning that already exists. It must
 * never add, remove, soften, broaden, narrow, or infer a fact, and an empty source field must
 * produce an empty output field, never invented content.
 */

export type TranslationDirection = "en-to-es" | "es-to-en";

export type TranslationInput = {
  organizationName: string;
  programName: string | null;
  /** Already-verified presentation prose only — never raw source text. */
  shortDescription: string | null;
  details: string | null;
  eligibility: string | null;
  hoursNote: string | null;
};

export type TranslationOutput = {
  shortDescription: string | null;
  details: string | null;
  eligibility: string | null;
  hoursNote: string | null;
};

const SYSTEM_PROMPT = `You are a professional translator for a community-resource directory, not a fact-checker and not a researcher.

You are given ALREADY-VERIFIED presentation text for a community resource. Your ONLY job is to translate the supplied meaning between English and Spanish.

Absolute rules:
- Translate only the supplied meaning. Do not add, remove, soften, broaden, narrow, summarize away, or infer facts.
- Preserve organization names, proper nouns, phone numbers, URLs, dates, times, eligibility qualifiers, and named programs exactly as given.
- Do not translate organization names unless the source organization itself provides a translated name — when in doubt, keep the name unchanged.
- If a source field is empty or null, return that field empty (null). Never invent content to fill an empty field.
- Do not infer 24/7 availability. Do not invent crisis language. Do not convert a general phone/service reference into a crisis line. Only carry forward what the source text itself states.
- Never add eligibility requirements, costs, hours, or service-area details that are not already present in the source text.

Return ONLY JSON matching this exact shape (use null for anything the source field itself was null/empty for):
{
  "shortDescription": string | null,
  "details": string | null,
  "eligibility": string | null,
  "hoursNote": string | null
}`;

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function parseTranslationJson(raw: string): TranslationOutput | null {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      parsed = JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  return {
    shortDescription: str(o.shortDescription),
    details: str(o.details),
    eligibility: str(o.eligibility),
    hoursNote: str(o.hoursNote),
  };
}

function userPayload(input: TranslationInput, direction: TranslationDirection): string {
  return JSON.stringify({
    direction,
    organizationName: input.organizationName,
    programName: input.programName,
    shortDescription: input.shortDescription,
    details: input.details,
    eligibility: input.eligibility,
    hoursNote: input.hoursNote,
  });
}

/**
 * Translates only already-verified presentation fields. Returns null on any unavailability,
 * timeout, or parse failure — caller must never fabricate and must route to human review.
 */
export async function translateVerifiedFacts(input: TranslationInput, direction: TranslationDirection): Promise<TranslationOutput | null> {
  const key = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!key) return null;

  // Nothing to translate — every field empty. Fail closed rather than calling the model for nothing.
  if (!input.shortDescription && !input.details && !input.eligibility && !input.hoursNote) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.RECURSOS_TRANSLATION_MODEL?.trim() || "openai/gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPayload(input, direction) },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    return parseTranslationJson(content);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function translationModelIdentifier(): string {
  return process.env.RECURSOS_TRANSLATION_MODEL?.trim() || "openai/gpt-4o-mini";
}
