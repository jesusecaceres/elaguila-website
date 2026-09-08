import "server-only";

/**
 * Recursos Intake OS — Gate 5 shared proposal-generation step. Both the URL and PDF orchestrators
 * call this exact same function when a candidate matches an existing resource — one global
 * comparison contract (Gate 5P/5O: the same function is designed to serve a future partner
 * request or re-verification pass too, just with a different `proposalSource`).
 */
import type { ResourceRecord } from "@/app/lib/recursos/types";
import type { UrlCandidateProposal } from "./urlCandidateProposal";
import { detectResourceFieldChanges, type ProposalSource } from "./resourceChangeDetection";
import { dbCreateResourceChangeProposalIfNotPending } from "./server/resourceChangeProposalsDb";
import { insertVerificationEvent } from "./server/verificationEventsDb";

export async function generateChangeProposalsForMatch(params: {
  proposal: UrlCandidateProposal;
  matchedResource: ResourceRecord;
  sourceIntakeJobId: string | null;
  proposalSource: ProposalSource;
  actorEmail: string | null;
}): Promise<{ changeCount: number }> {
  const changes = detectResourceFieldChanges(params.proposal, params.matchedResource);

  let created = 0;
  for (const change of changes) {
    const result = await dbCreateResourceChangeProposalIfNotPending({
      resourceId: params.matchedResource.id,
      sourceIntakeJobId: params.sourceIntakeJobId,
      fieldName: change.field,
      oldValue: change.oldValue,
      proposedValue: change.proposedValue,
      proposalSource: params.proposalSource,
    });
    if (result.ok && !result.skippedDuplicate) created++;
  }

  if (created > 0) {
    await insertVerificationEvent({
      resourceId: params.matchedResource.id,
      sourceIntakeJobId: params.sourceIntakeJobId,
      eventType: "evidence_recorded",
      actorEmail: params.actorEmail,
      sourceType: params.proposalSource,
      notes: `${created} change proposal(s) generated`,
    });
  }

  return { changeCount: changes.length };
}
