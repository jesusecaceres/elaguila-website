/**
 * Gate 2 — Business Dashboard cockpit. Deterministic "what should I do right now" composer.
 *
 * computeNextHelpfulAction() (salesWorkspaceLogic.ts) only ever looks at profile-completeness
 * inputs (business identity/contacts/service areas/digital profiles/links) — it has no idea
 * whether a follow-up is overdue, a commitment is blocked, a meeting is coming up, or a proposal
 * is waiting on the client. Using it alone as "the next right action" would misrepresent the
 * whole relationship as a data-entry checklist. This module composes a precedence-ordered signal
 * from data ALREADY loaded elsewhere on the page (no new query, no AI, no opaque scoring) and
 * falls back to computeNextHelpfulAction()'s own headline only when nothing more urgent exists.
 */

export type BusinessDashboardNextAction = {
  what: string;
  why: string;
  whereLabel: string;
  whereHref: string;
};

export type NextActionCommitmentInput = { status: string; dueAt: string | null; titleEn: string };
export type NextActionMeetingInput = { status: string; scheduledAt: string | null };
export type NextActionOpportunityInput = { lifecycleState: string };
export type NextActionCreativeJobInput = { status: string };
export type NextActionProposalInput = { isCurrent: boolean; status: string };

export type NextActionInput = {
  /** Accepts the real FollowUpStoredStatus enum (including "completed"/"cancelled") — those two
   * simply never match a precedence branch below and fall through, exactly like `null` would. */
  followUpStatus: "overdue" | "due_today" | "waiting_on_owner" | "scheduled" | "completed" | "cancelled" | null;
  followUpDate: string | null;
  commitments: readonly NextActionCommitmentInput[];
  meetings: readonly NextActionMeetingInput[];
  missingCriticalContact: boolean;
  recommendationStatus: string | null;
  opportunities: readonly NextActionOpportunityInput[];
  creativeJobs: readonly NextActionCreativeJobInput[];
  proposals: readonly NextActionProposalInput[];
  fallbackHeadlineEn: string;
  fallbackEvidenceEn: string;
};

const MEETING_SOON_WINDOW_MS = 48 * 60 * 60 * 1000;

export function computeBusinessDashboardNextAction(input: NextActionInput, nowMs: number = Date.now()): BusinessDashboardNextAction {
  if (input.followUpStatus === "overdue") {
    return {
      what: "Follow up with this business — the scheduled follow-up is overdue.",
      why: `Follow-up was due ${input.followUpDate ?? "earlier"} and has not been logged as complete.`,
      whereLabel: "Open Outreach",
      whereHref: "#outreach",
    };
  }
  if (input.followUpStatus === "due_today") {
    return {
      what: "Follow up with this business today.",
      why: `Follow-up is scheduled for today${input.followUpDate ? ` (${input.followUpDate})` : ""}.`,
      whereLabel: "Open Outreach",
      whereHref: "#outreach",
    };
  }

  const blockedCommitment = input.commitments.find((c) => c.status === "blocked");
  if (blockedCommitment) {
    return {
      what: `Resolve the blocked commitment: "${blockedCommitment.titleEn}".`,
      why: "A promise to this business is currently blocked and needs staff attention.",
      whereLabel: "Open Commitments",
      whereHref: "#promises",
    };
  }
  const overdueCommitment = input.commitments.find(
    (c) => c.status === "active" && c.dueAt !== null && new Date(c.dueAt).getTime() < nowMs,
  );
  if (overdueCommitment) {
    return {
      what: `Complete the overdue commitment: "${overdueCommitment.titleEn}".`,
      why: `This was due ${overdueCommitment.dueAt} and has not been marked complete.`,
      whereLabel: "Open Commitments",
      whereHref: "#promises",
    };
  }

  const soonMeeting = input.meetings.find(
    (m) =>
      (m.status === "planned" || m.status === "prepared") &&
      m.scheduledAt !== null &&
      new Date(m.scheduledAt).getTime() >= nowMs &&
      new Date(m.scheduledAt).getTime() <= nowMs + MEETING_SOON_WINDOW_MS,
  );
  if (soonMeeting) {
    return {
      what: "Prepare for the upcoming meeting.",
      why: `A meeting is scheduled ${soonMeeting.scheduledAt}.`,
      whereLabel: "Open Meetings",
      whereHref: "#meetings",
    };
  }

  if (input.missingCriticalContact) {
    return {
      what: "Confirm a verified contact method for this business.",
      why: "No confirmed phone, email, or other contact channel is on file yet — outreach cannot proceed responsibly without one.",
      whereLabel: "Open Overview",
      whereHref: "#overview",
    };
  }

  if (input.recommendationStatus === "review_required") {
    return {
      what: "Review the pending recommendation before it can be shared.",
      why: "A recommendation exists but has not yet passed staff review.",
      whereLabel: "Open Recommendations",
      whereHref: "#recommend",
    };
  }

  if (input.opportunities.some((o) => o.lifecycleState === "suggested")) {
    return {
      what: "Review the suggested opportunity.",
      why: "A contextual opportunity has been suggested and is awaiting staff review.",
      whereLabel: "Open Opportunities",
      whereHref: "#opportunity",
    };
  }

  if (input.creativeJobs.some((j) => j.status === "in_review" || j.status === "owner_review")) {
    return {
      what: "Review the creative work awaiting approval.",
      why: "A creative job is waiting on a review decision.",
      whereLabel: "Open Creative Studio",
      whereHref: "#creative",
    };
  }

  if (input.proposals.some((p) => p.isCurrent && p.status === "owner_review")) {
    return {
      what: "Follow up on the proposal awaiting the client's decision.",
      why: "The current proposal has been sent and is waiting on the client to decide.",
      whereLabel: "Open Client Decision",
      whereHref: "#proposals",
    };
  }
  if (input.proposals.some((p) => p.isCurrent && p.status === "accepted")) {
    return {
      what: "Complete the Owner Handoff for the accepted proposal.",
      why: "The client accepted — accepted does not mean signed, paid, or published yet.",
      whereLabel: "Open Client Decision",
      whereHref: "#proposals",
    };
  }

  return {
    what: input.fallbackHeadlineEn,
    why: input.fallbackEvidenceEn,
    whereLabel: "Open Overview",
    whereHref: "#overview",
  };
}
