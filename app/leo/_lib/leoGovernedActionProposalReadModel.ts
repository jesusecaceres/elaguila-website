/**
 * LEO-21B — Owner-facing governed action proposal read model (pure).
 * Maps canonical LeoActionProposal → safe cockpit presentation.
 * Does not invent a second store. No secrets / OAuth / raw provider dumps.
 */

import type {
  LeoActionProposal,
  LeoActionProposalActionFamily,
  LeoActionProposalState,
  LeoActionProposalStructuredPayload,
} from "@/app/leo/_lib/leoActionProposalTypes";
import { leoProposalTruthLabelForState } from "@/app/leo/_lib/leoConversationProposalBridge";

export type LeoGovernedActionProposalCard = {
  proposalId: string;
  actionFamily: LeoActionProposalActionFamily;
  actionFamilyLabel: string;
  proposalState: LeoActionProposalState;
  approvalState: string;
  governanceLevel: "RED";
  createdAt: string;
  expiresAt: string;
  approvedAt: string | null;
  executionClaimedAt: string | null;
  executedAt: string | null;
  verifiedAt: string | null;
  failedAt: string | null;
  proposalFingerprint: string;
  targetSummary: string;
  payloadSummary: string;
  payloadDetails: string[];
  truthLabel: string;
  statusPrimary: string;
  statusSecondary: string | null;
  linkedReceiptId: string | null;
  isExpired: boolean;
  canApprove: boolean;
  canCancel: boolean;
  whyApprovalRequired: string;
  executionCapabilityNote: string | null;
};

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function actionFamilyLabel(family: LeoActionProposalActionFamily): string {
  switch (family) {
    case "GMAIL_SEND":
      return "Gmail send";
    case "GMAIL_REPLY":
      return "Gmail reply";
    case "CALENDAR_CREATE":
      return "Calendar create";
    case "CALENDAR_UPDATE":
      return "Calendar update";
    default:
      return family;
  }
}

export function presentGovernedActionStatus(
  state: LeoActionProposalState,
): { primary: string; secondary: string | null } {
  switch (state) {
    case "DRAFT":
    case "PREPARED":
      return { primary: "Prepared", secondary: "Needs information or not ready for approval" };
    case "AWAITING_APPROVAL":
      return { primary: "Needs approval", secondary: "RED — explicit owner approval required" };
    case "APPROVED":
      return {
        primary: "Approved — execution capability not enabled yet",
        secondary: "Approval does not send, schedule, or execute",
      };
    case "EXECUTION_CLAIMED":
      return { primary: "Executing", secondary: "Execution claimed — not verified" };
    case "EXECUTED":
      return { primary: "Executed — verification pending", secondary: "Provider accepted ≠ verified" };
    case "VERIFIED":
      return { primary: "Verified", secondary: null };
    case "FAILED":
      return { primary: "Failed", secondary: null };
    case "CANCELLED":
      return { primary: "Cancelled", secondary: null };
    case "EXPIRED":
      return { primary: "Expired", secondary: "New action requires a new proposal" };
    default:
      return { primary: state, secondary: null };
  }
}

function buildTargetAndPayload(proposal: LeoActionProposal): {
  targetSummary: string;
  payloadSummary: string;
  payloadDetails: string[];
} {
  const family = proposal.actionFamily;
  const p = proposal.structuredPayload as LeoActionProposalStructuredPayload &
    Record<string, unknown>;
  const target = asRecord(proposal.normalizedTarget);
  const details: string[] = [];

  if (family === "GMAIL_SEND" || family === "GMAIL_REPLY") {
    const recipient =
      str((p as { recipient?: unknown }).recipient) ??
      str(target.recipient) ??
      str(target.email) ??
      "Recipient not set";
    const subject = str((p as { subject?: unknown }).subject) ?? "(no subject)";
    const body = str((p as { body?: unknown }).body) ?? "";
    const threadId = str((p as { threadId?: unknown }).threadId);
    details.push(`To: ${recipient}`);
    if (threadId) details.push(`Thread: ${threadId}`);
    details.push(`Subject: ${subject}`);
    if (body) {
      details.push(`Body:\n${body.slice(0, 4000)}`);
    } else {
      details.push("Body: (empty)");
    }
    return {
      targetSummary: recipient,
      payloadSummary: subject,
      payloadDetails: details,
    };
  }

  if (family === "CALENDAR_CREATE") {
    const title = str((p as { title?: unknown }).title) ?? "(untitled)";
    const start = str((p as { start?: unknown }).start) ?? "?";
    const end = str((p as { end?: unknown }).end) ?? "?";
    const timezone = str((p as { timezone?: unknown }).timezone) ?? "?";
    const location = str((p as { location?: unknown }).location);
    const attendees = Array.isArray((p as { attendees?: unknown }).attendees)
      ? ((p as { attendees: { email?: string | null; name?: string | null }[] }).attendees ?? [])
      : [];
    details.push(`Title: ${title}`);
    details.push(`Start: ${start}`);
    details.push(`End: ${end}`);
    details.push(`Timezone: ${timezone}`);
    if (location) details.push(`Location: ${location}`);
    if (attendees.length) {
      details.push(
        `Attendees: ${attendees
          .map((a) => str(a.email) ?? str(a.name) ?? "?")
          .join(", ")}`,
      );
    } else {
      details.push("Attendees: (none proven)");
    }
    const desc = str((p as { description?: unknown }).description);
    if (desc) details.push(`Description:\n${desc.slice(0, 2000)}`);
    return {
      targetSummary: title,
      payloadSummary: `${start} → ${end} (${timezone})`,
      payloadDetails: details,
    };
  }

  // CALENDAR_UPDATE
  const eventId =
    str((p as { eventId?: unknown }).eventId) ?? str(target.eventId) ?? "Event id unknown";
  const patch = asRecord((p as { patch?: unknown }).patch);
  details.push(`Event: ${eventId}`);
  for (const key of ["title", "start", "end", "timezone", "location", "description"] as const) {
    const v = str(patch[key]);
    if (v) details.push(`Change ${key}: ${v.slice(0, 1000)}`);
  }
  if (Array.isArray(patch.attendees)) {
    details.push(
      `Change attendees: ${(patch.attendees as { email?: string | null }[])
        .map((a) => str(a.email) ?? "?")
        .join(", ")}`,
    );
  }
  if (details.length === 1) details.push("Patch: (empty)");
  return {
    targetSummary: eventId,
    payloadSummary: "Calendar field changes",
    payloadDetails: details,
  };
}

/** Display priority — lower sorts first (Gate C). */
export function leoGovernedActionDisplayPriority(state: LeoActionProposalState): number {
  switch (state) {
    case "AWAITING_APPROVAL":
      return 1;
    case "APPROVED":
      return 2;
    case "EXECUTION_CLAIMED":
    case "EXECUTED":
      return 3;
    case "FAILED":
      return 4;
    case "PREPARED":
    case "DRAFT":
      return 5;
    case "VERIFIED":
      return 6;
    case "CANCELLED":
    case "EXPIRED":
      return 7;
    default:
      return 50;
  }
}

export function mapLeoActionProposalToOwnerCard(
  proposal: LeoActionProposal,
  nowMs: number = Date.now(),
): LeoGovernedActionProposalCard {
  const expiresMs = Date.parse(proposal.expiresAt);
  const isExpired =
    proposal.proposalState === "EXPIRED" ||
    (Number.isFinite(expiresMs) && expiresMs <= nowMs);

  const canApprove =
    !isExpired &&
    proposal.proposalState === "AWAITING_APPROVAL" &&
    proposal.approvalState === "PENDING";

  const canCancel =
    !isExpired &&
    (["DRAFT", "PREPARED", "AWAITING_APPROVAL", "APPROVED"] as string[]).includes(
      proposal.proposalState,
    );

  const status = presentGovernedActionStatus(proposal.proposalState);
  const { targetSummary, payloadSummary, payloadDetails } = buildTargetAndPayload(proposal);

  return {
    proposalId: proposal.proposalId,
    actionFamily: proposal.actionFamily,
    actionFamilyLabel: actionFamilyLabel(proposal.actionFamily),
    proposalState: proposal.proposalState,
    approvalState: proposal.approvalState,
    governanceLevel: "RED",
    createdAt: proposal.createdAt,
    expiresAt: proposal.expiresAt,
    approvedAt: proposal.approvedAt,
    executionClaimedAt: proposal.executionClaimedAt,
    executedAt: proposal.executedAt,
    verifiedAt: proposal.verifiedAt,
    failedAt: proposal.failedAt,
    proposalFingerprint: proposal.proposalFingerprint,
    targetSummary,
    payloadSummary,
    payloadDetails,
    truthLabel: leoProposalTruthLabelForState(proposal.proposalState, false),
    statusPrimary: status.primary,
    statusSecondary: status.secondary,
    linkedReceiptId: proposal.linkedReceiptId,
    isExpired,
    canApprove,
    canCancel,
    whyApprovalRequired:
      "RED governed action — LEO cannot execute without your explicit approval of this exact fingerprint.",
    executionCapabilityNote:
      proposal.proposalState === "APPROVED"
        ? "Approved — execution capability not enabled yet. Approve does not send or schedule."
        : null,
  };
}

export function sortLeoGovernedActionCards(
  cards: LeoGovernedActionProposalCard[],
): LeoGovernedActionProposalCard[] {
  return [...cards].sort((a, b) => {
    const pa = leoGovernedActionDisplayPriority(a.proposalState);
    const pb = leoGovernedActionDisplayPriority(b.proposalState);
    if (pa !== pb) return pa - pb;
    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });
}
