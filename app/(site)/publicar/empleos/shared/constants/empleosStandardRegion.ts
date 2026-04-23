/**
 * Internal discovery / filter region for Empleos (not a substitute for a real public city line).
 * Public UI should prefer `addressCity` / venue / employer address when present.
 */
export const EMPLEOS_INTERNAL_FILTER_REGION = "NorCal";

/** @deprecated Use {@link EMPLEOS_INTERNAL_FILTER_REGION}. */
export const EMPLEOS_STANDARD_CITY = EMPLEOS_INTERNAL_FILTER_REGION;

export function isEmpleosInternalFilterRegion(city: string): boolean {
  return city.trim().toLowerCase() === EMPLEOS_INTERNAL_FILTER_REGION.toLowerCase();
}
