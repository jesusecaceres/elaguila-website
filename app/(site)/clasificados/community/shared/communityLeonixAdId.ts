export function formatLeonixAdId(listingId: string | null | undefined): string | null {
  const compact = String(listingId ?? "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .trim()
    .toUpperCase();
  if (!compact) return null;
  return `LNX-${compact.slice(0, 8)}`;
}
