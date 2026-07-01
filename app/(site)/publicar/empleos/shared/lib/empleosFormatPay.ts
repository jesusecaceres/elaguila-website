/**
 * Leonix Empleos — pay/salary display formatter.
 *
 * Rules:
 * - Numeric-only values get a leading $.
 * - Do not double-prefix $.
 * - Ranges like "20-25" → "$20–$25"; "20-25 por hora" → "$20–$25 por hora".
 * - Verbatim pass-through for non-numeric text: A convenir, DOE, Comisión, etc.
 */

const VERBATIM_PAY = /^(a convenir|depende|doe|comisi[oó]n|propinas?|bonos?|negociable|por convenir|tbd|to be determined|flexible)/i;

function prefixDollar(s: string): string {
  const trimmed = s.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("$")) return trimmed;
  if (/^\d/.test(trimmed)) return `$${trimmed}`;
  return trimmed;
}

export function formatEmpleosPay(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return s;

  if (VERBATIM_PAY.test(s)) return s;

  const rangeMatch = s.match(
    /^\$?(\d[\d,.]*)(?:\s*[-\u2013]\s*)\$?(\d[\d,.]*)(.*)?$/
  );
  if (rangeMatch) {
    const lo = prefixDollar(rangeMatch[1].replace(/,/g, ""));
    const hi = prefixDollar(rangeMatch[2].replace(/,/g, ""));
    const suffix = (rangeMatch[3] ?? "").trim();
    return suffix ? `${lo}–${hi} ${suffix}` : `${lo}–${hi}`;
  }

  if (s.startsWith("$")) return s;
  if (/^\d/.test(s)) return prefixDollar(s);

  return s;
}
