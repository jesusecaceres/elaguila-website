"use client";

import { LeoAdminWayfinding } from "./LeoAdminWayfinding";
import { LeoConversationPanel } from "./LeoConversationPanel";
import { useLeoWorkspaceController } from "./LeoWorkspaceController";
import { LeoWorkspaceSurface, type LeoWorkspaceSlots } from "./LeoWorkspaceSurface";

/**
 * LEO-22A conversation-first operating shell.
 * Cold start: conversation is the visual focus.
 * Active: conversation stays live; workspace presents supporting evidence.
 */
export function LeoOperatingShell({ slots }: { slots: LeoWorkspaceSlots }) {
  const { conversationActive } = useLeoWorkspaceController();
  const coldStart = !conversationActive;

  return (
    <div
      className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-3 sm:gap-4"
      data-leo-operating-shell
      data-leo-cold-start={coldStart ? "true" : "false"}
      data-leo-conversation-first="true"
    >
      <header className="min-w-0 border-b border-[color:var(--lx-border)]/40 pb-2">
        <LeoAdminWayfinding />
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="text-xl font-bold tracking-tight text-[#1E1810] sm:text-2xl">LEO</h1>
          <p className="truncate text-xs font-semibold text-[#5C5346] sm:text-sm">
            Leonix Executive Operating Intelligence
          </p>
        </div>
      </header>

      <div
        className={
          coldStart
            ? "flex min-w-0 flex-col gap-3"
            : "flex min-w-0 flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-start lg:gap-5"
        }
      >
        <div
          id="leo-conversation-shell"
          className="min-w-0 lg:sticky lg:top-3"
          data-leo-conversation-region
        >
          <LeoConversationPanel coldStart={coldStart} />
        </div>

        <div
          className={
            coldStart
              ? "sr-only lg:not-sr-only lg:block lg:min-w-0 lg:opacity-70"
              : "min-w-0"
          }
          data-leo-workspace-region
          hidden={false}
        >
          <LeoWorkspaceSurface slots={slots} />
        </div>
      </div>
    </div>
  );
}
