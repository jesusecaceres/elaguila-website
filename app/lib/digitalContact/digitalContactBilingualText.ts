/**
 * Leonix Executive Contact Hub — bilingual text helpers (presentation-only).
 *
 * The `executives` table has one `title` column and one `bio` column (no schema changes
 * permitted). Executives who want a bilingual title store it as "English · Español" —
 * these helpers split that back into two lines for premium display. Single-language
 * values (no separator) degrade gracefully to one line, so this works for every
 * executive, not just bilingual ones.
 */

export type SplitTitle = { primary: string; secondary?: string };

export function splitBilingualTitle(title: string): SplitTitle {
  const parts = title
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { primary: parts[0]!, secondary: parts.slice(1).join(" · ") };
  }
  return { primary: title.trim() };
}

export type BilingualBio = { en?: string; es?: string };

/**
 * Parses the admin "Biography" field's optional "EN — …" / "ES — …" convention into
 * two paragraphs. Bios written without that convention are shown as-is under both
 * languages (no content is ever hidden or invented).
 */
export function parseBilingualBio(bio: string | undefined | null): BilingualBio {
  const text = (bio ?? "").trim();
  if (!text) return {};

  const enMatch = text.match(/EN\s*[—\-:]\s*([\s\S]*?)(?=\n\s*ES\s*[—\-:]|$)/i);
  const esMatch = text.match(/ES\s*[—\-:]\s*([\s\S]*)$/i);

  if (!enMatch && !esMatch) return { en: text, es: text };
  return { en: enMatch?.[1]?.trim() || undefined, es: esMatch?.[1]?.trim() || undefined };
}

/** Splits a parsed bio paragraph into lines for a lead-sentence + body treatment. */
export function bioParagraphLines(paragraph: string | undefined): string[] {
  if (!paragraph) return [];
  return paragraph
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}
