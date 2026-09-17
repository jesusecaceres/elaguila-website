/**
 * Validation for the Business Identity core. No validation library dependency exists in this
 * repo (confirmed: no Zod) — hand-rolled validators following repository convention, returning
 * structured FieldError[] rather than throwing, so Package 3's UI can render per-field messages
 * in the user's language via constants.fieldErrorDefaultMessage.
 */
import {
  ALLOWED_PREFERRED_CHANNEL_KINDS_BY_CONTACT_TYPE,
  AREA_KINDS,
  CONTACT_CAPABILITY_VALUES,
  CONTACT_TYPES,
  CUSTOM_LINK_TYPES,
  DIGITAL_PROFILE_PLATFORM_VALUES,
  MAX_CONTACT_VALUE_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_SERVICE_AREA_TEXT_LENGTH,
  OPERATING_MODELS,
  PRIMARY_LANGUAGES,
} from "./constants";
import { isValidCountryCode } from "./countries";
import { isKnownStateProvinceLabel } from "./statesProvinces";
import { normalizeContactValue, normalizeDisplayText, normalizeServiceAreaText, normalizeWebsiteDisplayValue, normalizeWebsiteDomain } from "./normalization";
import type {
  AreaKind,
  ChannelKind,
  ContactCapability,
  ContactType,
  CustomLinkType,
  EligibilityResult,
  FieldError,
  PreferredResponseMethod,
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
  /** Gate BCO-3R additions — optional so v1 callers (finalizeBusiness.ts) are unaffected. */
  label?: string;
  visibility?: string;
  /** Gate BCO-3R-B.2 — optional so v1/v2 callers are unaffected. Only meaningful for contactType === "phone". */
  capabilities?: readonly string[];
};

export function validateContact(input: ContactInput): ValidationResult<{
  contactType: ContactType;
  value: string;
  normalizedValue: string;
  preferredChannel: boolean;
  channelKind: ChannelKind | null;
  isPrimary: boolean;
  label: string;
  visibility: string;
  capabilities: ContactCapability[];
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

  // Capabilities are only meaningful for phone contacts — silently dropped (not an error) for
  // any other contact type, since a client could legitimately send an empty/stale array.
  const rawCapabilities = contactType === "phone" ? (input.capabilities ?? []) : [];
  const capabilities = rawCapabilities.filter((c): c is ContactCapability => (CONTACT_CAPABILITY_VALUES as readonly string[]).includes(c));
  if (contactType === "phone" && rawCapabilities.length > 0 && capabilities.length !== rawCapabilities.length) {
    errors.push(err("capabilities", "invalid_contact_capability", "Selecciona capacidades válidas para este teléfono.", "Select valid capabilities for this phone."));
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
      label: input.label ?? "main",
      visibility: input.visibility ?? "public",
      capabilities,
    },
  };
}

// ---------------------------------------------------------------------------
// Gate BCO-3R-B.2 additions — preferred response method, custom business links.
// ---------------------------------------------------------------------------

export type PreferredResponseMethodInput = {
  method: string | null;
  contacts: readonly { contactType: string; capabilities: readonly string[] }[];
};

/** Mirrors finalize_business_identity_v3's own server-side check exactly — never trust the client alone. */
export function validatePreferredResponseMethod(input: PreferredResponseMethodInput): ValidationResult<PreferredResponseMethod | null> {
  if (!input.method) return { ok: true, value: null };
  const method = input.method as PreferredResponseMethod;
  const satisfied = input.contacts.some((c) => {
    if (method === "email") return c.contactType === "email";
    if (method === "whatsapp") return c.contactType === "phone" && c.capabilities.includes("whatsapp");
    if (method === "sms") return c.contactType === "phone" && c.capabilities.includes("sms");
    if (method === "phone_call") return c.contactType === "phone" && c.capabilities.includes("calls");
    return false;
  });
  if (!satisfied) {
    return {
      ok: false,
      errors: [
        err(
          "preferredResponseMethod",
          "invalid_preferred_response_method",
          "El método de respuesta preferido no coincide con ningún contacto ingresado.",
          "The preferred response method doesn't match any entered contact.",
        ),
      ],
    };
  }
  return { ok: true, value: method };
}

export type CustomLinkInput = { linkType: string; customLabel: string | null; rawUrl: string; visibility?: string };

export function validateCustomLink(input: CustomLinkInput): ValidationResult<{
  linkType: CustomLinkType;
  customLabel: string | null;
  displayUrl: string;
  normalizedUrl: string;
  visibility: string;
}> {
  const linkType = input.linkType as CustomLinkType;
  if (!CUSTOM_LINK_TYPES.some((o) => o.value === linkType)) {
    return { ok: false, errors: [err("linkType", "invalid_custom_link", "Selecciona un tipo de enlace válido.", "Select a valid link type.")] };
  }
  const customLabel = linkType === "other" ? normalizeDisplayText(input.customLabel) : null;
  if (linkType === "other" && !customLabel) {
    return { ok: false, errors: [err("customLabel", "invalid_custom_link", "Describe este enlace.", "Describe this link.")] };
  }
  const displayUrl = normalizeWebsiteDisplayValue(input.rawUrl);
  const normalizedUrl = normalizeWebsiteDomain(input.rawUrl);
  if (!displayUrl || !normalizedUrl) {
    return { ok: false, errors: [err("rawUrl", "invalid_custom_link", "El enlace no es válido.", "The link is not valid.")] };
  }
  return { ok: true, value: { linkType, customLabel: customLabel || null, displayUrl, normalizedUrl, visibility: input.visibility === "private" ? "private" : "public" } };
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

// ---------------------------------------------------------------------------
// Gate BCO-3R additions — global location, operating model, authorization, digital profiles.
// ---------------------------------------------------------------------------

export function validateCountryField(code: string): ValidationResult<string> {
  if (!isValidCountryCode(code)) {
    return { ok: false, errors: [err("country", "invalid_country", "Selecciona un país válido.", "Select a valid country.")] };
  }
  return { ok: true, value: code };
}

export function validateOperatingModels(models: readonly string[]): ValidationResult<string[]> {
  const valid = models.filter((m) => (OPERATING_MODELS as readonly { value: string }[]).some((o) => o.value === m));
  if (valid.length === 0) {
    return { ok: false, errors: [err("operatingModels", "invalid_operating_model", "Selecciona al menos un modelo de operación.", "Select at least one operating model.")] };
  }
  return { ok: true, value: valid };
}

export type AuthorizationInput = {
  confirmed: boolean;
  role: string;
  representativeRelationship: string;
  representativeContactEmail: string;
};

export function validateAuthorization(input: AuthorizationInput): ValidationResult<true> {
  const errors: FieldError[] = [];
  if (!input.confirmed) {
    errors.push(err("ownershipConfirmed", "ownership_not_confirmed", "Confirma la autorización.", "Confirm authorization."));
  }
  if (input.role !== "owner" && input.role !== "authorized_representative") {
    errors.push(err("authorizationRole", "invalid_authorization_role", "Selecciona tu relación con el negocio.", "Select your relationship to the business."));
  }
  if (input.role === "authorized_representative" && !input.representativeRelationship.trim()) {
    errors.push(err("representativeRelationship", "invalid_authorization_role", "Describe tu relación con el negocio.", "Describe your relationship to the business."));
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: true };
}

// ---------------------------------------------------------------------------
// Gate BCO-3R-B.3 — service coverage (structuredDetails.coverage). Mirrors Phase 15's rules
// exactly; every branch below only fires for the coverage `level` it actually applies to, so
// switching levels never leaves a stale requirement from a different level behind.
// ---------------------------------------------------------------------------

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

export type ServiceCoverageInput = {
  country: string;
  coverage: {
    level: string;
    radiusValue?: number;
    radiusUnit?: string;
    citiesServed?: readonly string[];
    stateProvince?: string;
    statesProvincesServed?: readonly string[];
    excludedStatesProvinces?: readonly string[];
    excludedCitiesOrAreas?: readonly string[];
    nationwideConfirmed?: boolean;
    countriesServedCodes?: readonly string[];
    excludedCountries?: readonly string[];
    regionSelections?: readonly { regionCode: string; wholeRegion: boolean; countryCodes: readonly string[] }[];
    worldwideConfirmed?: boolean;
  };
  /** Base city/state, sourced from the shared top-level structuredDetails fields (baseCity / city). */
  baseCity?: string;
};

export function validateServiceCoverage(input: ServiceCoverageInput): ValidationResult<true> {
  const errors: FieldError[] = [];
  const c = input.coverage;
  const bad = (field: string, es: string, en: string) => errors.push(err(field, "invalid_service_coverage", es, en));

  switch (c.level) {
    case "local": {
      if (!isValidCountryCode(input.country)) {
        bad("country", "Selecciona el país que atiendes.", "Select the country you serve.");
      }
      if (!input.baseCity || !input.baseCity.trim()) {
        bad("coverage.baseCity", "El área local necesita una ciudad base.", "Local area requires a base city.");
      }
      if (c.radiusValue !== undefined) {
        if (!(c.radiusValue > 0)) bad("coverage.radiusValue", "El radio debe ser un número positivo.", "Radius must be a positive number.");
        if (c.radiusUnit !== "miles" && c.radiusUnit !== "kilometers") {
          bad("coverage.radiusUnit", "Selecciona la unidad del radio.", "Select the radius unit.");
        }
      }
      break;
    }
    case "multi_city": {
      if (!isValidCountryCode(input.country)) {
        bad("country", "Selecciona el país que atiendes.", "Select the country you serve.");
      }
      const cities = c.citiesServed ?? [];
      if (cities.length < 2) bad("coverage.citiesServed", "Agrega al menos 2 ciudades.", "Add at least 2 cities.");
      if (hasDuplicates(cities)) bad("coverage.citiesServed", "Hay ciudades duplicadas.", "There are duplicate cities.");
      break;
    }
    case "one_state": {
      if (!isValidCountryCode(input.country)) {
        bad("country", "Selecciona el país que atiendes.", "Select the country you serve.");
      }
      if (!c.stateProvince || !c.stateProvince.trim()) {
        bad("coverage.stateProvince", "Selecciona o escribe un estado o provincia.", "Select or enter a state or province.");
      } else if (!isKnownStateProvinceLabel(input.country, c.stateProvince)) {
        // Gate BCO-3R-B.5 — only fires for countries with a real dataset (US/MX/CA); catches the
        // "California" survives a switch to "Albania" contradiction at the data layer, not just the UI.
        bad("coverage.stateProvince", "Ese estado o provincia no corresponde al país seleccionado.", "That state or province doesn't belong to the selected country.");
      }
      break;
    }
    case "multi_state": {
      if (!isValidCountryCode(input.country)) {
        bad("country", "Selecciona el país que atiendes.", "Select the country you serve.");
      }
      const regions = c.statesProvincesServed ?? [];
      if (regions.length < 2) bad("coverage.statesProvincesServed", "Agrega al menos 2 estados o provincias.", "Add at least 2 states or provinces.");
      if (hasDuplicates(regions)) bad("coverage.statesProvincesServed", "Hay estados o provincias duplicados.", "There are duplicate states or provinces.");
      if (regions.some((r) => !isKnownStateProvinceLabel(input.country, r))) {
        bad("coverage.statesProvincesServed", "Uno o más estados o provincias no corresponden al país seleccionado.", "One or more states or provinces don't belong to the selected country.");
      }
      const excluded = c.excludedStatesProvinces ?? [];
      if (excluded.some((r) => regions.includes(r))) {
        bad("coverage.excludedStatesProvinces", "Un estado excluido no puede estar también incluido.", "An excluded state can't also be included.");
      }
      break;
    }
    case "nationwide": {
      if (!isValidCountryCode(input.country)) {
        bad("country", "Selecciona el país que atiendes.", "Select the country you serve.");
      }
      if (!c.nationwideConfirmed) {
        bad("coverage.nationwideConfirmed", "Confirma que atiendes todo el país.", "Confirm you serve the whole country.");
      }
      const excluded = c.excludedStatesProvinces ?? [];
      if (hasDuplicates(excluded)) bad("coverage.excludedStatesProvinces", "Hay exclusiones duplicadas.", "There are duplicate exclusions.");
      break;
    }
    case "multi_country": {
      const countries = c.countriesServedCodes ?? [];
      if (countries.length < 2) bad("coverage.countriesServedCodes", "Agrega al menos 2 países.", "Add at least 2 countries.");
      if (hasDuplicates(countries)) bad("coverage.countriesServedCodes", "Hay países duplicados.", "There are duplicate countries.");
      if (countries.some((code) => !isValidCountryCode(code))) {
        bad("coverage.countriesServedCodes", "Uno o más países no son válidos.", "One or more countries are not valid.");
      }
      const excluded = c.excludedCountries ?? [];
      if (excluded.some((code) => !isValidCountryCode(code))) {
        bad("coverage.excludedCountries", "Uno o más países excluidos no son válidos.", "One or more excluded countries are not valid.");
      }
      if (excluded.some((code) => countries.includes(code))) {
        bad("coverage.excludedCountries", "Un país excluido no puede estar también incluido.", "An excluded country can't also be included.");
      }
      for (const sel of c.regionSelections ?? []) {
        if (sel.wholeRegion && sel.countryCodes.length === 0) {
          bad("coverage.regionSelections", "Seleccionar todos los países de una región requiere confirmación explícita.", "Selecting every country in a region requires explicit confirmation.");
        }
      }
      break;
    }
    case "worldwide": {
      if (!c.worldwideConfirmed) {
        bad("coverage.worldwideConfirmed", "Confirma la disponibilidad mundial.", "Confirm worldwide availability.");
      }
      const excluded = c.excludedCountries ?? [];
      if (excluded.some((code) => !isValidCountryCode(code))) {
        bad("coverage.excludedCountries", "Uno o más países excluidos no son válidos.", "One or more excluded countries are not valid.");
      }
      if (hasDuplicates(excluded)) bad("coverage.excludedCountries", "Hay exclusiones duplicadas.", "There are duplicate exclusions.");
      break;
    }
    default:
      bad("coverage.level", "Selecciona hasta dónde atiende tu negocio.", "Select how far your business serves.");
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: true };
}

export type DigitalProfileInput = { platform: string; handleOrUrl: string };

export function validateDigitalProfile(input: DigitalProfileInput): ValidationResult<DigitalProfileInput> {
  if (!DIGITAL_PROFILE_PLATFORM_VALUES.includes(input.platform as (typeof DIGITAL_PROFILE_PLATFORM_VALUES)[number])) {
    return { ok: false, errors: [err("platform", "invalid_digital_profile", "Selecciona una plataforma válida.", "Select a valid platform.")] };
  }
  if (!input.handleOrUrl.trim()) {
    return { ok: false, errors: [err("handleOrUrl", "invalid_digital_profile", "Agrega el enlace o usuario.", "Add the link or handle.")] };
  }
  return { ok: true, value: input };
}
