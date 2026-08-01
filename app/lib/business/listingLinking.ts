import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveListingSourceOwnershipContract, resolveOwnedListingIdentityKeys } from "@/app/lib/listingPlans/listingEntitlementOwnership";
import { hasVerifiedLinkForListing } from "./repositories/listingLinksRepo";
import { SERVICIOS_PUBLIC_LISTING_SELECT } from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingSort";
import { listAutosClassifiedsListingsForOwner, autosClassifiedsRowToDashboardRow } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";

export type ListingLinkVerification =
  | { ok: true }
  | { ok: false; reasonCode: "unsupported_listing_source" | "listing_ownership_unverified" | "listing_already_linked" };

/**
 * Safe listing-linking pre-check (Phase 11). Uses the canonical
 * LISTING_SOURCE_OWNERSHIP_CONTRACT exactly as-is — never duplicates owner-column knowledge.
 * Never mutates the listing row, never transfers ownership, never infers ownership from
 * display data. Fails closed for any source not in the contract.
 */
export async function verifyListingOwnershipForLinking(
  adminClient: SupabaseClient,
  params: { userId: string; listingSource: string; listingId: string },
): Promise<ListingLinkVerification> {
  const contract = resolveListingSourceOwnershipContract(params.listingSource);
  if (!contract) {
    return { ok: false, reasonCode: "unsupported_listing_source" };
  }

  const alreadyLinked = await hasVerifiedLinkForListing(adminClient, params.listingSource, params.listingId);
  if (alreadyLinked) {
    return { ok: false, reasonCode: "listing_already_linked" };
  }

  const owned = await resolveOwnedListingIdentityKeys(adminClient, params.listingSource, [params.listingId], params.userId);
  if (!owned.has(params.listingId)) {
    return { ok: false, reasonCode: "listing_ownership_unverified" };
  }

  return { ok: true };
}

export type OwnedListingCandidate = {
  listingSource: string;
  listingId: string;
  /** Display-only, sourced from each category's own already-audited safe select — never fabricated. Absent when that source has no such column. */
  displayName?: string;
  city?: string;
  imageUrl?: string;
  status?: string;
};

/**
 * Automatic owned-listing discovery (Gate BCO-3R Phase 10, extended in Gate BCO-3R-B Phase 10).
 * Scans every source in LISTING_SOURCE_OWNERSHIP_CONTRACT for rows owned by userId, reusing the
 * exact same contract as verifyListingOwnershipForLinking (never a second ownership map).
 *
 * Display fields (displayName/city/imageUrl/status) are populated **only** from each category's
 * own pre-existing, already-audited safe column set — never a new unaudited `select("*")` or a
 * new cross-table join:
 * - `listings`: the same `title/city/images/category/status` columns `ownerListingsQuery.ts`
 *   already selects for the owner's own mis-anuncios dashboard.
 * - `restaurantes_public_listings`: the same `business_name/city_canonical/hero_image_url/status`
 *   columns `restaurantesPublicListingsServer.ts`'s `LIST_SELECT` already exposes publicly.
 * - `servicios_public_listings`: the exported `SERVICIOS_PUBLIC_LISTING_SELECT` as-is (this
 *   source has no image column — none is fabricated).
 * - `autos_classifieds_listings`: reuses the existing owner-scoped
 *   `listAutosClassifiedsListingsForOwner` + `autosClassifiedsRowToDashboardRow` adapter that
 *   already derives title/city/thumbnail from `listing_payload` for the owner's own dashboard —
 *   no new query against this table.
 * Every projection stays scoped to `userId`'s own rows via the same owner column the ownership
 * contract uses; nothing here can surface another owner's listing.
 */
export async function discoverOwnedListingCandidates(adminClient: SupabaseClient, userId: string): Promise<OwnedListingCandidate[]> {
  const candidates: OwnedListingCandidate[] = [];

  {
    const contract = resolveListingSourceOwnershipContract("listings");
    if (contract) {
      const { data, error } = await adminClient
        .from("listings")
        .select("id, leonix_ad_id, title, city, images, category, status")
        .eq(contract.ownerColumn, userId)
        .limit(10);
      if (!error && data) {
        for (const row of data as Record<string, unknown>[]) {
          const images = Array.isArray(row.images) ? (row.images as unknown[]) : [];
          candidates.push({
            listingSource: "listings",
            listingId: String(row.id),
            displayName: typeof row.title === "string" && row.title.trim() ? row.title.trim() : undefined,
            city: typeof row.city === "string" && row.city.trim() ? row.city.trim() : undefined,
            imageUrl: typeof images[0] === "string" ? (images[0] as string) : undefined,
            status: typeof row.status === "string" ? row.status : undefined,
          });
        }
      }
    }
  }

  {
    const contract = resolveListingSourceOwnershipContract("restaurantes_public_listings");
    if (contract) {
      const { data, error } = await adminClient
        .from("restaurantes_public_listings")
        .select("id, leonix_ad_id, status, business_name, city_canonical, hero_image_url")
        .eq(contract.ownerColumn, userId)
        .limit(10);
      if (!error && data) {
        for (const row of data as Record<string, unknown>[]) {
          candidates.push({
            listingSource: "restaurantes_public_listings",
            listingId: String(row.id),
            displayName: typeof row.business_name === "string" && row.business_name.trim() ? row.business_name.trim() : undefined,
            city: typeof row.city_canonical === "string" && row.city_canonical.trim() ? row.city_canonical.trim() : undefined,
            imageUrl: typeof row.hero_image_url === "string" && row.hero_image_url.trim() ? row.hero_image_url.trim() : undefined,
            status: typeof row.status === "string" ? row.status : undefined,
          });
        }
      }
    }
  }

  {
    const contract = resolveListingSourceOwnershipContract("servicios_public_listings");
    if (contract) {
      const { data, error } = await adminClient
        .from("servicios_public_listings")
        .select(SERVICIOS_PUBLIC_LISTING_SELECT)
        .eq(contract.ownerColumn, userId)
        .limit(10);
      if (!error && data) {
        for (const row of data as unknown as Record<string, unknown>[]) {
          candidates.push({
            listingSource: "servicios_public_listings",
            listingId: String(row.id),
            displayName: typeof row.business_name === "string" && row.business_name.trim() ? row.business_name.trim() : undefined,
            city: typeof row.city === "string" && row.city.trim() ? row.city.trim() : undefined,
            // No image column exists on this source's audited select — not fabricated.
            status: typeof row.listing_status === "string" ? row.listing_status : undefined,
          });
        }
      }
    }
  }

  {
    const contract = resolveListingSourceOwnershipContract("autos_classifieds_listings");
    if (contract) {
      try {
        const rows = await listAutosClassifiedsListingsForOwner(userId);
        for (const row of rows) {
          const dashboardRow = autosClassifiedsRowToDashboardRow(row);
          candidates.push({
            listingSource: "autos_classifieds_listings",
            listingId: dashboardRow.id,
            displayName: dashboardRow.title && dashboardRow.title !== "—" ? dashboardRow.title : undefined,
            city: dashboardRow.city || undefined,
            imageUrl: dashboardRow.thumbUrl ?? undefined,
            status: dashboardRow.status,
          });
        }
      } catch {
        // Fail closed — no candidates from this source rather than a broken discovery response.
      }
    }
  }

  return candidates;
}

/**
 * Non-production-only synthetic owned-listing fixture (Gate BCO-3R QA — staging has none of the
 * category tables applied, so real candidates cannot exist there; see shouldApplyTestOverride's
 * doc comment for the identical safety gate). Never used in production, never client-triggered.
 */
export function buildTestOverrideOwnedListingCandidate(): OwnedListingCandidate {
  return {
    listingSource: "listings",
    listingId: "00000000-0000-4000-f000-000000000000",
    displayName: "Negocio de prueba (QA no producción) / Test business (non-production QA)",
    status: "active",
  };
}
