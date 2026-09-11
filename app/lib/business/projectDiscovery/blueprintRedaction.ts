/**
 * Client Discovery & Project Blueprint Engine, Gate 5 — narrow secret/credential boundary
 * sanitizer for generated blueprint text (MD <security>). No general secret-management system
 * exists anywhere in this codebase (confirmed by direct inspection) and this file does not build
 * one — it only ever strips an obvious credential-shaped substring from free text before that text
 * is embedded in a blueprint packet/Markdown snapshot. Pure, no I/O.
 */

const CREDENTIAL_PATTERNS: readonly RegExp[] = [
  // "password: xyz", "pwd=xyz", "contraseña: xyz"
  /\b(password|contrase[ñn]a|pwd)\s*[:=]\s*\S+/gi,
  // Generic API-key / token / secret assignment ("api_key: sk_live_...", "token=...")
  /\b(api[_-]?key|access[_-]?token|secret|service[_-]?role[_-]?key|oauth[_-]?token|recovery[_-]?code)s?\s*[:=]\s*\S+/gi,
  // Stripe/Sanity/Supabase/OpenAI-shaped raw key prefixes, wherever they appear standalone.
  /\b(sk_live_|sk_test_|sbp_|sb-|eyJ[a-zA-Z0-9_-]{20,})\S*/g,
];

const REDACTED_PLACEHOLDER = "[REDACTED]";

/** Strips obvious credential-shaped substrings from a single free-text value. Never throws. */
export function redactCredentialLikeText(value: string): string {
  let result = value;
  for (const pattern of CREDENTIAL_PATTERNS) {
    result = result.replace(pattern, REDACTED_PLACEHOLDER);
  }
  return result;
}

/** True when the given text still contains an obvious credential-shaped substring after redaction would apply — used by tests/guards, never to decide whether to publish unredacted text. */
export function containsCredentialLikeText(value: string): boolean {
  return CREDENTIAL_PATTERNS.some((p) => new RegExp(p.source, p.flags).test(value));
}

/** Redacts every string value in a shallow record (one level of nesting) — used as the last boundary pass over free-text packet fields before they reach the Markdown generator. */
export function redactRecordStrings<T extends Record<string, unknown>>(record: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    out[key] = typeof value === "string" ? redactCredentialLikeText(value) : value;
  }
  return out as T;
}
