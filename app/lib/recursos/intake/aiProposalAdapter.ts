import "server-only";

/**
 * Recursos Intake OS — Gate 3 AI field proposal. Same shape as
 * app/lib/iglesias/churchIntakeAiAdapter.ts: Vercel AI Gateway, strict system prompt, structured
 * JSON only, fail-closed (any error/timeout/unavailable → null, caller must never fabricate).
 *
 * CRITICAL: the AI never determines verification truth. It only proposes field values from the
 * text it was given. It is explicitly instructed to leave a field null rather than guess, and to
 * never claim 24/7 or a crisis line without the source text saying so explicitly.
 */
import type { DeterministicSignals } from "./htmlExtraction";
import type { UrlCandidateProposal } from "./urlCandidateProposal";
import type { CostModel, OrganizationType, PrimaryCategorySlug, UrgencyLevel } from "@/app/lib/recursos/types";

const SYSTEM_PROMPT = `You are a FIELD PROPOSAL assistant for a community-resource directory admin tool.
You read the text of an official organization/program webpage and propose structured field values.
You are NOT a verifier — everything you output is an unverified proposal a human will review.

Rules:
- Never invent a fact that is not stated or clearly implied by the given text.
- Leave a field null if the text does not clearly state it. Never guess a phone number, address, or hours.
- Only propose is24Hours=true if the text EXPLICITLY says "24 hours", "24/7", or equivalent. Never infer it from urgency or category.
- Only propose crisisPhone if the text explicitly frames a number as a crisis/emergency/hotline number — never propose a general office number as a crisis line.
- If the text indicates the physical address is confidential (e.g. a domestic violence shelter), do NOT propose any address fields — leave them null and note it in confidenceNote instead.
- suggestedPrimaryCategory MUST be exactly one of: urgent-safety, food-basic-needs, housing-rent, mental-health-recovery, health-clinics, legal-immigration, babies-kids-parents, youth-education, jobs-training, seniors-disability, transportation-access, community-support.
- suggestedUrgencyLevel MUST be exactly one of: help-now, i-need-help, want-to-connect. Only use help-now for genuine crisis/emergency/safety services.
- organizationType MUST be exactly one of: nonprofit, government, faith-based, school-district, healthcare, community-clinic, hotline, other (or null).
- costModel MUST be exactly one of: free, low_cost, eligibility_based, unknown (or null).

Return ONLY JSON matching this shape (use null for anything not clearly stated):
{
  "organizationName": string,
  "programName": string | null,
  "organizationType": string | null,
  "suggestedDescriptionEn": string | null,
  "suggestedPrimaryCategory": string,
  "suggestedUrgencyLevel": string,
  "phone": string | null,
  "crisisPhone": string | null,
  "sms": string | null,
  "email": string | null,
  "websiteUrl": string | null,
  "addressLine1": string | null,
  "addressCity": string | null,
  "addressState": string | null,
  "addressZip": string | null,
  "addressWithheldForSafety": boolean,
  "serviceArea": string | null,
  "eligibilityEn": string | null,
  "languages": string[],
  "costModel": string | null,
  "hoursNoteEn": string | null,
  "is24Hours": boolean,
  "confidenceNote": string | null
}`;

const CATEGORY_VALUES = new Set<PrimaryCategorySlug>(["urgent-safety", "food-basic-needs", "housing-rent", "mental-health-recovery", "health-clinics", "legal-immigration", "babies-kids-parents", "youth-education", "jobs-training", "seniors-disability", "transportation-access", "community-support"]);
const URGENCY_VALUES = new Set<UrgencyLevel>(["help-now", "i-need-help", "want-to-connect"]);
const ORG_TYPE_VALUES = new Set<OrganizationType>(["nonprofit", "government", "faith-based", "school-district", "healthcare", "community-clinic", "hotline", "other"]);
const COST_MODEL_VALUES = new Set<CostModel>(["free", "low_cost", "eligibility_based", "unknown"]);

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, 500) : null;
}
function bool(v: unknown): boolean {
  return v === true;
}
function enumOrDefault<T extends string>(v: unknown, allowed: Set<T>, fallback: T): T {
  return typeof v === "string" && allowed.has(v as T) ? (v as T) : fallback;
}

export function parseAiProposalJson(raw: string, officialSourceUrl: string): UrlCandidateProposal | null {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      parsed = JSON.parse(trimmed.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  const organizationName = str(o.organizationName);
  if (!organizationName) return null; // an organization name is the one non-negotiable field

  return {
    organizationName,
    programName: str(o.programName),
    organizationType: (enumOrDefault(o.organizationType, ORG_TYPE_VALUES, "" as never) || null) as UrlCandidateProposal["organizationType"],
    suggestedDescriptionEn: str(o.suggestedDescriptionEn),
    suggestedPrimaryCategory: enumOrDefault(o.suggestedPrimaryCategory, CATEGORY_VALUES, "community-support"),
    suggestedUrgencyLevel: enumOrDefault(o.suggestedUrgencyLevel, URGENCY_VALUES, "i-need-help"),
    phone: str(o.phone),
    crisisPhone: str(o.crisisPhone),
    sms: str(o.sms),
    email: str(o.email),
    websiteUrl: str(o.websiteUrl),
    addressLine1: bool(o.addressWithheldForSafety) ? null : str(o.addressLine1),
    addressCity: bool(o.addressWithheldForSafety) ? null : str(o.addressCity),
    addressState: bool(o.addressWithheldForSafety) ? null : str(o.addressState),
    addressZip: bool(o.addressWithheldForSafety) ? null : str(o.addressZip),
    addressWithheldForSafety: bool(o.addressWithheldForSafety),
    serviceArea: str(o.serviceArea),
    eligibilityEn: str(o.eligibilityEn),
    languages: Array.isArray(o.languages) ? o.languages.filter((x): x is string => typeof x === "string").slice(0, 15) : [],
    costModel: (enumOrDefault(o.costModel, COST_MODEL_VALUES, "" as never) || null) as UrlCandidateProposal["costModel"],
    hoursNoteEn: str(o.hoursNoteEn),
    is24Hours: bool(o.is24Hours),
    officialSourceUrl,
    confidenceNote: str(o.confidenceNote),
  };
}

function userPayload(signals: DeterministicSignals): string {
  return JSON.stringify({
    title: signals.title,
    hostname: signals.hostname,
    headings: signals.headingCandidates,
    jsonLdOrganizationName: signals.jsonLdOrganizationName,
    deterministicEmails: signals.emails,
    deterministicPhones: signals.phoneCandidates,
    pageText: signals.sanitizedText,
  });
}

/** Returns null on any unavailability/error/timeout — caller must fail to human-review, never fabricate. */
export async function proposeCandidateFieldsWithAi(signals: DeterministicSignals, officialSourceUrl: string): Promise<UrlCandidateProposal | null> {
  const key = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.RECURSOS_URL_INTAKE_MODEL?.trim() || "openai/gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPayload(signals) },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    return parseAiProposalJson(content, officialSourceUrl);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
