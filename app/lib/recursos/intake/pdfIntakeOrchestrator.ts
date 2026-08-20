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
import { encodeProposalAsDiscrepancies } from "./urlCandidateProposal";
import { matchCandidateToExistingResource, type MatchResult } from "./matchCandidateToExistingResource";
import { dbCreateResourceIntakeJob, dbUpdateResourceIntakeJob } from "./server/resourceIntakeJobsDb";
import { insertVerificationEvent } from "./server/verificationEventsDb";
import { dbSaveCandidateReview } from "@/app/lib/recursos/server/communityResourceCandidateReviewsDb";
import { dbListCommunityResources } from "@/app/lib/recursos/server/communityResourcesDb";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";

const PAGE_BATCH_SIZE = 6;
const MAX_PAGES_PROCESSED_BY_AI = 60; // cost/runtime cap for the AI-proposal stage per job

function slugifyForCandidateId(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

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
};

export type PdfIntakeResult =
  | { ok: true; jobId: string; candidates: PdfIntakeCandidateSummary[]; pagesProcessed: number; aiUsed: boolean }
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
  const candidates: PdfIntakeCandidateSummary[] = [];

  for (const proposal of deduped) {
    const match = matchCandidateToExistingResource(
      { organizationName: proposal.organizationName, websiteUrl: proposal.websiteUrl, phone: proposal.phone, crisisPhone: proposal.crisisPhone },
      existingResources,
    );

    const candidateId = `pdf-${slugifyForCandidateId(proposal.organizationName) || "organizacion"}-${Math.random().toString(36).slice(2, 8)}`;

    const notesParts = [
      `Creado por intake de PDF (${params.documentTitle}).`,
      `Páginas fuente: ${proposal.sourcePages.join(", ") || "no disponible"}.`,
      proposal.mergedFromPageCount > 1 ? `Combinado desde ${proposal.mergedFromPageCount} menciones dentro del mismo documento.` : null,
      `Clasificación de coincidencia: ${match.classification}${match.matchedResourceName ? ` (${match.matchedResourceName})` : ""}.`,
      proposal.addressWithheldForSafety ? "Posible dirección confidencial detectada — dirección omitida." : null,
    ].filter(Boolean);

    const saveResult = await dbSaveCandidateReview({
      candidateId,
      disposition: "researching",
      reviewedBy: null,
      reviewedAt: null,
      currentSourceUrl: null,
      currentSourceType: null,
      organizationConfirmedActive: null,
      fieldsConfirmed: [],
      discrepanciesFromPdf: encodeProposalAsDiscrepancies(proposal),
      is24HoursConfirmedExplicit: false,
      addressHandling: proposal.addressWithheldForSafety ? "withheld_for_safety" : null,
      verificationNotes: notesParts.join(" "),
    });
    if (!saveResult.ok) continue; // one candidate failing to save must not abort the whole job

    await insertVerificationEvent({
      candidateId,
      sourceIntakeJobId: jobId,
      eventType: "candidate_created",
      actorEmail: params.actorEmail,
      sourceType: "pdf",
      notes: `Match: ${match.classification}; pages: ${proposal.sourcePages.join(",")}`,
    });
    if (aiUsedAtLeastOnce) {
      await insertVerificationEvent({ candidateId, sourceIntakeJobId: jobId, eventType: "ai_proposal_generated", actorEmail: params.actorEmail, sourceType: "pdf" });
    }

    candidates.push({ candidateId, organizationName: proposal.organizationName, classification: match.classification, matchedResourceName: match.matchedResourceName, sourcePages: proposal.sourcePages });
  }

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
    pagesProcessed: pagesToProcess.length,
  });

  return { ok: true, jobId, candidates, pagesProcessed: pagesToProcess.length, aiUsed: aiUsedAtLeastOnce };
}
