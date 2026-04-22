import type { AutosPublicListing } from "@/app/clasificados/autos/data/autosPublicSampleTypes";
import { compareAutosListingFairTieBreak } from "@/app/clasificados/autos/lib/autosPublicListingScore";

/**
 * Primary recency for browse sort: `publicSortTimestamp` from Supabase row
 * (`max(published_at, updated_at)`), so dashboard edits / republish refresh surface as “newer”
 * without implying a separate paid “boost” product.
 */
export function listingPrimaryRecencyMs(l: AutosPublicListing): number {
  if (l.publicSortTimestamp) {
    const t = Date.parse(l.publicSortTimestamp);
    if (Number.isFinite(t)) return t;
  }
  return l.year * 1_000_000 + l.price;
}

/** Descending “newest” comparator for public browse (landing + results). */
export function compareNewestAutosPublic(a: AutosPublicListing, b: AutosPublicListing): number {
  const tb = listingPrimaryRecencyMs(b);
  const ta = listingPrimaryRecencyMs(a);
  if (tb !== ta) return tb - ta;
  if (b.year !== a.year) return b.year - a.year;
  if (b.price !== a.price) return b.price - a.price;
  return compareAutosListingFairTieBreak(a, b);
}
