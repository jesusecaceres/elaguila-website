import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";

/**
 * Clasificados publish intentionally remaps from the current form state.
 * On existing-listing edits, preserve prior profile sections that are not fully owned by
 * the current form/hydration path so a normal edit does not erase paid/legacy data.
 */
export function mergeOpsControlledServiciosProfileFields(
  nextWire: ServiciosBusinessProfile,
  previous: ServiciosBusinessProfile | null | undefined,
): ServiciosBusinessProfile {
  if (!previous) return nextWire;

  const merged: ServiciosBusinessProfile = {
    ...nextWire,
    contact: {
      ...nextWire.contact,
      ...(previous.contact?.isFeatured ? { isFeatured: true } : {}),
      ...(previous.contact?.featuredLabel && !nextWire.contact?.featuredLabel
        ? { featuredLabel: previous.contact.featuredLabel }
        : {}),
    },
  };

  if (!nextWire.quickFacts?.length && previous.quickFacts?.length) merged.quickFacts = previous.quickFacts;
  if (!nextWire.trust?.length && previous.trust?.length) merged.trust = previous.trust;
  if (!nextWire.reviews?.length && previous.reviews?.length) merged.reviews = previous.reviews;
  if (!nextWire.promotions?.length && previous.promotions?.length) merged.promotions = previous.promotions;
  if (!nextWire.promo && previous.promo) merged.promo = previous.promo;

  return merged;
}
