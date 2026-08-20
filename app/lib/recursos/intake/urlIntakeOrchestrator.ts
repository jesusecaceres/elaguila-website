import "server-only";

/**
 * Recursos Intake OS — Gate 3 URL intake orchestrator. Ties together: URL safety validation
 * (no DB writes if this fails) -> source_documents + resource_intake_jobs rows -> safe fetch ->
 * deterministic extraction -> AI proposal (fail-closed) -> confidential-address override ->
 * matching V1 -> community_resource_candidate_reviews row (disposition='researching', never
 * verified/promoted) -> verification_events -> job completion. Never writes community_resources.
 */
import { validateIntakeUrl } from "./urlSafety";
import { fetchUrlSafely } from "./urlFetch";
import { extractDeterministicSignals, looksConfidential } from "./htmlExtraction";
import { proposeCandidateFieldsWithAi } from "./aiProposalAdapter";
import { encodeProposalAsDiscrepancies, type UrlCandidateProposal } from "./urlCandidateProposal";
import { matchCandidateToExistingResource, type MatchResult } from "./matchCandidateToExistingResource";
import { dbCreateUrlSourceDocument } from "./server/sourceDocumentsDb";
import { dbCreateResourceIntakeJob, dbUpdateResourceIntakeJob } from "./server/resourceIntakeJobsDb";
import { insertVerificationEvent } from "./server/verificationEventsDb";
import { dbSaveCandidateReview } from "@/app/lib/recursos/server/communityResourceCandidateReviewsDb";
import { dbListCommunityResources } from "@/app/lib/recursos/server/communityResourcesDb";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";

function slugifyForCandidateId(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function buildDeterministicOnlyProposal(signals: ReturnType<typeof extractDeterministicSignals>, finalUrl: string, confidential: boolean): UrlCandidateProposal {
  const organizationName = signals.jsonLdOrganizationName ?? signals.headingCandidates[0] ?? signals.title ?? signals.hostname;
  return {
    organizationName,
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
    is24Hours: false,
    officialSourceUrl: finalUrl,
    confidenceNote: "Propuesta solo determinística — el proveedor de IA no estaba disponible. Requiere investigación humana completa.",
  };
}

function enforceConfidentialOverride(proposal: UrlCandidateProposal, confidential: boolean): UrlCandidateProposal {
  if (!confidential) return proposal;
  return {
    ...proposal,
    addressLine1: null,
    addressCity: null,
    addressState: null,
    addressZip: null,
    addressWithheldForSafety: true,
    confidenceNote: [proposal.confidenceNote, "ADVERTENCIA: el texto de la página sugiere una dirección confidencial — ninguna dirección se propuso automáticamente."]
      .filter(Boolean)
      .join(" "),
  };
}

export type UrlIntakeResult =
  | {
      ok: true;
      jobId: string;
      candidateId: string;
      proposal: UrlCandidateProposal;
      match: MatchResult;
      aiUsed: boolean;
      warnings: string[];
    }
  | { ok: false; reason: string; jobId: string | null };

export async function runUrlIntake(rawUrl: string, actorEmail: string | null): Promise<UrlIntakeResult> {
  const validated = validateIntakeUrl(rawUrl);
  if (!validated.ok) {
    // No DB writes at all for a rejected URL — nothing to clean up, nothing created.
    return { ok: false, reason: validated.reason, jobId: null };
  }

  const docResult = await dbCreateUrlSourceDocument({ title: validated.url.hostname, sourceUrl: validated.url.toString(), createdBy: actorEmail });
  if (!docResult.ok) return { ok: false, reason: `No se pudo registrar el documento fuente: ${docResult.error}`, jobId: null };

  const jobResult = await dbCreateResourceIntakeJob({ sourceType: "url", sourceDocumentId: docResult.id, createdBy: actorEmail });
  if (!jobResult.ok) return { ok: false, reason: `No se pudo crear el trabajo de intake: ${jobResult.error}`, jobId: null };
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
  const rawProposal = aiProposal ?? buildDeterministicOnlyProposal(signals, fetchResult.finalUrl, confidential);
  const proposal = enforceConfidentialOverride(rawProposal, confidential);

  const { rows: existingResources } = await dbListCommunityResources();
  const match = matchCandidateToExistingResource(
    { organizationName: proposal.organizationName, websiteUrl: proposal.websiteUrl, phone: proposal.phone, crisisPhone: proposal.crisisPhone },
    existingResources,
  );

  const candidateId = `url-${slugifyForCandidateId(proposal.organizationName) || slugifyForCandidateId(signals.hostname)}-${Math.random().toString(36).slice(2, 8)}`;

  const warnings: string[] = [];
  if (!aiUsed) warnings.push("El proveedor de IA no estaba disponible — solo se usaron señales determinísticas.");
  if (confidential) warnings.push("Posible dirección confidencial detectada — ninguna dirección se propuso automáticamente.");
  if (match.classification === "POSSIBLE_DUPLICATE") warnings.push("Múltiples recursos existentes comparten una señal fuerte — revisar manualmente antes de continuar.");

  const notesParts = [
    `Creado por intake de URL (${fetchResult.finalUrl}).`,
    aiUsed ? "Propuesta generada con asistencia de IA." : "Propuesta generada solo con extracción determinística (IA no disponible).",
    `Clasificación de coincidencia: ${match.classification}${match.matchedResourceName ? ` (${match.matchedResourceName})` : ""}.`,
    confidential ? "Posible dirección confidencial detectada — dirección omitida." : null,
  ].filter(Boolean);

  const saveResult = await dbSaveCandidateReview({
    candidateId,
    disposition: "researching",
    reviewedBy: null,
    reviewedAt: null,
    currentSourceUrl: fetchResult.finalUrl,
    currentSourceType: /\.gov$/i.test(signals.hostname) ? "government" : "official_org_site",
    organizationConfirmedActive: null,
    fieldsConfirmed: [],
    discrepanciesFromPdf: encodeProposalAsDiscrepancies(proposal),
    is24HoursConfirmedExplicit: false,
    addressHandling: confidential ? "withheld_for_safety" : null,
    verificationNotes: notesParts.join(" "),
  });

  if (!saveResult.ok) {
    await dbUpdateResourceIntakeJob(jobId, { status: "failed", errorMessage: `No se pudo guardar el candidato: ${saveResult.error}`, completed: true });
    return { ok: false, reason: `No se pudo guardar el candidato: ${saveResult.error}`, jobId };
  }

  await insertVerificationEvent({
    candidateId,
    sourceIntakeJobId: jobId,
    eventType: "candidate_created",
    actorEmail,
    sourceUrl: fetchResult.finalUrl,
    sourceType: "url",
    notes: `Match: ${match.classification}`,
  });
  if (aiUsed) {
    await insertVerificationEvent({
      candidateId,
      sourceIntakeJobId: jobId,
      eventType: "ai_proposal_generated",
      actorEmail,
      sourceUrl: fetchResult.finalUrl,
      sourceType: "url",
      notes: "AI Gateway field proposal generated — unverified.",
    });
  }

  await dbUpdateResourceIntakeJob(jobId, {
    status: "needs_review",
    provider: aiUsed ? "ai_gateway" : "deterministic_only",
    pagesProcessed: 1,
    candidatesCreatedCount: 1,
    matchesFoundCount: match.classification === "NEW" ? 0 : 1,
    completed: true,
  });

  auditAdminWrite("recurso_url_intake_candidate_created", "community_resource_candidate_review", candidateId, {
    actorEmail,
    sourceUrl: fetchResult.finalUrl,
    matchClassification: match.classification,
    jobId,
  });

  return { ok: true, jobId, candidateId, proposal, match, aiUsed, warnings };
}
