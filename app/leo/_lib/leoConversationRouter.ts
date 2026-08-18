/**
 * LEO-7 Conversation Router — deterministic intent resolution.
 * Ambiguous → UNKNOWN. NEVER-class patterns outrank RED action verbs.
 */
import type {
  LeoActionIntentKind,
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
  return /\b(what can you do|what can leo do|what are your capabilities|what tools do you have|how can you help( me)?|what can you help with)\b/i.test(
    q,
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

  if (request.intent && isLeoConversationIntent(request.intent) && request.intent !== "UNKNOWN") {
    notes.push(`explicit intent=${request.intent}`);
    return {
      intent: request.intent,
      confidence: "high",
      inferredActionKind: request.actionKind ?? actionFromQ,
      inferredPreparationKind: request.preparationKind ?? prepFromQ,
      routeNotes: notes,
    };
  }

  // Capability overview BEFORE authority/action routing ("What can you do?" ≠ OTHER/RED)
  if (isLeoCapabilityOverviewQuestion(q)) {
    notes.push("capability overview pattern");
    return {
      intent: "CAPABILITY_OVERVIEW",
      confidence: "high",
      inferredActionKind: "READ",
      inferredPreparationKind: null,
      routeNotes: notes,
    };
  }

  // Consequential / specific authority questions
  if (actionFromQ && actionFromQ !== "PREPARE_DRAFT") {
    notes.push("capability/governance pattern");
    return {
      intent: "CAPABILITY_GOVERNANCE",
      confidence: "high",
      inferredActionKind: request.actionKind ?? actionFromQ,
      inferredPreparationKind: null,
      routeNotes: notes,
    };
  }

  if (
    /\b(are you allowed|may you|am i allowed|do you need (my )?approval)\b/i.test(q) ||
    /\bcan you (deploy|send|merge|publish|change|spend|delete|remove|pay|schedule)\b/i.test(q)
  ) {
    notes.push("capability/governance pattern");
    return {
      intent: "CAPABILITY_GOVERNANCE",
      confidence: request.actionKind || actionFromQ ? "high" : "medium",
      inferredActionKind: request.actionKind ?? actionFromQ,
      inferredPreparationKind: null,
      routeNotes: notes,
    };
  }

  if (request.preparationKind || prepFromQ) {
    notes.push("preparation pattern");
    return {
      intent: "PREPARATION",
      confidence: "high",
      inferredActionKind: "PREPARE_DRAFT",
      inferredPreparationKind: request.preparationKind ?? prepFromQ,
      routeNotes: notes,
    };
  }

  if (
    /\b(what needs my attention|needs (my )?attention|attention overview|top priorities|what should i focus)\b/i.test(
      q,
    ) ||
    (/\battention\b/i.test(q) && /\b(what|needs|today|executive)\b/i.test(q))
  ) {
    return {
      intent: "ATTENTION_OVERVIEW",
      confidence: "high",
      inferredActionKind: null,
      inferredPreparationKind: null,
      routeNotes: ["attention pattern"],
    };
  }

  if (
    /\b(who is waiting|who needs follow[- ]?up|follow[- ]?up|client care|overdue follow|waiting on)\b/i.test(q)
  ) {
    return {
      intent: "CLIENT_CARE",
      confidence: "high",
      inferredActionKind: null,
      inferredPreparationKind: null,
      routeNotes: ["client care pattern"],
    };
  }

  if (/\b(why is (this |the )?listing|listing (flagged|reason)|reason chain)\b/i.test(q)) {
    return {
      intent: "LISTING_REASON",
      confidence: request.listingId ? "high" : "medium",
      inferredActionKind: null,
      inferredPreparationKind: null,
      routeNotes: ["listing reason pattern"],
    };
  }

  if (
    request.decisionContext ||
    /\b(should we|challenge (this )?decision|decision support|what are my options)\b/i.test(q)
  ) {
    return {
      intent: "DECISION_SUPPORT",
      confidence: request.decisionContext ? "high" : "medium",
      inferredActionKind: request.actionKind ?? actionFromQ,
      inferredPreparationKind: null,
      routeNotes: ["decision support pattern"],
    };
  }

  if (
    request.memorySubject ||
    /\b(what did we decide|remember|living book|memory|prior decision|recent decisions)\b/i.test(q)
  ) {
    return {
      intent: "MEMORY_LOOKUP",
      confidence: request.memorySubject ? "high" : "medium",
      inferredActionKind: null,
      inferredPreparationKind: null,
      routeNotes: ["memory lookup pattern"],
    };
  }

  return {
    intent: "UNKNOWN",
    confidence: "low",
    inferredActionKind: null,
    inferredPreparationKind: null,
    routeNotes: ["no clear deterministic pattern"],
  };
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
  };

  if (body.intent !== undefined) {
    if (!isLeoConversationIntent(body.intent)) {
      return { ok: false, error: "invalid_request", message: "intent is not a supported LeoConversationIntent." };
    }
    request.intent = body.intent;
  }

  return { ok: true, request };
}
