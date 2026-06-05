/**
 * Gate EMP1 — saved_listings row identity for Empleos public listings.
 */
import { empleosEngagementListingKey } from "@/app/(site)/clasificados/empleos/lib/recordEmpleosGlobalAnalytics";

export type EmpleosSavedListingSource = {
  id: string;
  slug?: string | null;
  leonix_ad_id?: string | null;
};

export type EmpleosSaveExtras = {
  category?: string;
  source_table?: string;
  source_id?: string;
  canonical_ad_id?: string;
};

export function empleosSavedListingExtras(row: EmpleosSavedListingSource): EmpleosSaveExtras {
  const sourceId = (row.id ?? "").trim();
  const listingId = empleosEngagementListingKey(row);
  return {
    category: "empleos",
    source_table: "empleos_public_listings",
    source_id: sourceId,
    canonical_ad_id: listingId,
  };
}
