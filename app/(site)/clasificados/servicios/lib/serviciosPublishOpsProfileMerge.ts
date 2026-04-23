import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";

/**
 * Clasificados publish never maps `contact.isFeatured` from the advertiser form (ops / billing only).
 * When a listing is republished, merge prior wire so paid/amplified placement is not wiped.
 */
export function mergeOpsControlledServiciosProfileFields(
  nextWire: ServiciosBusinessProfile,
  previous: ServiciosBusinessProfile | null | undefined,
): ServiciosBusinessProfile {
  if (!previous?.contact?.isFeatured) return nextWire;
  return {
    ...nextWire,
    contact: { ...nextWire.contact, isFeatured: true },
  };
}
