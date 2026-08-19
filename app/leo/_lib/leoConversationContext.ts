/**
 * LEO-14.6 — pure active conversation context (references only).
 * No DB, no network, no authority inference.
 */
import type {
  LeoActiveConversationContext,
  LeoConversationClientContext,
  LeoConversationEntityRef,
  LeoConversationFocus,
  LeoConversationTurn,
  LeoResultCard,
} from "@/app/leo/_lib/leoTypes";

export const LEO_ACTIVE_CONTEXT_TURN_WINDOW = 12;

function nonEmpty(v: string | null | undefined): string | null {
  const s = v?.trim();
  return s ? s : null;
}

function boundEntityRef(ref: LeoConversationEntityRef | null | undefined): LeoConversationEntityRef | null {
  if (!ref) return null;
  const system = nonEmpty(ref.system);
  const kind = nonEmpty(ref.kind);
  const id = nonEmpty(ref.id);
  if (!system || !kind || !id) return null;
  return {
    system: system.slice(0, 64),
    kind: kind.slice(0, 64),
    id: id.slice(0, 200),
    label: ref.label != null ? String(ref.label).slice(0, 120) : undefined,
  };
}

/** Extract durable refs from a live result card — never bodies. */
export function extractRefsFromResultCard(card: LeoResultCard): {
  entityRef: LeoConversationEntityRef | null;
  threadId: string | null;
  messageId: string | null;
  eventId: string | null;
  commitmentId: string | null;
  receiptId: string | null;
} {
  switch (card.kind) {
    case "EMAIL":
      return {
        entityRef: {
          system: "GOOGLE_GMAIL",
          kind: "EMAIL",
          id: card.threadId || card.messageId,
          label: card.title.slice(0, 120),
        },
        threadId: nonEmpty(card.threadId),
        messageId: nonEmpty(card.messageId),
        eventId: null,
        commitmentId: null,
        receiptId: null,
      };
    case "CALENDAR":
      return {
        entityRef: {
          system: "GOOGLE_CALENDAR",
          kind: "CALENDAR",
          id: card.eventId,
          label: card.title.slice(0, 120),
        },
        threadId: null,
        messageId: null,
        eventId: nonEmpty(card.eventId),
        commitmentId: null,
        receiptId: null,
      };
    case "COMMITMENT":
      return {
        entityRef: {
          system: "LEO",
          kind: "COMMITMENT",
          id: card.commitmentId,
          label: card.title.slice(0, 120),
        },
        threadId: null,
        messageId: null,
        eventId: null,
        commitmentId: nonEmpty(card.commitmentId),
        receiptId: null,
      };
    case "CLIENT":
      return {
        entityRef: {
          system: "LEONIX",
          kind: "CLIENT",
          id: card.entityRef.id ?? card.cardId,
          label: card.displayName.slice(0, 120),
        },
        threadId: null,
        messageId: null,
        eventId: null,
        commitmentId: null,
        receiptId: null,
      };
    case "PROJECT":
      return {
        entityRef: {
          system: "GITHUB",
          kind: "PROJECT",
          id: card.commitSha || card.deploymentId || card.repository || card.cardId,
          label: (card.title || card.projectName || "project").slice(0, 120),
        },
        threadId: null,
        messageId: null,
        eventId: null,
        commitmentId: null,
        receiptId: null,
      };
    case "PREPARED_ACTION":
      return {
        entityRef: {
          system: "LEO",
          kind: "PREPARED_ACTION",
          id: card.preparationId,
          label: card.title.slice(0, 120),
        },
        threadId: null,
        messageId: null,
        eventId: null,
        commitmentId: null,
        receiptId: null,
      };
    default:
      return {
        entityRef: {
          system: "LEO",
          kind: card.kind,
          id: card.cardId,
          label: card.title.slice(0, 120),
        },
        threadId: null,
        messageId: null,
        eventId: null,
        commitmentId: null,
        receiptId: null,
      };
  }
}

export function extractResultCardRefsFromAnswer(cards: LeoResultCard[] | null | undefined): string[] {
  if (!cards?.length) return [];
  return cards.map((c) => c.cardId).filter(Boolean).slice(0, 40);
}

export function extractEntityRefsFromCards(cards: LeoResultCard[] | null | undefined): LeoConversationEntityRef[] {
  if (!cards?.length) return [];
  const out: LeoConversationEntityRef[] = [];
  for (const card of cards.slice(0, 40)) {
    const ref = extractRefsFromResultCard(card).entityRef;
    if (ref) out.push(ref);
  }
  return out.slice(0, 20);
}

export function extractReceiptIdsFromAnswer(input: {
  cards?: LeoResultCard[] | null;
  contextRefs?: Record<string, unknown>;
  preparedAction?: { preparationId?: string } | null;
}): string[] {
  const ids: string[] = [];
  const fromCtx = input.contextRefs?.receiptIds;
  if (Array.isArray(fromCtx)) {
    for (const id of fromCtx) {
      if (typeof id === "string" && id.trim()) ids.push(id.trim().slice(0, 80));
    }
  }
  const single = input.contextRefs?.receiptId;
  if (typeof single === "string" && single.trim()) ids.push(single.trim().slice(0, 80));
  return [...new Set(ids)].slice(0, 40);
}

function focusFromTurn(turn: LeoConversationTurn | null | undefined): Partial<LeoActiveConversationContext> {
  if (!turn) return {};
  const ctx = turn.contextRefs ?? {};
  const entity = turn.selectedEntityRefs[0] ?? null;
  return {
    lastTurnId: turn.id,
    lastIntent: turn.intent,
    focusCardId: nonEmpty(typeof ctx.focusCardId === "string" ? ctx.focusCardId : turn.resultCardRefs[0]),
    focusEntityRef: boundEntityRef(entity),
    focusThreadId: nonEmpty(typeof ctx.threadId === "string" ? ctx.threadId : null),
    focusMessageId: nonEmpty(typeof ctx.messageId === "string" ? ctx.messageId : null),
    focusEventId: nonEmpty(typeof ctx.eventId === "string" ? ctx.eventId : null),
    focusCommitmentId: nonEmpty(
      typeof ctx.commitmentId === "string"
        ? ctx.commitmentId
        : entity?.kind === "COMMITMENT"
          ? entity.id
          : null,
    ),
    focusReceiptId: nonEmpty(
      typeof ctx.receiptId === "string"
        ? ctx.receiptId
        : turn.receiptIds[0] ?? null,
    ),
    lastCardIds: turn.resultCardRefs.slice(0, 40),
  };
}

function emptyContext(sessionId: string | null): LeoActiveConversationContext {
  return {
    sessionId,
    lastTurnId: null,
    lastIntent: null,
    focusCardId: null,
    focusEntityRef: null,
    focusThreadId: null,
    focusMessageId: null,
    focusEventId: null,
    focusCommitmentId: null,
    focusReceiptId: null,
    lastCardIds: [],
  };
}

function toFocus(ctx: LeoActiveConversationContext): LeoConversationFocus | undefined {
  if (
    !ctx.focusCardId &&
    !ctx.focusEntityRef &&
    !ctx.focusThreadId &&
    !ctx.focusMessageId &&
    !ctx.focusEventId &&
    !ctx.focusCommitmentId &&
    !ctx.focusReceiptId
  ) {
    return undefined;
  }
  return {
    cardId: ctx.focusCardId ?? undefined,
    entityRef: ctx.focusEntityRef ?? undefined,
    threadId: ctx.focusThreadId ?? undefined,
    messageId: ctx.focusMessageId ?? undefined,
    eventId: ctx.focusEventId ?? undefined,
    commitmentId: ctx.focusCommitmentId ?? undefined,
    receiptId: ctx.focusReceiptId ?? undefined,
  };
}

/**
 * Build active context.
 * Priority: explicit client selection → latest unambiguous server focus → recent cards.
 * Never randomly guesses from older turns.
 */
export function buildLeoActiveConversationContext(input: {
  sessionId: string | null;
  turns: LeoConversationTurn[];
  latestCards?: LeoResultCard[] | null;
  clientContext?: LeoConversationClientContext | null;
  nowMs?: number;
}): LeoActiveConversationContext {
  const nowMs = input.nowMs ?? Date.now();
  const activeTurns = input.turns
    .filter((t) => !t.archivedAt && Date.parse(t.expiresAt) > nowMs)
    .slice(-LEO_ACTIVE_CONTEXT_TURN_WINDOW);

  const base = emptyContext(input.sessionId);
  const latestLeo = [...activeTurns].reverse().find((t) => t.role === "LEO") ?? null;
  const latestAny = activeTurns[activeTurns.length - 1] ?? null;
  const fromTurn = focusFromTurn(latestLeo ?? latestAny);

  let ctx: LeoActiveConversationContext = {
    ...base,
    ...fromTurn,
    sessionId: input.sessionId,
    lastCardIds:
      fromTurn.lastCardIds && fromTurn.lastCardIds.length > 0
        ? fromTurn.lastCardIds
        : extractResultCardRefsFromAnswer(input.latestCards),
  };

  // Latest live cards refresh lastCardIds when present.
  if (input.latestCards?.length) {
    ctx = {
      ...ctx,
      lastCardIds: extractResultCardRefsFromAnswer(input.latestCards),
    };
    if (!ctx.focusCardId && input.latestCards.length === 1) {
      const only = input.latestCards[0];
      const refs = extractRefsFromResultCard(only);
      ctx = {
        ...ctx,
        focusCardId: only.cardId,
        focusEntityRef: refs.entityRef,
        focusThreadId: refs.threadId,
        focusMessageId: refs.messageId,
        focusEventId: refs.eventId,
        focusCommitmentId: refs.commitmentId,
        focusReceiptId: refs.receiptId,
      };
    }
  }

  // Explicit current selection outranks implicit focus.
  const selectedCardId = nonEmpty(input.clientContext?.selectedCardId ?? null);
  const selectedEntity = boundEntityRef(input.clientContext?.selectedEntityRef ?? null);
  if (selectedCardId || selectedEntity) {
    ctx = {
      ...ctx,
      focusCardId: selectedCardId ?? ctx.focusCardId,
      focusEntityRef: selectedEntity ?? ctx.focusEntityRef,
    };
    if (selectedEntity?.kind === "COMMITMENT") {
      ctx = { ...ctx, focusCommitmentId: selectedEntity.id };
    }
    if (selectedEntity?.kind === "EMAIL" || selectedEntity?.kind === "THREAD") {
      ctx = { ...ctx, focusThreadId: selectedEntity.id };
    }
    if (selectedEntity?.kind === "RECEIPT") {
      ctx = { ...ctx, focusReceiptId: selectedEntity.id };
    }
  }

  const visible = (input.clientContext?.visibleCardIds ?? [])
    .map((id) => nonEmpty(id))
    .filter((id): id is string => Boolean(id))
    .slice(0, 40);
  if (visible.length > 0 && ctx.lastCardIds.length === 0) {
    ctx = { ...ctx, lastCardIds: visible };
  }

  return { ...ctx, focus: toFocus(ctx) };
}

/** Safe session title from first question — no AI. */
export function deriveLeoSessionTitleFromQuestion(question: string): string {
  const cleaned = question.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "Conversation";
  return cleaned.length > 80 ? `${cleaned.slice(0, 79)}…` : cleaned;
}

/** Build bounded contextRefs for turn persistence — refs only. */
export function buildTurnContextRefs(input: {
  clientRequestId?: string | null;
  focus?: LeoConversationFocus | null;
  active?: LeoActiveConversationContext | null;
}): Record<string, unknown> {
  const refs: Record<string, unknown> = {};
  if (input.clientRequestId) refs.clientRequestId = input.clientRequestId.slice(0, 120);
  const focus = input.focus ?? input.active?.focus;
  if (focus?.cardId) refs.focusCardId = focus.cardId.slice(0, 120);
  if (focus?.threadId) refs.threadId = focus.threadId.slice(0, 200);
  if (focus?.messageId) refs.messageId = focus.messageId.slice(0, 200);
  if (focus?.eventId) refs.eventId = focus.eventId.slice(0, 200);
  if (focus?.commitmentId) refs.commitmentId = focus.commitmentId.slice(0, 200);
  if (focus?.receiptId) refs.receiptId = focus.receiptId.slice(0, 200);
  if (focus?.entityRef) {
    refs.entitySystem = focus.entityRef.system.slice(0, 64);
    refs.entityKind = focus.entityRef.kind.slice(0, 64);
    refs.entityId = focus.entityRef.id.slice(0, 200);
  }
  return refs;
}
