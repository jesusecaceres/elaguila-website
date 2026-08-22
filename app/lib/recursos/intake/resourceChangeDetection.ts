/**
 * Recursos Intake OS — Gate 5 field comparison engine. Pure, no DB/network. One global contract
 * every intake source (URL re-check, PDF re-extraction, future partner request, future
 * re-verification) feeds through — no second diff engine per source. Compares a proposal
 * (already produced by URL/PDF intake — see urlCandidateProposal.ts) against the matched
 * ResourceRecord and returns ONLY meaningfully-changed fields, normalized so cosmetic
 * differences (formatting, trailing slash, null vs "") never produce a false proposal.
 */
import type { ResourceRecord } from "@/app/lib/recursos/types";
import type { UrlCandidateProposal } from "./urlCandidateProposal";

export type ProposalSource = "pdf_reextraction" | "url_recheck" | "partner_request" | "manual" | "translation" | "official_spanish";

/**
 * Fields eligible for a change proposal at all, mapped to their community_resources column.
 * This IS the server allow-list Gate 5H requires — accept/reject/bulk-accept actions only ever
 * write a column that appears here, never an arbitrary client-supplied name.
 *
 * Spanish Bridge (Gate ES-2A): the four *Es entries are the ONLY Spanish fields ever writable
 * through this contract — no arbitrary *_es key is permitted. These are always safe fields
 * structurally (never phone/address/is24Hours), but a proposal touching them is separately
 * excluded from bulk-safe-accept whenever proposalSource === "translation" OR "official_spanish"
 * (Gate ES-9B) — see app/admin/recursosChangeProposalActions.ts's acceptAllSafeChangeProposalsAction.
 * Official-source Spanish must only ever reach community_resources through the dedicated
 * confirmation core in recursosOfficialSpanishActions.ts/recursosTranslationActions.ts, never the
 * generic factual bulk-accept.
 */
export const WRITABLE_FIELD_COLUMNS: Record<string, string> = {
  organizationName: "organization_name",
  programName: "program_name",
  suggestedDescriptionEn: "short_description_en",
  websiteUrl: "website_url",
  phone: "phone",
  crisisPhone: "crisis_phone",
  sms: "sms",
  email: "email",
  addressLine1: "address_line1",
  addressCity: "address_city",
  addressState: "address_state",
  addressZip: "address_zip",
  hoursNoteEn: "hours_note_en",
  is24Hours: "is_24_hours",
  serviceArea: "service_area",
  eligibilityEn: "eligibility_en",
  languages: "languages",
  costModel: "cost_model",
  shortDescriptionEs: "short_description_es",
  detailsEs: "details_es",
  eligibilityEs: "eligibility_es",
  hoursNoteEs: "hours_note_es",
};

/**
 * Fields that always require individual human review — never eligible for "Aceptar cambios
 * seguros" bulk accept, regardless of how confident the proposal looks. Centralized here so
 * every caller (bulk-accept action, UI badge, future Gate 7/re-verification) reads one source
 * of truth instead of re-deriving this list.
 */
export const SAFETY_SENSITIVE_FIELDS: ReadonlySet<string> = new Set([
  "crisisPhone",
  "sms",
  "addressLine1",
  "addressCity",
  "addressState",
  "addressZip",
  "is24Hours",
]);

export function isSafetySensitiveField(field: string): boolean {
  return SAFETY_SENSITIVE_FIELDS.has(field);
}

/**
 * Spanish Bridge (Gate ES-2D): identifies a resource whose PROSE content deserves extra scrutiny
 * during translation review, even though the translation itself never touches a structured
 * SAFETY_SENSITIVE_FIELDS value. A crisis/24-7/urgent-safety resource's Spanish description or
 * eligibility text still needs individual human attention (e.g. a mistranslated eligibility
 * qualifier on a DV shelter's Spanish page is a real harm even though "eligibilityEs" itself is
 * not in SAFETY_SENSITIVE_FIELDS). Does not change any factual value — read-only classification,
 * consumed by later gates (Cambios badge now; bulk-translation exclusion in a future gate).
 */
export function isHighRiskResourceForTranslation(resource: {
  primaryCategory?: string | null;
  crisisPhone?: string | null;
  is24Hours?: boolean | null;
}): boolean {
  return resource.primaryCategory === "urgent-safety" || Boolean(resource.crisisPhone) || resource.is24Hours === true;
}

export type FieldChange = {
  field: string;
  oldValue: string | null;
  proposedValue: string | null;
  safetySensitive: boolean;
};

function normalizeForCompare(field: string, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return [...value].map((v) => String(v).trim().toLowerCase()).sort().join(";");
  let s = String(value).trim();
  if (s === "") return "";

  if (field === "phone" || field === "crisisPhone") {
    const digits = s.replace(/\D/g, "");
    return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  }
  if (field === "websiteUrl") {
    try {
      const u = new URL(s);
      const host = u.hostname.toLowerCase().replace(/^www\./, "");
      const path = u.pathname.replace(/\/+$/, "");
      return `${host}${path}`.toLowerCase();
    } catch {
      return s.toLowerCase().replace(/\/+$/, "");
    }
  }
  if (field === "is24Hours") {
    return s.toLowerCase() === "true" ? "true" : "false";
  }
  // Default: case/whitespace-insensitive text compare — real semantic differences still survive.
  return s.toLowerCase().replace(/\s+/g, " ");
}

function displayValue(field: string, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.length ? value.join("; ") : null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

function getResourceFieldValue(resource: ResourceRecord, field: string): unknown {
  switch (field) {
    case "organizationName":
      return resource.organizationName;
    case "programName":
      return resource.programName;
    case "suggestedDescriptionEn":
      return resource.shortDescriptionEn;
    case "websiteUrl":
      return resource.contact.websiteUrl;
    case "phone":
      return resource.contact.phone;
    case "crisisPhone":
      return resource.contact.crisisPhone;
    case "sms":
      return resource.contact.sms;
    case "email":
      return resource.contact.email;
    case "addressLine1":
      return resource.contact.address?.line1 ?? null;
    case "addressCity":
      return resource.contact.address?.city ?? null;
    case "addressState":
      return resource.contact.address?.state ?? null;
    case "addressZip":
      return resource.contact.address?.zip ?? null;
    case "hoursNoteEn":
      return resource.contact.hoursNoteEn;
    case "is24Hours":
      return resource.contact.is24Hours;
    case "serviceArea":
      return resource.serviceArea;
    case "eligibilityEn":
      return resource.eligibilityEn;
    case "languages":
      return resource.languages;
    case "costModel":
      return resource.costModel;
    case "shortDescriptionEs":
      return resource.shortDescriptionEs;
    case "detailsEs":
      return resource.detailsEs;
    case "eligibilityEs":
      return resource.eligibilityEs;
    case "hoursNoteEs":
      return resource.contact.hoursNoteEs;
    default:
      return undefined;
  }
}

function getProposalFieldValue(proposal: UrlCandidateProposal, field: string): unknown {
  return (proposal as unknown as Record<string, unknown>)[field];
}

/**
 * Returns only fields whose normalized value actually differs. Address fields are only
 * proposed at all when the incoming proposal did NOT withhold them for safety (a confidential
 * address must never generate a "proposed" address change) — the existing resource's own
 * withheld status, if any, is preserved untouched either way.
 */
export function detectResourceFieldChanges(proposal: UrlCandidateProposal, resource: ResourceRecord): FieldChange[] {
  const changes: FieldChange[] = [];
  const addressWithheld = resource.contact.address?.addressWithheldForSafety === true;

  for (const field of Object.keys(WRITABLE_FIELD_COLUMNS)) {
    const isAddressField = field.startsWith("address");
    if (isAddressField && (proposal.addressWithheldForSafety || addressWithheld)) continue; // never propose over a confidential address

    const proposedRaw = getProposalFieldValue(proposal, field);
    if (proposedRaw === null || proposedRaw === undefined || proposedRaw === "" || (Array.isArray(proposedRaw) && proposedRaw.length === 0)) {
      continue; // never propose replacing a real value with "we don't know"
    }

    const currentRaw = getResourceFieldValue(resource, field);
    if (normalizeForCompare(field, proposedRaw) === normalizeForCompare(field, currentRaw)) continue;

    changes.push({
      field,
      oldValue: displayValue(field, currentRaw),
      proposedValue: displayValue(field, proposedRaw),
      safetySensitive: isSafetySensitiveField(field),
    });
  }

  return changes;
}
