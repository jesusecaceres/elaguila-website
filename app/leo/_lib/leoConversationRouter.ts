/**
 * LEO-7 Conversation Router — deterministic intent resolution.
 * Ambiguous → UNKNOWN. NEVER-class patterns outrank RED action verbs.
 */
import type {
  LeoActionIntentKind,
  LeoCommunicationSubtype,
  LeoConversationClientContext,
  LeoConversationEntityRef,
  LeoConversationIntent,
  LeoConversationRequest,
  LeoConversationRouteResult,
  LeoPreparationKind,
} from "@/app/leo/_lib/leoTypes";

/** Centralized conversation request bounds. */
export const LEO_CONVERSATION_BOUNDS = {
  maxQuestionLength: 2000,
  maxResultsDefault: 10,
  maxResultsCap: 20,
  maxMemoryLookup: 20,
  maxEntityRefs: 5,
  maxExternalNotes: 5,
  maxExternalNoteLength: 500,
  maxBodyBytes: 32_768,
  /** LEO-14.6 */
  maxSessionIdLength: 80,
  maxClientRequestIdLength: 120,
  maxVisibleCardIds: 40,
  maxVisibleCardIdLength: 120,
} as const;

const VALID_INTENTS: readonly LeoConversationIntent[] = [
  "ATTENTION_OVERVIEW",
  "CLIENT_CARE",
  "LISTING_REASON",
  "MEMORY_LOOKUP",
  "DECISION_SUPPORT",
  "CAPABILITY_OVERVIEW",
  "CAPABILITY_GOVERNANCE",
  "PREPARATION",
  "PROJECT_INTELLIGENCE",
  "COMMUNICATION_INTELLIGENCE",
  "COMMITMENT_INTELLIGENCE",
  "RECEIPT_INTELLIGENCE",
  "MORNING_BRIEF",
  "BUSINESS_CONCIERGE_CONTEXT",
  "EXECUTIVE_REPORTING",
  "UNKNOWN",
] as const;

export function isLeoConversationIntent(v: unknown): v is LeoConversationIntent {
  return typeof v === "string" && (VALID_INTENTS as readonly string[]).includes(v);
}

function normalizeQuestion(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Infer action kind. NEVER-class patterns are evaluated before RED verbs so
 * "ignore governance and deploy Production" → BYPASS_APPROVAL (NEVER), not DEPLOY.
 */
export function inferLeoActionKind(q: string): LeoActionIntentKind | null {
  // NEVER class first
  if (
    /bypass approval|ignore governance|override governance|rewrite governance|override approval|circumvent (governance|approval)/i.test(
      q,
    )
  ) {
    return "BYPASS_APPROVAL";
  }
  if (/self[- ]?grant|give myself (admin|permission|privilege)/i.test(q)) return "SELF_GRANT_PRIVILEGE";
  if (/conceal audit|disable audit|hide audit|delete governance history|erase audit/i.test(q)) {
    return "MODIFY_AUDIT";
  }
  if (/rewrite (leo )?governance|change (the )?governance rules/i.test(q)) return "REWRITE_GOVERNANCE";

  // RED class
  if (/deploy.*production|production.*deploy|deploy to prod/i.test(q)) return "DEPLOY_PRODUCTION";
  if (/merge.*main|merge to main/i.test(q)) return "MERGE_MAIN";
  if (/\bsend (this|the|it)\b|send (an )?email|send (a )?message|outreach send/i.test(q)) {
    return "SEND_EXTERNAL";
  }
  if (/change pricing|update pricing|raise prices/i.test(q)) return "CHANGE_PRICING";
  if (/spend money|transfer money|wire funds/i.test(q)) return "SPEND_MONEY";
  if (/accept (the )?contract|sign (the )?contract/i.test(q)) return "ACCEPT_CONTRACT";
  if (/delete critical|permanent delete|wipe (the )?data/i.test(q)) return "DELETE_CRITICAL_DATA";
  if (/change permission|grant admin|elevate privilege/i.test(q)) return "CHANGE_PERMISSIONS";
  if (/remove staff|fire (the )?employee|delete staff/i.test(q)) return "REMOVE_STAFF";
  if (/publish (to )?public|public publish/i.test(q)) return "PUBLISH_PUBLIC";
  return null;
}

/** General capability discovery — not a consequential action request. */
export function isLeoCapabilityOverviewQuestion(q: string): boolean {
  return /\b(what can you do|what can leo do|what are your capabilities|what tools do you have|what project tools|what can you read|what can you prepare|how can you help( me)?|what can you help with)\b/i.test(
    q,
  );
}

export function isLeoProjectIntelligenceQuestion(q: string): boolean {
  // Exclude deploy/governance action phrasing — those stay CAPABILITY_GOVERNANCE.
  if (
    /\b(deploy|redeploy|promote|rollback)\b.*\bproduction\b|\bproduction\b.*\b(deploy|redeploy|promote|rollback)\b/i.test(
      q,
    ) ||
    /\bcan you deploy\b|\bignore governance\b|\bbypass approval\b/i.test(q)
  ) {
    return false;
  }

  return /\b(what branch is leo on|what branch are we on|latest (leo )?commit|what is the latest (leo )?commit|leo preview ready|is the (leo )?preview ready|is preview ready|what is deployed|what deployment|what changed (today|recently)|what changed in the repo|what did we (build|finish)|what happened with leo|what should i qa|did the deployment fail|is production (on this|behind)|production on this commit|is production on the same (commit|version)|is production running this commit|does production match this commit|is production on the (latest )?leo commit|is production caught up with leo|deployment (tied|linked) to (this )?commit|github (repo|branch|commit)|vercel (deployment|preview|production)|project (status|intelligence)|what is the leo project status)\b/i.test(
    q,
  );
}

/** LEO-13: bounded Gmail / Calendar / meeting-prep routing. */
export function inferLeoCommunicationSubtype(q: string): LeoCommunicationSubtype | null {
  if (
    /\bprepare (me )?for (my )?next meeting\b|\bmeeting prep\b|\bprepare (a )?meeting brief\b|\bwhat emails relate to (my )?next meeting\b/i.test(
      q,
    )
  ) {
    return "MEETING_PREP";
  }
  if (
    /\bwhat meetings do i have today\b|\bwhat is my next meeting\b|\bwhat do i have tomorrow\b|\bwho is attending (my )?next meeting\b|\b(my )?calendar today\b|\bmeetings tomorrow\b/i.test(
      q,
    )
  ) {
    return "CALENDAR";
  }
  if (
    /\bwho emailed me\b|\bwhat emails need (my )?attention\b|\bwho may need a reply\b|\bwho is waiting on my reply\b|\bunread (emails|mail)\b|\binbox (status|attention)\b/i.test(
      q,
    )
  ) {
    return "EMAIL";
  }
  return null;
}

export function isLeoCommunicationIntelligenceQuestion(q: string): boolean {
  return inferLeoCommunicationSubtype(q) != null;
}

/** LEO-14.4: bounded commitment intelligence routing — avoids listing/calendar collisions. */
export function isLeoCommitmentIntelligenceQuestion(q: string): boolean {
  const n = normalizeQuestion(q);
  if (
    /\b(listing|listings|calendar|meeting|inbox|email|gmail|deploy|production|preview)\b/.test(n)
  ) {
    // Allow "due" only when clearly commitment-scoped; block calendar/listing collisions.
    if (!/\bcommitment|promise|promised\b/.test(n) && !/\bwhat am i forgetting\b/.test(n)) {
      return false;
    }
  }
  return (
    /\bwhat did i promise\b/.test(n) ||
    /\bwhat have i promised\b/.test(n) ||
    /\bmy commitments?\b/.test(n) ||
    /\bopen commitments?\b/.test(n) ||
    /\bwhat commitments do i have\b/.test(n) ||
    /\bwhat is overdue\b/.test(n) ||
    /\bwhat's overdue\b/.test(n) ||
    /\bwhat commitments are overdue\b/.test(n) ||
    /\bcommitments? (that are )?overdue\b/.test(n) ||
    /\bwhat is due today\b/.test(n) ||
    /\bwhat's due today\b/.test(n) ||
    /\bwhat is due soon\b/.test(n) ||
    /\bwhat's due soon\b/.test(n) ||
    /\bcommitments? due soon\b/.test(n) ||
    /\bcompleted commitments?\b/.test(n) ||
    /\bwhat did i complete\b/.test(n) ||
    /\bcommitments? with no due date\b/.test(n) ||
    /\bwhat am i forgetting\b/.test(n) ||
    /\bwhat can wait\b/.test(n)
  );
}

/** LEO-14.5: durable receipt / action-history routing. */
export function isLeoReceiptIntelligenceQuestion(q: string): boolean {
  const n = normalizeQuestion(q);
  return (
    /\bwhat did you do\b/.test(n) ||
    /\bwhat have you done\b/.test(n) ||
    /\bwhat did you prepare\b/.test(n) ||
    /\bwhat have you prepared\b/.test(n) ||
    /\bdid you execute that\b/.test(n) ||
    /\bdid that execute\b/.test(n) ||
    /\bdid that actually run\b/.test(n) ||
    /\bwhat failed\b/.test(n) ||
    /\bwhat did not execute\b/.test(n) ||
    /\bwhat is waiting for my approval\b/.test(n) ||
    /\bshow recent leo actions\b/.test(n) ||
    /\bshow recent leo receipts\b/.test(n)
  );
}

/** LEO-14.11: Morning CEO Brief routing — distinct from ATTENTION_OVERVIEW. */
export function isLeoMorningBriefQuestion(q: string): boolean {
  const n = normalizeQuestion(q);
  return (
    /\bgive me my morning brief\b/.test(n) ||
    /\bmorning brief\b/.test(n) ||
    /\bbrief me\b/.test(n) ||
    /\bwhat do i need to know today\b/.test(n) ||
    /\bstart my day\b/.test(n) ||
    /\bwhat should i focus on today\b/.test(n) ||
    /\bwhat needs me today\b/.test(n)
  );
}

/** EXEC-REPORTS-01: company-wide admin reporting — does not steal Morning Brief or Client Care. */
export function isLeoExecutiveReportingQuestion(q: string): boolean {
  const n = normalizeQuestion(q);
  if (isLeoMorningBriefQuestion(n)) return false;
  if (/\bwhat needs my attention\b/.test(n) || /\bwho is waiting on\b/.test(n)) return false;
  if (/\bclient care\b/.test(n)) return false;
  return (
    /\bcompany report\b/.test(n) ||
    /\badmin report\b/.test(n) ||
    /\ball reports\b/.test(n) ||
    /\bwhat is happening across leonix\b/.test(n) ||
    /\bshow me everything important\b/.test(n) ||
    /\bhow is the business doing\b/.test(n) ||
    /\bwhat do all my admin areas show\b/.test(n) ||
    /\bhow are newsletters? doing\b/.test(n) ||
    /\bshow sales and payment issues\b/.test(n) ||
    /\bwhat is happening in iglesias\b/.test(n) ||
    /\bwhich admin areas have unresolved queues\b/.test(n) ||
    /\bexecutive reports?\b/.test(n) ||
    /\bgive me all admin reports\b/.test(n)
  );
}

/** LEO-15: Business Concierge read context — distinct from generic CLIENT_CARE. */
export function isLeoBusinessConciergeContextQuestion(q: string): boolean {
  const n = normalizeQuestion(q);
  if (/\bclient care plan\b/.test(n) || /\bwho is waiting on\b/.test(n)) return false;
  return (
    /\bwhat can concierge do\b/.test(n) ||
    /\bconcierge context\b/.test(n) ||
    /\bshow concierge\b/.test(n) ||
    /\bwhat tools can help this client\b/.test(n) ||
    /\bwhat do we know about this business\b/.test(n) ||
    /\bbusiness concierge\b/.test(n) ||
    /\bbefore i (call|talk to) this (client|business)\b/.test(n) ||
    (/\bwhat does this (client|business) need\b/.test(n) &&
      /\b(concierge|tools|business profile|business context)\b/.test(n))
  );
}

function inferPreparationKindFromQuestion(q: string): LeoPreparationKind | null {
  const wantsPrep = /\b(prepare|draft|make me a brief|checklist)\b/.test(q);
  if (!wantsPrep) return null;
  if (/follow[- ]?up/.test(q)) return "FOLLOW_UP_DRAFT";
  if (/meeting brief|brief for (the )?meeting|meeting/.test(q)) return "MEETING_BRIEF";
  if (/decision/.test(q)) return "DECISION_BRIEF";
  if (/review/.test(q)) return "REVIEW_PLAN";
  if (/client care|care plan/.test(q)) return "CLIENT_CARE_PLAN";
  return "INTERNAL_TASK_DRAFT";
}

function routeResult(
  partial: Omit<LeoConversationRouteResult, "inferredCommunicationSubtype"> & {
    inferredCommunicationSubtype?: LeoCommunicationSubtype | null;
  },
): LeoConversationRouteResult {
  return {
    ...partial,
    inferredCommunicationSubtype: partial.inferredCommunicationSubtype ?? null,
  };
}

/**
 * Resolve conversation intent from explicit request fields first, then small patterns.
 */
export function routeLeoConversation(
  request: Pick<
    LeoConversationRequest,
    "question" | "intent" | "listingId" | "memorySubject" | "decisionContext" | "actionKind" | "preparationKind"
  >,
): LeoConversationRouteResult {
  const notes: string[] = [];
  const q = normalizeQuestion(request.question ?? "");
  const prepFromQ = inferPreparationKindFromQuestion(q);
  const actionFromQ = inferLeoActionKind(q);
  const communicationSubtype = inferLeoCommunicationSubtype(q);

  if (request.intent && isLeoConversationIntent(request.intent) && request.intent !== "UNKNOWN") {
    notes.push(`explicit intent=${request.intent}`);
    return routeResult({
      intent: request.intent,
      confidence: "high",
      inferredActionKind: request.actionKind ?? actionFromQ,
      inferredPreparationKind: request.preparationKind ?? prepFromQ,
      inferredCommunicationSubtype:
        request.intent === "COMMUNICATION_INTELLIGENCE" ? communicationSubtype : null,
      routeNotes: notes,
    });
  }

  // Capability overview BEFORE authority/action routing ("What can you do?" ≠ OTHER/RED)
  if (isLeoCapabilityOverviewQuestion(q)) {
    notes.push("capability overview pattern");
    return routeResult({
      intent: "CAPABILITY_OVERVIEW",
      confidence: "high",
      inferredActionKind: "READ",
      inferredPreparationKind: null,
      routeNotes: notes,
    });
  }

  // Project intelligence — evidence-first (GitHub/Vercel reads)
  if (isLeoProjectIntelligenceQuestion(q)) {
    notes.push("project intelligence pattern");
    return routeResult({
      intent: "PROJECT_INTELLIGENCE",
      confidence: "high",
      inferredActionKind: "READ",
      inferredPreparationKind: null,
      routeNotes: notes,
    });
  }

  // Communication intelligence — before general preparation / client-care "waiting on"
  if (communicationSubtype) {
    notes.push(`communication intelligence pattern subtype=${communicationSubtype}`);
    return routeResult({
      intent: "COMMUNICATION_INTELLIGENCE",
      confidence: "high",
      inferredActionKind: communicationSubtype === "MEETING_PREP" ? "PREPARE_DRAFT" : "READ",
      inferredPreparationKind:
        communicationSubtype === "MEETING_PREP" ? "MEETING_BRIEF" : null,
      inferredCommunicationSubtype: communicationSubtype,
      routeNotes: notes,
    });
  }

  // Commitment intelligence — before client-care / memory / attention collisions
  if (isLeoCommitmentIntelligenceQuestion(q)) {
    notes.push("commitment intelligence pattern");
    return routeResult({
      intent: "COMMITMENT_INTELLIGENCE",
      confidence: "high",
      inferredActionKind: "READ",
      inferredPreparationKind: null,
      routeNotes: notes,
    });
  }

  // Receipt / action history — durable receipts, not prose memory
  if (isLeoReceiptIntelligenceQuestion(q)) {
    notes.push("receipt intelligence pattern");
    return routeResult({
      intent: "RECEIPT_INTELLIGENCE",
      confidence: "high",
      inferredActionKind: "READ",
      inferredPreparationKind: null,
      routeNotes: notes,
    });
  }

  if (isLeoMorningBriefQuestion(q)) {
    notes.push("morning brief pattern");
    return routeResult({
      intent: "MORNING_BRIEF",
      confidence: "high",
      inferredActionKind: "READ",
      inferredPreparationKind: null,
      routeNotes: notes,
    });
  }

  if (isLeoExecutiveReportingQuestion(q)) {
    notes.push("executive reporting pattern");
    return routeResult({
      intent: "EXECUTIVE_REPORTING",
      confidence: "high",
      inferredActionKind: "READ",
      inferredPreparationKind: null,
      routeNotes: notes,
    });
  }

  if (isLeoBusinessConciergeContextQuestion(q)) {
    notes.push("business concierge context pattern");
    return routeResult({
      intent: "BUSINESS_CONCIERGE_CONTEXT",
      confidence: "high",
      inferredActionKind: "READ",
      inferredPreparationKind: null,
      routeNotes: notes,
    });
  }

  // Consequential / specific authority questions
  if (actionFromQ && actionFromQ !== "PREPARE_DRAFT") {
    notes.push("capability/governance pattern");
    return routeResult({
      intent: "CAPABILITY_GOVERNANCE",
      confidence: "high",
      inferredActionKind: request.actionKind ?? actionFromQ,
      inferredPreparationKind: null,
      routeNotes: notes,
    });
  }

  if (
    /\b(are you allowed|may you|am i allowed|do you need (my )?approval)\b/i.test(q) ||
    /\bcan you (deploy|send|merge|publish|change|spend|delete|remove|pay|schedule)\b/i.test(q)
  ) {
    notes.push("capability/governance pattern");
    return routeResult({
      intent: "CAPABILITY_GOVERNANCE",
      confidence: request.actionKind || actionFromQ ? "high" : "medium",
      inferredActionKind: request.actionKind ?? actionFromQ,
      inferredPreparationKind: null,
      routeNotes: notes,
    });
  }

  if (request.preparationKind || prepFromQ) {
    notes.push("preparation pattern");
    return routeResult({
      intent: "PREPARATION",
      confidence: "high",
      inferredActionKind: "PREPARE_DRAFT",
      inferredPreparationKind: request.preparationKind ?? prepFromQ,
      routeNotes: notes,
    });
  }

  if (
    /\b(what needs my attention|needs (my )?attention|attention overview|top priorities|what should i focus)\b/i.test(
      q,
    ) ||
    (/\battention\b/i.test(q) && /\b(what|needs|today|executive)\b/i.test(q))
  ) {
    return routeResult({
      intent: "ATTENTION_OVERVIEW",
      confidence: "high",
      inferredActionKind: null,
      inferredPreparationKind: null,
      routeNotes: ["attention pattern"],
    });
  }

  if (
    /\b(who is waiting|who needs follow[- ]?up|follow[- ]?up|client care|overdue follow|waiting on)\b/i.test(q)
  ) {
    return routeResult({
      intent: "CLIENT_CARE",
      confidence: "high",
      inferredActionKind: null,
      inferredPreparationKind: null,
      routeNotes: ["client care pattern"],
    });
  }

  if (/\b(why is (this |the )?listing|listing (flagged|reason)|reason chain)\b/i.test(q)) {
    return routeResult({
      intent: "LISTING_REASON",
      confidence: request.listingId ? "high" : "medium",
      inferredActionKind: null,
      inferredPreparationKind: null,
      routeNotes: ["listing reason pattern"],
    });
  }

  if (
    request.decisionContext ||
    /\b(should we|challenge (this )?decision|decision support|what are my options)\b/i.test(q)
  ) {
    return routeResult({
      intent: "DECISION_SUPPORT",
      confidence: request.decisionContext ? "high" : "medium",
      inferredActionKind: request.actionKind ?? actionFromQ,
      inferredPreparationKind: null,
      routeNotes: ["decision support pattern"],
    });
  }

  if (
    request.memorySubject ||
    /\b(what did we decide|remember|living book|memory|prior decision|recent decisions)\b/i.test(q)
  ) {
    return routeResult({
      intent: "MEMORY_LOOKUP",
      confidence: request.memorySubject ? "high" : "medium",
      inferredActionKind: null,
      inferredPreparationKind: null,
      routeNotes: ["memory lookup pattern"],
    });
  }

  return routeResult({
    intent: "UNKNOWN",
    confidence: "low",
    inferredActionKind: null,
    inferredPreparationKind: null,
    routeNotes: ["no clear deterministic pattern"],
  });
}

export type LeoConversationValidationError = {
  ok: false;
  error: "invalid_request" | "question_too_long" | "too_many_results" | "too_many_notes";
  message: string;
};

/**
 * Pure request validation — fails closed. No authority escalation fields.
 */
export function validateLeoConversationRequest(
  raw: unknown,
): { ok: true; request: LeoConversationRequest } | LeoConversationValidationError {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "invalid_request", message: "Body must be a JSON object." };
  }
  const body = raw as Record<string, unknown>;

  const forbidden = [
    "approvalGranted",
    "bypassGovernance",
    "roleOverride",
    "executionAllowed",
    "lowerGovernance",
    "grantPermission",
    "ownerAuthUserId",
    "ownerId",
    "actorId",
    "actorAuthUserId",
    "priorTurns",
    "conversationHistory",
    "rawGmail",
    "providerPayload",
  ];
  for (const key of forbidden) {
    if (key in body) {
      return {
        ok: false,
        error: "invalid_request",
        message: `Forbidden field '${key}' is not allowed.`,
      };
    }
  }

  if (typeof body.question !== "string") {
    return { ok: false, error: "invalid_request", message: "question string is required." };
  }
  const question = body.question.trim();
  if (!question) {
    return { ok: false, error: "invalid_request", message: "question must be non-empty." };
  }
  if (question.length > LEO_CONVERSATION_BOUNDS.maxQuestionLength) {
    return {
      ok: false,
      error: "question_too_long",
      message: `question exceeds ${LEO_CONVERSATION_BOUNDS.maxQuestionLength} characters.`,
    };
  }

  let sessionId: string | undefined;
  if (body.sessionId !== undefined && body.sessionId !== null) {
    if (typeof body.sessionId !== "string") {
      return { ok: false, error: "invalid_request", message: "sessionId must be a string." };
    }
    const sid = body.sessionId.trim();
    if (!sid) {
      return { ok: false, error: "invalid_request", message: "sessionId must be non-empty when provided." };
    }
    if (sid.length > LEO_CONVERSATION_BOUNDS.maxSessionIdLength) {
      return { ok: false, error: "invalid_request", message: "sessionId exceeds max length." };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(sid)) {
      return { ok: false, error: "invalid_request", message: "sessionId has invalid shape." };
    }
    sessionId = sid;
  }

  let clientRequestId: string | undefined;
  if (body.clientRequestId !== undefined && body.clientRequestId !== null) {
    if (typeof body.clientRequestId !== "string") {
      return { ok: false, error: "invalid_request", message: "clientRequestId must be a string." };
    }
    const cid = body.clientRequestId.trim();
    if (cid.length > LEO_CONVERSATION_BOUNDS.maxClientRequestIdLength) {
      return { ok: false, error: "invalid_request", message: "clientRequestId exceeds max length." };
    }
    if (cid) clientRequestId = cid.slice(0, LEO_CONVERSATION_BOUNDS.maxClientRequestIdLength);
  }

  let clientContext: LeoConversationClientContext | undefined;
  if (body.clientContext !== undefined && body.clientContext !== null) {
    if (typeof body.clientContext !== "object" || Array.isArray(body.clientContext)) {
      return { ok: false, error: "invalid_request", message: "clientContext must be an object." };
    }
    const cc = body.clientContext as Record<string, unknown>;
    const out: LeoConversationClientContext = {};
    if (cc.selectedCardId !== undefined) {
      if (cc.selectedCardId !== null && typeof cc.selectedCardId !== "string") {
        return { ok: false, error: "invalid_request", message: "selectedCardId must be a string or null." };
      }
      out.selectedCardId =
        typeof cc.selectedCardId === "string"
          ? cc.selectedCardId.trim().slice(0, LEO_CONVERSATION_BOUNDS.maxVisibleCardIdLength) || null
          : null;
    }
    if (cc.selectedEntityRef !== undefined) {
      if (cc.selectedEntityRef === null) {
        out.selectedEntityRef = null;
      } else if (typeof cc.selectedEntityRef === "object" && !Array.isArray(cc.selectedEntityRef)) {
        const er = cc.selectedEntityRef as Record<string, unknown>;
        const system = typeof er.system === "string" ? er.system.trim().slice(0, 64) : "";
        const kind = typeof er.kind === "string" ? er.kind.trim().slice(0, 64) : "";
        const id = typeof er.id === "string" ? er.id.trim().slice(0, 200) : "";
        if (!system || !kind || !id) {
          return {
            ok: false,
            error: "invalid_request",
            message: "selectedEntityRef requires system, kind, and id.",
          };
        }
        const ref: LeoConversationEntityRef = {
          system,
          kind,
          id,
          label:
            er.label != null ? String(er.label).slice(0, 120) : undefined,
        };
        out.selectedEntityRef = ref;
      } else {
        return { ok: false, error: "invalid_request", message: "selectedEntityRef must be an object or null." };
      }
    }
    if (cc.visibleCardIds !== undefined) {
      if (!Array.isArray(cc.visibleCardIds)) {
        return { ok: false, error: "invalid_request", message: "visibleCardIds must be an array." };
      }
      if (cc.visibleCardIds.length > LEO_CONVERSATION_BOUNDS.maxVisibleCardIds) {
        return {
          ok: false,
          error: "invalid_request",
          message: `visibleCardIds exceeds ${LEO_CONVERSATION_BOUNDS.maxVisibleCardIds}.`,
        };
      }
      out.visibleCardIds = cc.visibleCardIds
        .map((id) => (typeof id === "string" ? id.trim().slice(0, LEO_CONVERSATION_BOUNDS.maxVisibleCardIdLength) : ""))
        .filter(Boolean)
        .slice(0, LEO_CONVERSATION_BOUNDS.maxVisibleCardIds);
    }
    clientContext = out;
  }

  let maxResults: number = LEO_CONVERSATION_BOUNDS.maxResultsDefault;
  if (body.maxResults !== undefined) {
    if (typeof body.maxResults !== "number" || !Number.isFinite(body.maxResults)) {
      return { ok: false, error: "invalid_request", message: "maxResults must be a number." };
    }
    maxResults = Math.floor(body.maxResults);
    if (maxResults < 1 || maxResults > LEO_CONVERSATION_BOUNDS.maxResultsCap) {
      return {
        ok: false,
        error: "too_many_results",
        message: `maxResults must be 1..${LEO_CONVERSATION_BOUNDS.maxResultsCap}.`,
      };
    }
  }

  let externalUntrustedNotes: string[] | undefined;
  if (body.externalUntrustedNotes !== undefined) {
    if (!Array.isArray(body.externalUntrustedNotes)) {
      return { ok: false, error: "invalid_request", message: "externalUntrustedNotes must be an array." };
    }
    if (body.externalUntrustedNotes.length > LEO_CONVERSATION_BOUNDS.maxExternalNotes) {
      return {
        ok: false,
        error: "too_many_notes",
        message: `externalUntrustedNotes exceeds ${LEO_CONVERSATION_BOUNDS.maxExternalNotes}.`,
      };
    }
    externalUntrustedNotes = body.externalUntrustedNotes.map((n) => {
      const s = typeof n === "string" ? n : String(n);
      return s.slice(0, LEO_CONVERSATION_BOUNDS.maxExternalNoteLength);
    });
  }

  const request: LeoConversationRequest = {
    question,
    intent: undefined,
    listingId: typeof body.listingId === "string" ? body.listingId : body.listingId === null ? null : undefined,
    memorySubject:
      body.memorySubject && typeof body.memorySubject === "object"
        ? {
            subjectType: String((body.memorySubject as { subjectType?: unknown }).subjectType ?? ""),
            subjectKey: String((body.memorySubject as { subjectKey?: unknown }).subjectKey ?? ""),
          }
        : body.memorySubject === null
          ? null
          : undefined,
    decisionContext: (body.decisionContext as LeoConversationRequest["decisionContext"]) ?? undefined,
    actionKind: (body.actionKind as LeoConversationRequest["actionKind"]) ?? undefined,
    maxResults,
    externalUntrustedNotes,
    preparationKind: (body.preparationKind as LeoConversationRequest["preparationKind"]) ?? undefined,
    watcherKind: (body.watcherKind as LeoConversationRequest["watcherKind"]) ?? undefined,
    entityId: typeof body.entityId === "string" ? body.entityId : body.entityId === null ? null : undefined,
    nowMs: typeof body.nowMs === "number" ? body.nowMs : undefined,
    sessionId,
    clientRequestId,
    clientContext,
  };

  if (body.intent !== undefined) {
    if (!isLeoConversationIntent(body.intent)) {
      return { ok: false, error: "invalid_request", message: "intent is not a supported LeoConversationIntent." };
    }
    request.intent = body.intent;
  }

  return { ok: true, request };
}
