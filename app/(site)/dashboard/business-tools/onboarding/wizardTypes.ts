import type {
  AreaKind,
  AuthorizationRole,
  BroadBusinessType,
  BusinessStage,
  ChannelKind,
  ContactLabel,
  ContactType,
  ContactVisibility,
  DigitalProfilePlatform,
  OperatingModel,
  PrimaryLanguage,
  SalesChannel,
  SalesRelationship,
  StructuredLocationDetailsV1,
} from "@/app/lib/business/types";

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
};

export type WizardDigitalProfileDraft = {
  id: string;
  platform: DigitalProfilePlatform | "";
  handleOrUrl: string;
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
  digitalProfiles: WizardDigitalProfileDraft[];
  ownershipAuthorization: {
    confirmed: boolean;
    role: AuthorizationRole | "";
    representativeRelationship: string;
    representativeContactEmail: string;
    representativeNote: string;
  };
  selectedListingCandidates: WizardListingCandidateDraftV2[];
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
    digitalProfiles: [],
    ownershipAuthorization: { confirmed: false, role: "", representativeRelationship: "", representativeContactEmail: "", representativeNote: "" },
    selectedListingCandidates: [],
    updatedByStep: 1,
  };
}

export function newContactDraftV2(): WizardContactDraftV2 {
  return { id: crypto.randomUUID(), contactType: "", rawValue: "", preferredChannel: false, channelKind: null, isPrimary: false, label: "main", visibility: "public" };
}

export function newDigitalProfileDraft(): WizardDigitalProfileDraft {
  return { id: crypto.randomUUID(), platform: "", handleOrUrl: "" };
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
