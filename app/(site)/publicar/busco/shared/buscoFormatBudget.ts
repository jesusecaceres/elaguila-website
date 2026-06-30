/**
 * Format a Busco budget string for public display.
 *
 * Rules:
 * - "50" → "$50"
 * - "50-100" / "50 - 100" → "$50–$100"
 * - "$50-$100" → "$50–$100"
 * - "$50" stays "$50" (no double prefix)
 * - "100 o menos" → "$100 o menos" (leading digit detected)
 * - "Gratis" / "Intercambio" / "Donación" / "Depende" → unchanged
 * - Arbitrary non-price text → unchanged
 */
export function formatBuscoBudget(raw: string): string {
  const s = raw.trim();
  if (!s) return s;

  const VERBATIM = /^(gratis|intercambio|donaci[oó]n|depende|negociable|flexible|nada|free|donation|negotiable)/i;
  if (VERBATIM.test(s)) return s;

  // Already has $ — normalize range separators only
  if (s.startsWith("$")) {
    return normalizeRange(s);
  }

  // Detect leading number (possibly with range)
  const LEADING_NUM = /^\d/;
  if (LEADING_NUM.test(s)) {
    return normalizeRange(addDollarToRange(s));
  }

  // Fallback: return as-is
  return s;
}

function addDollarToRange(s: string): string {
  // "50-100" or "50 - 100"
  const rangeMatch = s.match(/^(\d[\d,.]*)(\s*[-–]\s*)(\d[\d,.]*)(.*)$/);
  if (rangeMatch) {
    const [, lo, , hi, rest] = rangeMatch;
    return `$${lo}–$${hi}${rest}`;
  }
  return `$${s}`;
}

function normalizeRange(s: string): string {
  // "$50-$100" or "$50 - $100" → "$50–$100"
  return s.replace(/(\$[\d,.]+)\s*[-–]\s*(\$[\d,.]+)/g, "$1–$2");
}
