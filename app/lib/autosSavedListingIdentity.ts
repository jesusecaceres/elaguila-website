/**
 * Gate AUTO1 — saved_listings row identity for Autos public listings.
 */
import { autosEngagementListingKey } from "@/app/(site)/clasificados/autos/lib/recordAutosGlobalAnalytics";

export type AutosSavedListingSource = {
  id: string;
  leonix_ad_id?: string | null;
};

export type AutosSaveExtras = {
  category?: string;
  source_table?: string;
  source_id?: string;
  canonical_ad_id?: string;
};

export function autosSavedListingExtras(row: AutosSavedListingSource): AutosSaveExtras {
  const sourceId = (row.id ?? "").trim();
  const listingId = autosEngagementListingKey(row);
  return {
    category: "autos",
    source_table: "autos_classifieds_listings",
    source_id: sourceId,
    canonical_ad_id: listingId,
  };
}
