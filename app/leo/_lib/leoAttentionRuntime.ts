/**
 * LEO-14.5 attention runtime — pure source identity + disposition application.
 * ACK/DISMISS/SNOOZE never mutate canonical source truth.
 * Fail-open: if ack persistence is unavailable, show all canonical attention.
 */
import { isLeoAttentionAckSuppressing } from "@/app/leo/_lib/leoPersistenceSemantics";
import type {
  LeoAttentionAck,
  LeoAttentionAckDisposition,
  LeoAttentionBrief,
  LeoAttentionItem,
  LeoCommitment,
  LeoEmailResultCard,
  LeoCommitmentResultCard,
  LeoResultCard,
} from "@/app/leo/_lib/leoTypes";

export type LeoOwnerAttentionDispositionView =
  | "ACTIVE"
  | LeoAttentionAckDisposition;

export type LeoAttentionSourceIdentity = {
  sourceKind: string;
  sourceKey: string;
};

export function ackLookupKey(sourceKind: string, sourceKey: string): string {
  return `${sourceKind}::${sourceKey}`;
}

/** Stable identity for attention brief items (root-cause / group key). */
export function identityForAttentionItem(item: LeoAttentionItem): LeoAttentionSourceIdentity {
  return {
    sourceKind: "attention_item",
    sourceKey: item.id,
  };
}

/**
 * Email conversation identity: thread + latest message.
 * New inbound messageId → new key → may resurface after prior dismiss.
 */
export function identityForGmailCard(card: Pick<LeoEmailResultCard, "threadId" | "messageId">): LeoAttentionSourceIdentity {
  const thread = card.threadId?.trim() || "no-thread";
  const message = card.messageId?.trim() || "no-message";
  return {
    sourceKind: "gmail_thread",
    sourceKey: `${thread}:${message}`,
  };
}

/** Commitment attention identity — status stays on commitment record, not ACK. */
export function identityForCommitment(c: Pick<LeoCommitment, "id">): LeoAttentionSourceIdentity {
  return {
    sourceKind: "commitment",
    sourceKey: c.id,
  };
}

export function buildAckMap(acks: LeoAttentionAck[]): Map<string, LeoAttentionAck> {
  const map = new Map<string, LeoAttentionAck>();
  for (const ack of acks) {
    map.set(ackLookupKey(ack.sourceKind, ack.sourceKey), ack);
  }
  return map;
}

export function resolveOwnerDisposition(
  ack: LeoAttentionAck | null | undefined,
  nowMs: number,
): {
  view: LeoOwnerAttentionDispositionView;
  suppressing: boolean;
} {
  if (!ack) return { view: "ACTIVE", suppressing: false };
  const suppressing = isLeoAttentionAckSuppressing(ack, nowMs);
  if (ack.disposition === "SNOOZED" && !suppressing) {
    return { view: "ACTIVE", suppressing: false };
  }
  return { view: ack.disposition, suppressing };
}

export type LeoAttentionRuntimeBrief = LeoAttentionBrief & {
  visibleItems: LeoAttentionItem[];
  suppressedItems: LeoAttentionItem[];
  dispositionAvailability: "AVAILABLE" | "EMPTY" | "UNAVAILABLE";
  itemDispositions: Record<string, LeoOwnerAttentionDispositionView>;
};

/**
 * Apply owner dispositions AFTER canonical attention generation.
 * If ack DB unavailable → fail open (all items visible).
 */
export function applyOwnerDispositionsToAttentionBrief(input: {
  brief: LeoAttentionBrief;
  acks: LeoAttentionAck[];
  dispositionAvailability: "AVAILABLE" | "EMPTY" | "UNAVAILABLE";
  nowMs: number;
  /** When true, include acknowledged items in visible set (explicit ask). */
  includeAcknowledged?: boolean;
}): LeoAttentionRuntimeBrief {
  const itemDispositions: Record<string, LeoOwnerAttentionDispositionView> = {};
  const visibleItems: LeoAttentionItem[] = [];
  const suppressedItems: LeoAttentionItem[] = [];

  if (input.dispositionAvailability === "UNAVAILABLE") {
    for (const item of input.brief.items) {
      itemDispositions[item.id] = "ACTIVE";
      visibleItems.push(item);
    }
    return {
      ...input.brief,
      visibleItems,
      suppressedItems,
      dispositionAvailability: "UNAVAILABLE",
      itemDispositions,
      limitations: [
        ...input.brief.limitations,
        "LEO acknowledgement state is unavailable — showing canonical attention (fail-open).",
      ],
      actionableCount: visibleItems.filter((i) => i.level !== "INFORMATIONAL").length,
      informationalCount: visibleItems.filter((i) => i.level === "INFORMATIONAL").length,
    };
  }

  const map = buildAckMap(input.acks);
  for (const item of input.brief.items) {
    const id = identityForAttentionItem(item);
    const ack = map.get(ackLookupKey(id.sourceKind, id.sourceKey)) ?? null;
    const resolved = resolveOwnerDisposition(ack, input.nowMs);
    itemDispositions[item.id] = resolved.view;
    if (resolved.suppressing && !input.includeAcknowledged) {
      suppressedItems.push(item);
    } else {
      visibleItems.push(item);
    }
  }

  return {
    ...input.brief,
    items: input.brief.items,
    visibleItems,
    suppressedItems,
    dispositionAvailability: input.dispositionAvailability,
    itemDispositions,
    actionableCount: visibleItems.filter((i) => i.level !== "INFORMATIONAL").length,
    informationalCount: visibleItems.filter((i) => i.level === "INFORMATIONAL").length,
  };
}

export function decorateEmailCardsWithDispositions(input: {
  cards: LeoEmailResultCard[];
  acks: LeoAttentionAck[];
  dispositionAvailability: "AVAILABLE" | "EMPTY" | "UNAVAILABLE";
  nowMs: number;
}): LeoEmailResultCard[] {
  if (input.dispositionAvailability === "UNAVAILABLE") {
    return input.cards.map((c) => ({ ...c, ownerAttentionDisposition: "ACTIVE" as const }));
  }
  const map = buildAckMap(input.acks);
  return input.cards.map((card) => {
    const id = identityForGmailCard(card);
    const ack = map.get(ackLookupKey(id.sourceKind, id.sourceKey)) ?? null;
    const resolved = resolveOwnerDisposition(ack, input.nowMs);
    return {
      ...card,
      ownerAttentionDisposition: resolved.view,
    };
  });
}

export function decorateCommitmentCardsWithDispositions(input: {
  cards: LeoCommitmentResultCard[];
  acks: LeoAttentionAck[];
  dispositionAvailability: "AVAILABLE" | "EMPTY" | "UNAVAILABLE";
  nowMs: number;
}): LeoCommitmentResultCard[] {
  if (input.dispositionAvailability === "UNAVAILABLE") {
    return input.cards.map((c) => ({
      ...c,
      ownerAttentionDisposition: "ACTIVE" as const,
      // status unchanged
    }));
  }
  const map = buildAckMap(input.acks);
  return input.cards.map((card) => {
    const id = identityForCommitment({ id: card.commitmentId });
    const ack = map.get(ackLookupKey(id.sourceKind, id.sourceKey)) ?? null;
    const resolved = resolveOwnerDisposition(ack, input.nowMs);
    return {
      ...card,
      ownerAttentionDisposition: resolved.view,
      // Never mutate commitment.status from ACK.
      status: card.status,
    };
  });
}

export function decorateResultCardsWithDispositions(
  cards: LeoResultCard[],
  acks: LeoAttentionAck[],
  dispositionAvailability: "AVAILABLE" | "EMPTY" | "UNAVAILABLE",
  nowMs: number,
): LeoResultCard[] {
  return cards.map((card) => {
    if (card.kind === "EMAIL") {
      return decorateEmailCardsWithDispositions({
        cards: [card],
        acks,
        dispositionAvailability,
        nowMs,
      })[0];
    }
    if (card.kind === "COMMITMENT") {
      return decorateCommitmentCardsWithDispositions({
        cards: [card],
        acks,
        dispositionAvailability,
        nowMs,
      })[0];
    }
    return card;
  });
}

/** Exact internal LEO action allowlist for this gate. */
export const LEO_INTERNAL_ATTENTION_ACTION_ALLOWLIST = [
  "ACKNOWLEDGE",
  "DISMISS",
  "REMIND_LATER",
] as const;

export type LeoInternalAttentionActionType =
  (typeof LEO_INTERNAL_ATTENTION_ACTION_ALLOWLIST)[number];

export function isLeoInternalAttentionActionType(
  v: unknown,
): v is LeoInternalAttentionActionType {
  return (
    typeof v === "string" &&
    (LEO_INTERNAL_ATTENTION_ACTION_ALLOWLIST as readonly string[]).includes(v)
  );
}
