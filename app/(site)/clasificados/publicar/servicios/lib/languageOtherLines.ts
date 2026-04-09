/**
 * Parse "Otro idioma" textarea: one language per line; also splits comma/semicolon paste.
 */
export function parseLanguageOtherLines(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/\r?\n|,|;/)) {
    const t = part.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t.slice(0, 80));
    if (out.length >= 12) break;
  }
  return out;
}
