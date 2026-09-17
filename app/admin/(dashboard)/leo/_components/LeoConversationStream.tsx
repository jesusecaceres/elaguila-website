"use client";

import { useEffect, useRef } from "react";

import type { LeoConversationEntityRef, LeoResultCard } from "@/app/leo/_lib/leoTypes";

import { LeoConversationTurnView, type LeoStreamTurn } from "./LeoConversationTurn";

export function LeoConversationStream({
  turns,
  pending,
  selectedCardId,
  sessionId,
  activeWorkspace,
  onAsk,
  onSelectCard,
  onRetryUser,
}: {
  turns: LeoStreamTurn[];
  pending?: boolean;
  selectedCardId?: string | null;
  sessionId?: string | null;
  activeWorkspace?: string | null;
  onAsk: (q: string) => void;
  onSelectCard: (card: LeoResultCard, entityRef: LeoConversationEntityRef) => void;
  onRetryUser?: (localId: string) => void;
}) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const latestLeoId = [...turns].reverse().find((t) => t.role === "LEO")?.localId ?? null;

  useEffect(() => {
    const last = turns[turns.length - 1];
    if (!last || last.role !== "LEO") return;
    // Gentle scroll only when a new LEO turn arrives at the end.
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns.length, turns[turns.length - 1]?.localId]);

  if (turns.length === 0) return null;

  return (
    <div className="min-w-0 space-y-4" aria-live="polite" data-conversation-stream>
      {turns.map((turn, idx) => {
        const priorUser = [...turns.slice(0, idx)].reverse().find((t) => t.role === "USER");
        return (
        <LeoConversationTurnView
          key={turn.localId}
          turn={turn}
          isLatestLeo={turn.localId === latestLeoId}
          selectedCardId={selectedCardId}
          sessionId={sessionId}
          userTurnId={priorUser?.turnId ?? null}
          requestSnapshot={priorUser?.boundedText ?? null}
          activeWorkspace={activeWorkspace}
          pending={pending}
          onAsk={onAsk}
          onSelectCard={onSelectCard}
          onRetry={
            turn.role === "USER" && turn.error && onRetryUser
              ? () => onRetryUser(turn.localId)
              : undefined
          }
        />
        );
      })}
      {pending ? (
        <p className="text-sm font-medium text-[#5C5346]" aria-live="polite">
          LEO is reviewing the evidence…
        </p>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}
