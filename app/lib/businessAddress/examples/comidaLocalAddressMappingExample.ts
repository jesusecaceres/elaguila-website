/**
 * DOCUMENTATION-ONLY reference adapter — NOT imported by any live page or Comida Local file.
 *
 * Comida Local (shipped, merged to main) is the reference privacy pattern this whole foundation
 * generalizes: a free-text `businessAddressLine: string` + an explicit `showAddressPublicly:
 * boolean` opt-in, with the address withheld from the public preview VM entirely unless the owner
 * opts in (`app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm.ts`:
 * `businessAddressLine = draft.showAddressPublicly ? draft.businessAddressLine.trim() : ""`).
 *
 * Comida Local's Gate D/F work is already merged, tested, and closed out — this file does NOT
 * modify, wrap, or import-for-runtime-use anything from that category. It only imports
 * Comida Local's public TYPE for illustration and shows, as code, how a FUTURE adapter could map
 * those two fields onto the new shared `BusinessAddress` / `BusinessAddressPublicView` contract
 * without changing Comida Local's actual behavior today.
 *
 * Note the honest impedance mismatch: `businessAddressLine` is a single free-text string, not
 * Comida Local's structured street/unit/city/region/postalCode. A real future migration would
 * need a real field-splitting UI change (out of scope here) — this example intentionally does not
 * paper over that by fabricating structure that doesn't exist in the source data. It stores the
 * whole free-text line in `street` and leaves the rest blank, which is honest about what
 * Comida Local's data model actually contains today.
 */

import type { ComidaLocalDraft } from "@/app/lib/clasificados/comida-local/comidaLocalTypes";
import type { BusinessAddress } from "../businessAddressContract";
import { DEFAULT_BUSINESS_ADDRESS_COUNTRY } from "../businessAddressContract";
import {
  resolveBusinessAddressPublicView,
  type BusinessAddressPublicView,
} from "../businessAddressPrivacy";

/**
 * Maps Comida Local's two address fields onto the shared `BusinessAddress` contract. Manual entry
 * only — Comida Local has never had provider verification, so this never claims "verified".
 */
export function comidaLocalDraftToBusinessAddressExample(
  draft: Pick<ComidaLocalDraft, "businessAddressLine">
): BusinessAddress | null {
  const line = draft.businessAddressLine.trim();
  if (!line) return null;
  return {
    street: line,
    city: "",
    region: "",
    postalCode: "",
    country: DEFAULT_BUSINESS_ADDRESS_COUNTRY,
    formattedAddress: line,
    verificationStatus: "manual",
    manualEntry: true,
  };
}

/**
 * Maps Comida Local's `businessAddressLine` + `showAddressPublicly` + resolved city onto the
 * shared `BusinessAddressPublicView`. Illustrates that the shared privacy resolver produces the
 * same "hide unless opted in" guarantee Comida Local already ships by hand.
 */
export function comidaLocalDraftToPublicViewExample(
  draft: Pick<ComidaLocalDraft, "businessAddressLine" | "showAddressPublicly" | "cityCanonical">
): BusinessAddressPublicView {
  const address = comidaLocalDraftToBusinessAddressExample(draft);
  return resolveBusinessAddressPublicView({
    address,
    showExactAddress: draft.showAddressPublicly,
    cityOrServiceArea: draft.cityCanonical,
  });
}
