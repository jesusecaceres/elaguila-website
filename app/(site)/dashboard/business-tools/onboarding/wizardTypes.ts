import type { AreaKind, ChannelKind, ContactType, PrimaryLanguage } from "@/app/lib/business/types";

/**
 * The wizard's own working draft shape. Structurally compatible with
 * BusinessOnboardingDraftPayloadV1 (schemaVersion: 1, same field names for singular sections)
 * but extends `contact` to a `contacts` array to support "add another contact" (Phase 6 step 4)
 * — draft_payload is stored as plain jsonb server-side (draftsRepo.ts's isDraftPayload guard only
 * checks schemaVersion), so this superset round-trips safely without touching Package 2 schema.
 */
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
