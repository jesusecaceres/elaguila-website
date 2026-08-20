/**
 * LEO-14.6 — pure deterministic conversational referent resolver.
 * Resolves only when unambiguous. Never infers authorization.
 * LEO-18A — bridges resolved referents into entity resolution (reuse, don't duplicate).
 */
import type {
  LeoActiveConversationContext,
  LeoConversationEntityRef,
  LeoConversationIntent,
  LeoResultCard,
  LeoResultCardKind,
} from "@/app/leo/_lib/leoTypes";
import { extractRefsFromResultCard } from "@/app/leo/_lib/leoConversationContext";
import {
  entityQueryFromReferentFields,
  LEO_18A_ENTITY_NOT_CLAIMING,
  resolveLeoEntity,
  type LeoEntityCategory,
  type LeoEntityKnownBusiness,
  type LeoEntityKnownPerson,
  type LeoEntityResolutionResult,
} from "@/app/leo/_lib/leoEntityResolution";

export type LeoReferentKind =
  | "EMAIL"
  | "CALENDAR"
  | "COMMITMENT"
  | "PROJECT"
  | "RECEIPT"
  | "CLIENT"
  | "GENERIC_CARD";

export type LeoReferentFollowUpAction =
  | "SUMMARIZE"
  | "OPEN"
  | "EVIDENCE"
  | "EXECUTE_STATUS"
  | "MUTATE"
  | "GENERIC"
  | null;

export type LeoReferentResolution =
  | {
      status: "RESOLVED";
      kind: LeoReferentKind;
      cardId: string | null;
      entityRef: LeoConversationEntityRef | null;
      threadId: string | null;
      messageId: string | null;
      eventId: string | null;
      commitmentId: string | null;
      receiptId: string | null;
      ordinalIndex: number | null;
      label: string | null;
      suggestedIntent: LeoConversationIntent | null;
      followUpAction: LeoReferentFollowUpAction;
    }
  | {
      status: "AMBIGUOUS";
      clarification: string;
      candidates: Array<{ label: string; kind: LeoReferentKind; cardId: string | null }>;
      blocksMutation: boolean;
      suggestedIntent: LeoConversationIntent | null;
      followUpAction: LeoReferentFollowUpAction;
    }
  | {
      status: "NONE";
    };

const ORDINAL_MAP: Record<string, number> = {
  first: 0,
  "1st": 0,
  second: 1,
  "2nd": 1,
  third: 2,
  "3rd": 2,
  fourth: 3,
  "4th": 3,
  fifth: 4,
  "5th": 4,
  last: -1,
};

function normalize(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

function cardKindToReferent(kind: LeoResultCardKind): LeoReferentKind {
  switch (kind) {
    case "EMAIL":
      return "EMAIL";
    case "CALENDAR":
      return "CALENDAR";
    case "COMMITMENT":
      return "COMMITMENT";
    case "PROJECT":
      return "PROJECT";
    case "CLIENT":
      return "CLIENT";
    default:
      return "GENERIC_CARD";
  }
}

function detectFollowUp(q: string): {
  action: LeoReferentFollowUpAction;
  suggestedIntent: LeoConversationIntent | null;
  wantsMutation: boolean;
} {
  const n = normalize(q);
  const wantsMutation =
    /\b(acknowledge|ack|dismiss|remind later|snooze|create (a )?commitment)\b/.test(n) ||
    /\b(mark (it|that) (done|acknowledged|dismissed))\b/.test(n) ||
    // LEO-17B: consequential connected-action verbs on referents require unambiguous targets.
    /\b(send|reply|schedule|reschedule|move|update)\b/.test(n);

  if (wantsMutation) {
    return { action: "MUTATE", suggestedIntent: null, wantsMutation: true };
  }
  if (/\b(summarize|summary|sum up)\b/.test(n)) {
    return { action: "SUMMARIZE", suggestedIntent: "COMMUNICATION_INTELLIGENCE", wantsMutation: false };
  }
  if (/\b(show evidence|evidence for|inspect)\b/.test(n)) {
    return { action: "EVIDENCE", suggestedIntent: null, wantsMutation: false };
  }
  if (/\b(did that execute|did it execute|was that verified|did you (do|execute)|execution (status|state))\b/.test(n)) {
    return { action: "EXECUTE_STATUS", suggestedIntent: "RECEIPT_INTELLIGENCE", wantsMutation: false };
  }
  if (/\b(open|show|view|look at)\b/.test(n)) {
    return { action: "OPEN", suggestedIntent: null, wantsMutation: false };
  }
  if (/\b(what about|tell me about|more about)\b/.test(n)) {
    return { action: "GENERIC", suggestedIntent: null, wantsMutation: false };
  }
  return { action: null, suggestedIntent: null, wantsMutation: false };
}

function detectTypeHint(q: string): LeoReferentKind | null {
  const n = normalize(q);
  if (/\b(email|message|thread|gmail)\b/.test(n)) return "EMAIL";
  if (/\b(meeting|calendar|event)\b/.test(n)) return "CALENDAR";
  if (/\bcommitment\b/.test(n)) return "COMMITMENT";
  if (/\b(project|repo|deploy|commit)\b/.test(n)) return "PROJECT";
  if (/\breceipt\b/.test(n)) return "RECEIPT";
  if (/\b(client|lead|customer)\b/.test(n)) return "CLIENT";
  return null;
}

function hasReferentPhrase(q: string): boolean {
  const n = normalize(q);
  return (
    /\b(that|this|it)\b/.test(n) ||
    /\b(that|this) one\b/.test(n) ||
    /\bthe (first|second|third|fourth|fifth|last|1st|2nd|3rd|4th|5th) one\b/.test(n) ||
    /\bthe (first|second|third|fourth|fifth|last)\b/.test(n) ||
    /\bthat (email|message|thread|commitment|meeting|project|receipt|client)\b/.test(n) ||
    /\bthis (email|message|thread|commitment|meeting|project|receipt|client)\b/.test(n)
  );
}

function detectOrdinal(q: string): number | null {
  const n = normalize(q);
  const m = n.match(/\b(?:the )?((?:first|second|third|fourth|fifth|last|1st|2nd|3rd|4th|5th))(?: one)?\b/);
  if (!m) return null;
  const key = m[1];
  return key in ORDINAL_MAP ? ORDINAL_MAP[key] : null;
}

function labelForCard(card: LeoResultCard): string {
  if (card.kind === "EMAIL") {
    const who = card.senderDisplayName || card.senderAddress || "an email";
    const subj = card.subject ? ` (${card.subject.slice(0, 60)})` : "";
    return `the email from ${who}${subj}`;
  }
  if (card.kind === "COMMITMENT") {
    const due = card.dueAt ? ` due ${card.dueAt.slice(0, 10)}` : "";
    return `the commitment “${card.title.slice(0, 60)}”${due}`;
  }
  if (card.kind === "CALENDAR") {
    return `the meeting “${card.title.slice(0, 60)}”`;
  }
  return card.title.slice(0, 80) || `${card.kind.toLowerCase()} card`;
}

function resolveFromCard(
  card: LeoResultCard,
  ordinalIndex: number | null,
  follow: ReturnType<typeof detectFollowUp>,
  typeHint: LeoReferentKind | null,
): Extract<LeoReferentResolution, { status: "RESOLVED" }> {
  const refs = extractRefsFromResultCard(card);
  let suggestedIntent = follow.suggestedIntent;
  const kind = cardKindToReferent(card.kind);
  if (kind === "EMAIL" || typeHint === "EMAIL") {
    suggestedIntent = suggestedIntent ?? "COMMUNICATION_INTELLIGENCE";
  } else if (kind === "COMMITMENT" || typeHint === "COMMITMENT") {
    suggestedIntent = suggestedIntent ?? "COMMITMENT_INTELLIGENCE";
  } else if (kind === "CALENDAR" || typeHint === "CALENDAR") {
    suggestedIntent = suggestedIntent ?? "COMMUNICATION_INTELLIGENCE";
  } else if (kind === "PROJECT" || typeHint === "PROJECT") {
    suggestedIntent = suggestedIntent ?? "PROJECT_INTELLIGENCE";
  } else if (typeHint === "RECEIPT" || follow.action === "EXECUTE_STATUS") {
    suggestedIntent = "RECEIPT_INTELLIGENCE";
  }

  return {
    status: "RESOLVED",
    kind,
    cardId: card.cardId,
    entityRef: refs.entityRef,
    threadId: refs.threadId,
    messageId: refs.messageId,
    eventId: refs.eventId,
    commitmentId: refs.commitmentId,
    receiptId: refs.receiptId,
    ordinalIndex,
    label: labelForCard(card),
    suggestedIntent,
    followUpAction: follow.action,
  };
}

function resolveFromContextFocus(
  ctx: LeoActiveConversationContext,
  follow: ReturnType<typeof detectFollowUp>,
  typeHint: LeoReferentKind | null,
): Extract<LeoReferentResolution, { status: "RESOLVED" }> | null {
  if (
    !ctx.focusCardId &&
    !ctx.focusEntityRef &&
    !ctx.focusThreadId &&
    !ctx.focusMessageId &&
    !ctx.focusCommitmentId &&
    !ctx.focusEventId &&
    !ctx.focusReceiptId
  ) {
    return null;
  }

  if (typeHint === "COMMITMENT" && !ctx.focusCommitmentId && ctx.focusEntityRef?.kind !== "COMMITMENT") {
    return null;
  }
  if (typeHint === "EMAIL" && !ctx.focusThreadId && !ctx.focusMessageId && ctx.focusEntityRef?.kind !== "EMAIL") {
    return null;
  }
  if (typeHint === "RECEIPT" && !ctx.focusReceiptId && ctx.focusEntityRef?.kind !== "RECEIPT") {
    return null;
  }

  let kind: LeoReferentKind = "GENERIC_CARD";
  if (ctx.focusCommitmentId || ctx.focusEntityRef?.kind === "COMMITMENT") kind = "COMMITMENT";
  else if (ctx.focusThreadId || ctx.focusMessageId || ctx.focusEntityRef?.kind === "EMAIL") kind = "EMAIL";
  else if (ctx.focusEventId || ctx.focusEntityRef?.kind === "CALENDAR") kind = "CALENDAR";
  else if (ctx.focusReceiptId || ctx.focusEntityRef?.kind === "RECEIPT") kind = "RECEIPT";
  else if (ctx.focusEntityRef?.kind === "PROJECT") kind = "PROJECT";
  else if (ctx.focusEntityRef?.kind === "CLIENT") kind = "CLIENT";
  else if (typeHint) kind = typeHint;

  let suggestedIntent = follow.suggestedIntent;
  if (kind === "EMAIL") suggestedIntent = suggestedIntent ?? "COMMUNICATION_INTELLIGENCE";
  if (kind === "COMMITMENT") suggestedIntent = suggestedIntent ?? "COMMITMENT_INTELLIGENCE";
  if (kind === "CALENDAR") suggestedIntent = suggestedIntent ?? "COMMUNICATION_INTELLIGENCE";
  if (kind === "PROJECT") suggestedIntent = suggestedIntent ?? "PROJECT_INTELLIGENCE";
  if (kind === "RECEIPT" || follow.action === "EXECUTE_STATUS") suggestedIntent = "RECEIPT_INTELLIGENCE";

  return {
    status: "RESOLVED",
    kind,
    cardId: ctx.focusCardId,
    entityRef: ctx.focusEntityRef,
    threadId: ctx.focusThreadId,
    messageId: ctx.focusMessageId,
    eventId: ctx.focusEventId,
    commitmentId: ctx.focusCommitmentId,
    receiptId: ctx.focusReceiptId,
    ordinalIndex: null,
    label: ctx.focusEntityRef?.label ?? ctx.focusCardId ?? "the focused item",
    suggestedIntent,
    followUpAction: follow.action,
  };
}

function clarificationMessage(
  candidates: Array<{ label: string; kind: LeoReferentKind }>,
  wantsMutation: boolean,
): string {
  if (candidates.length >= 2) {
    const a = candidates[0].label;
    const b = candidates[1].label;
    if (wantsMutation) {
      return `I can do that, but I need to know which one you mean—${a} or ${b}?`;
    }
    return `I can open it, but I have two possible matches. Do you mean ${a} or ${b}?`;
  }
  return "Which one do you mean? There are a few possible matches in this conversation.";
}

/**
 * Resolve conversational referents against active context + optional live cards.
 * Ambiguous → clarification; never guesses. Does not grant authority.
 */
export function resolveLeoConversationReferent(input: {
  question: string;
  context: LeoActiveConversationContext;
  cards?: LeoResultCard[] | null;
}): LeoReferentResolution {
  const q = input.question ?? "";
  if (!hasReferentPhrase(q)) return { status: "NONE" };

  const follow = detectFollowUp(q);
  const typeHint = detectTypeHint(q);
  const ordinal = detectOrdinal(q);

  const cards = (input.cards ?? []).slice(0, 40);
  const cardById = new Map(cards.map((c) => [c.cardId, c]));

  // Ordinal against lastCardIds / live cards
  if (ordinal != null) {
    const ids =
      input.context.lastCardIds.length > 0
        ? input.context.lastCardIds
        : cards.map((c) => c.cardId);
    if (ids.length === 0) {
      return {
        status: "AMBIGUOUS",
        clarification: "I don’t have a clear list to pick from yet. Which item do you mean?",
        candidates: [],
        blocksMutation: follow.wantsMutation,
        suggestedIntent: follow.suggestedIntent,
        followUpAction: follow.action,
      };
    }
    const index = ordinal === -1 ? ids.length - 1 : ordinal;
    if (index < 0 || index >= ids.length) {
      return {
        status: "AMBIGUOUS",
        clarification: `I only see ${ids.length} item${ids.length === 1 ? "" : "s"} in the current list. Which one did you mean?`,
        candidates: ids.slice(0, 3).map((id, i) => {
          const card = cardById.get(id);
          return {
            label: card ? labelForCard(card) : `item ${i + 1}`,
            kind: card ? cardKindToReferent(card.kind) : "GENERIC_CARD",
            cardId: id,
          };
        }),
        blocksMutation: follow.wantsMutation,
        suggestedIntent: follow.suggestedIntent,
        followUpAction: follow.action,
      };
    }
    const cardId = ids[index];
    const card = cardById.get(cardId);
    if (card) return resolveFromCard(card, index, follow, typeHint);
    // Card id known from history but not rehydrated — resolve by id + context focus fields if matching
    return {
      status: "RESOLVED",
      kind: typeHint ?? "GENERIC_CARD",
      cardId,
      entityRef: input.context.focusCardId === cardId ? input.context.focusEntityRef : null,
      threadId: null,
      messageId: null,
      eventId: null,
      commitmentId: null,
      receiptId: null,
      ordinalIndex: index,
      label: `item ${index + 1}`,
      suggestedIntent: follow.suggestedIntent,
      followUpAction: follow.action,
    };
  }

  // Typed or pronoun referent with explicit focus
  const fromFocus = resolveFromContextFocus(input.context, follow, typeHint);
  if (fromFocus) {
    // If type hint conflicts with multiple live cards of that type and no unique focus match
    if (typeHint && cards.length > 1) {
      const typed = cards.filter((c) => cardKindToReferent(c.kind) === typeHint);
      if (typed.length > 1) {
        const focusMatches = typed.filter(
          (c) =>
            c.cardId === input.context.focusCardId ||
            (typeHint === "COMMITMENT" &&
              c.kind === "COMMITMENT" &&
              c.commitmentId === input.context.focusCommitmentId) ||
            (typeHint === "EMAIL" &&
              c.kind === "EMAIL" &&
              (c.threadId === input.context.focusThreadId ||
                c.messageId === input.context.focusMessageId)),
        );
        if (focusMatches.length === 1) {
          return resolveFromCard(focusMatches[0], null, follow, typeHint);
        }
        if (focusMatches.length === 0 && !input.context.focusCardId && !input.context.focusCommitmentId) {
          return {
            status: "AMBIGUOUS",
            clarification: clarificationMessage(
              typed.slice(0, 2).map((c) => ({ label: labelForCard(c), kind: cardKindToReferent(c.kind) })),
              follow.wantsMutation,
            ),
            candidates: typed.slice(0, 4).map((c) => ({
              label: labelForCard(c),
              kind: cardKindToReferent(c.kind),
              cardId: c.cardId,
            })),
            blocksMutation: true,
            suggestedIntent: follow.suggestedIntent,
            followUpAction: follow.action,
          };
        }
      }
      if (typed.length === 1) return resolveFromCard(typed[0], null, follow, typeHint);
    }
    return fromFocus;
  }

  // Single live card → resolve "that"/"it"
  if (cards.length === 1) {
    return resolveFromCard(cards[0], 0, follow, typeHint);
  }

  // Type-filtered single card
  if (typeHint && cards.length > 0) {
    const typed = cards.filter((c) => cardKindToReferent(c.kind) === typeHint);
    if (typed.length === 1) return resolveFromCard(typed[0], null, follow, typeHint);
    if (typed.length > 1) {
      return {
        status: "AMBIGUOUS",
        clarification: clarificationMessage(
          typed.slice(0, 2).map((c) => ({ label: labelForCard(c), kind: cardKindToReferent(c.kind) })),
          follow.wantsMutation,
        ),
        candidates: typed.slice(0, 4).map((c) => ({
          label: labelForCard(c),
          kind: cardKindToReferent(c.kind),
          cardId: c.cardId,
        })),
        blocksMutation: true,
        suggestedIntent: follow.suggestedIntent,
        followUpAction: follow.action,
      };
    }
  }

  // Multiple plausible targets, no focus
  if (cards.length > 1) {
    return {
      status: "AMBIGUOUS",
      clarification: clarificationMessage(
        cards.slice(0, 2).map((c) => ({ label: labelForCard(c), kind: cardKindToReferent(c.kind) })),
        follow.wantsMutation,
      ),
      candidates: cards.slice(0, 4).map((c) => ({
        label: labelForCard(c),
        kind: cardKindToReferent(c.kind),
        cardId: c.cardId,
      })),
      blocksMutation: true,
      suggestedIntent: follow.suggestedIntent,
      followUpAction: follow.action,
    };
  }

  // lastCardIds without rehydrated cards and no focus
  if (input.context.lastCardIds.length > 1) {
    return {
      status: "AMBIGUOUS",
      clarification:
        "Which one do you mean? There are several items from the last answer—say the first, second, or describe it.",
      candidates: input.context.lastCardIds.slice(0, 4).map((id, i) => ({
        label: `item ${i + 1}`,
        kind: "GENERIC_CARD" as const,
        cardId: id,
      })),
      blocksMutation: true,
      suggestedIntent: follow.suggestedIntent,
      followUpAction: follow.action,
    };
  }

  if (input.context.lastCardIds.length === 1) {
    return {
      status: "RESOLVED",
      kind: typeHint ?? "GENERIC_CARD",
      cardId: input.context.lastCardIds[0],
      entityRef: input.context.focusEntityRef,
      threadId: input.context.focusThreadId,
      messageId: input.context.focusMessageId,
      eventId: input.context.focusEventId,
      commitmentId: input.context.focusCommitmentId,
      receiptId: input.context.focusReceiptId,
      ordinalIndex: 0,
      label: "the last result",
      suggestedIntent: follow.suggestedIntent,
      followUpAction: follow.action,
    };
  }

  return {
    status: "AMBIGUOUS",
    clarification: "I’m not sure which item you mean. Point to one from the latest results, or name it.",
    candidates: [],
    blocksMutation: follow.wantsMutation,
    suggestedIntent: follow.suggestedIntent,
    followUpAction: follow.action,
  };
}

/** True when consequential/internal mutation must wait for clarification. */
export function referentBlocksMutation(resolution: LeoReferentResolution): boolean {
  return resolution.status === "AMBIGUOUS" && resolution.blocksMutation;
}

/**
 * LEO-18A — Map a resolved (or focus) referent into entity resolution evidence.
 * Reuses this referent system; does not invent a second one.
 * Supports phrases like "that email", "that meeting" via proven ids only.
 */
export function resolveEntityFromConversationReferent(input: {
  rawText: string;
  referent: LeoReferentResolution | null | undefined;
  context?: LeoActiveConversationContext | null;
  knownPersons?: readonly LeoEntityKnownPerson[];
  knownBusinesses?: readonly LeoEntityKnownBusiness[];
  knownEmails?: readonly string[];
  expectedCategories?: readonly LeoEntityCategory[];
}): LeoEntityResolutionResult {
  const resolved = input.referent?.status === "RESOLVED" ? input.referent : null;
  const ambiguous = input.referent?.status === "AMBIGUOUS";

  if (ambiguous) {
    return {
      query: { rawText: input.rawText },
      state: "AMBIGUOUS",
      confidence: "NONE",
      candidates: (input.referent && input.referent.status === "AMBIGUOUS"
        ? input.referent.candidates
        : []
      ).map((c, i) => ({
        candidateId: `REFERENT_AMBIGUOUS:${c.cardId ?? i}`,
        category:
          c.kind === "EMAIL"
            ? ("CONVERSATION_THREAD" as const)
            : c.kind === "CALENDAR"
              ? ("CALENDAR_EVENT" as const)
              : c.kind === "CLIENT"
                ? ("PERSON" as const)
                : ("LEONIX_ENTITY" as const),
        displayLabel: c.label,
        provenIdentifier: null,
        confidence: "WEAK" as const,
        evidence: [
          {
            matchedOn: c.label,
            reason: "Ambiguous conversation referent — clarification required.",
            source: "CONVERSATION_REFERENT" as const,
            sourceRef: c.cardId,
          },
        ],
      })),
      ambiguity: true,
      clarificationRequired: true,
      clarification:
        input.referent && input.referent.status === "AMBIGUOUS"
          ? input.referent.clarification
          : "Which item do you mean?",
      proposalSafe: false,
      notClaiming: LEO_18A_ENTITY_NOT_CLAIMING,
    };
  }

  return resolveLeoEntity(
    entityQueryFromReferentFields({
      rawText: input.rawText,
      expectedCategories: input.expectedCategories,
      referentStatus: input.referent?.status ?? null,
      threadId: resolved?.threadId ?? input.context?.focusThreadId ?? null,
      eventId: resolved?.eventId ?? input.context?.focusEventId ?? null,
      messageId: resolved?.messageId ?? input.context?.focusMessageId ?? null,
      label: resolved?.label ?? null,
      kind: resolved?.kind ?? null,
      knownEmails: input.knownEmails,
      knownPersons: input.knownPersons,
      knownBusinesses: input.knownBusinesses,
    }),
  );
}
