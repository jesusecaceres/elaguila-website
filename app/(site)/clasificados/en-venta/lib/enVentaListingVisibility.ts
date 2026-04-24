import { isListingRowActiveAndPublishedForBrowse } from "@/app/(site)/clasificados/lib/listingPublicBrowseEligibility";

/**
 * En Venta public browse — category gate + canonical active/published rule
 * (`listingPublicBrowseEligibility`).
 */
export function isEnVentaListingPubliclyVisible(row: Record<string, unknown>): boolean {
  if (String(row.category ?? "").toLowerCase() !== "en-venta") return false;
  return isListingRowActiveAndPublishedForBrowse({
    status: row.status as string | null | undefined,
    is_published: row.is_published as boolean | null | undefined,
  });
}
