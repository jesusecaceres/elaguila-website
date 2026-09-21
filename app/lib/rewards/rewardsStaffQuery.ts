/**
 * LEONIX IX REWARDS — the pure input rules the staff surfaces enforce.
 *
 * DELIBERATELY IO-FREE AND NOT `server-only`, so `scripts/verify-ix-rewards-behavior-01.ts` can
 * CALL these with crafted inputs instead of grepping the route's source text for reassuring
 * substrings. The earlier version of that check asserted the sanitizer's source contained the
 * characters `(`, `)`, `,` and `.` — true of every JavaScript function ever written — and would
 * have passed against a sanitizer that replaced nothing at all.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A wallet is addressed by a canonical uuid. Anything else is refused before it reaches a query. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Below this, a search term is not specific enough to run. */
export const SEARCH_TERM_MIN_LENGTH = 2;
/** And above this it is not a name, so it is truncated rather than passed through. */
export const SEARCH_TERM_MAX_LENGTH = 60;

/**
 * Make a human-typed search term safe to place inside a PostgREST `.or()` filter string.
 *
 * `.or()` takes a SINGLE STRING whose grammar uses `,` to separate conditions, `.` to separate an
 * operator from its operand, and `()` to group. Interpolating a raw term into it is not SQL
 * injection — Supabase still parameterizes — but it is FILTER injection: a term containing a comma
 * adds a condition the server never intended, and one containing `)` closes the group early. A
 * term of `a,status.eq.deleted` widened the result set straight past the `status` filter applied
 * beside it.
 *
 * So every character with meaning in that grammar is dropped, the `%` and `_` LIKE wildcards are
 * collapsed (as is `*`, which PostgREST rewrites to `%` for `like`/`ilike`), whitespace and
 * control characters are folded, and the length is bounded. What survives is a plain substring.
 *
 * Returns null when nothing usable is left — the caller refuses rather than searching for `%%`,
 * which would match every row.
 */
export function sanitizeSearchTerm(raw: string): string | null {
  const cleaned = raw
    // PostgREST `.or()` grammar, quoting, and escaping.
    .replace(/[(),.*"'\\]/g, " ")
    // LIKE wildcards.
    .replace(/[%_]/g, " ")
    // Any whitespace or control character, including newlines and non-breaking space. Written as
    // an explicit code-point test rather than a control-character range in a regex, which lint
    // rejects for good reason: a literal \x00-\x1f class in source is easy to mis-read.
    .split("")
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      const isControl = code <= 0x1f || code === 0x7f;
      return isControl || /\s/.test(ch) || code === 0x00a0 ? " " : ch;
    })
    .join("")
    .replace(/ +/g, " ")
    .trim()
    .slice(0, SEARCH_TERM_MAX_LENGTH)
    .trim();
  return cleaned.length >= SEARCH_TERM_MIN_LENGTH ? cleaned : null;
}
