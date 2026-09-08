import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessListingLink } from "../types";

type ListingLinkRow = {
  id: string;
  business_id: string;
  listing_source: string;
  listing_id: string;
  relationship_role: string;
  linked_by: string;
  linked_at: string;
  verified_at: string | null;
  status: string;
};

const LISTING_LINK_COLUMNS = "id, business_id, listing_source, listing_id, relationship_role, linked_by, linked_at, verified_at, status";

function mapListingLinkRow(row: ListingLinkRow): BusinessListingLink {
  return {
    id: row.id,
    businessId: row.business_id,
    listingSource: row.listing_source,
    listingId: row.listing_id,
    relationshipRole: row.relationship_role as BusinessListingLink["relationshipRole"],
    linkedBy: row.linked_by,
    linkedAt: row.linked_at,
    verifiedAt: row.verified_at,
    status: row.status as BusinessListingLink["status"],
  };
}

/** RLS scopes this to businesses the caller has an active membership in. */
export async function listListingLinksForBusiness(client: SupabaseClient, businessId: string): Promise<BusinessListingLink[]> {
  const { data, error } = await client.from("business_listing_links").select(LISTING_LINK_COLUMNS).eq("business_id", businessId);
  if (error || !data) return [];
  return (data as ListingLinkRow[]).map(mapListingLinkRow);
}

/**
 * Admin-scoped only — used by the duplicate-detection engine to check whether a candidate
 * listing is already verified-linked to some (possibly inaccessible-to-the-caller) business.
 * Never exposes the linked business's private data — callers must only use the boolean result.
 */
export async function hasVerifiedLinkForListing(adminClient: SupabaseClient, listingSource: string, listingId: string): Promise<boolean> {
  const { data, error } = await adminClient
    .from("business_listing_links")
    .select("id")
    .eq("listing_source", listingSource)
    .eq("listing_id", listingId)
    .eq("status", "verified")
    .maybeSingle();
  return !error && !!data;
}

/**
 * Link creation is intentionally NOT implemented as a standalone client-callable function —
 * business_listing_links has no client mutation policy by design. Verified links are only
 * ever created inside the atomic finalize RPC (Phase 12), after ownership re-verification.
 */
