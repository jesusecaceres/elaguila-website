/**
 * Recursos Intake OS — Gate 7C/7G partner-request type vocabulary and strict field mapping.
 *
 * Every field key listed here MUST already exist in resourceChangeDetection.WRITABLE_FIELD_COLUMNS
 * (Gate 5's server allow-list) — this module never introduces a field name that bypasses it, and
 * the create-request action only ever reads formData under these exact keys, never an arbitrary
 * client-supplied field name. Deliberately excludes crisisPhone/sms/is24Hours/category/urgency —
 * those are not offered as partner-reportable request types at all in V1, which is stricter than
 * Gate 7H's minimum requirement (individual review only), not equivalent to it.
 */
import { WRITABLE_FIELD_COLUMNS } from "./resourceChangeDetection";

export type PartnerRequestType =
  | "phone_change"
  | "website_change"
  | "email_change"
  | "address_change"
  | "hours_change"
  | "program_update"
  | "eligibility_update"
  | "service_area_update"
  | "other";

export const PARTNER_REQUEST_TYPES: { value: PartnerRequestType; label: string }[] = [
  { value: "phone_change", label: "Cambio de teléfono" },
  { value: "website_change", label: "Cambio de sitio web" },
  { value: "email_change", label: "Cambio de correo electrónico" },
  { value: "address_change", label: "Cambio de dirección" },
  { value: "hours_change", label: "Cambio de horario" },
  { value: "program_update", label: "Actualización de programa/servicio" },
  { value: "eligibility_update", label: "Actualización de elegibilidad" },
  { value: "service_area_update", label: "Actualización de área de servicio" },
  { value: "other", label: "Otro (usar notas)" },
];

const PARTNER_REQUEST_TYPE_VALUES = new Set<string>(PARTNER_REQUEST_TYPES.map((t) => t.value));

export function isValidPartnerRequestType(value: string): value is PartnerRequestType {
  return PARTNER_REQUEST_TYPE_VALUES.has(value);
}

/**
 * Request type -> the ONLY field(s) it may report a change for. "other" has none — it can only
 * carry free-text source notes and can never itself produce a change proposal.
 */
export const REQUEST_TYPE_FIELDS: Record<PartnerRequestType, string[]> = {
  phone_change: ["phone"],
  website_change: ["websiteUrl"],
  email_change: ["email"],
  address_change: ["addressLine1", "addressCity", "addressState", "addressZip"],
  hours_change: ["hoursNoteEn"],
  program_update: ["programName", "suggestedDescriptionEn"],
  eligibility_update: ["eligibilityEn"],
  service_area_update: ["serviceArea"],
  other: [],
};

const FIELD_LABELS: Record<string, string> = {
  phone: "Teléfono",
  websiteUrl: "Sitio web",
  email: "Correo electrónico",
  addressLine1: "Dirección (línea 1)",
  addressCity: "Ciudad",
  addressState: "Estado",
  addressZip: "Código postal",
  hoursNoteEn: "Horario (nota)",
  programName: "Nombre del programa",
  suggestedDescriptionEn: "Descripción",
  eligibilityEn: "Elegibilidad",
  serviceArea: "Área de servicio",
};

export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

// Defensive self-check: every field this module offers must already be a Gate 5 writable column.
for (const fields of Object.values(REQUEST_TYPE_FIELDS)) {
  for (const f of fields) {
    if (!(f in WRITABLE_FIELD_COLUMNS)) {
      throw new Error(`partnerRequestFieldMap.ts: "${f}" is not in WRITABLE_FIELD_COLUMNS — refusing to offer an unwritable field.`);
    }
  }
}
