import type { AutoDealerListing } from "../types/autoDealerListing";

/** Must match option value in taxonomy (`Otro`). */
export const SELECT_OTHER_VALUE = "Otro";

/**
 * When `selected === otherToken`, returns trimmed `custom` (or undefined if blank).
 * Otherwise returns `selected` (preset label).
 */
export function resolveOtroField(
  selected: string | undefined,
  custom: string | undefined,
  otherToken: string = SELECT_OTHER_VALUE,
): string | undefined {
  const s = selected?.trim();
  if (!s) return undefined;
  if (s === otherToken) {
    const c = custom?.trim();
    return c || undefined;
  }
  return s;
}

export function resolveExteriorColor(data: AutoDealerListing): string | undefined {
  return resolveOtroField(data.exteriorColor, data.exteriorColorCustom);
}

export function resolveInteriorColor(data: AutoDealerListing): string | undefined {
  return resolveOtroField(data.interiorColor, data.interiorColorCustom);
}

export function resolveBodyStyle(data: AutoDealerListing): string | undefined {
  return resolveOtroField(data.bodyStyle, data.bodyStyleCustom);
}

export function resolveFuelType(data: AutoDealerListing): string | undefined {
  return resolveOtroField(data.fuelType, data.fuelTypeCustom);
}

export function resolveTransmission(data: AutoDealerListing): string | undefined {
  return resolveOtroField(data.transmission, data.transmissionCustom);
}

export function resolveTitleStatus(data: AutoDealerListing): string | undefined {
  return resolveOtroField(data.titleStatus, data.titleStatusCustom);
}

export function resolveDrivetrain(data: AutoDealerListing): string | undefined {
  return resolveOtroField(data.drivetrain, data.drivetrainCustom);
}

export function isOtroIncomplete(selected: string | undefined, custom: string | undefined): boolean {
  const s = selected?.trim();
  if (!s || s !== SELECT_OTHER_VALUE) return false;
  return !custom?.trim();
}
