/**
 * Saved Search 06 — Rentas category resolver for the shared delivery engine (Gate 14). Reuses the
 * exact same eligibility gate and canonical URL contract as the Rentas match orchestrator.
 *
 * Site-origin note: no Rentas-specific site-origin helper exists in the repo (confirmed by direct
 * search — `app/(site)/clasificados/rentas/**` has none). `getBrSiteOrigin()` is a plain,
 * category-agnostic env-driven resolver (`NEXT_PUBLIC_SITE_URL` -> `VERCEL_URL` ->
 * `http://localhost:3000`) with no Bienes-Raíces-specific logic in its implementation — reused
 * here rather than duplicating a third identical implementation or editing a non-Saved-Search file
 * to rename it (out of this build's scope per Gate 27).
 */
import "server-only";
import { queryRentasListingById } from "@/app/clasificados/rentas/lib/rentasListingPublicSelect";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { certifyRentasPublicEligibleListing } from "./rentasPublicEligibleListing";
import { getBrSiteOrigin } from "@/app/lib/clasificados/bienes-raices/stripeBrConfig";
import { rentasListingPublicPath } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import type { SavedSearchDeliveryCategoryResolver } from "../delivery/savedSearchDeliveryCategoryResolver";

export const rentasSavedSearchDeliveryResolver: SavedSearchDeliveryCategoryResolver = {
  async revalidateListingStillEligible(listingId: string): Promise<boolean> {
    if (!isSupabaseAdminConfigured()) return false;
    const { data, error } = await queryRentasListingById(getAdminSupabase(), listingId);
    if (error || !data) return false;
    return certifyRentasPublicEligibleListing(data as Record<string, unknown>) !== null;
  },
  buildDetailUrl(listingId: string): string {
    return `${getBrSiteOrigin()}${rentasListingPublicPath(listingId)}?lang=es`;
  },
};
