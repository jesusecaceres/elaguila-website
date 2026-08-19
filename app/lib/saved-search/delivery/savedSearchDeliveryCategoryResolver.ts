/**
 * Saved Search 06 — the shared contract every category plugs into the delivery engine with
 * (Gate 14). Deliberately narrow: only the two things that are genuinely category-specific about
 * delivery (revalidating a listing is still publicly eligible right now, and building its
 * canonical public URL). Claim/owner-lookup/status-settlement/Resend logic never varies by
 * category and stays entirely inside `savedSearchEmailDelivery.ts`.
 */
export type SavedSearchDeliveryCategoryResolver = {
  /** Re-runs the category's real public eligibility gate for one listing id. */
  revalidateListingStillEligible(listingId: string): Promise<boolean>;
  /** The category's canonical, absolute public detail URL for one listing id. */
  buildDetailUrl(listingId: string): string;
};
