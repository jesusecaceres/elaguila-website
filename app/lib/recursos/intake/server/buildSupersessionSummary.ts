import "server-only";

/**
 * Recursos Intake OS — Gate 5M/5N updated-guide-edition comparison. Purely a job-level derived
 * SUMMARY computed on demand — no new schema, no durable "discontinued" state. Informational
 * only: absence from a newer PDF is NEVER treated as proof of closure, and nothing here ever
 * deactivates a resource. That decision (documented, not silently skipped) is: a proper
 * durable "possibly discontinued" flag with its own review workflow is real Gate 6+ scope, not
 * something to bolt onto this gate without a deliberate schema conversation.
 */
import { dbListResourceIntakeJobsForDocument } from "./resourceIntakeJobsDb";
import { dbListCandidateIdsCreatedByJob } from "./verificationEventsDb";
import { dbGetCandidateReview } from "@/app/lib/recursos/server/communityResourceCandidateReviewsDb";
import { dbListPendingResourceChangeProposalsForResource } from "./resourceChangeProposalsDb";

function normalizeName(s: string | null | undefined): string {
  return (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export type SupersessionSummary = {
  existingUnchangedCount: number;
  existingChangedCount: number;
  newCandidateCount: number;
  possiblyDiscontinued: { organizationName: string; resourceId: string }[];
};

/**
 * Compares the organizations found in the NEW job against the resources that were promoted
 * from the OLD (superseded) document's own jobs. `newJobCandidateOrgNames` should be the
 * organization names already extracted by the new job (passed in rather than re-derived, since
 * the caller already has them from the job it just ran).
 */
export async function buildSupersessionSummary(supersededDocumentId: string, newJobCandidateOrgNames: string[]): Promise<SupersessionSummary> {
  const oldJobs = await dbListResourceIntakeJobsForDocument(supersededDocumentId);
  const oldCandidateIds = (await Promise.all(oldJobs.map((j) => dbListCandidateIdsCreatedByJob(j.id)))).flat();

  const oldPromotedResources: { organizationName: string; resourceId: string }[] = [];
  for (const candidateId of oldCandidateIds) {
    const review = await dbGetCandidateReview(candidateId);
    if (review?.promotedResourceId) {
      // organizationName isn't stored on the review row itself for DB-only candidates, but the
      // candidate_id slug embeds a normalized org fragment (pdf-<org-slug>-<rand>), good enough
      // for this informational summary's name-matching purpose.
      const orgFragment = candidateId.replace(/^pdf-/, "").replace(/-[a-z0-9]{6}$/, "").replace(/-/g, " ");
      oldPromotedResources.push({ organizationName: orgFragment, resourceId: review.promotedResourceId });
    }
  }

  const newNamesNormalized = new Set(newJobCandidateOrgNames.map(normalizeName));
  const stillPresent = oldPromotedResources.filter((r) => newNamesNormalized.has(normalizeName(r.organizationName)));
  const possiblyDiscontinued = oldPromotedResources.filter((r) => !newNamesNormalized.has(normalizeName(r.organizationName)));

  let existingChangedCount = 0;
  for (const r of stillPresent) {
    const pending = await dbListPendingResourceChangeProposalsForResource(r.resourceId);
    if (pending.length > 0) existingChangedCount++;
  }

  return {
    existingUnchangedCount: stillPresent.length - existingChangedCount,
    existingChangedCount,
    newCandidateCount: newJobCandidateOrgNames.length,
    possiblyDiscontinued,
  };
}
