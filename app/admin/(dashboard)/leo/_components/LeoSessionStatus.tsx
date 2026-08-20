"use client";

import type { LeoConversationPersistenceState } from "@/app/leo/_lib/leoTypes";

export function LeoSessionStatus({
  persistenceState,
  restoring,
  historyWarning,
  handsFreeLocalOnly,
}: {
  persistenceState: LeoConversationPersistenceState | null;
  restoring?: boolean;
  historyWarning?: string | null;
  handsFreeLocalOnly?: boolean;
}) {
  if (restoring) {
    return (
      <p className="text-[11px] text-[#5C5346]" aria-live="polite">
        Restoring conversation…
      </p>
    );
  }

  if (historyWarning) {
    return (
      <p className="text-[11px] text-amber-900" role="status">
        {historyWarning}
      </p>
    );
  }

  if (handsFreeLocalOnly) {
    return (
      <p className="text-[11px] text-amber-900" role="status">
        Hands-Free is on this page only — mode wasn’t saved.
      </p>
    );
  }

  if (persistenceState === "NOT_PERSISTED_UNAVAILABLE") {
    return (
      <p className="text-[11px] text-amber-900" role="status">
        Conversation history isn’t being saved right now.
      </p>
    );
  }

  if (persistenceState === "FAILED") {
    return (
      <p className="text-[11px] text-amber-900" role="status">
        LEO answered, but this turn could not be saved.
      </p>
    );
  }

  return null;
}
