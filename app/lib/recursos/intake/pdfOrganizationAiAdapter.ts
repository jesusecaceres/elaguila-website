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

const SYSTEM_PROMPT = `You are a FIELD EXTRACTION assistant for a community-resource directory admin tool.
You read OCR'd text from several pages of a PDF resource guide and identify every distinct
organization or program described, proposing structured field values for each.
You are NOT a verifier — everything you output is an unverified proposal a human will review.

Rules:
- Identify EVERY distinct organization/program on these pages, not just the first one.
- Never invent a fact that is not stated or clearly implied by the given text.
- Leave a field null if the text does not clearly state it. Never guess a phone number, address, or hours.
- Only propose is24Hours=true if the text EXPLICITLY says "24 hours", "24/7", or equivalent.
- Only propose crisisPhone if the text explicitly frames a number as a crisis/emergency/hotline number.
- If the text indicates a confidential address (e.g. a domestic violence shelter), do NOT propose address fields.
- suggestedPrimaryCategory MUST be exactly one of: urgent-safety, food-basic-needs, housing-rent, mental-health-recovery, health-clinics, legal-immigration, babies-kids-parents, youth-education, jobs-training, seniors-disability, transportation-access, community-support.
- suggestedUrgencyLevel MUST be exactly one of: help-now, i-need-help, want-to-connect.
- organizationType MUST be exactly one of: nonprofit, government, faith-based, school-district, healthcare, community-clinic, hotline, other (or null).
- costModel MUST be exactly one of: free, low_cost, eligibility_based, unknown (or null).
- For each organization, include sourcePages: the array of page numbers (from the provided page markers) where it appears.

SPANISH FIELDS — you will be told the detected language of this page batch (es / en / bilingual / unknown):
- If the batch is SPANISH: extract shortDescriptionEs/detailsEs/eligibilityEs/hoursNoteEs DIRECTLY from the Spanish source text for each organization. This is EXTRACTION, not translation.
- If the batch is BILINGUAL: extract BOTH English fields (from their English text) AND Spanish fields (from their own separate Spanish text) — never translate one from the other.
- If the batch is ENGLISH (or unknown): leave ALL Spanish fields (shortDescriptionEs, detailsEs, eligibilityEs, hoursNoteEs) null for every organization. Do NOT translate — translation only happens later, after human verification, through a separate process.

Return ONLY JSON: { "organizations": [ <one object per distinct organization, same field shape as before including shortDescriptionEs/detailsEs/eligibilityEs/hoursNoteEs, plus "sourcePages": number[]> ] }
If no organizations are found on these pages, return { "organizations": [] }.`;

const CATEGORY_VALUES = new Set(["urgent-safety", "food-basic-needs", "housing-rent", "mental-health-recovery", "health-clinics", "legal-immigration", "babies-kids-parents", "youth-education", "jobs-training", "seniors-disability", "transportation-access", "community-support"]);
const URGENCY_VALUES = new Set(["help-now", "i-need-help", "want-to-connect"]);
const ORG_TYPE_VALUES = new Set(["nonprofit", "government", "faith-based", "school-district", "healthcare", "community-clinic", "hotline", "other"]);
const COST_MODEL_VALUES = new Set(["free", "low_cost", "eligibility_based", "unknown"]);

export type PdfOrganizationProposal = UrlCandidateProposal & { sourcePages: number[] };

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
    shortDescriptionEs,
    detailsEs,
    eligibilityEs,
    hoursNoteEs,
    detectedSourceLanguage: detectedLanguage,
    spanishIsOfficialSource,
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
