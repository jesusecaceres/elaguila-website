/**
 * Target field vocabulary for Autos (dealer + private). Typed here for publish/detail alignment.
 * Persist via `detail_pairs` / structured details until dedicated columns exist.
 */

export type AutosInventoryType = "new" | "used";

export type AutosYesNo = "yes" | "no";

/** Recommended `detail_pairs` label keys (English) for stable mapping from forms → live view. */
export const AUTOS_DETAIL_LABEL_INVENTORY_TYPE = "Inventory type";
export const AUTOS_DETAIL_LABEL_CERTIFIED = "Certified";
export const AUTOS_DETAIL_LABEL_FINANCING_AVAILABLE = "Financing available";
export const AUTOS_DETAIL_LABEL_TRANSMISSION = "Transmission";
export const AUTOS_DETAIL_LABEL_FUEL = "Fuel type";
export const AUTOS_DETAIL_LABEL_DRIVETRAIN = "Drivetrain";
export const AUTOS_DETAIL_LABEL_VIN = "VIN";
export const AUTOS_DETAIL_LABEL_EXTERIOR_COLOR = "Exterior color";
export const AUTOS_DETAIL_LABEL_INTERIOR_COLOR = "Interior color";
export const AUTOS_DETAIL_LABEL_MONTHLY_PAYMENT = "Est. monthly payment";
