/** Legacy wizard field keys merged with current BR detail keys. */

export const LEGACY_WIZARD_BR_DETAIL = {
  propertyType: "propertyType",
} as const;

export function coalesceWizardDetailValue(
  details: Record<string, string>,
  primaryKey: string,
  legacyKey: string
): string {
  return (details[primaryKey] ?? details[legacyKey] ?? "").trim();
}
