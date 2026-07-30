/**
 * Validation for the Business Identity core. No validation library dependency exists in this
 * repo (confirmed: no Zod) — hand-rolled validators following repository convention, returning
 * structured FieldError[] rather than throwing, so Package 3's UI can render per-field messages
 * in the user's language via constants.fieldErrorDefaultMessage.
 */
import {
  ALLOWED_PREFERRED_CHANNEL_KINDS_BY_CONTACT_TYPE,
  AREA_KINDS,
  CONTACT_TYPES,
  MAX_CONTACT_VALUE_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_SERVICE_AREA_TEXT_LENGTH,
  PRIMARY_LANGUAGES,
} from "./constants";
import { normalizeContactValue, normalizeDisplayText, normalizeServiceAreaText } from "./normalization";
import type {
  AreaKind,
  ChannelKind,
  ContactType,
  EligibilityResult,
  FieldError,
  PrimaryLanguage,
  ValidationResult,
} from "./types";

function err(field: string, code: FieldError["code"], es: string, en: string): FieldError {
  return { field, code, defaultMessage: `${es} / ${en}` };
}

// ---------------------------------------------------------------------------
// Business basics
// ---------------------------------------------------------------------------

export type BusinessBasicsInput = {
  displayName: string;
  broadBusinessType: string;
  businessStage: string;
  primaryLanguage: string;
};

export function validateBusinessBasics(input: BusinessBasicsInput): ValidationResult<{
  displayName: string;
  broadBusinessType: string;
  businessStage: string;
  primaryLanguage: PrimaryLanguage;
}> {
  const errors: FieldError[] = [];

  const displayName = normalizeDisplayText(input.displayName);
  if (!displayName) {
    errors.push(err("displayName", "required", "El nombre del negocio es obligatorio.", "Business name is required."));
  } else if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    errors.push(err("displayName", "invalid_display_name", "El nombre es demasiado largo.", "The name is too long."));
  }

  const broadBusinessType = normalizeDisplayText(input.broadBusinessType);
  if (!broadBusinessType) {
    errors.push(err("broadBusinessType", "invalid_business_type", "Selecciona un tipo de negocio.", "Select a business type."));
  }

  const businessStage = normalizeDisplayText(input.businessStage);
  if (!businessStage) {
    errors.push(err("businessStage", "invalid_business_stage", "Selecciona una etapa.", "Select a stage."));
  }

  const primaryLanguage = input.primaryLanguage as PrimaryLanguage;
  if (!PRIMARY_LANGUAGES.includes(primaryLanguage)) {
    errors.push(err("primaryLanguage", "invalid_language", "Selecciona un idioma válido.", "Select a valid language."));
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { displayName, broadBusinessType, businessStage, primaryLanguage } };
}

// ---------------------------------------------------------------------------
// Contact / channel combination — mirrors the DB CHECK constraints exactly.
// ---------------------------------------------------------------------------

export type ContactInput = {
  contactType: string;
  rawValue: string;
  preferredChannel: boolean;
  channelKind: string | null;
  isPrimary: boolean;
};

export function validateContact(input: ContactInput): ValidationResult<{
  contactType: ContactType;
  value: string;
  normalizedValue: string;
  preferredChannel: boolean;
  channelKind: ChannelKind | null;
  isPrimary: boolean;
}> {
  const errors: FieldError[] = [];
  const contactType = input.contactType as ContactType;

  if (!CONTACT_TYPES.includes(contactType)) {
    return { ok: false, errors: [err("contactType", "invalid_contact_combination", "Tipo de contacto inválido.", "Invalid contact type.")] };
  }

  const normalized = normalizeContactValue(contactType, input.rawValue);
  if (!normalized || normalized.value.length > MAX_CONTACT_VALUE_LENGTH) {
    errors.push(err("value", "invalid_contact_combination", "El valor de contacto no es válido.", "The contact value is not valid."));
  }

  const channelKind = input.preferredChannel ? (input.channelKind as ChannelKind | null) : null;
  if (input.preferredChannel) {
    const allowed = ALLOWED_PREFERRED_CHANNEL_KINDS_BY_CONTACT_TYPE[contactType];
    if (!channelKind || !allowed.includes(channelKind)) {
      errors.push(
        err(
          "channelKind",
          "invalid_contact_combination",
          "Esa combinación de contacto y canal preferido no es válida.",
          "That preferred-channel combination is not valid.",
        ),
      );
    }
  }

  if (errors.length > 0 || !normalized) return { ok: false, errors };
  return {
    ok: true,
    value: {
      contactType,
      value: normalized.value,
      normalizedValue: normalized.normalizedValue,
      preferredChannel: input.preferredChannel,
      channelKind,
      isPrimary: input.isPrimary,
    },
  };
}

// ---------------------------------------------------------------------------
// Service area
// ---------------------------------------------------------------------------

export type ServiceAreaInput = {
  areaKind: string;
  rawText: string;
  isPrimary: boolean;
};

export function validateServiceArea(input: ServiceAreaInput): ValidationResult<{
  areaKind: AreaKind;
  rawText: string;
  normalizedText: string;
  isPrimary: boolean;
}> {
  const errors: FieldError[] = [];
  const areaKind = input.areaKind as AreaKind;
  if (!AREA_KINDS.includes(areaKind)) {
    errors.push(err("areaKind", "invalid_area_kind", "Tipo de ubicación inválido.", "Invalid location type."));
  }

  const rawText = normalizeDisplayText(input.rawText);
  const normalizedText = normalizeServiceAreaText(input.rawText);
  if (!rawText || !normalizedText || rawText.length > MAX_SERVICE_AREA_TEXT_LENGTH) {
    errors.push(err("rawText", "missing_service_area", "Describe la ubicación o zona de servicio.", "Describe the location or service area."));
  }

  if (errors.length > 0 || !normalizedText) return { ok: false, errors };
  return { ok: true, value: { areaKind, rawText, normalizedText, isPrimary: input.isPrimary } };
}

// ---------------------------------------------------------------------------
// Final creation request — application-level completion requirements.
// Mirrors the required list from BCO-1B.2 §10/§11: authenticated user, valid basics,
// >=1 contact, >=1 service area, ownership confirmation, eligible/approved access,
// feature access enabled, valid listing ownership if linking is requested.
// ---------------------------------------------------------------------------

export type FinalCreationRequestInput = {
  userId: string | null;
  basics: BusinessBasicsInput;
  contacts: readonly ContactInput[];
  serviceAreas: readonly ServiceAreaInput[];
  ownershipConfirmed: boolean;
  featureAccessGranted: boolean;
  eligibility: EligibilityResult | null;
  listingCandidate: { listingSource: string; listingId: string } | null;
  listingOwnershipVerified: boolean | null;
};

export function validateFinalCreationRequest(input: FinalCreationRequestInput): ValidationResult<true> {
  const errors: FieldError[] = [];

  if (!input.userId) {
    errors.push(err("userId", "required", "Debes iniciar sesión.", "You must be signed in."));
  }

  const basics = validateBusinessBasics(input.basics);
  if (!basics.ok) errors.push(...basics.errors);

  if (input.contacts.length === 0) {
    errors.push(err("contacts", "missing_contact", "Agrega al menos un contacto.", "Add at least one contact."));
  } else {
    for (const contact of input.contacts) {
      const result = validateContact(contact);
      if (!result.ok) errors.push(...result.errors);
    }
  }

  if (input.serviceAreas.length === 0) {
    errors.push(err("serviceAreas", "missing_service_area", "Agrega una ubicación o zona de servicio.", "Add a location or service area."));
  } else {
    for (const area of input.serviceAreas) {
      const result = validateServiceArea(area);
      if (!result.ok) errors.push(...result.errors);
    }
  }

  if (!input.ownershipConfirmed) {
    errors.push(err("ownershipConfirmed", "ownership_not_confirmed", "Confirma la autorización.", "Confirm authorization."));
  }

  if (!input.featureAccessGranted) {
    errors.push(err("featureAccess", "feature_access_denied", "Sin acceso a esta función.", "No access to this feature."));
  }

  if (!input.eligibility || (input.eligibility.status !== "eligible" && !input.eligibility.requiresManualReview)) {
    errors.push(err("eligibility", "feature_access_denied", "Elegibilidad no confirmada.", "Eligibility not confirmed."));
  }

  if (input.listingCandidate) {
    if (input.listingOwnershipVerified !== true) {
      errors.push(
        err(
          "listingCandidate",
          "listing_ownership_unverified",
          "No se pudo verificar la propiedad del anuncio.",
          "Could not verify listing ownership.",
        ),
      );
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: true };
}

export function validateOnboardingStep(step: unknown): step is number {
  return typeof step === "number" && Number.isInteger(step) && step >= 1;
}
