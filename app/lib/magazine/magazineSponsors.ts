/**
 * Revista hub — SPONSORS seam.
 *
 * TRUTH RULE: a business appears here only if the repository / data model says, explicitly, that it
 * sponsors THIS edition. It is never inferred from a featured business, a paid listing, a premium
 * placement, an advertiser status or a magazine package entitlement.
 *
 * AUDIT (Gate 2, 2026-09-19): there is NO issue-specific sponsor source today.
 *   - `magazine_issues` has no sponsor relation.
 *   - Ofertas Locales partners (`partner_type = 'sponsor' | 'magazine_pickup_partner' | …`) are a general
 *     partner program, not "sponsor of edition X".
 *   - Creative Studio `magazine_ad` / `sponsored_insert` are asset/request types, not a sponsor registry.
 * So this returns an empty list and the hub renders a truthful empty state. To go live later, replace the
 * body of `getMagazineEditionSponsors` with a read of the real issue↔sponsor relation — the section
 * component and its copy already render logo / name / optional link when the list is non-empty.
 */
export type MagazineSponsor = {
  /** Stable id from the canonical source. */
  id: string;
  name: string;
  /** Logo image URL from the canonical source; the name is shown when absent. */
  logoUrl?: string | null;
  /** Destination — only when the canonical source provides one. */
  href?: string | null;
};

export function getMagazineEditionSponsors(_edition: { year: string; monthKey: string }): MagazineSponsor[] {
  return [];
}
