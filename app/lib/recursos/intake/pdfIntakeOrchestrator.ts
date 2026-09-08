import "server-only";

/**
 * Recursos Intake OS — Gate 4 PDF intake orchestrator. Source document + storage upload already
 * happened in the upload route (so the already-hashed, already-uploaded PDF is never re-processed
 * on retry) — this orchestrator owns: job creation -> OCR -> page-batch AI proposal (with
 * pages_processed persisted after every batch, the resumable-progress unit Gate 4I asks for) ->
 * within-job dedup -> matching -> candidate review rows -> verification_events -> job summary.
 * Never writes community_resources. Never marks anything verified.
 *
 * V1 scope note: Google Document AI itself performs OCR on the whole PDF in one call (it is the
 * pagination engine, not something this code chunks) — if a PDF is too large for Document AI's
 * own synchronous limits, that call fails and the job is marked failed with the honest provider
 * error, never a fake success. The AI-organization-proposal stage IS chunked here, in page-range
 * batches, which is the stage actually under this code's control.
 */
import { extractPdfPagesWithDocumentAi, isPdfOcrConfigured, type PdfPageText } from "./pdfExtractionAdapter";
import { proposeOrganizationsFromPages, type PdfOrganizationProposal } from "./pdfOrganizationAiAdapter";
import { dedupeProposalsWithinJob } from "./pdfCandidateDedup";
import { createCandidatesFromEntityProposals, type MatchedPartnerSummary, type NonCandidateEntitySummary } from "./entityCandidateCreation";
import type { MatchResult } from "./matchCandidateToExistingResource";
import { dbCreateResourceIntakeJob, dbUpdateResourceIntakeJob } from "./server/resourceIntakeJobsDb";
import { dbListCommunityResources } from "@/app/lib/recursos/server/communityResourcesDb";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";

const PAGE_BATCH_SIZE = 6;
const MAX_PAGES_PROCESSED_BY_AI = 60; // cost/runtime cap for the AI-proposal stage per job

function batchPages(pages: PdfPageText[], size: number): PdfPageText[][] {
  const out: PdfPageText[][] = [];
  for (let i = 0; i < pages.length; i += size) out.push(pages.slice(i, i + size));
  return out;
}

export type PdfIntakeCandidateSummary = {
  candidateId: string;
  organizationName: string;
  classification: MatchResult["classification"];
  matchedResourceName: string | null;
  sourcePages: number[];
  changeCount: number;
};

export type PdfIntakeResult =
  | {
      ok: true;
      jobId: string;
      candidates: PdfIntakeCandidateSummary[];
      matchedPartners: MatchedPartnerSummary[];
      nonCandidateEntities: NonCandidateEntitySummary[];
      pagesProcessed: number;
      aiUsed: boolean;
    }
  | { ok: false; jobId: string; reason: string };

export async function processPdfIntake(params: {
  sourceDocumentId: string;
  documentTitle: string;
  buffer: Buffer;
  actorEmail: string | null;
}): Promise<PdfIntakeResult> {
  const jobResult = await dbCreateResourceIntakeJob({ sourceType: "pdf", sourceDocumentId: params.sourceDocumentId, createdBy: params.actorEmail });
  if (!jobResult.ok) return { ok: false, jobId: "", reason: `No se pudo crear el trabajo de intake: ${jobResult.error}` };
  const jobId = jobResult.id;

  if (!isPdfOcrConfigured()) {
    await dbUpdateResourceIntakeJob(jobId, { status: "failed", errorMessage: "Google Document AI no está configurado en este entorno.", completed: true });
    return { ok: false, jobId, reason: "Google Document AI no está configurado en este entorno." };
  }

  await dbUpdateResourceIntakeJob(jobId, { status: "processing", provider: "document_ai" });

  let ocr;
  try {
    ocr = await extractPdfPagesWithDocumentAi(params.buffer);
  } catch (e) {
    const reason = e instanceof Error ? e.message : "OCR failed.";
    await dbUpdateResourceIntakeJob(jobId, { status: "failed", errorMessage: reason, completed: true });
    return { ok: false, jobId, reason };
  }

  if (ocr.pagesProcessed === 0 || ocr.pages.every((p) => !p.text.trim())) {
    await dbUpdateResourceIntakeJob(jobId, { status: "failed", errorMessage: "El PDF no produjo texto legible (posible documento escaneado sin capa de texto o página en blanco).", completed: true });
    return { ok: false, jobId, reason: "El PDF no produjo texto legible." };
  }

  const pagesToProcess = ocr.pages.slice(0, MAX_PAGES_PROCESSED_BY_AI);
  const batches = batchPages(pagesToProcess, PAGE_BATCH_SIZE);

  const allProposals: PdfOrganizationProposal[] = [];
  let aiUsedAtLeastOnce = false;
  let batchesProcessed = 0;

  for (const batch of batches) {
    const proposals = await proposeOrganizationsFromPages(batch, params.documentTitle);
    if (proposals.length > 0) aiUsedAtLeastOnce = true;
    allProposals.push(...proposals);
    batchesProcessed++;
    // Persist progress after every batch — this is the resumable-progress unit: if the request
    // is interrupted, the job row honestly reflects how far it got rather than vanishing silently.
    await dbUpdateResourceIntakeJob(jobId, { pagesProcessed: Math.min(batchesProcessed * PAGE_BATCH_SIZE, pagesToProcess.length) });
  }

  const deduped = dedupeProposalsWithinJob(allProposals);

  const { rows: existingResources } = await dbListCommunityResources();

  // Gate ES-7D: routing (PRIMARY_RESOURCE/PROGRAM -> candidate flow, PARTNER_ORGANIZATION ->
  // matched-first, LOCATION/REFERRAL_LINK -> evidence only, never a candidate) is centralized in
  // entityCandidateCreation.ts — the exact same function the URL multi-entity path uses, so PDF
  // and URL multi-entity intake can never drift into two different policies.
  const { candidates: entityCandidates, matchedPartners, nonCandidateEntities } = await createCandidatesFromEntityProposals({
    proposals: deduped,
    jobId,
    actorEmail: params.actorEmail,
    sourceType: "pdf",
    candidateIdPrefix: "pdf",
    existingResources,
    matchedProposalSource: "pdf_reextraction",
    aiUsedAtLeastOnce,
    candidateCreatedEventNotes: (proposal, match) =>
      [
        `Creado por intake de PDF (${params.documentTitle}).`,
        `Tipo de entidad: ${proposal.entityType}.`,
        proposal.parentOrganizationName ? `Organización principal: ${proposal.parentOrganizationName}.` : null,
        `Páginas fuente: ${proposal.sourcePages.join(", ") || "no disponible"}.`,
        proposal.mergedFromPageCount && proposal.mergedFromPageCount > 1 ? `Combinado desde ${proposal.mergedFromPageCount} menciones dentro del mismo documento.` : null,
        `Clasificación de coincidencia: ${match.classification}${match.matchedResourceName ? ` (${match.matchedResourceName})` : ""}.`,
        proposal.addressWithheldForSafety ? "Posible dirección confidencial detectada — dirección omitida." : null,
      ]
        .filter(Boolean)
        .join(" "),
  });

  const candidates: PdfIntakeCandidateSummary[] = entityCandidates.map((c) => ({
    candidateId: c.candidateId,
    organizationName: c.organizationName,
    classification: c.classification,
    matchedResourceName: c.matchedResourceName,
    sourcePages: c.sourcePages,
    changeCount: c.changeCount,
  }));

  await dbUpdateResourceIntakeJob(jobId, {
    status: "needs_review",
    pagesProcessed: pagesToProcess.length,
    candidatesCreatedCount: candidates.length,
    matchesFoundCount: candidates.filter((c) => c.classification !== "NEW").length,
    completed: true,
  });

  auditAdminWrite("recurso_pdf_intake_completed", "resource_intake_job", jobId, {
    actorEmail: params.actorEmail,
    documentTitle: params.documentTitle,
    candidatesCreated: candidates.length,
    matchedPartners: matchedPartners.length,
    nonCandidateEntities: nonCandidateEntities.length,
    pagesProcessed: pagesToProcess.length,
  });

  return { ok: true, jobId, candidates, matchedPartners, nonCandidateEntities, pagesProcessed: pagesToProcess.length, aiUsed: aiUsedAtLeastOnce };
}
