import "server-only";

/**
 * Recursos Intake OS — Gate ES-7C multi-entity URL intake. A sibling to runUrlIntake()
 * (urlIntakeOrchestrator.ts), not a replacement — that function stays untouched and remains the
 * default single-entity path for a simple organization page. This one is explicit, opt-in, for a
 * page that clearly lists multiple entities (a partner-agency page, a county services directory
 * page). Reuses the exact same fetch/validate/extract pipeline, and reuses
 * proposeOrganizationsFromPages() (the same array-returning AI adapter PDF intake already uses,
 * fed one synthetic "page" of the page's own sanitized text) — no second AI adapter, no second
 * matcher, no second entity-routing policy (entityCandidateCreation.ts is shared with PDF intake).
 */
import { validateIntakeUrl, normalizeFriendlyUrlInput } from "./urlSafety";
import { fetchUrlSafely } from "./urlFetch";
import { extractDeterministicSignals } from "./htmlExtraction";
import { proposeOrganizationsFromPages, type PdfOrganizationProposal } from "./pdfOrganizationAiAdapter";
import { dedupeProposalsWithinJob } from "./pdfCandidateDedup";
import { createCandidatesFromEntityProposals, type EntityCandidateSummary, type MatchedPartnerSummary, type NonCandidateEntitySummary } from "./entityCandidateCreation";
import { dbCreateUrlSourceDocument } from "./server/sourceDocumentsDb";
import { dbCreateResourceIntakeJob, dbUpdateResourceIntakeJob } from "./server/resourceIntakeJobsDb";
import { dbListCommunityResources } from "@/app/lib/recursos/server/communityResourcesDb";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";

export type MultiEntityUrlIntakeResult =
  | {
      ok: true;
      jobId: string;
      candidates: EntityCandidateSummary[];
      matchedPartners: MatchedPartnerSummary[];
      nonCandidateEntities: NonCandidateEntitySummary[];
      aiUsed: boolean;
    }
  | { ok: false; reason: string; jobId: string | null };

export async function runMultiEntityUrlIntake(rawUrl: string, actorEmail: string | null): Promise<MultiEntityUrlIntakeResult> {
  const validated = validateIntakeUrl(normalizeFriendlyUrlInput(rawUrl));
  if (!validated.ok) return { ok: false, reason: validated.reason, jobId: null };

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

  // Reuses the exact PDF-batch AI adapter with one synthetic page — same array-returning contract
  // (entityType/parent metadata/Spanish gating all already built into it), zero duplicated prompt logic.
  const proposals = await proposeOrganizationsFromPages([{ pageNumber: 1, text: signals.sanitizedText }], fetchResult.finalUrl);
  const aiUsed = proposals.length > 0;

  const deduped: PdfOrganizationProposal[] = dedupeProposalsWithinJob(proposals);

  const { rows: existingResources } = await dbListCommunityResources();

  const { candidates, matchedPartners, nonCandidateEntities } = await createCandidatesFromEntityProposals({
    proposals: deduped,
    jobId,
    actorEmail,
    sourceType: "url",
    candidateIdPrefix: "url",
    existingResources,
    matchedProposalSource: "url_recheck",
    aiUsedAtLeastOnce: aiUsed,
    candidateCreatedEventNotes: (proposal, match) =>
      [
        `Creado por intake multi-entidad de URL (${fetchResult.finalUrl}).`,
        `Tipo de entidad: ${proposal.entityType}.`,
        proposal.parentOrganizationName ? `Organización principal: ${proposal.parentOrganizationName}.` : null,
        `Clasificación de coincidencia: ${match.classification}${match.matchedResourceName ? ` (${match.matchedResourceName})` : ""}.`,
        proposal.addressWithheldForSafety ? "Posible dirección confidencial detectada — dirección omitida." : null,
      ]
        .filter(Boolean)
        .join(" "),
  });

  await dbUpdateResourceIntakeJob(jobId, {
    status: "needs_review",
    provider: aiUsed ? "ai_gateway" : "deterministic_only",
    pagesProcessed: 1,
    candidatesCreatedCount: candidates.length,
    matchesFoundCount: candidates.filter((c) => c.classification !== "NEW").length + matchedPartners.length,
    completed: true,
  });

  auditAdminWrite("recurso_url_multi_entity_intake_completed", "resource_intake_job", jobId, {
    actorEmail,
    sourceUrl: fetchResult.finalUrl,
    candidatesCreated: candidates.length,
    matchedPartners: matchedPartners.length,
    nonCandidateEntities: nonCandidateEntities.length,
  });

  return { ok: true, jobId, candidates, matchedPartners, nonCandidateEntities, aiUsed };
}
