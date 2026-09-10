/**
 * Privacy boundary for business addresses.
 *
 * Address TRUTH (`BusinessAddress`) and PUBLIC VISIBILITY are separate concepts. This module is
 * the single safe boundary between them: `resolveBusinessAddressPublicView` is the only place
 * allowed to decide whether an exact address line reaches a public view model. Callers (preview
 * VM mappers, detail-page shells, etc.) must never re-derive that decision themselves — they
 * should render from the `BusinessAddressPublicView` this function returns and nothing else.
 *
 * This mirrors the pattern Comida Local already ships and proves out in production: a private
 * `businessAddressLine` plus an explicit `showAddressPublicly` owner opt-in that gates the public
 * preview VM (`app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm.ts`). See
 * `scripts/verify-business-address-foundation.ts` for a read-only regression proof against that
 * shipped behavior.
 */

import type { BusinessAddress } from "./businessAddressContract";

export type BusinessAddressPublicView = {
  /** True when there is a private address on file at all (regardless of whether it is shown). */
  hasPrivateAddress: boolean;
  /** Always safe to display, even when the exact address is private. */
  publicCityOrServiceArea: string;
  /** The owner's explicit choice to reveal the exact address. */
  showExactAddress: boolean;
  /** Present ONLY when `showExactAddress` is true. Never populated otherwise — this is the
   * structural guarantee this module exists to provide. */
  exactAddressLine?: string;
  /** Whether a "get directions" CTA is safe to render for this view. */
  directionsAllowed: boolean;
};

/**
 * Resolves the public-safe view of a business address. This is the ONLY function permitted to
 * decide whether `exactAddressLine` is populated — every field is computed from the boolean
 * `showExactAddress` gate, never from string content, so there is no edge case (empty string,
 * whitespace, an address that happens to contain the word "public", etc.) that can leak the
 * private line when the owner has not opted in.
 */
export function resolveBusinessAddressPublicView(input: {
  address: BusinessAddress | null;
  showExactAddress: boolean;
  cityOrServiceArea: string;
}): BusinessAddressPublicView {
  const { address, showExactAddress, cityOrServiceArea } = input;

  const hasPrivateAddress = Boolean(address && address.street.trim());
  const publicCityOrServiceArea = (cityOrServiceArea || "").trim();

  // Structural gate: exactAddressLine can only ever be assigned inside this branch, and only
  // when showExactAddress is strictly true AND there is a real address to show. There is no
  // other code path in this function that sets it.
  const reveal = showExactAddress === true && hasPrivateAddress;

  const view: BusinessAddressPublicView = {
    hasPrivateAddress,
    publicCityOrServiceArea,
    showExactAddress: reveal,
    directionsAllowed: reveal,
  };

  if (reveal && address) {
    const line = buildExactAddressLineForDisplay(address);
    if (line) {
      view.exactAddressLine = line;
    } else {
      // Address had no meaningful content to show even though reveal was requested — do not
      // claim directions are allowed for a destination that doesn't actually exist.
      view.showExactAddress = false;
      view.directionsAllowed = false;
    }
  }

  return view;
}

function buildExactAddressLineForDisplay(address: BusinessAddress): string {
  if (address.formattedAddress && address.formattedAddress.trim()) {
    return address.formattedAddress.trim();
  }
  const parts = [
    address.street.trim(),
    address.unit?.trim(),
    address.city.trim(),
    address.region.trim(),
  ].filter((p): p is string => Boolean(p));
  return parts.join(", ");
}
