import "server-only";

/**
 * Recursos Intake OS — Gate ES-7D shared entity-routing step. Single place that decides what
 * happens to each classified entity from a multi-entity source (PDF or URL) — reused by both
 * pdfIntakeOrchestrator.ts and urlMultiEntityIntakeOrchestrator.ts so there is exactly one
 * routing policy, not two that could drift. Reuses matchCandidateToExistingResource.ts unchanged
 * (ES-7E) — no second matcher. Never writes community_resources, never marks anything verified.
 *
 * Routing (ES-7D):
 * - PRIMARY_RESOURCE / PROGRAM: always the existing candidate flow (create a
 *   community_resource_candidate_reviews row), regardless of match classification. PROGRAM's
 *   parentOrganizationName/parentProgramName ride along automatically inside the encoded proposal
 *   (urlCandidateProposal.ts FIELD_KEYS) — no separate evidence step needed for that part.
 * - PARTNER_ORGANIZATION: matched FIRST. If matching finds an EXISTING_RESOURCE_UPDATE (an exact,
 *   already-published resource), no candidate is created — field-change proposals are generated
 *   against the matched resource instead (the existing Gate 5 engine), avoiding a blind duplicate.
 *   Any other classification (NEW/LIKELY_MATCH/POSSIBLE_DUPLICATE) still creates a normal
 *   candidate for human review.
 * - LOCATION / REFERRAL_LINK: NEVER create a candidate (see entityType.ts's
 *   isCandidateEligibleEntityType — the ES-7N hard gate). Preserved as an evidence_recorded
 *   verification_event attached to the resolved parent candidate (by normalized
 *   parentOrganizationName/organizationName match against candidates created earlier in this same
 *   job), or job-scoped only if no parent could be resolved — never silently dropped.
 */
import type { ResourceRecord } from "@/app/lib/recursos/types";
import type { PdfOrganizationProposal } from "./pdfOrganizationAiAdapter";
import { isCandidateEligibleEntityType, type EntityType } from "./entityType";
import { encodeProposalAsDiscrepancies } from "./urlCandidateProposal";
import { matchCandidateToExistingResource, type MatchResult } from "./matchCandidateToExistingResource";
import { encodeMatchMetadata } from "./candidateMatchMetadata";
import { generateChangeProposalsForMatch } from "./generateChangeProposalsForMatch";
import { dbSaveCandidateReview } from "@/app/lib/recursos/server/communityResourceCandidateReviewsDb";
import { insertVerificationEvent } from "./server/verificationEventsDb";
import type { ProposalSource } from "./resourceChangeDetection";

function normalizeName(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function slugifyForCandidateId(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export type EntityCandidateSummary = {
  candidateId: string;
  organizationName: string;
  entityType: EntityType;
  classification: MatchResult["classification"];
  matchedResourceName: string | null;
  sourcePages: number[];
  changeCount: number;
};

export type MatchedPartnerSummary = {
  organizationName: string;
  matchedResourceId: string;
  matchedResourceName: string | null;
  changeCount: number;
};

export type NonCandidateEntitySummary = {
  entityType: "LOCATION" | "REFERRAL_LINK";
  organizationName: string;
  parentOrganizationName: string | null;
  parentResolved: boolean;
  sourcePages: number[];
};

export type CreateCandidatesFromEntityProposalsResult = {
  candidates: EntityCandidateSummary[];
  matchedPartners: MatchedPartnerSummary[];
  nonCandidateEntities: NonCandidateEntitySummary[];
};

function describeNonCandidateEntity(p: PdfOrganizationProposal): string {
  const parts = [
    p.entityType === "LOCATION" ? "LOCATION" : "REFERRAL_LINK",
    p.organizationName,
    p.addressLine1 ? `— ${p.addressLine1}${p.addressCity ? `, ${p.addressCity}` : ""}` : null,
    p.websiteUrl ? `— ${p.websiteUrl}` : null,
    p.phone ? `— tel: ${p.phone}` : null,
  ].filter(Boolean);
  return parts.join(" ");
}

export async function createCandidatesFromEntityProposals(params: {
  proposals: PdfOrganizationProposal[];
  jobId: string;
  actorEmail: string | null;
  /** "pdf" or "url" — carried into verification_events/notes/candidate-id-prefix, never mixed. */
  sourceType: "pdf" | "url";
  candidateIdPrefix: "pdf" | "url";
  existingResources: ResourceRecord[];
  matchedProposalSource: ProposalSource;
  candidateCreatedEventNotes: (proposal: PdfOrganizationProposal & { mergedFromPageCount?: number }, match: MatchResult) => string;
  aiUsedAtLeastOnce: boolean;
}): Promise<CreateCandidatesFromEntityProposalsResult> {
  const { proposals, jobId, actorEmail, sourceType, candidateIdPrefix, existingResources, matchedProposalSource, candidateCreatedEventNotes, aiUsedAtLeastOnce } = params;

  const candidates: EntityCandidateSummary[] = [];
  const matchedPartners: MatchedPartnerSummary[] = [];
  const nonCandidateEntities: NonCandidateEntitySummary[] = [];
  const candidateIdByNormalizedOrg = new Map<string, string>();

  // Pass 1: PRIMARY_RESOURCE / PROGRAM / PARTNER_ORGANIZATION only (ES-7N: the only entity types
  // ever permitted to reach dbSaveCandidateReview).
  for (const proposal of proposals) {
    if (!isCandidateEligibleEntityType(proposal.entityType)) continue;

    const match = matchCandidateToExistingResource(
      {
        organizationName: proposal.organizationName,
        programName: proposal.programName,
        websiteUrl: proposal.websiteUrl,
        phone: proposal.phone,
        crisisPhone: proposal.crisisPhone,
        addressLine1: proposal.addressLine1,
        addressZip: proposal.addressZip,
      },
      existingResources,
    );

    // ES-7D/ES-7E: a PARTNER_ORGANIZATION that clearly already exists never becomes a duplicate
    // candidate — it's matched and (if it carries newer info) proposed as a field change instead.
    if (proposal.entityType === "PARTNER_ORGANIZATION" && match.classification === "EXISTING_RESOURCE_UPDATE" && match.matchedResourceId) {
      const matchedResource = existingResources.find((r) => r.id === match.matchedResourceId);
      let changeCount = 0;
      if (matchedResource) {
        const { changeCount: c } = await generateChangeProposalsForMatch({
          proposal,
          matchedResource,
          sourceIntakeJobId: jobId,
          proposalSource: matchedProposalSource,
          actorEmail,
        });
        changeCount = c;
      }
      await insertVerificationEvent({
        resourceId: match.matchedResourceId,
        sourceIntakeJobId: jobId,
        eventType: "evidence_recorded",
        actorEmail,
        sourceType,
        notes: `PARTNER_ORGANIZATION "${proposal.organizationName}" matched to an existing resource on intake — ${changeCount} field change(s) proposed, no duplicate candidate created.`,
      });
      matchedPartners.push({ organizationName: proposal.organizationName, matchedResourceId: match.matchedResourceId, matchedResourceName: match.matchedResourceName, changeCount });
      continue; // no candidate row for this one — matched, not duplicated
    }

    const candidateId = `${candidateIdPrefix}-${slugifyForCandidateId(proposal.organizationName) || "entidad"}-${Math.random().toString(36).slice(2, 8)}`;

    const saveResult = await dbSaveCandidateReview({
      candidateId,
      disposition: "researching",
      reviewedBy: null,
      reviewedAt: null,
      currentSourceUrl: sourceType === "url" ? proposal.websiteUrl || proposal.officialSourceUrl || null : null,
      currentSourceType: null,
      organizationConfirmedActive: null,
      fieldsConfirmed: [],
      discrepanciesFromPdf: [...encodeProposalAsDiscrepancies(proposal), ...encodeMatchMetadata(match)],
      is24HoursConfirmedExplicit: false,
      addressHandling: proposal.addressWithheldForSafety ? "withheld_for_safety" : null,
      verificationNotes: candidateCreatedEventNotes(proposal, match),
    });
    if (!saveResult.ok) continue; // one candidate failing to save must not abort the whole job

    candidateIdByNormalizedOrg.set(normalizeName(proposal.organizationName), candidateId);

    await insertVerificationEvent({
      candidateId,
      sourceIntakeJobId: jobId,
      eventType: "candidate_created",
      actorEmail,
      sourceType,
      notes: `entityType=${proposal.entityType}; match=${match.classification}; pages=${proposal.sourcePages.join(",")}`,
    });
    if (aiUsedAtLeastOnce) {
      await insertVerificationEvent({ candidateId, sourceIntakeJobId: jobId, eventType: "ai_proposal_generated", actorEmail, sourceType });
    }

    let changeCount = 0;
    if (match.classification === "EXISTING_RESOURCE_UPDATE" && match.matchedResourceId) {
      const matchedResource = existingResources.find((r) => r.id === match.matchedResourceId);
      if (matchedResource) {
        const { changeCount: c } = await generateChangeProposalsForMatch({
          proposal,
          matchedResource,
          sourceIntakeJobId: jobId,
          proposalSource: matchedProposalSource,
          actorEmail,
        });
        changeCount = c;
      }
    }

    candidates.push({
      candidateId,
      organizationName: proposal.organizationName,
      entityType: proposal.entityType,
      classification: match.classification,
      matchedResourceName: match.matchedResourceName,
      sourcePages: proposal.sourcePages,
      changeCount,
    });
  }

  // Pass 2: LOCATION / REFERRAL_LINK — never a candidate, always evidence on the resolved parent
  // (or job-scoped if no parent could be resolved — never silently dropped, ES-7G/ES-7H).
  for (const proposal of proposals) {
    if (isCandidateEligibleEntityType(proposal.entityType)) continue;
    const entityType = proposal.entityType as "LOCATION" | "REFERRAL_LINK";

    const parentKey = normalizeName(proposal.parentOrganizationName || proposal.organizationName);
    const parentCandidateId = candidateIdByNormalizedOrg.get(parentKey) ?? null;

    await insertVerificationEvent({
      candidateId: parentCandidateId,
      sourceIntakeJobId: jobId,
      eventType: "evidence_recorded",
      actorEmail,
      sourceType,
      notes: describeNonCandidateEntity(proposal),
    });

    nonCandidateEntities.push({
      entityType,
      organizationName: proposal.organizationName,
      parentOrganizationName: proposal.parentOrganizationName,
      parentResolved: parentCandidateId !== null,
      sourcePages: proposal.sourcePages,
    });
  }

  return { candidates, matchedPartners, nonCandidateEntities };
}
