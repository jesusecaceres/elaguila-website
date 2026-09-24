/**
 * LEO FINAL-02 connected-action preparation — server-only.
 * Resolves contacts/availability, persists the exact proposal the owner will
 * confirm against, and returns a bounded result card carrying the (possibly
 * disabled) connected action. Never executes a provider call itself.
 */
import "server-only";

import { requireLeoOwnerAccess } from "@/app/leo/_lib/leoAccess";
import { createLeoConnectedActionProposal } from "@/app/leo/_lib/leoActionProposalRepository";
import { checkLeoCalendarAvailability } from "@/app/leo/_lib/leoCalendarWriteAdapter";
import {
  createCalendarConnectedAction,
  createEmailConnectedAction,
} from "@/app/leo/_lib/leoExecutiveActions";
import { getLeoGoogleCapabilityDiagnostic } from "@/app/leo/_lib/leoGoogleWorkspaceConfig";
import { resolveLeoContact } from "@/app/leo/_lib/leoPeopleAdapter";
import type {
  LeoCalendarActionProposal,
  LeoCalendarAttendeeProposal,
  LeoContactResolutionResult,
  LeoEmailActionProposal,
  LeoExecutiveAction,
  LeoGenericResultCard,
  LeoToolId,
} from "@/app/leo/_lib/leoTypes";

/**
 * Wrap a successful prepare result into a renderable card. GENERIC kind is
 * intentional — it already renders title/subtitle/reason/actions via the
 * existing GenericBody + LeoActionBar, so no new card-kind/UI work is needed.
 */
export function leoConnectedActionResultCard(
  result: Extract<LeoConnectedActionPrepareResult, { ok: true }>,
): LeoGenericResultCard {
  const [title, ...rest] = result.summary.split("\n");
  return {
    cardId: `leo-connected-action-${result.action.actionId}`,
    kind: "GENERIC",
    priority: "NORMAL",
    certainty: "PROVEN",
    title: title || result.action.label,
    subtitle: rest.join(" ").slice(0, 200) || null,
    whyItMatters: null,
    reason: result.summary,
    evidenceRefs: [],
    sourceSystem: result.action.targetRef.system,
    actions: [result.action],
    spokenSummary: `${result.action.label}: ${title}`.slice(0, 200),
    ownerAttentionDisposition: null,
  };
}

const WRITE_CAPABILITY_MESSAGE = "Google write actions require owner setup.";

export type LeoConnectedActionPrepareResult =
  | { ok: true; action: LeoExecutiveAction; summary: string }
  | { ok: false; error: "AMBIGUOUS"; candidates: LeoContactResolutionResult["candidates"]; message: string }
  | { ok: false; error: "NOT_FOUND" | "UNAVAILABLE" | "ERROR" | "CONFLICT_UNKNOWN"; message: string };

function toolForEmailKind(kind: LeoEmailActionProposal["kind"]): LeoToolId {
  if (kind === "CREATE_EMAIL_DRAFT") return "leo.gmail.draft.create";
  if (kind === "SEND_EMAIL") return "leo.gmail.send";
  return "leo.gmail.reply";
}

function capabilityReason(): string | null {
  const capability = getLeoGoogleCapabilityDiagnostic({ tokenAvailable: true });
  return capability.write === "WRITE_READY" ? null : WRITE_CAPABILITY_MESSAGE;
}

/**
 * Prepare a Gmail connected action (draft/send/reply). Resolves the recipient
 * by name/email first — RESOLVED continues, AMBIGUOUS/NOT_FOUND/UNAVAILABLE
 * fail closed with no proposal created and no invented address.
 */
export async function prepareLeoEmailAction(input: {
  kind: LeoEmailActionProposal["kind"];
  recipientQuery: string;
  subject: string;
  bodyText: string;
  replyToMessageId?: string | null;
  replyToThreadId?: string | null;
}): Promise<LeoConnectedActionPrepareResult> {
  const access = await requireLeoOwnerAccess();
  const actor = access.admin.authUserId?.trim();
  if (!actor) return { ok: false, error: "ERROR", message: "Owner identity unavailable." };

  if (input.kind === "REPLY_EMAIL" && !input.replyToThreadId?.trim()) {
    return { ok: false, error: "ERROR", message: "Reply requires a proven thread reference." };
  }

  const resolution = await resolveLeoContact({ query: input.recipientQuery });
  if (resolution.state === "AMBIGUOUS") {
    return {
      ok: false,
      error: "AMBIGUOUS",
      candidates: resolution.candidates,
      message: "Multiple contacts matched — clarification required before this can be prepared.",
    };
  }
  if (resolution.state === "NOT_FOUND") {
    return { ok: false, error: "NOT_FOUND", message: "No saved contact matched. LEO will not invent an address." };
  }
  if (resolution.state !== "RESOLVED" || !resolution.resolved) {
    return { ok: false, error: "UNAVAILABLE", message: "Contact resolution is unavailable right now." };
  }

  const proposal: LeoEmailActionProposal = {
    kind: input.kind,
    recipientEmail: resolution.resolved.email,
    recipientDisplayName: resolution.resolved.displayName,
    subject: input.subject.trim().slice(0, 200),
    bodyText: input.bodyText.trim().slice(0, 20_000),
    replyToMessageId: input.replyToMessageId ?? null,
    replyToThreadId: input.replyToThreadId ?? null,
  };

  const toolId = toolForEmailKind(input.kind);
  const persisted = await createLeoConnectedActionProposal({ actorAuthUserId: actor, toolId, proposal: { toolId, email: proposal } });
  if (!persisted.ok) {
    return { ok: false, error: "ERROR", message: "Could not prepare this action right now." };
  }

  const action = createEmailConnectedAction({
    kind: input.kind,
    proposalId: persisted.id,
    fingerprint: persisted.fingerprint,
    recipientEmail: proposal.recipientEmail,
    toolId,
    capabilityDisabledReason: capabilityReason(),
  });

  return {
    ok: true,
    action,
    summary: `To: ${proposal.recipientEmail}\nSubject: ${proposal.subject}\n\n${proposal.bodyText.slice(0, 400)}`,
  };
}

/**
 * Prepare a Calendar connected action (create/update). Resolves attendees the
 * same way as email, checks availability, and always surfaces conflicts
 * truthfully in the returned summary rather than overriding them.
 */
export async function prepareLeoCalendarAction(input: {
  kind: LeoCalendarActionProposal["kind"];
  existingEventId?: string | null;
  title: string;
  startIso: string;
  endIso: string;
  timezone: string;
  attendeeQueries: string[];
  location?: string | null;
  description?: string | null;
}): Promise<LeoConnectedActionPrepareResult> {
  const access = await requireLeoOwnerAccess();
  const actor = access.admin.authUserId?.trim();
  if (!actor) return { ok: false, error: "ERROR", message: "Owner identity unavailable." };

  if (input.kind === "UPDATE_CALENDAR_EVENT" && !input.existingEventId?.trim()) {
    return { ok: false, error: "ERROR", message: "Update requires a proven existing event ID." };
  }

  const attendees: LeoCalendarAttendeeProposal[] = [];
  for (const query of input.attendeeQueries.slice(0, 20)) {
    const resolution = await resolveLeoContact({ query });
    if (resolution.state === "AMBIGUOUS") {
      return {
        ok: false,
        error: "AMBIGUOUS",
        candidates: resolution.candidates,
        message: `Multiple contacts matched for "${query}" — clarification required.`,
      };
    }
    if (resolution.state === "NOT_FOUND") {
      return { ok: false, error: "NOT_FOUND", message: `No saved contact matched "${query}". LEO will not invent an address.` };
    }
    if (resolution.state !== "RESOLVED" || !resolution.resolved) {
      return { ok: false, error: "UNAVAILABLE", message: "Contact resolution is unavailable right now." };
    }
    attendees.push({ email: resolution.resolved.email, displayName: resolution.resolved.displayName });
  }

  const availability = await checkLeoCalendarAvailability({ startIso: input.startIso, endIso: input.endIso });
  if (!availability.ok) {
    return { ok: false, error: "CONFLICT_UNKNOWN", message: "Availability could not be determined right now." };
  }

  const proposal: LeoCalendarActionProposal = {
    kind: input.kind,
    existingEventId: input.existingEventId ?? null,
    title: input.title.trim().slice(0, 200),
    startIso: input.startIso,
    endIso: input.endIso,
    timezone: input.timezone,
    attendees,
    location: input.location?.trim().slice(0, 200) ?? null,
    description: input.description?.trim().slice(0, 500) ?? null,
    conflictState: availability.conflictState,
  };

  const toolId: LeoToolId = input.kind === "CREATE_CALENDAR_EVENT" ? "leo.calendar.create" : "leo.calendar.update";
  const persisted = await createLeoConnectedActionProposal({ actorAuthUserId: actor, toolId, proposal: { toolId, calendar: proposal } });
  if (!persisted.ok) {
    return { ok: false, error: "ERROR", message: "Could not prepare this action right now." };
  }

  const action = createCalendarConnectedAction({
    kind: input.kind,
    proposalId: persisted.id,
    fingerprint: persisted.fingerprint,
    title: proposal.title,
    toolId,
    capabilityDisabledReason: capabilityReason(),
  });

  const conflictLine =
    proposal.conflictState === "CONFLICT"
      ? "\n\nConflict: this time overlaps an existing event on the calendar."
      : proposal.conflictState === "UNKNOWN"
        ? "\n\nAvailability could not be fully confirmed."
        : "";

  return {
    ok: true,
    action,
    summary: `${proposal.title}\n${proposal.startIso} – ${proposal.endIso} (${proposal.timezone})\nAttendees: ${
      attendees.map((a) => a.email).join(", ") || "none"
    }${proposal.location ? `\nLocation: ${proposal.location}` : ""}${conflictLine}`,
  };
}
