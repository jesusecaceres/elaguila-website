/**
 * Dealer (negocio) lane: business storefront. New vs used is field-driven (`inventoryType`), not a folder split.
 */

import type { AutosInventoryType } from "../../contracts/autosInventoryAndTrustFields";

export type AutosDealerInventoryType = AutosInventoryType;

export const AUTOS_DEALER_MAX_PHOTOS = 12;
export const AUTOS_DEALER_VIDEO_ALLOWED = true;
export const AUTOS_DEALER_BOOST_ELIGIBLE = true;

/** Dealer-only structured hints (persist via detail_pairs / business_meta until first-class columns). */
export const AUTOS_DEALER_FIELD_INVENTORY_TYPE = "inventoryType" as const;
export const AUTOS_DEALER_FIELD_CERTIFIED = "certified" as const;
export const AUTOS_DEALER_FIELD_FINANCING_AVAILABLE = "financingAvailable" as const;
