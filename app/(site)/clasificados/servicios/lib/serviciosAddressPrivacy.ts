/**
 * Gate SERVICIOS-P7-BLOCKER-REPAIR-01 — Repair C (SERVICIOS-ADDRESS-PRIVACY-1).
 *
 * B5: the owner's "hide my exact address" choice (`contact.showExactAddress === false`) used to be
 * honoured only while RENDERING (`resolveServiciosProfile`). The exact street was still written into
 * `profile_json`, which the public read path serves — so the privacy promise was false at the
 * data-access boundary.
 *
 * The fix is a PUBLIC / PRIVATE split at the single save boundary:
 *   - the PUBLIC profile (`profile_json`) never carries the exact-location fields when the owner hid
 *     them — city / region / country / postal code stay public for the area presentation;
 *   - the PRIVATE record (`servicios_public_listings.private_contact`, readable only by the service
 *     role — see migration 20260910210000) keeps them, so the verified owner's edit hydration still
 *     round-trips the address they entered.
 *
 * `physicalProviderPlaceId` is private too: a Google Place ID resolves to an exact location.
 *
 * Pure (type-only import) so `scripts/verify-servicios-address-privacy.ts` executes it directly.
 */

import type { ServiciosBusinessProfile } from "@/app/servicios/types/serviciosBusinessProfile";

/** Contact fields that pinpoint the exact location. Everything else in `contact` stays public. */
export const SERVICIOS_PRIVATE_EXACT_ADDRESS_KEYS = ["physicalStreet", "physicalSuite", "physicalProviderPlaceId"] as const;

export type ServiciosPrivateExactAddressKey = (typeof SERVICIOS_PRIVATE_EXACT_ADDRESS_KEYS)[number];
export type ServiciosPrivateContact = Partial<Record<ServiciosPrivateExactAddressKey, string>>;

/** The owner hid their exact address. Absent means shown (the resolver's own `?? true` default). */
export function serviciosExactAddressIsHidden(profile: Pick<ServiciosBusinessProfile, "contact"> | null | undefined): boolean {
  return profile?.contact?.showExactAddress === false;
}

/**
 * Split a profile at the save boundary into what may be PUBLIC and what must stay PRIVATE.
 *
 * `privateContact` is `null` when nothing is private — either the owner chose to show the exact
 * address (then it is intentionally public), or there is no exact address at all. Callers write
 * `private_contact` ONLY when it is non-null, so saves of every other listing never depend on the
 * column (see the publish route for why that ordering matters).
 */
export function splitServiciosAddressForPersistence(profile: ServiciosBusinessProfile): {
  publicProfile: ServiciosBusinessProfile;
  privateContact: ServiciosPrivateContact | null;
} {
  if (!serviciosExactAddressIsHidden(profile)) {
    return { publicProfile: profile, privateContact: null };
  }
  const contact = { ...(profile.contact ?? {}) } as Record<string, unknown>;
  const privateContact: ServiciosPrivateContact = {};
  for (const key of SERVICIOS_PRIVATE_EXACT_ADDRESS_KEYS) {
    const value = contact[key];
    if (typeof value === "string" && value.trim()) privateContact[key] = value;
    delete contact[key];
  }
  return {
    publicProfile: { ...profile, contact: contact as ServiciosBusinessProfile["contact"] },
    privateContact: Object.keys(privateContact).length > 0 ? privateContact : null,
  };
}

/**
 * OWNER-ONLY — re-attach the private exact address for the verified owner's edit hydration and
 * listing-bound Preview. Applied only while the address is hidden: once the owner shows it again,
 * the public profile is the truth and any older private copy is inert.
 */
export function mergeServiciosPrivateAddressForOwner(
  profile: ServiciosBusinessProfile | null,
  privateContact: unknown,
): ServiciosBusinessProfile | null {
  if (!profile || !serviciosExactAddressIsHidden(profile)) return profile;
  if (!privateContact || typeof privateContact !== "object") return profile;
  const restored: Record<string, unknown> = {};
  for (const key of SERVICIOS_PRIVATE_EXACT_ADDRESS_KEYS) {
    const value = (privateContact as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) restored[key] = value;
  }
  if (Object.keys(restored).length === 0) return profile;
  return { ...profile, contact: { ...(profile.contact ?? {}), ...restored } as ServiciosBusinessProfile["contact"] };
}
