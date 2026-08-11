/**
 * Program 5 — Promise Keeper domain types. Commitments are tracked, never silently
 * disappear. Blockers and capacity are visible. No shame language. When capacity
 * is stretched, reduced scope / postpone / delegate / release are all permitted.
 */

export type CommitmentStatus =
  | "planned"
  | "active"
  | "blocked"
  | "completed"
  | "released";

export type ResponsibleParty =
  | "owner"
  | "staff"
  | "shared"
  | "external";

export type CapacityState =
  | "normal"
  | "stretched"
  | "paused";

export type ReviewOutcome =
  | "continue"
  | "modify"
  | "delegate"
  | "release";

export type CommitmentActor =
  | { type: "staff"; rosterId: string; authUserId: string; email: string; role: string }
  | { type: "owner"; authUserId: string; email: string };

export type CommitmentEventType =
  | "created"
  | "started"
  | "blocked"
  | "help_requested"
  | "due_date_changed"
  | "reassigned"
  | "completed"
  | "released"
  | "reviewed";

export type BusinessCommitment = {
  id: string;
  businessId: string;
  meetingId: string | null;
  recommendationId: string | null;
  proposalId: string | null;
  titleEs: string;
  titleEn: string;
  responsibleParty: ResponsibleParty;
  assignedRosterId: string | null;
  smallestNextStep: string | null;
  dueAt: string | null;
  status: CommitmentStatus;
  blocker: string | null;
  helpRequested: boolean;
  evidenceRequired: boolean;
  capacityState: CapacityState;
  reviewOutcome: ReviewOutcome | null;
  createdActorType: "staff" | "owner";
  createdByRosterId: string | null;
  createdByAuthUserId: string;
  createdByEmail: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
};

export type CommitmentEvent = {
  id: string;
  commitmentId: string;
  businessId: string;
  eventType: CommitmentEventType;
  eventActorType: "staff" | "owner";
  eventByRosterId: string | null;
  eventByAuthUserId: string;
  eventByEmail: string;
  eventByRole: string;
  details: Record<string, unknown> | null;
  createdAt: string;
};
