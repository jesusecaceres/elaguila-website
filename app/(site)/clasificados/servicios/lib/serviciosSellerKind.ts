import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";

export type ServiciosSellerPresentation = "business" | "independent";

/**
 * Public “Negocio” vs “Independiente” for discovery cards and the results `seller` filter.
 * Derived only from **published** `contact` fields (no advertiser self-label column):
 * - **business**: physical street/suite **or** public website URL present.
 * - **independent**: neither — still a full profile; badges must not imply verification beyond `leonixVerified`.
 */
export function inferServiciosSellerPresentation(profile: ServiciosBusinessProfile): ServiciosSellerPresentation {
  const c = profile.contact;
  const hasStorefront = Boolean(
    (c?.physicalStreet && c.physicalStreet.trim()) || (c?.physicalSuite && c.physicalSuite.trim()),
  );
  const hasWeb = Boolean(c?.websiteUrl && c.websiteUrl.trim());
  return hasStorefront || hasWeb ? "business" : "independent";
}
