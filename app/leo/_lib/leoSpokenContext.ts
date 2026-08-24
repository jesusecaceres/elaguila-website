/**
 * LEO-22B — Spoken session context (client).
 * Readable text is already owner-visible. No microphone audio storage.
 * No secrets, no raw provider payloads, no RED authority.
 */

import type { LeoConversationEntityRef, LeoResultCard } from "@/app/leo/_lib/leoTypes";
import { getLeoWorkspaceDefinition, type LeoWorkspaceId } from "@/app/leo/_lib/leoWorkspaceModel";

export type LeoSpokenVoicePhase = "idle" | "listening" | "speaking";

export type LeoAddressableSpokenItem = {
  index: number;
  cardId: string;
  label: string;
  spokenText: string;
  entityRef: LeoConversationEntityRef | null;
};

export type LeoSpokenSessionSnapshot = {
  workspaceId: LeoWorkspaceId;
  selectedCardId: string | null;
  selectedEntityRef: LeoConversationEntityRef | null;
  currentAnswerSpoken: string | null;
  currentAnswerDisplay: string | null;
  visibleItems: LeoAddressableSpokenItem[];
  lastSpokenText: string | null;
  speechActive: boolean;
  recognitionAvailable: boolean;
  synthesisAvailable: boolean;
};

export type LeoReadableContextResult =
  | { ok: true; text: string; source: "selected_item" | "numbered_item" | "current_answer" | "workspace_summary" }
  | { ok: false; reason: "nothing_readable" };

const MAX_SPOKEN = 360;

export function boundLeoSpokenOwnerText(raw: string | null | undefined): string | null {
  const t = (raw ?? "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;
  if (t.length <= MAX_SPOKEN) return t;
  return `${t.slice(0, MAX_SPOKEN - 1).trim()}…`;
}

export function leoWorkspaceSpokenSummary(workspaceId: LeoWorkspaceId): string {
  const def = getLeoWorkspaceDefinition(workspaceId);
  return `${def.label}. ${def.description}.`;
}

function entityRefFromResultCard(card: LeoResultCard): LeoConversationEntityRef | null {
  switch (card.kind) {
    case "EMAIL": {
      const id = (card.threadId || card.messageId).trim();
      if (!id) return null;
      return {
        system: card.sourceSystem,
        kind: "EMAIL",
        id,
        label: card.subject ?? card.title,
      };
    }
    case "CALENDAR": {
      const id = card.eventId.trim();
      if (!id) return null;
      return {
        system: card.sourceSystem,
        kind: "CALENDAR",
        id,
        label: card.title,
      };
    }
    case "CLIENT": {
      const id = card.entityRef.id?.trim();
      if (!id) return null;
      return {
        system: card.sourceSystem,
        kind: "CLIENT",
        id,
        label: card.displayName || card.title,
      };
    }
    case "PROJECT": {
      const id = (card.deploymentId || card.commitSha || card.repository || "").trim();
      if (!id) return null;
      return {
        system: card.sourceSystem,
        kind: "PROJECT",
        id,
        label: card.projectName || card.title,
      };
    }
    case "COMMITMENT": {
      const id = card.commitmentId.trim();
      if (!id) return null;
      return {
        system: card.sourceSystem,
        kind: "COMMITMENT",
        id,
        label: card.title,
      };
    }
    case "PREPARED_ACTION": {
      const id = card.preparationId.trim();
      if (!id) return null;
      return {
        system: card.sourceSystem,
        kind: "PREPARED_ACTION",
        id,
        label: card.title,
      };
    }
    case "BRIEF_SECTION": {
      const id = card.sectionKey.trim();
      if (!id) return null;
      return {
        system: card.sourceSystem,
        kind: "BRIEF_SECTION",
        id,
        label: card.title,
      };
    }
    default:
      return null;
  }
}

export function leoResultCardsToAddressableItems(
  cards: readonly LeoResultCard[] | null | undefined,
): LeoAddressableSpokenItem[] {
  if (!cards?.length) return [];
  return cards.slice(0, 8).map((card, i) => ({
    index: i + 1,
    cardId: card.cardId,
    label: (card.title || card.subtitle || `Item ${i + 1}`).slice(0, 120),
    spokenText:
      boundLeoSpokenOwnerText(card.spokenSummary || card.title || card.subtitle) || `Item ${i + 1}.`,
    entityRef: entityRefFromResultCard(card),
  }));
}

export function resolveLeoVisibleItemByNumber(
  items: readonly LeoAddressableSpokenItem[],
  index: number,
): LeoAddressableSpokenItem | null {
  if (!Number.isInteger(index) || index < 1) return null;
  return items.find((item) => item.index === index) ?? null;
}

/**
 * Deterministic read target:
 * selected item → numbered item (if provided) → current answer → workspace summary.
 */
export function resolveLeoReadableContext(
  snapshot: Pick<
    LeoSpokenSessionSnapshot,
    "selectedCardId" | "currentAnswerSpoken" | "currentAnswerDisplay" | "visibleItems" | "workspaceId"
  >,
  numberedIndex?: number,
): LeoReadableContextResult {
  if (typeof numberedIndex === "number") {
    const item = resolveLeoVisibleItemByNumber(snapshot.visibleItems, numberedIndex);
    if (!item) return { ok: false, reason: "nothing_readable" };
    return { ok: true, text: item.spokenText, source: "numbered_item" };
  }

  if (snapshot.selectedCardId) {
    const selected = snapshot.visibleItems.find((item) => item.cardId === snapshot.selectedCardId);
    if (selected) return { ok: true, text: selected.spokenText, source: "selected_item" };
  }

  const answer = boundLeoSpokenOwnerText(snapshot.currentAnswerSpoken || snapshot.currentAnswerDisplay);
  if (answer) return { ok: true, text: answer, source: "current_answer" };

  const workspace = boundLeoSpokenOwnerText(leoWorkspaceSpokenSummary(snapshot.workspaceId));
  if (workspace) return { ok: true, text: workspace, source: "workspace_summary" };

  return { ok: false, reason: "nothing_readable" };
}

export const LEO_VISIBLE_ITEM_MISSING =
  "That number isn’t on screen. I can only open items that are currently visible.";

export const LEO_NOTHING_READABLE =
  "There’s nothing on screen I can read yet. Ask a question first, or open a visible item.";

export const LEO_BARGE_IN_LIMITATION =
  "While LEO is speaking, tap Stop. This browser cannot reliably interrupt speech with the microphone.";
