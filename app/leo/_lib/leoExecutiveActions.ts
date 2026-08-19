/**
 * LEO-14.2 global executive action contract — pure, fixture-safe.
 * Governance is central. Factories fail closed. No external execution.
 */
import type {
  LeoActionReceiptBehavior,
  LeoActionTargetRef,
  LeoExecutionType,
  LeoExecutiveAction,
  LeoExecutiveActionType,
  LeoGovernanceLevel,
  LeoResultSourceSystem,
  LeoToolId,
} from "@/app/leo/_lib/leoTypes";

const GOVERNANCE_BY_ACTION: Record<LeoExecutiveActionType, LeoGovernanceLevel> = {
  OPEN_EXTERNAL: "GREEN",
  OPEN_INTERNAL: "GREEN",
  INSPECT: "GREEN",
  SUMMARIZE: "GREEN",
  SHOW_TIMELINE: "GREEN",
  SHOW_EVIDENCE: "GREEN",
  COPY: "GREEN",
  JOIN_MEETING: "GREEN",
  OPEN_GMAIL: "GREEN",
  OPEN_CALENDAR: "GREEN",
  OPEN_GITHUB: "GREEN",
  OPEN_VERCEL: "GREEN",
  CALL: "GREEN",
  WHATSAPP: "GREEN",
  EMAIL: "GREEN", // opens compose/navigation only — not send
  // Internal LEO state only; does not mutate canonical external source truth.
  ACKNOWLEDGE: "GREEN",
  DISMISS: "GREEN",
  PREPARE_DRAFT: "YELLOW",
  PREPARE_FOLLOWUP: "YELLOW",
  CREATE_COMMITMENT: "YELLOW",
  REMIND_LATER: "YELLOW",
};

const EXECUTION_BY_ACTION: Record<LeoExecutiveActionType, LeoExecutionType> = {
  OPEN_EXTERNAL: "NAVIGATE",
  OPEN_INTERNAL: "NAVIGATE",
  OPEN_GMAIL: "NAVIGATE",
  OPEN_CALENDAR: "NAVIGATE",
  OPEN_GITHUB: "NAVIGATE",
  OPEN_VERCEL: "NAVIGATE",
  JOIN_MEETING: "NAVIGATE",
  CALL: "NAVIGATE",
  WHATSAPP: "NAVIGATE",
  EMAIL: "NAVIGATE",
  INSPECT: "CLIENT_ONLY",
  SUMMARIZE: "PREPARE",
  SHOW_TIMELINE: "CLIENT_ONLY",
  SHOW_EVIDENCE: "CLIENT_ONLY",
  COPY: "CLIENT_ONLY",
  ACKNOWLEDGE: "PERSIST_INTERNAL",
  DISMISS: "PERSIST_INTERNAL",
  REMIND_LATER: "PERSIST_INTERNAL",
  PREPARE_DRAFT: "PREPARE",
  PREPARE_FOLLOWUP: "PREPARE",
  CREATE_COMMITMENT: "PERSIST_INTERNAL",
};

const RECEIPT_BY_ACTION: Record<LeoExecutiveActionType, LeoActionReceiptBehavior> = {
  OPEN_EXTERNAL: "NONE",
  OPEN_INTERNAL: "NONE",
  OPEN_GMAIL: "NONE",
  OPEN_CALENDAR: "NONE",
  OPEN_GITHUB: "NONE",
  OPEN_VERCEL: "NONE",
  JOIN_MEETING: "NONE",
  CALL: "NONE",
  WHATSAPP: "NONE",
  EMAIL: "NONE",
  INSPECT: "NONE",
  SUMMARIZE: "CREATE",
  SHOW_TIMELINE: "NONE",
  SHOW_EVIDENCE: "NONE",
  COPY: "NONE",
  ACKNOWLEDGE: "CREATE",
  DISMISS: "CREATE",
  REMIND_LATER: "CREATE",
  PREPARE_DRAFT: "CREATE",
  PREPARE_FOLLOWUP: "CREATE",
  CREATE_COMMITMENT: "CREATE",
};

const ICON_BY_ACTION: Record<LeoExecutiveActionType, string> = {
  OPEN_EXTERNAL: "external-link",
  OPEN_INTERNAL: "arrow-right",
  INSPECT: "search",
  SUMMARIZE: "file-text",
  PREPARE_DRAFT: "pen",
  PREPARE_FOLLOWUP: "follow-up",
  CREATE_COMMITMENT: "bookmark",
  ACKNOWLEDGE: "check",
  DISMISS: "x",
  REMIND_LATER: "clock",
  SHOW_TIMELINE: "timeline",
  SHOW_EVIDENCE: "list",
  COPY: "copy",
  CALL: "phone",
  WHATSAPP: "message",
  EMAIL: "mail",
  JOIN_MEETING: "video",
  OPEN_GMAIL: "mail",
  OPEN_CALENDAR: "calendar",
  OPEN_GITHUB: "github",
  OPEN_VERCEL: "vercel",
};

const DEFAULT_LABEL: Record<LeoExecutiveActionType, string> = {
  OPEN_EXTERNAL: "Open",
  OPEN_INTERNAL: "Open",
  INSPECT: "Inspect",
  SUMMARIZE: "Summarize",
  PREPARE_DRAFT: "Prepare draft",
  PREPARE_FOLLOWUP: "Prepare follow-up",
  CREATE_COMMITMENT: "Create commitment",
  ACKNOWLEDGE: "Acknowledge",
  DISMISS: "Dismiss",
  REMIND_LATER: "Remind later",
  SHOW_TIMELINE: "Show timeline",
  SHOW_EVIDENCE: "Show evidence",
  COPY: "Copy",
  CALL: "Call",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  JOIN_MEETING: "Join meeting",
  OPEN_GMAIL: "Open Gmail",
  OPEN_CALENDAR: "Open Calendar",
  OPEN_GITHUB: "Open GitHub",
  OPEN_VERCEL: "Open Vercel",
};

export function leoGovernanceForExecutiveAction(
  type: LeoExecutiveActionType,
): LeoGovernanceLevel {
  return GOVERNANCE_BY_ACTION[type];
}

export function leoExecutionTypeForAction(type: LeoExecutiveActionType): LeoExecutionType {
  return EXECUTION_BY_ACTION[type];
}

function sanitizeMeta(meta?: Record<string, string>): Record<string, string> | undefined {
  if (!meta) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (typeof k !== "string" || typeof v !== "string") continue;
    if (/token|secret|password|authorization|bearer|refresh/i.test(k)) continue;
    if (/token|secret|password|bearer/i.test(v)) continue;
    out[k.slice(0, 40)] = v.slice(0, 300);
  }
  return Object.keys(out).length ? out : undefined;
}

export type LeoCreateExecutiveActionInput = {
  type: LeoExecutiveActionType;
  targetRef: LeoActionTargetRef;
  label?: string;
  toolId?: LeoToolId | null;
  /** Force disabled with reason (e.g. missing URL). */
  forceDisabledReason?: string | null;
  requiresConfirmation?: boolean;
  actionIdSuffix?: string;
};

/**
 * Central factory — callers cannot invent governance or enable EXECUTE_EXTERNAL.
 */
export function createLeoExecutiveAction(
  input: LeoCreateExecutiveActionInput,
): LeoExecutiveAction {
  const type = input.type;
  const governanceLevel = leoGovernanceForExecutiveAction(type);
  const executionType = leoExecutionTypeForAction(type);

  if (governanceLevel === "NEVER") {
    return {
      actionId: `leo.action.${type}.blocked`,
      type,
      label: input.label ?? DEFAULT_LABEL[type],
      iconSemantic: ICON_BY_ACTION[type],
      targetRef: {
        system: input.targetRef.system,
        entityType: input.targetRef.entityType,
        id: input.targetRef.id,
        url: null,
        meta: sanitizeMeta(input.targetRef.meta),
      },
      governanceLevel: "NEVER",
      executionType,
      toolId: null,
      enabled: false,
      disabledReason: "NEVER actions are not exposable as usable UI actions.",
      requiresConfirmation: true,
      receiptBehavior: "NONE",
    };
  }

  const id = input.targetRef.id?.trim() ?? "";
  const entityType = input.targetRef.entityType?.trim() ?? "";
  const system = input.targetRef.system;
  const missingTarget = !id || !entityType || !system;

  const needsUrl =
    type === "OPEN_GMAIL" ||
    type === "OPEN_CALENDAR" ||
    type === "OPEN_GITHUB" ||
    type === "OPEN_VERCEL" ||
    type === "JOIN_MEETING" ||
    type === "OPEN_EXTERNAL";

  const url = input.targetRef.url?.trim() || null;
  const missingUrl = needsUrl && !url;

  let disabledReason: string | null = null;
  if (missingTarget) disabledReason = "Missing required target reference.";
  else if (missingUrl) disabledReason = "Trusted navigation URL unavailable.";
  else if (input.forceDisabledReason) disabledReason = input.forceDisabledReason;

  // Hard rule: this gate never enables EXECUTE_EXTERNAL.
  if (executionType === "EXECUTE_EXTERNAL") {
    disabledReason = "External execution is not available in LEO-14.2.";
  }

  const suffix = input.actionIdSuffix?.trim() || id || "unknown";
  const actionId = `leo.action.${type}.${suffix}`.slice(0, 160);

  const yellowNeedsConfirm =
    governanceLevel === "YELLOW" || governanceLevel === "RED";

  return {
    actionId,
    type,
    label: input.label ?? DEFAULT_LABEL[type],
    iconSemantic: ICON_BY_ACTION[type],
    targetRef: {
      system,
      entityType,
      id: id || "unknown",
      url: missingUrl ? null : url,
      meta: sanitizeMeta(input.targetRef.meta),
    },
    governanceLevel,
    executionType,
    toolId: input.toolId ?? null,
    enabled: disabledReason === null,
    disabledReason,
    requiresConfirmation:
      input.requiresConfirmation ?? yellowNeedsConfirm,
    receiptBehavior: RECEIPT_BY_ACTION[type],
  };
}

/* -------------------------------------------------------------------------- */
/* Trusted provider URL helpers — deterministic, fail closed                  */
/* -------------------------------------------------------------------------- */

/** Gmail thread deep link only when threadId is present. */
export function buildTrustedGmailThreadUrl(threadId: string | null | undefined): string | null {
  const id = threadId?.trim();
  if (!id) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
  return `https://mail.google.com/mail/u/0/#inbox/${id}`;
}

/** Calendar event UI URL when calendarId + eventId known (primary calendar). */
export function buildTrustedGoogleCalendarEventUrl(
  eventId: string | null | undefined,
): string | null {
  const id = eventId?.trim();
  if (!id) return null;
  // Google Calendar event deep links require encoding; reject unsafe chars loosely.
  if (id.length > 500) return null;
  const encoded = encodeURIComponent(id);
  return `https://calendar.google.com/calendar/event?eid=${encoded}`;
}

export function isTrustedHttpUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Only accept Meet/Zoom-like https URLs already present on calendar evidence. */
export function trustedMeetingJoinUrl(url: string | null | undefined): string | null {
  if (!isTrustedHttpUrl(url)) return null;
  const u = new URL(url!.trim());
  const host = u.hostname.toLowerCase();
  if (
    host === "meet.google.com" ||
    host.endsWith(".zoom.us") ||
    host === "zoom.us" ||
    host.endsWith(".teams.microsoft.com")
  ) {
    return u.toString();
  }
  // Allow other https meetingUrl from Calendar API as NAVIGATE only if https.
  if (u.protocol === "https:") return u.toString();
  return null;
}

export function buildTrustedGithubRepoUrl(
  fullName: string | null | undefined,
): string | null {
  const name = fullName?.trim();
  if (!name || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(name)) return null;
  return `https://github.com/${name}`;
}

export function buildTrustedGithubCommitUrl(
  fullName: string | null | undefined,
  sha: string | null | undefined,
): string | null {
  const repo = buildTrustedGithubRepoUrl(fullName);
  const s = sha?.trim();
  if (!repo || !s || !/^[a-fA-F0-9]{7,40}$/.test(s)) return null;
  return `${repo}/commit/${s}`;
}

export function trustedVercelDeploymentUrl(url: string | null | undefined): string | null {
  if (!isTrustedHttpUrl(url)) return null;
  const u = new URL(url!.trim());
  if (u.protocol !== "https:") return null;
  return u.toString();
}

/* -------------------------------------------------------------------------- */
/* Common action factories                                                    */
/* -------------------------------------------------------------------------- */

function target(
  system: LeoResultSourceSystem,
  entityType: string,
  id: string,
  url?: string | null,
  meta?: Record<string, string>,
): LeoActionTargetRef {
  return { system, entityType, id, url: url ?? null, meta };
}

export function createOpenGmailAction(opts: {
  threadId: string | null;
  messageId: string;
}): LeoExecutiveAction {
  const url = buildTrustedGmailThreadUrl(opts.threadId);
  return createLeoExecutiveAction({
    type: "OPEN_GMAIL",
    targetRef: target(
      "GOOGLE_GMAIL",
      "thread",
      opts.threadId?.trim() || opts.messageId,
      url,
    ),
    toolId: "leo.email.thread.read",
    actionIdSuffix: opts.messageId,
  });
}

export function createOpenCalendarAction(opts: {
  eventId: string;
}): LeoExecutiveAction {
  const url = buildTrustedGoogleCalendarEventUrl(opts.eventId);
  return createLeoExecutiveAction({
    type: "OPEN_CALENDAR",
    targetRef: target("GOOGLE_CALENDAR", "event", opts.eventId, url),
    toolId: "leo.calendar.events.read",
    actionIdSuffix: opts.eventId,
  });
}

export function createJoinMeetingAction(opts: {
  eventId: string;
  meetingUrl: string | null;
}): LeoExecutiveAction {
  const url = trustedMeetingJoinUrl(opts.meetingUrl);
  return createLeoExecutiveAction({
    type: "JOIN_MEETING",
    targetRef: target("GOOGLE_CALENDAR", "meeting", opts.eventId, url),
    actionIdSuffix: opts.eventId,
  });
}

export function createOpenGithubAction(opts: {
  repositoryFullName: string | null;
  sha?: string | null;
}): LeoExecutiveAction {
  const url = opts.sha
    ? buildTrustedGithubCommitUrl(opts.repositoryFullName, opts.sha)
    : buildTrustedGithubRepoUrl(opts.repositoryFullName);
  return createLeoExecutiveAction({
    type: "OPEN_GITHUB",
    targetRef: target(
      "GITHUB",
      "repository",
      opts.repositoryFullName?.trim() || "unknown",
      url,
    ),
    toolId: "leo.project.github.read",
    actionIdSuffix: opts.sha?.slice(0, 12) || opts.repositoryFullName || "repo",
  });
}

export function createOpenVercelAction(opts: {
  deploymentId: string | null;
  deploymentUrl: string | null;
}): LeoExecutiveAction {
  const url = trustedVercelDeploymentUrl(opts.deploymentUrl);
  return createLeoExecutiveAction({
    type: "OPEN_VERCEL",
    targetRef: target(
      "VERCEL",
      "deployment",
      opts.deploymentId?.trim() || "unknown",
      url,
    ),
    toolId: "leo.project.vercel.read",
    actionIdSuffix: opts.deploymentId || "deploy",
  });
}

export function createSummarizeAction(opts: {
  system: LeoResultSourceSystem;
  entityType: string;
  id: string;
  toolId?: LeoToolId | null;
}): LeoExecutiveAction {
  return createLeoExecutiveAction({
    type: "SUMMARIZE",
    targetRef: target(opts.system, opts.entityType, opts.id),
    toolId: opts.toolId ?? null,
    actionIdSuffix: opts.id,
  });
}

export function createPrepareDraftAction(opts: {
  system: LeoResultSourceSystem;
  entityType: string;
  id: string;
  toolId?: LeoToolId | null;
  label?: string;
}): LeoExecutiveAction {
  return createLeoExecutiveAction({
    type: "PREPARE_DRAFT",
    targetRef: target(opts.system, opts.entityType, opts.id),
    toolId: opts.toolId ?? "leo.preparation.prepare",
    label: opts.label,
    actionIdSuffix: opts.id,
  });
}

export function createCreateCommitmentAction(opts: {
  system: LeoResultSourceSystem;
  entityType: string;
  id: string;
}): LeoExecutiveAction {
  return createLeoExecutiveAction({
    type: "CREATE_COMMITMENT",
    targetRef: target(opts.system, opts.entityType, opts.id),
    actionIdSuffix: opts.id,
  });
}

export function createAcknowledgeAction(opts: {
  sourceKind: string;
  sourceKey: string;
}): LeoExecutiveAction {
  return createLeoExecutiveAction({
    type: "ACKNOWLEDGE",
    targetRef: target("LEO", opts.sourceKind, opts.sourceKey),
    actionIdSuffix: opts.sourceKey,
  });
}

export function createDismissAction(opts: {
  sourceKind: string;
  sourceKey: string;
}): LeoExecutiveAction {
  return createLeoExecutiveAction({
    type: "DISMISS",
    targetRef: target("LEO", opts.sourceKind, opts.sourceKey),
    actionIdSuffix: opts.sourceKey,
  });
}

export function createRemindLaterAction(opts: {
  sourceKind: string;
  sourceKey: string;
}): LeoExecutiveAction {
  return createLeoExecutiveAction({
    type: "REMIND_LATER",
    targetRef: target("LEO", opts.sourceKind, opts.sourceKey),
    actionIdSuffix: opts.sourceKey,
  });
}

export function createShowEvidenceAction(opts: {
  system: LeoResultSourceSystem;
  entityType: string;
  id: string;
}): LeoExecutiveAction {
  return createLeoExecutiveAction({
    type: "SHOW_EVIDENCE",
    targetRef: target(opts.system, opts.entityType, opts.id),
    actionIdSuffix: opts.id,
  });
}

export function createInspectAction(opts: {
  system: LeoResultSourceSystem;
  entityType: string;
  id: string;
}): LeoExecutiveAction {
  return createLeoExecutiveAction({
    type: "INSPECT",
    targetRef: target(opts.system, opts.entityType, opts.id),
    actionIdSuffix: opts.id,
  });
}
