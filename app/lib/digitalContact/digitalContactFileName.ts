/** Shared, client-safe filename sanitizer — keeps VCF and QR download filenames in sync. */
export function sanitizeDigitalContactFileNameBase(fullName: string, fallbackSlug: string): string {
  const safe = fullName
    .replace(/["“”]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics (á → a) so ASCII filenames read naturally
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return safe || fallbackSlug;
}
