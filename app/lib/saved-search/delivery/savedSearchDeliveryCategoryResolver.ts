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
  /**
   * The category's canonical, absolute public detail URL for one listing id.
   *
   * Gate SERVICIOS-2 — widened from `string` to `string | Promise<string>`. A category whose
   * canonical public URL is slug-addressed rather than id-addressed (Servicios:
   * `/clasificados/servicios/[slug]`) must read the row to build it, and inventing a synchronous
   * id-based URL would produce a link that 404s. Autos/Bienes Raíces/Rentas still return a plain
   * string and are unchanged — `string` remains assignable to this union. The single call site in
   * `savedSearchEmailDelivery.ts` awaits the result.
   */
  buildDetailUrl(listingId: string): string | Promise<string>;
};
