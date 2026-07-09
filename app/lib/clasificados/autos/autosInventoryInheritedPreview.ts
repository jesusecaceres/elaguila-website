import type { AutoDealerListing, RelatedDealerListing } from "@/app/(site)/clasificados/autos/negocios/types/autoDealerListing";
import { safeNormalizeAutosDraftListing } from "@/app/clasificados/autos/shared/lib/safeNormalizeAutosDraftListing";
import type { AutosClassifiedsLang } from "./autosClassifiedsTypes";
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
    "dealerAddressCountry",
    "dealerAddress",
    "dealerHours",
    "dealerSocials",
    "googleReviewsUrl",
    "googleBusinessUrl",
    "yelpReviewsUrl",
    "dealerCustomLinks",
    "dealerLanguages",
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
    "videoUrls",
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

function mainCoverUrl(parent: AutoDealerListing): string {
  const primary = parent.mediaImages?.find((m) => m.isPrimary)?.url ?? parent.mediaImages?.[0]?.url;
  if (primary?.trim()) return primary.trim();
  return parent.heroImages?.[0]?.trim() || "";
}

/**
 * Draft-only related inventory for child full preview — excludes the previewed child;
 * includes main vehicle + sibling children. Hrefs are preview placeholders (no public URLs).
 */
export function buildRelatedDraftPreviewListings(
  parent: AutoDealerListing,
  additional: AutosAdditionalInventoryVehicleDraft[],
  excludeChildId: string,
  _lang: AutosClassifiedsLang,
): RelatedDealerListing[] {
  const rows: RelatedDealerListing[] = [];

  if (parent.year && parent.make && parent.model) {
    rows.push({
      id: "draft-preview-main",
      imageUrl: mainCoverUrl(parent),
      year: parent.year,
      make: parent.make,
      model: parent.model,
      trim: parent.trim,
      price: parent.price ?? 0,
      mileage: parent.mileage ?? 0,
      city: parent.city,
      state: parent.state,
      href: "#draft-preview-main",
    });
  }

  for (const child of additional) {
    if (child.id === excludeChildId) continue;
    const merged = mapInheritedDealerPreviewListing(parent, child);
    if (!merged.year || !merged.make || !merged.model) continue;
    rows.push({
      id: `draft-preview-${child.id}`,
      imageUrl: inventoryVehicleCoverUrl(child) ?? "",
      year: merged.year,
      make: merged.make,
      model: merged.model,
      trim: merged.trim,
      price: merged.price ?? 0,
      mileage: merged.mileage ?? 0,
      city: merged.city ?? parent.city,
      state: merged.state ?? parent.state,
      href: `#draft-preview-${child.id}`,
    });
  }

  return rows.slice(0, 4);
}
