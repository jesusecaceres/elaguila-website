/**
 * Recursos Spanish Bridge — Gate ES-3D. Lightweight deterministic post-check: a translated field
 * must never introduce a structured token (phone-like number, URL, email, explicit 24/7
 * indicator, numeric value, or currency amount) that was absent from the source text. This
 * catches invented facts a language model might slip in despite the prompt's rules — it never
 * tries to auto-correct, only to detect and reject. Pure, no network/DB.
 */

const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
const URL_RE = /https?:\/\/[^\s)"'<>]+/gi;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const ALWAYS_OPEN_RE = /\b24\/7\b|\b24-7\b|\b24 hours?\b|\bveinticuatro horas\b/gi;
const CURRENCY_RE = /\$\s?\d+(?:,\d{3})*(?:\.\d{2})?/g;
const NUMBER_RE = /\b\d+(?:\.\d+)?\b/g;

function normalizeDigits(s: string): string {
  return s.replace(/\D/g, "");
}

function extractTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const m of text.matchAll(PHONE_RE)) {
    const digits = normalizeDigits(m[0]);
    if (digits.length >= 7) tokens.add(`phone:${digits}`);
  }
  for (const m of text.matchAll(URL_RE)) tokens.add(`url:${m[0].toLowerCase().replace(/\/+$/, "")}`);
  for (const m of text.matchAll(EMAIL_RE)) tokens.add(`email:${m[0].toLowerCase()}`);
  for (const m of text.matchAll(ALWAYS_OPEN_RE)) tokens.add("always-open");
  for (const m of text.matchAll(CURRENCY_RE)) tokens.add(`currency:${normalizeDigits(m[0])}`);
  for (const m of text.matchAll(NUMBER_RE)) tokens.add(`number:${m[0]}`);
  return tokens;
}

export type IntegrityCheckResult = { ok: true } | { ok: false; invented: string[] };

/**
 * Compares a translated field against its own source text. Returns the tokens present in the
 * translation but absent from the source — a non-empty list means the translation likely
 * introduced a fact the source never stated. Never auto-corrects; the caller must reject the
 * field's proposal, not attempt to strip/fix the invented content.
 */
export function checkFieldTranslationIntegrity(sourceText: string | null, translatedText: string | null): IntegrityCheckResult {
  if (!translatedText) return { ok: true }; // nothing translated, nothing to invent
  if (!sourceText) return { ok: false, invented: [...extractTokens(translatedText)] }; // translated content from an empty source is itself invention

  const sourceTokens = extractTokens(sourceText);
  const translatedTokens = extractTokens(translatedText);
  const invented = [...translatedTokens].filter((t) => !sourceTokens.has(t));
  return invented.length === 0 ? { ok: true } : { ok: false, invented };
}
