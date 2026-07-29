/**
 * Gate I.4.3 — pure, zero-I/O precedence/chunking logic for the batched Revenue OS ad-plan proof
 * lookup (`fetchRevenueOsAdPlanProofsForListings`, `revenuePaymentLookup.ts`). Extracted into its
 * own file, with no `"server-only"` import and no transitive dependency on one, specifically so a
 * plain `tsx` self-test can exercise the exact real logic directly — the same pattern already
 * established for the BR/Restaurantes lifecycle gates (e.g. `brListingLifecycleEligibility.ts`),
 * needed here for the same reason: `revenuePaymentLookup.ts` itself is `"server-only"` and cannot
 * be loaded outside the Next.js server runtime.
 */

export const REVENUE_OS_LOOKUP_CHUNK_SIZE = 80;

export type RevenueOsEntitlementRow = {
  listing_id: string | null;
  status: string | null;
  package_key: string | null;
  billing_mode: string | null;
  ends_at: string | null;
};

/** Splits `ids` into chunks of at most `REVENUE_OS_LOOKUP_CHUNK_SIZE`, preserving order. */
export function chunkListingIds(ids: readonly string[]): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += REVENUE_OS_LOOKUP_CHUNK_SIZE) {
    chunks.push(ids.slice(i, i + REVENUE_OS_LOOKUP_CHUNK_SIZE));
  }
  return chunks;
}

/**
 * Precedence: among rows for the same `listing_id`, keep the one with the LATEST `ends_at` —
 * identical to the original per-listing implementation's own
 * `.order("ends_at", { ascending: false }).limit(1)`. A row with no `listing_id` or no
 * `package_key` is never eligible (matches the original `if (!data?.package_key) continue;`
 * skip). Order-independent: the same input set always produces the same result regardless of
 * array order.
 */
export function pickBestRevenueOsEntitlementByListingId(
  rows: readonly RevenueOsEntitlementRow[],
): Map<string, RevenueOsEntitlementRow> {
  const bestByListingId = new Map<string, RevenueOsEntitlementRow>();
  for (const row of rows) {
    if (!row.listing_id || !row.package_key) continue;
    const existing = bestByListingId.get(row.listing_id);
    if (!existing) {
      bestByListingId.set(row.listing_id, row);
      continue;
    }
    const existingEndsAt = existing.ends_at ? new Date(existing.ends_at).getTime() : Number.NEGATIVE_INFINITY;
    const candidateEndsAt = row.ends_at ? new Date(row.ends_at).getTime() : Number.NEGATIVE_INFINITY;
    if (candidateEndsAt > existingEndsAt) bestByListingId.set(row.listing_id, row);
  }
  return bestByListingId;
}
