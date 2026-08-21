import "server-only";

/**
 * Recursos Intake OS — Gate 6H reverification via the existing URL intake engine. No second
 * website-recheck system: reuses validateIntakeUrl, fetchUrlSafely, extractDeterministicSignals,
 * proposeCandidateFieldsWithAi, and the Gate 5 field-comparison contract exactly as Gate 3's URL
 * intake does. The one difference is identity is already known (this resource), so there is no
 * matching step and no new candidate is created — comparison runs directly against the known
 * resource, producing resource_change_proposals only.
 */
import { validateIntakeUrl } from "./urlSafety";
import { fetchUrlSafely } from "./urlFetch";
import { extractDeterministicSignals, looksConfidential } from "./htmlExtraction";
import { proposeCandidateFieldsWithAi } from "./aiProposalAdapter";
import { detectResourceFieldChanges } from "./resourceChangeDetection";
import { dbCreateUrlSourceDocument } from "./server/sourceDocumentsDb";
import { dbCreateResourceIntakeJob, dbUpdateResourceIntakeJob } from "./server/resourceIntakeJobsDb";
import { dbCreateResourceChangeProposalIfNotPending } from "./server/resourceChangeProposalsDb";
import { insertVerificationEvent } from "./server/verificationEventsDb";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import type { ResourceRecord } from "@/app/lib/recursos/types";
import type { UrlCandidateProposal } from "./urlCandidateProposal";

export type ReverifyResourceResult =
  | { ok: true; jobId: string; changeCount: number; aiUsed: boolean }
  | { ok: false; reason: string; jobId: string | null };

function buildDeterministicOnlyProposal(signals: ReturnType<typeof extractDeterministicSignals>, finalUrl: string, resourceName: string, confidential: boolean): UrlCandidateProposal {
  // is24Hours is deliberately OMITTED, not set to `false`: extractDeterministicSignals has no
  // capability to detect 24/7 status at all (confirmed — it only extracts phones/emails/address-
  // like lines), so there is zero real signal either way. A hardcoded `false` here would fabricate
  // a safety-sensitive claim with no evidence — confirmed live during Gate 8 QA, where this exact
  // bug proposed flipping a genuinely-24/7 resource's is24Hours to false on every AI-unavailable
  // reverification. detectResourceFieldChanges skips undefined fields entirely (never proposes
  // replacing real data with "unknown"), so omitting it here is the correct, safe behavior — same
  // fix pattern as convertPartnerRequestToProposals.ts (Gate 7).
  const proposal: Partial<UrlCandidateProposal> = {
    organizationName: resourceName,
    programName: null,
    organizationType: null,
    suggestedDescriptionEn: null,
    suggestedPrimaryCategory: "community-support",
    suggestedUrgencyLevel: "i-need-help",
    phone: signals.phoneCandidates[0] ?? null,
    crisisPhone: null,
    sms: null,
    email: signals.emails[0] ?? null,
    websiteUrl: finalUrl,
    addressLine1: confidential ? null : (signals.addressLikeLines[0] ?? null),
    addressCity: null,
    addressState: null,
    addressZip: null,
    addressWithheldForSafety: confidential,
    serviceArea: null,
    eligibilityEn: null,
    languages: [],
    costModel: null,
    hoursNoteEn: null,
    officialSourceUrl: finalUrl,
    confidenceNote: "Solo señales determinísticas — proveedor de IA no disponible durante la reverificación.",
  };
  return proposal as UrlCandidateProposal;
}

/** Reverifies ONE known resource against its own official URL. Never creates a new candidate. */
export async function reverifyResourceViaUrl(resource: ResourceRecord, actorEmail: string | null): Promise<ReverifyResourceResult> {
  const rawUrl = resource.contact.websiteUrl ?? resource.verification.officialSourceUrl;
  if (!rawUrl) {
    return { ok: false, reason: "Sin sitio oficial para reverificar automáticamente.", jobId: null };
  }

  const validated = validateIntakeUrl(rawUrl);
  if (!validated.ok) return { ok: false, reason: validated.reason, jobId: null };

  const docResult = await dbCreateUrlSourceDocument({ title: `Reverificación — ${resource.organizationName}`, sourceUrl: validated.url.toString(), createdBy: actorEmail });
  if (!docResult.ok) return { ok: false, reason: `No se pudo registrar el documento fuente: ${docResult.error}`, jobId: null };

  const jobResult = await dbCreateResourceIntakeJob({ sourceType: "url", sourceDocumentId: docResult.id, createdBy: actorEmail });
  if (!jobResult.ok) return { ok: false, reason: `No se pudo crear el trabajo de reverificación: ${jobResult.error}`, jobId: null };
  const jobId = jobResult.id;

  const fetchResult = await fetchUrlSafely(validated.url);
  if (!fetchResult.ok) {
    await dbUpdateResourceIntakeJob(jobId, { status: "failed", errorMessage: fetchResult.reason, completed: true });
    return { ok: false, reason: fetchResult.reason, jobId };
  }

  const signals = extractDeterministicSignals(fetchResult.html, fetchResult.finalUrl);
  const confidential = looksConfidential(signals.sanitizedText);

  const aiProposal = await proposeCandidateFieldsWithAi(signals, fetchResult.finalUrl);
  const aiUsed = aiProposal !== null;
  const proposal = aiProposal ?? buildDeterministicOnlyProposal(signals, fetchResult.finalUrl, resource.organizationName, confidential);

  const changes = detectResourceFieldChanges(proposal, resource);
  let created = 0;
  for (const change of changes) {
    const result = await dbCreateResourceChangeProposalIfNotPending({
      resourceId: resource.id,
      sourceIntakeJobId: jobId,
      fieldName: change.field,
      oldValue: change.oldValue,
      proposedValue: change.proposedValue,
      proposalSource: "url_recheck",
    });
    if (result.ok && !result.skippedDuplicate) created++;
  }

  await insertVerificationEvent({
    resourceId: resource.id,
    sourceIntakeJobId: jobId,
    eventType: "evidence_recorded",
    actorEmail,
    sourceUrl: fetchResult.finalUrl,
    sourceType: "url_recheck",
    notes: `Reverificación iniciada — ${created} cambio(s) propuesto(s)${aiUsed ? "" : " (solo determinístico, IA no disponible)"}.`,
  });

  await dbUpdateResourceIntakeJob(jobId, {
    status: "needs_review",
    provider: aiUsed ? "ai_gateway" : "deterministic_only",
    pagesProcessed: 1,
    candidatesCreatedCount: 0,
    matchesFoundCount: created > 0 ? 1 : 0,
    completed: true,
  });

  auditAdminWrite("recurso_reverification_started", "community_resource", resource.id, { actorEmail, sourceUrl: fetchResult.finalUrl, changeCount: created, jobId });

  return { ok: true, jobId, changeCount: created, aiUsed };
}
