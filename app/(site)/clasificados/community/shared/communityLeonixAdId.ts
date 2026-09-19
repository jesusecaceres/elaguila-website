/**
 * The Leonix Ad ID people see. The STORED `listings.leonix_ad_id` (BUSCO-/CLASS-/COM-/PET-YYYY-NNNNNN,
 * assigned by the DB trigger) is what Admin search, payment records and support use, so it wins whenever
 * it exists. The derived `LNX-<8 chars of uuid>` is only a fallback for rows that have no stored id
 * (previews, or legacy rows) — never a competing identity for a row that has one.
 */
export function formatLeonixAdId(
  listingId: string | null | undefined,
  storedLeonixAdId?: string | null,
): string | null {
  const stored = String(storedLeonixAdId ?? "").trim();
  if (stored) return stored;
  const compact = String(listingId ?? "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .trim()
    .toUpperCase();
  if (!compact) return null;
  return `LNX-${compact.slice(0, 8)}`;
}
