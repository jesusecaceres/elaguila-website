import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";

export type ServiciosSellerPresentation = "business" | "independent";

/**
 * Public seller presentation derived from published profile contact fields (no separate DB column).
 * Negocio: storefront or strong web presence. Independiente: leaner solo / mobile-first profile.
 */
export function inferServiciosSellerPresentation(profile: ServiciosBusinessProfile): ServiciosSellerPresentation {
  const c = profile.contact;
  const hasStorefront = Boolean(
    (c?.physicalStreet && c.physicalStreet.trim()) || (c?.physicalSuite && c.physicalSuite.trim()),
  );
  const hasWeb = Boolean(c?.websiteUrl && c.websiteUrl.trim());
  return hasStorefront || hasWeb ? "business" : "independent";
}
