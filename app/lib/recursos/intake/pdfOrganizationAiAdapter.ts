import "server-only";

/**
 * Recursos Intake OS — Gate 4 AI organization/program extraction from OCR'd PDF page text.
 * Same Vercel AI Gateway pattern as aiProposalAdapter.ts (URL intake) and
 * app/lib/iglesias/churchIntakeAiAdapter.ts — fail-closed to an empty array on any error, never
 * fabricates. Called once per page-range batch (see pdfIntakeOrchestrator.ts) so a single call
 * never has to carry an entire large PDF's text.
 */
import type { UrlCandidateProposal } from "./urlCandidateProposal";
import { detectSourceLanguageFromText, type DetectedLanguage } from "./htmlExtraction";
import { ENTITY_TYPE_VALUES, type EntityType } from "./entityType";

const SYSTEM_PROMPT = `You are a FIELD EXTRACTION assistant for a community-resource directory admin tool.
You read OCR'd text from several pages of a PDF resource guide and identify every distinct
entity described — organizations, programs, partner listings, office locations, and referral
links — proposing structured field values for each.
You are NOT a verifier — everything you output is an unverified proposal a human will review.

Rules:
- Identify EVERY distinct entity on these pages, not just the first one.
- Never invent a fact that is not stated or clearly implied by the given text.
- Leave a field null if the text does not clearly state it. Never guess a phone number, address, or hours.
- Only propose is24Hours=true if the text EXPLICITLY says "24 hours", "24/7", or equivalent.
- Only propose crisisPhone if the text explicitly frames a number as a crisis/emergency/hotline number.
- If the text indicates a confidential address (e.g. a domestic violence shelter), do NOT propose address fields.
- suggestedPrimaryCategory MUST be exactly one of: urgent-safety, food-basic-needs, housing-rent, mental-health-recovery, health-clinics, legal-immigration, babies-kids-parents, youth-education, jobs-training, seniors-disability, transportation-access, community-support.
- suggestedUrgencyLevel MUST be exactly one of: help-now, i-need-help, want-to-connect.
- organizationType MUST be exactly one of: nonprofit, government, faith-based, school-district, healthcare, community-clinic, hotline, other (or null).
- costModel MUST be exactly one of: free, low_cost, eligibility_based, unknown (or null).
- For each entity, include sourcePages: the array of page numbers (from the provided page markers) where it appears, and sourceSections: a short label of the section/heading it appeared under, if one is visible (e.g. "County Services — Behavioral Health"), else null.

ENTITY TYPE — every entity MUST be classified as exactly one of:
- PRIMARY_RESOURCE: a standalone service or organization that stands on its own and is suitable for someone to contact directly for help. Most top-level entries in a guide are this.
- PROGRAM: a distinct service or program that is clearly offered UNDER a parent organization (e.g. "CalFresh" under a county Social Services department). Set parentOrganizationName to the parent's exact name as it appears in the text.
- PARTNER_ORGANIZATION: an organization mentioned as linked/associated with a primary entry (e.g. a partner-agency list) that may already exist as its own independent resource elsewhere. Set parentOrganizationName to the entry it's listed under, if any.
- LOCATION: an office, service site, mailing address, or drop-box location only — not a service in itself. Set parentOrganizationName (and parentProgramName if it's specific to one program) to whichever entity this location belongs to.
- REFERRAL_LINK: a resource, phone number, or link mentioned only as a pointer to look up elsewhere (e.g. "BenefitsCal", "211", an external application portal, a general government landing page) — not something to propose as its own resource. Set parentOrganizationName to the entry it was mentioned under, if any.
Only PRIMARY_RESOURCE, PROGRAM, and PARTNER_ORGANIZATION are ever eligible to become a reviewable candidate — LOCATION and REFERRAL_LINK are always evidence attached to their parent, never a standalone entry, regardless of how much detail is given about them.

SPANISH FIELDS — you will be told the detected language of this page batch (es / en / bilingual / unknown):
- If the batch is SPANISH: extract shortDescriptionEs/detailsEs/eligibilityEs/hoursNoteEs DIRECTLY from the Spanish source text for each entity. This is EXTRACTION, not translation.
- If the batch is BILINGUAL: extract BOTH English fields (from their English text) AND Spanish fields (from their own separate Spanish text) — never translate one from the other.
- If the batch is ENGLISH (or unknown): leave ALL Spanish fields (shortDescriptionEs, detailsEs, eligibilityEs, hoursNoteEs) null for every entity. Do NOT translate — translation only happens later, after human verification, through a separate process.

Return ONLY JSON: { "organizations": [ <one object per distinct entity, same field shape as before including shortDescriptionEs/detailsEs/eligibilityEs/hoursNoteEs, plus "sourcePages": number[], "sourceSections": string|null, "entityType", "parentOrganizationName", "parentProgramName"> ] }
If no entities are found on these pages, return { "organizations": [] }.`;

const CATEGORY_VALUES = new Set(["urgent-safety", "food-basic-needs", "housing-rent", "mental-health-recovery", "health-clinics", "legal-immigration", "babies-kids-parents", "youth-education", "jobs-training", "seniors-disability", "transportation-access", "community-support"]);
const URGENCY_VALUES = new Set(["help-now", "i-need-help", "want-to-connect"]);
const ORG_TYPE_VALUES = new Set(["nonprofit", "government", "faith-based", "school-district", "healthcare", "community-clinic", "hotline", "other"]);
const COST_MODEL_VALUES = new Set(["free", "low_cost", "eligibility_based", "unknown"]);

export type PdfOrganizationProposal = UrlCandidateProposal & { sourcePages: number[]; sourceSections: string | null };

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, 500) : null;
}
function bool(v: unknown): boolean {
  return v === true;
}

function parseOneOrganization(o: Record<string, unknown>, officialSourceUrl: string, detectedLanguage: DetectedLanguage): PdfOrganizationProposal | null {
  const organizationName = str(o.organizationName);
  if (!organizationName) return null;
  const withheld = bool(o.addressWithheldForSafety);
  const sourcePages = Array.isArray(o.sourcePages) ? o.sourcePages.filter((p): p is number => typeof p === "number") : [];

  // Spanish Bridge (Gate ES-5D): same defense-in-depth gate as the URL adapter — even if the
  // model hallucinates Spanish content for an English/unknown batch, it is forcibly discarded here.
  const sourceMayHaveSpanish = detectedLanguage === "es" || detectedLanguage === "bilingual";
  const shortDescriptionEs = sourceMayHaveSpanish ? str(o.shortDescriptionEs) : null;
  const detailsEs = sourceMayHaveSpanish ? str(o.detailsEs) : null;
  const eligibilityEs = sourceMayHaveSpanish ? str(o.eligibilityEs) : null;
  const hoursNoteEs = sourceMayHaveSpanish ? str(o.hoursNoteEs) : null;
  const spanishIsOfficialSource = sourceMayHaveSpanish && Boolean(shortDescriptionEs || detailsEs || eligibilityEs || hoursNoteEs);

  // Gate ES-7A: never invent a classification the model didn't give — but an unclassifiable or
  // missing value defaults to PRIMARY_RESOURCE (visible for human review), never silently to
  // LOCATION/REFERRAL_LINK (which would make it invisible instead — the unsafe direction).
  const entityTypeRaw = String(o.entityType ?? "");
  const entityType: EntityType = ENTITY_TYPE_VALUES.has(entityTypeRaw as EntityType) ? (entityTypeRaw as EntityType) : "PRIMARY_RESOURCE";
  const parentOrganizationName = str(o.parentOrganizationName);
  const parentProgramName = str(o.parentProgramName);
  const sourceSections = str(o.sourceSections);

  return {
    organizationName,
    programName: str(o.programName),
    organizationType: (ORG_TYPE_VALUES.has(String(o.organizationType)) ? (o.organizationType as PdfOrganizationProposal["organizationType"]) : null),
    suggestedDescriptionEn: str(o.suggestedDescriptionEn),
    suggestedPrimaryCategory: CATEGORY_VALUES.has(String(o.suggestedPrimaryCategory)) ? (o.suggestedPrimaryCategory as PdfOrganizationProposal["suggestedPrimaryCategory"]) : "community-support",
    suggestedUrgencyLevel: URGENCY_VALUES.has(String(o.suggestedUrgencyLevel)) ? (o.suggestedUrgencyLevel as PdfOrganizationProposal["suggestedUrgencyLevel"]) : "i-need-help",
    phone: str(o.phone),
    crisisPhone: str(o.crisisPhone),
    sms: str(o.sms),
    email: str(o.email),
    websiteUrl: str(o.websiteUrl),
    addressLine1: withheld ? null : str(o.addressLine1),
    addressCity: withheld ? null : str(o.addressCity),
    addressState: withheld ? null : str(o.addressState),
    addressZip: withheld ? null : str(o.addressZip),
    addressWithheldForSafety: withheld,
    serviceArea: str(o.serviceArea),
    eligibilityEn: str(o.eligibilityEn),
    languages: Array.isArray(o.languages) ? o.languages.filter((x): x is string => typeof x === "string").slice(0, 15) : [],
    costModel: COST_MODEL_VALUES.has(String(o.costModel)) ? (o.costModel as PdfOrganizationProposal["costModel"]) : null,
    hoursNoteEn: str(o.hoursNoteEn),
    is24Hours: bool(o.is24Hours),
    officialSourceUrl,
    confidenceNote: str(o.confidenceNote),
    sourcePages: sourcePages.length ? sourcePages : [],
    sourceSections,
    shortDescriptionEs,
    detailsEs,
    eligibilityEs,
    hoursNoteEs,
    detectedSourceLanguage: detectedLanguage,
    spanishIsOfficialSource,
    entityType,
    parentOrganizationName,
    parentProgramName,
  };
}

export function parsePdfOrganizationsJson(raw: string, officialSourceUrl: string, detectedLanguage: DetectedLanguage = "unknown"): PdfOrganizationProposal[] {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return [];
    try {
      parsed = JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return [];
    }
  }
  if (!parsed || typeof parsed !== "object") return [];
  const list = (parsed as Record<string, unknown>).organizations;
  if (!Array.isArray(list)) return [];
  return list
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((o) => parseOneOrganization(o, officialSourceUrl, detectedLanguage))
    .filter((x): x is PdfOrganizationProposal => x !== null)
    .slice(0, 40); // hard cap per batch — a sane page-range batch should never legitimately exceed this
}

function userPayload(pages: { pageNumber: number; text: string }[], detectedLanguage: DetectedLanguage): string {
  const marked = pages.map((p) => `[PAGE ${p.pageNumber}]\n${p.text}`).join("\n\n");
  return JSON.stringify({ detectedLanguage, pages: marked.slice(0, 12000) }); // cost control — one batch's worth of page text, not an entire large PDF
}

/** Returns [] on any unavailability/error/timeout — caller must fail to human-review, never fabricate. */
export async function proposeOrganizationsFromPages(pages: { pageNumber: number; text: string }[], officialSourceUrl: string): Promise<PdfOrganizationProposal[]> {
  const key = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!key) return [];
  if (pages.every((p) => !p.text.trim())) return [];

  // Spanish Bridge (Gate ES-5D): PDF page text has no <html lang> attribute, so language
  // detection here is text-density-only (detectSourceLanguageFromText), computed once per batch
  // from the combined page text and passed to the model as explicit context, then re-enforced
  // defensively in parseOneOrganization regardless of what the model does with it.
  const combinedText = pages.map((p) => p.text).join(" ");
  const detectedLanguage = detectSourceLanguageFromText(combinedText);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.RECURSOS_PDF_INTAKE_MODEL?.trim() || "openai/gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPayload(pages, detectedLanguage) },
        ],
      }),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return [];
    return parsePdfOrganizationsJson(content, officialSourceUrl, detectedLanguage);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
