/**
 * Controlled value sets and bounded default copy for the Business Identity core.
 * These mirror the CHECK constraints in the BCO-1C.1 migration exactly — do not
 * drift from them without a corresponding migration change.
 */
import type { AreaKind, ChannelKind, ContactType, FieldErrorCode, PrimaryLanguage } from "./types";

export const BUSINESS_IDENTITY_FLAG_KEY = "business_identity_foundation";

export const PRIMARY_LANGUAGES: readonly PrimaryLanguage[] = ["es", "en"];
export const CONTACT_TYPES: readonly ContactType[] = ["phone", "email", "website"];
export const CHANNEL_KINDS: readonly ChannelKind[] = ["whatsapp", "call", "email"];
export const AREA_KINDS: readonly AreaKind[] = ["physical_address", "service_area_text"];

/** contact_type -> allowed channel_kind values when preferred_channel = true. Mirrors the DB CHECK exactly. */
export const ALLOWED_PREFERRED_CHANNEL_KINDS_BY_CONTACT_TYPE: Readonly<Record<ContactType, readonly ChannelKind[]>> = {
  phone: ["whatsapp", "call"],
  email: ["email"],
  website: [],
};

/**
 * Bounded default field-error copy, es/en. Package 3's UI may render its own copy per field/code;
 * this is a safety-net default so no path in domain logic ever hardcodes final UI strings.
 */
export const FIELD_ERROR_DEFAULT_MESSAGES: Readonly<Record<FieldErrorCode, { es: string; en: string }>> = {
  required: { es: "Este campo es obligatorio.", en: "This field is required." },
  invalid_display_name: { es: "El nombre del negocio no es válido.", en: "The business name is not valid." },
  invalid_business_type: { es: "Selecciona un tipo de negocio válido.", en: "Select a valid business type." },
  invalid_business_stage: { es: "Selecciona una etapa de negocio válida.", en: "Select a valid business stage." },
  invalid_language: { es: "Selecciona un idioma válido.", en: "Select a valid language." },
  invalid_contact_combination: {
    es: "Esa combinación de contacto y canal no es válida.",
    en: "That contact and channel combination is not valid.",
  },
  invalid_area_kind: { es: "El tipo de ubicación no es válido.", en: "The location type is not valid." },
  missing_contact: { es: "Agrega al menos un contacto.", en: "Add at least one contact." },
  missing_service_area: { es: "Agrega una ubicación o zona de servicio.", en: "Add a location or service area." },
  ownership_not_confirmed: {
    es: "Confirma que tienes autorización para crear este negocio.",
    en: "Confirm you're authorized to create this business.",
  },
  feature_access_denied: {
    es: "Tu cuenta no tiene acceso a Business Concierge todavía.",
    en: "Your account doesn't have access to Business Concierge yet.",
  },
  listing_ownership_unverified: {
    es: "No pudimos verificar que este anuncio te pertenece.",
    en: "We couldn't verify that this listing belongs to you.",
  },
  unsupported_listing_source: {
    es: "Ese tipo de anuncio todavía no se puede vincular.",
    en: "That listing type can't be linked yet.",
  },
};

export function fieldErrorDefaultMessage(code: FieldErrorCode, lang: PrimaryLanguage): string {
  return FIELD_ERROR_DEFAULT_MESSAGES[code][lang];
}

/** Draft lifecycle default (matches the repository-level "30 days" precedent from the BCO-1B blueprint). */
export const DRAFT_DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const MAX_DISPLAY_NAME_LENGTH = 200;
export const MAX_CONTACT_VALUE_LENGTH = 320;
export const MAX_SERVICE_AREA_TEXT_LENGTH = 500;
