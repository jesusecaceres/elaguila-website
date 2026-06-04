import type { AutoDealerListing } from "@/app/(site)/clasificados/autos/negocios/types/autoDealerListing";
import { safeNormalizeAutosDraftListing } from "@/app/clasificados/autos/shared/lib/safeNormalizeAutosDraftListing";
import type { AutosAdditionalInventoryVehicleDraft } from "./autosAdditionalInventoryDraft";
import {
  additionalInventoryVehicleTitle,
  inventoryVehicleCoverUrl,
  inventoryVehicleDraftToListingSlice,
} from "./autosAdditionalInventoryDraft";

/**
 * Combines parent dealer draft + child vehicle draft into a preview-ready listing.
 * Child vehicle fields overwrite the main vehicle slice; dealer/contact/finance/social inherit from parent.
 *
 * Final publish (A5.QA-08B) must map this into separate listing rows + Leonix Ad IDs.
 */
export function mapInheritedDealerPreviewListing(
  parent: AutoDealerListing,
  child: AutosAdditionalInventoryVehicleDraft,
): AutoDealerListing {
  const vehicleSlice = inventoryVehicleDraftToListingSlice(child);
  return safeNormalizeAutosDraftListing(
    {
      ...parent,
      ...vehicleSlice,
      autosLane: "negocios",
    },
    "negocios",
  );
}

export type AutosInheritedPreviewFieldGroups = {
  inheritedFromParent: readonly string[];
  childSpecific: readonly string[];
};

export const AUTOS_INVENTORY_INHERITED_FIELD_GROUPS: AutosInheritedPreviewFieldGroups = {
  inheritedFromParent: [
    "dealerName",
    "dealerLogo",
    "dealerPhoneOffice",
    "dealerPhoneMobile",
    "dealerSmsPhone",
    "dealerWhatsapp",
    "dealerEmail",
    "dealerWebsite",
    "dealerBookingUrl",
    "dealerStreetNumber",
    "dealerStreetName",
    "dealerUnitOrSuite",
    "dealerAddressCity",
    "dealerAddressState",
    "dealerAddressZip",
    "dealerAddress",
    "dealerHours",
    "dealerSocials",
    "googleReviewsUrl",
    "yelpReviewsUrl",
    "dealerCustomLinks",
    "financeContactName",
    "financeContactTitle",
    "financeContactPhone",
    "financeContactWhatsapp",
    "financeContactEmail",
    "financeApplicationUrl",
    "financeContactImageUrl",
    "financeContactImageFileName",
    "financeContactImageSource",
    "financeNotes",
  ],
  childSpecific: [
    "vehicleTitle",
    "year",
    "make",
    "model",
    "trim",
    "condition",
    "price",
    "monthlyEstimate",
    "mileage",
    "city",
    "state",
    "zip",
    "vin",
    "stockNumber",
    "transmission",
    "drivetrain",
    "engine",
    "fuelType",
    "mpgCity",
    "mpgHighway",
    "bodyStyle",
    "exteriorColor",
    "interiorColor",
    "doors",
    "seats",
    "titleStatus",
    "badges",
    "features",
    "customEquipment",
    "otherEquipmentDetails",
    "mediaImages",
    "videoUrl",
    "description",
  ],
};

export function previewCardSummaryFromChild(
  parent: AutoDealerListing,
  child: AutosAdditionalInventoryVehicleDraft,
): {
  title: string;
  price?: number;
  mileage?: number;
  coverUrl: string | null;
  dealerName?: string;
  photoCount: number;
} {
  const merged = mapInheritedDealerPreviewListing(parent, child);
  return {
    title: additionalInventoryVehicleTitle(child),
    price: merged.price,
    mileage: merged.mileage,
    coverUrl: inventoryVehicleCoverUrl(child),
    dealerName: parent.dealerName,
    photoCount: child.mediaImages?.length ?? 0,
  };
}
