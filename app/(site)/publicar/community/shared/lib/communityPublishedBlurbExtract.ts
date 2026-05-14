/**
 * `publishCommunityQuickToListings` stores a composite `listings.description` (body + organizer + meta).
 * Public `blurb` is that string (minus Leonix markers). Preview shows only the first segment — the user's
 * free-text description — before structured fields. This extracts that same segment for WYSIWYG parity.
 */
export function extractCommunityQuickUserDescriptionFromPublishedBlurb(blurb: string): string {
  const t = String(blurb ?? "").trim();
  if (!t) return "";
  const firstBlock = t.split(/\n\n+/)[0]?.trim() ?? "";
  if (firstBlock.startsWith("Organizador:") || firstBlock.startsWith("Organizer:")) return "";
  return firstBlock;
}
