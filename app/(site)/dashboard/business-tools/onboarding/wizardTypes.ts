import type {
  AreaKind,
  AuthorizationRole,
  BroadBusinessType,
  BusinessStage,
  ChannelKind,
  ContactCapability,
  ContactLabel,
  ContactType,
  ContactVisibility,
  CustomLinkType,
  DigitalProfilePlatform,
  OperatingModel,
  PreferredResponseMethod,
  PrimaryLanguage,
  SalesChannel,
  SalesRelationship,
  StructuredLocationDetailsV1,
} from "@/app/lib/business/types";
import { countryLabel } from "@/app/lib/business/countries";
import { regionLabel } from "@/app/lib/business/regions";
import { fillTemplate } from "@/app/lib/business/copyTemplate";
import type { BusinessIdentityCopy } from "../_components/businessIdentityCopy";

// =============================================================================
// V1 — the original Package 3 wizard draft shape. Kept byte-for-byte structurally
// unchanged so the already-shipped 7-step wizard (still reachable for any in-flight
// v1 draft/session) keeps working exactly as before. Never merge these type names with
// the V2 ones below — Gate BCO-3R deliberately keeps the two fully separate rather than
// sharing structurally-incompatible fields (V2's contact/area drafts require additional
// fields V1 never collected).
// =============================================================================

export type WizardContactDraft = {
  id: string;
  contactType: ContactType | "";
  rawValue: string;
  preferredChannel: boolean;
  channelKind: ChannelKind | null;
  isPrimary: boolean;
};

export type WizardServiceAreaDraft = {
  areaKind: AreaKind | "";
  rawText: string;
  cityHint: string | null;
};

export type WizardListingCandidateDraft = {
  listingSource: string;
  listingId: string;
} | null;

export type WizardDraftPayload = {
  schemaVersion: 1;
  basics: {
    displayName: string;
    legalName: string;
    publicName: string;
    primaryLanguage: PrimaryLanguage;
  };
  typeStage: {
    broadBusinessType: string;
    businessStage: string;
  };
  serviceArea: WizardServiceAreaDraft;
  contacts: WizardContactDraft[];
  ownershipConfirmation: {
    confirmed: boolean;
    settingUpForSomeoneElse: boolean;
  };
  listingCandidate: WizardListingCandidateDraft;
  updatedByStep: number;
};

export function emptyWizardPayload(lang: PrimaryLanguage): WizardDraftPayload {
  return {
    schemaVersion: 1,
    basics: { displayName: "", legalName: "", publicName: "", primaryLanguage: lang },
    typeStage: { broadBusinessType: "", businessStage: "" },
    serviceArea: { areaKind: "", rawText: "", cityHint: null },
    contacts: [],
    ownershipConfirmation: { confirmed: false, settingUpForSomeoneElse: false },
    listingCandidate: null,
    updatedByStep: 1,
  };
}

export function newContactDraft(): WizardContactDraft {
  return { id: crypto.randomUUID(), contactType: "", rawValue: "", preferredChannel: false, channelKind: null, isPrimary: false };
}

// =============================================================================
// V2 — Gate BCO-3R corrected 9-step flow. Fully separate type names (suffixed V2)
// from the V1 ones above; no shared type is structurally reused between the two.
// =============================================================================

export type WizardContactDraftV2 = {
  id: string;
  contactType: ContactType | "";
  rawValue: string;
  preferredChannel: boolean;
  channelKind: ChannelKind | null;
  isPrimary: boolean;
  label: ContactLabel;
  visibility: ContactVisibility;
  /** Gate BCO-3R-B.2 — only meaningful when contactType === "phone". */
  capabilities: ContactCapability[];
};

export type WizardDigitalProfileDraft = {
  id: string;
  platform: DigitalProfilePlatform | "";
  handleOrUrl: string;
};

/** Gate BCO-3R-B.2 — draft shape for business_custom_links. */
export type WizardCustomLinkDraft = {
  id: string;
  linkType: CustomLinkType | "";
  customLabel: string;
  rawUrl: string;
};

export type WizardServiceAreaDraftV2 = {
  areaKind: AreaKind | "";
  rawText: string;
  cityHint: string | null;
  country: string;
  structuredDetails: StructuredLocationDetailsV1;
};

export type WizardListingCandidateDraftV2 = { listingSource: string; listingId: string };

export type WizardDraftPayloadV2 = {
  schemaVersion: 2;
  setupLanguage: PrimaryLanguage;
  basics: {
    displayName: string;
    legalName: string;
    publicName: string;
    businessPrimaryLanguage: string;
    businessAdditionalLanguages: string[];
    yearStarted: number | null;
  };
  typeStage: {
    broadBusinessType: BroadBusinessType | "";
    specificBusinessType: string;
    customSpecificType: string;
    businessStage: BusinessStage | "";
  };
  operatingModel: {
    operatingModels: OperatingModel[];
    salesRelationships: SalesRelationship[];
    salesChannels: SalesChannel[];
  };
  serviceArea: WizardServiceAreaDraftV2;
  contacts: WizardContactDraftV2[];
  /** Gate BCO-3R-B.2 — single business-wide preferred response method, server-validated against `contacts` at finalize time. */
  preferredResponseMethod: PreferredResponseMethod | "";
  digitalProfiles: WizardDigitalProfileDraft[];
  customLinks: WizardCustomLinkDraft[];
  ownershipAuthorization: {
    confirmed: boolean;
    role: AuthorizationRole | "";
    representativeRelationship: string;
    representativeContactEmail: string;
    representativeNote: string;
  };
  selectedListingCandidates: WizardListingCandidateDraftV2[];
  /** Gate BCO-3R-B.1 — owner explicitly said "none of these are mine" in step 8, distinct from simply not having acted yet. */
  listingsSkipped: boolean;
  updatedByStep: number;
};

export function emptyWizardPayloadV2(setupLanguage: PrimaryLanguage): WizardDraftPayloadV2 {
  return {
    schemaVersion: 2,
    setupLanguage,
    basics: { displayName: "", legalName: "", publicName: "", businessPrimaryLanguage: "", businessAdditionalLanguages: [], yearStarted: null },
    typeStage: { broadBusinessType: "", specificBusinessType: "", customSpecificType: "", businessStage: "" },
    operatingModel: { operatingModels: [], salesRelationships: [], salesChannels: [] },
    serviceArea: { areaKind: "", rawText: "", cityHint: null, country: "", structuredDetails: { schemaVersion: 1 } },
    contacts: [],
    preferredResponseMethod: "",
    digitalProfiles: [],
    customLinks: [],
    ownershipAuthorization: { confirmed: false, role: "", representativeRelationship: "", representativeContactEmail: "", representativeNote: "" },
    selectedListingCandidates: [],
    listingsSkipped: false,
    updatedByStep: 1,
  };
}

export function newContactDraftV2(): WizardContactDraftV2 {
  return { id: crypto.randomUUID(), contactType: "", rawValue: "", preferredChannel: false, channelKind: null, isPrimary: false, label: "main", visibility: "public", capabilities: [] };
}

export function newDigitalProfileDraft(): WizardDigitalProfileDraft {
  return { id: crypto.randomUUID(), platform: "", handleOrUrl: "" };
}

export function newCustomLinkDraft(): WizardCustomLinkDraft {
  return { id: crypto.randomUUID(), linkType: "", customLabel: "", rawUrl: "" };
}

// ---------------------------------------------------------------------------
// v1 -> v2 migration (Gate BCO-3R Phase 14). Never silently discards an unfinished v1 draft —
// every mappable v1 field carries forward; the only field genuinely lost is the old free-text
// `broadBusinessType`/`businessStage` values if they don't match the new controlled lists (the
// gate's old values were unconstrained free text, so a real mismatch is possible) — those are
// left blank for the owner to re-select on step 3, never silently invented.
// ---------------------------------------------------------------------------

const KNOWN_BROAD_TYPES: readonly string[] = [
  "retail_ecommerce", "professional_services", "food_hospitality", "health_beauty_wellness",
  "construction_trades", "technology_digital_services", "education_training_coaching",
  "real_estate_property_services", "automotive_transportation", "manufacturing_local_production",
  "arts_entertainment_events", "home_personal_services", "nonprofit_faith_community",
  "agriculture_food_production", "finance_insurance", "other",
];
const KNOWN_STAGES: readonly string[] = ["planning_prelaunch", "newly_opened", "operating", "growing", "established_mature", "paused_restructuring"];

export function isLegacyV1Payload(value: unknown): value is WizardDraftPayload {
  return typeof value === "object" && value !== null && (value as { schemaVersion?: unknown }).schemaVersion === 1;
}

export function migrateDraftV1ToV2(legacy: Partial<WizardDraftPayload>, fallbackLang: PrimaryLanguage): WizardDraftPayloadV2 {
  const v2 = emptyWizardPayloadV2(legacy.basics?.primaryLanguage ?? fallbackLang);

  v2.basics.displayName = legacy.basics?.displayName ?? "";
  v2.basics.legalName = legacy.basics?.legalName ?? "";
  v2.basics.publicName = legacy.basics?.publicName ?? "";

  const legacyBroadType = legacy.typeStage?.broadBusinessType ?? "";
  v2.typeStage.broadBusinessType = (KNOWN_BROAD_TYPES.includes(legacyBroadType) ? legacyBroadType : "") as WizardDraftPayloadV2["typeStage"]["broadBusinessType"];
  const legacyStage = legacy.typeStage?.businessStage ?? "";
  v2.typeStage.businessStage = (KNOWN_STAGES.includes(legacyStage) ? legacyStage : "") as WizardDraftPayloadV2["typeStage"]["businessStage"];
  // Unmappable legacy values are preserved for owner review rather than silently discarded.
  if (legacyBroadType && !KNOWN_BROAD_TYPES.includes(legacyBroadType)) {
    v2.typeStage.customSpecificType = legacyBroadType;
  }

  if (legacy.serviceArea?.rawText) {
    v2.serviceArea.areaKind = legacy.serviceArea.areaKind ?? "service_area_text";
    v2.serviceArea.rawText = legacy.serviceArea.rawText;
    v2.serviceArea.cityHint = legacy.serviceArea.cityHint ?? null;
  }

  v2.contacts = (legacy.contacts ?? []).map((c) => ({
    id: c.id ?? crypto.randomUUID(),
    contactType: c.contactType ?? "",
    rawValue: c.rawValue ?? "",
    preferredChannel: c.preferredChannel ?? false,
    channelKind: c.channelKind ?? null,
    isPrimary: c.isPrimary ?? false,
    label: "main",
    visibility: "public",
    capabilities: [],
  }));

  v2.ownershipAuthorization.confirmed = legacy.ownershipConfirmation?.confirmed ?? false;
  v2.ownershipAuthorization.role = legacy.ownershipConfirmation?.confirmed ? "owner" : "";

  if (legacy.listingCandidate?.listingSource && legacy.listingCandidate.listingId) {
    v2.selectedListingCandidates = [{ listingSource: legacy.listingCandidate.listingSource, listingId: legacy.listingCandidate.listingId }];
  }

  // Step 1 (setup language) and step 2 (type/stage) must be revisited since they're new/changed
  // — never assume step 9 (review) was reachable under the old 7-step numbering.
  v2.updatedByStep = 1;

  return v2;
}

// ---------------------------------------------------------------------------
// Structured-location rawText composer (Gate BCO-3R-B). Step 5 only edits `country` and
// `structuredDetails` — `rawText`/`normalizedText` (required by `validateServiceArea`, used for
// duplicate-detection matching) are auto-composed here rather than hand-typed by the owner.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Operating-model hybrid derivation (Gate BCO-3R-B.1). The customer never selects "hybrid"
// directly — it's derived automatically from selecting more than one primary mode, so the UI
// never asks for both the individual modes AND Hybrid. "multiple_locations" is a separate
// business fact, not one of the four primary modes this derivation counts.
// ---------------------------------------------------------------------------

export const PRIMARY_OPERATING_MODE_VALUES: readonly OperatingModel[] = ["fixed_location", "mobile", "online_remote", "regional"];

export function deriveEffectiveOperatingModels(selected: readonly OperatingModel[]): OperatingModel[] {
  const withoutHybrid = selected.filter((m) => m !== "hybrid");
  const primaryCount = withoutHybrid.filter((m) => PRIMARY_OPERATING_MODE_VALUES.includes(m)).length;
  return primaryCount > 1 ? [...withoutHybrid, "hybrid"] : withoutHybrid;
}

export function composeServiceAreaAreaKind(details: StructuredLocationDetailsV1): AreaKind {
  return details.streetName || details.streetNumber ? "physical_address" : "service_area_text";
}

// ---------------------------------------------------------------------------
// Gate BCO-3R-B.5 — changing the top-level service-area country must never leave stale,
// now-incompatible city/state/postal geography behind (e.g. country switched to Albania while
// "San Jose, California" from the previous country silently survives in coverage fields). Only
// fields that are physically "in" the selected country are cleared here — multi_country's own
// country list, worldwide's languages/time zones/delivery model, and non-geographic prefs
// (radius value/unit, address visibility, interaction mode) are untouched, since those are
// explicitly allowed to represent a different, independently-selected country (Phase 2's
// "business based in Albania, serves the US" example).
// ---------------------------------------------------------------------------

export function clearCountryDependentGeography(details: StructuredLocationDetailsV1): StructuredLocationDetailsV1 {
  const { coverage } = details;
  return {
    ...details,
    streetNumber: undefined,
    streetName: undefined,
    unit: undefined,
    neighborhood: undefined,
    city: undefined,
    stateProvince: undefined,
    postalCode: undefined,
    baseCity: undefined,
    baseStateProvince: undefined,
    basePostalCode: undefined,
    customCountryName: undefined,
    coverage: coverage
      ? {
          ...coverage,
          citiesServed: undefined,
          citiesStateProvince: undefined,
          stateProvince: undefined,
          statesProvincesServed: undefined,
          excludedStatesProvinces: undefined,
          excludedCitiesOrAreas: undefined,
          multiStateSelectAllConfirmed: undefined,
          nationwideConfirmed: undefined,
        }
      : coverage,
  };
}

export function composeServiceAreaRawText(country: string, details: StructuredLocationDetailsV1): string {
  if (details.streetName || details.streetNumber) {
    const line1 = [details.streetNumber, details.streetName].filter(Boolean).join(" ");
    const line2 = [details.unit, details.neighborhood].filter(Boolean).join(", ");
    const line3 = [details.city, details.stateProvince, details.postalCode].filter(Boolean).join(", ");
    return [line1, line2, line3, country && country !== "OTHER" ? country : details.customCountryName].filter(Boolean).join(", ");
  }
  // Gate BCO-3R-B.3 — the new unified coverage shape takes priority over the legacy scattered
  // fields below (which stay untouched for backward compatibility with pre-gate v2 records).
  const coverage = details.coverage;
  if (coverage?.level) {
    if (coverage.level === "local") {
      const place = [details.baseCity ?? details.city, details.baseStateProvince ?? details.stateProvince].filter(Boolean).join(", ");
      if (place) return place;
    } else if (coverage.level === "multi_city" && coverage.citiesServed && coverage.citiesServed.length > 0) {
      return coverage.citiesServed.join(", ");
    } else if (coverage.level === "one_state" && coverage.stateProvince) {
      return coverage.stateProvince;
    } else if (coverage.level === "multi_state" && coverage.statesProvincesServed && coverage.statesProvincesServed.length > 0) {
      return coverage.statesProvincesServed.join(", ");
    } else if (coverage.level === "nationwide") {
      return "Nationwide";
    } else if (coverage.level === "multi_country" && coverage.countriesServedCodes && coverage.countriesServedCodes.length > 0) {
      return coverage.countriesServedCodes.join(", ");
    } else if (coverage.level === "worldwide") {
      return "Worldwide";
    }
  }
  if (details.customCoverageDescription) return details.customCoverageDescription;
  if (details.citiesServed && details.citiesServed.length > 0) return details.citiesServed.join(", ");
  if (details.regionsServed && details.regionsServed.length > 0) return details.regionsServed.join(", ");
  if (details.countriesServed && details.countriesServed.length > 0) return details.countriesServed.join(", ");
  if (details.baseCity) return [details.baseCity, details.baseStateProvince].filter(Boolean).join(", ");
  if (details.international) return "International";
  if (details.nationwide) return "Nationwide";
  return country && country !== "OTHER" ? country : (details.customCountryName ?? "");
}

// ---------------------------------------------------------------------------
// Service-coverage human-readable summary (Gate BCO-3R-B.3, Phase 13/14). Renders exactly one
// sentence describing the owner's coverage choice — never raw arrays or raw JSON — for Step 9's
// review and the completed-profile view.
// ---------------------------------------------------------------------------

/**
 * Gate BCO-3R-B.5 — the physical street address is a fact about ONE country (the address's own),
 * kept fully separate from the business's country and its (possibly different) service-area
 * coverage — never collapsed into one line. Returns null when no physical address was entered so
 * the review row is omitted entirely rather than shown as an empty "—" fact. Shared by Step 9
 * review and the completed-profile page.
 */
export function physicalAddressSummary(details: StructuredLocationDetailsV1, country: string, lang: PrimaryLanguage): string | null {
  if (!details.streetName && !details.streetNumber && !details.city) return null;
  const line1 = [details.streetNumber, details.streetName].filter(Boolean).join(" ");
  const line2 = [details.unit, details.neighborhood].filter(Boolean).join(", ");
  const line3 = [details.city, details.stateProvince, details.postalCode].filter(Boolean).join(", ");
  const countryText = country && country !== "OTHER" ? countryLabel(country, lang) : (details.customCountryName ?? "");
  return [line1, line2, line3, countryText].filter(Boolean).join(", ");
}

export function summarizeServiceCoverage(
  country: string,
  details: StructuredLocationDetailsV1,
  lang: PrimaryLanguage,
  tc: BusinessIdentityCopy["wizard"]["step5"]["coverage"]["summary"],
): string {
  const coverage = details.coverage;
  if (!coverage || !coverage.level) return tc.none;

  function joinList(items: readonly string[]): string {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    return `${items.slice(0, -1).join(", ")} ${tc.listJoiner} ${items[items.length - 1]}`;
  }

  switch (coverage.level) {
    case "local": {
      const place = [details.baseCity || details.city, details.baseStateProvince || details.stateProvince].filter(Boolean).join(", ") || "—";
      if (coverage.radiusValue) {
        const unit = coverage.radiusUnit === "kilometers" ? tc.kilometersUnit : tc.milesUnit;
        return fillTemplate(tc.localWithRadiusTemplate, { radius: coverage.radiusValue, unit, place });
      }
      return fillTemplate(tc.localTemplate, { place });
    }
    case "multi_city": {
      const n = coverage.citiesServed?.length ?? 0;
      if (coverage.citiesStateProvince) return fillTemplate(tc.multiCityWithStateTemplate, { n, state: coverage.citiesStateProvince });
      return fillTemplate(tc.multiCityTemplate, { n });
    }
    case "one_state":
      return fillTemplate(tc.oneStateTemplate, { state: coverage.stateProvince || "—" });
    case "multi_state": {
      const n = coverage.statesProvincesServed?.length ?? 0;
      const excluded = coverage.excludedStatesProvinces ?? [];
      if (excluded.length > 0) return fillTemplate(tc.multiStateWithExclusionsTemplate, { n, exclusions: joinList(excluded) });
      return fillTemplate(tc.multiStateTemplate, { n });
    }
    case "nationwide": {
      const countryText = country && country !== "OTHER" ? countryLabel(country, lang) : (details.customCountryName ?? "—");
      const excluded = coverage.excludedStatesProvinces ?? [];
      if (excluded.length > 0) return fillTemplate(tc.nationwideWithExclusionsTemplate, { country: countryText, exclusions: joinList(excluded) });
      return fillTemplate(tc.nationwideTemplate, { country: countryText });
    }
    case "multi_country": {
      const codes = coverage.countriesServedCodes ?? [];
      const wholeRegionMatch = (coverage.regionSelections ?? []).find(
        (sel) => sel.wholeRegion && sel.countryCodes.length > 0 && sel.countryCodes.length === codes.length && sel.countryCodes.every((code) => codes.includes(code)),
      );
      if (wholeRegionMatch) {
        return fillTemplate(tc.multiCountryRegionTemplate, { n: codes.length, region: regionLabel(wholeRegionMatch.regionCode, lang) });
      }
      return fillTemplate(tc.multiCountryTemplate, { n: codes.length });
    }
    case "worldwide": {
      const languages = details.languagesServed ?? [];
      if (languages.length > 0) return fillTemplate(tc.worldwideWithLanguagesTemplate, { languages: joinList(languages) });
      return tc.worldwideTemplate;
    }
    default:
      return tc.none;
  }
}
