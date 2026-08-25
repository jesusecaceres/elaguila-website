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

/**
 * Existing Resource Official-Spanish Bridge — Gate ES-9C. Official-source Spanish text is
 * independently published by a third party, not translated from Leonix's own English prose — so
 * comparing it against an English presentation field (checkFieldTranslationIntegrity's model)
 * would false-positive on almost every real submission (an official Spanish hours line will
 * legitimately contain digits absent from a short English description). Instead this compares the
 * proposed field against the resource's own STRUCTURED, already-verified facts: any phone/URL/
 * email/24-7-claim/currency/number token in the proposed text must already appear somewhere in
 * those structured fields (or the free-form English presentation text, included as a secondary
 * allowed source since it's already verified truth too) — never merely require identity with one
 * single EN field. Never auto-corrects; a failing field must be rejected, not silently fixed.
 *
 * This is a deterministic backstop only. It cannot catch a prose-level factual drift that
 * introduces no new phone/URL/email/24-7/currency/number token (e.g. a subtly wrong program
 * scope) — human review in the owner batch workspace remains load-bearing for that class of
 * error.
 */
export type OfficialSpanishStructuredFacts = {
  phone?: string | null;
  crisisPhone?: string | null;
  sms?: string | null;
  websiteUrl?: string | null;
  applicationUrl?: string | null;
  officialSourceUrl?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressZip?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  is24Hours?: boolean | null;
  /** Secondary allowed-token source: the resource's own already-verified EN presentation text for this same field family (e.g. hoursNoteEn when checking hoursNoteEs). Optional — omit if not applicable. */
  relatedVerifiedEnText?: string | null;
};

function allowedStructuredTokens(facts: OfficialSpanishStructuredFacts): Set<string> {
  const parts: string[] = [
    facts.phone ?? "",
    facts.crisisPhone ?? "",
    facts.sms ?? "",
    facts.websiteUrl ?? "",
    facts.applicationUrl ?? "",
    facts.officialSourceUrl ?? "",
    facts.email ?? "",
    facts.addressLine1 ?? "",
    facts.addressZip ?? "",
    facts.ageMin != null ? String(facts.ageMin) : "",
    facts.ageMax != null ? String(facts.ageMax) : "",
    facts.relatedVerifiedEnText ?? "",
  ];
  const tokens = extractTokens(parts.join(" "));
  if (facts.is24Hours === true) {
    tokens.add("always-open");
    // A genuinely 24/7 resource's Spanish text saying "24/7" also contains the raw digits 24 and
    // 7, which NUMBER_RE captures as separate number tokens — without this, a truthful 24/7 claim
    // would still fail integrity on those two numbers even though the semantic "always-open" token
    // itself is allowed. Only added when is24Hours is actually true, never unconditionally.
    tokens.add("number:24");
    tokens.add("number:7");
  }
  return tokens;
}

/**
 * Validates one proposed official-Spanish field against the resource's own structured verified
 * facts (never against English prose alone). Returns PASS/FAIL with the exact invented tokens —
 * reject-only, same discipline as checkFieldTranslationIntegrity. Never writes or autocorrects.
 */
export function checkOfficialSpanishFieldIntegrity(facts: OfficialSpanishStructuredFacts, proposedEsText: string | null): IntegrityCheckResult {
  if (!proposedEsText || !proposedEsText.trim()) return { ok: true }; // nothing proposed, nothing to invent

  const allowed = allowedStructuredTokens(facts);
  const proposedTokens = extractTokens(proposedEsText);
  const invented = [...proposedTokens].filter((t) => !allowed.has(t));
  return invented.length === 0 ? { ok: true } : { ok: false, invented };
}
