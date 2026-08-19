/**
 * Build 03A-V — current-source verification evidence contract.
 *
 * This module evaluates whether a CANDIDATE's review evidence is sufficient to move
 * toward promotion. It is deliberately separate from `urgentResourceValidation.ts`,
 * which evaluates a promoted/DB `ResourceRecord` itself before it can be marked
 * `verified`. Two separate safety gates, on purpose — see docs/recursos-verification-workflow.md.
 */
import type { UrgencyLevel } from "./types";

export type CandidateReviewDisposition = "pending" | "ready_for_promotion" | "promoted" | "dropped";

export type CurrentSourceType = "government" | "official_org_site" | "phone_call";

export type AddressHandling = "confirmed" | "withheld_for_safety" | "not_applicable";

export type FieldDiscrepancy = {
  field: string;
  pdfValue: string;
  currentValue: string;
};

export type CandidateReview = {
  id: string;
  candidateId: string;
  disposition: CandidateReviewDisposition;
  reviewedBy: string | null;
  reviewedAt: string | null;
  currentSourceUrl: string | null;
  currentSourceType: CurrentSourceType | null;
  organizationConfirmedActive: boolean | null;
  fieldsConfirmed: string[];
  discrepanciesFromPdf: FieldDiscrepancy[];
  is24HoursConfirmedExplicit: boolean;
  addressHandling: AddressHandling | null;
  verificationNotes: string | null;
  promotedResourceId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CandidateReviewInput = Omit<CandidateReview, "id" | "createdAt" | "updatedAt" | "promotedResourceId">;

/**
 * Baseline completeness — enough to say a human actually looked at this candidate,
 * regardless of urgency tier.
 */
export function isEvidenceComplete(review: Pick<CandidateReview, "reviewedBy" | "reviewedAt" | "currentSourceUrl" | "organizationConfirmedActive">): boolean {
  return Boolean(review.reviewedBy && review.reviewedAt && review.currentSourceUrl && review.organizationConfirmedActive !== null);
}

/**
 * Stricter bar for help-now (Priority 1) candidates. Phone-call-only evidence is
 * explicitly NOT sufficient on its own — it leaves no durable, re-checkable citation.
 * This does not replace `validateResourceForVerification()` on the promoted resource;
 * it only decides whether this candidate's evidence is strong enough to proceed toward
 * promotion at all.
 */
export function isEvidenceSufficientForPriority1(
  review: Pick<
    CandidateReview,
    "organizationConfirmedActive" | "currentSourceUrl" | "currentSourceType" | "fieldsConfirmed" | "is24HoursConfirmedExplicit" | "verificationNotes"
  >,
  candidate: { suggestedUrgencyLevel: UrgencyLevel; is24Hours?: boolean },
): boolean {
  if (candidate.suggestedUrgencyLevel !== "help-now") return true;

  if (review.organizationConfirmedActive !== true) return false;
  if (!review.currentSourceUrl) return false;
  if (review.currentSourceType !== "government" && review.currentSourceType !== "official_org_site") return false;

  const hasContactConfirmation = ["phone", "crisisPhone", "sms"].some((f) => review.fieldsConfirmed.includes(f));
  if (!hasContactConfirmation) return false;

  if (candidate.is24Hours && !review.is24HoursConfirmedExplicit) return false;

  if (!review.verificationNotes || review.verificationNotes.trim().length === 0) return false;

  return true;
}

export function candidateReviewDispositionLabel(disposition: CandidateReviewDisposition): string {
  switch (disposition) {
    case "pending":
      return "Pending review";
    case "ready_for_promotion":
      return "Ready for promotion";
    case "promoted":
      return "Promoted";
    case "dropped":
      return "Dropped (obsolete)";
  }
}
