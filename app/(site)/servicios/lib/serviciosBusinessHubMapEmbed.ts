/**
 * Safe Google Maps embed src from a structured address — no API key, no user iframe HTML.
 * Pattern: https://www.google.com/maps?q=<address>&output=embed
 */
export function buildServiciosGoogleMapsEmbedSrc(address: string): string | undefined {
  const q = address.trim().replace(/\s+/g, " ");
  if (!q || q.length < 4) return undefined;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}
