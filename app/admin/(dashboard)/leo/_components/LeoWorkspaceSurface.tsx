"use client";

import type { ReactNode } from "react";

import { adminCardBase } from "@/app/admin/_components/adminTheme";
import {
  getLeoWorkspaceDefinition,
  type LeoWorkspaceId,
} from "@/app/leo/_lib/leoWorkspaceModel";

import { useLeoWorkspaceController } from "./LeoWorkspaceController";

export type LeoWorkspaceSlots = {
  HOME: ReactNode;
  ATTENTION: ReactNode;
  CLIENTS: ReactNode;
  GOVERNED_ACTIONS: ReactNode;
  MEMORY: ReactNode;
  SELF_INTELLIGENCE: ReactNode;
  TECHNOLOGY: ReactNode;
  REPORTS: ReactNode;
};

function Placeholder({ workspace }: { workspace: LeoWorkspaceId }) {
  const def = getLeoWorkspaceDefinition(workspace);
  return (
    <section className={`${adminCardBase} min-w-0 p-4`} data-leo-workspace-placeholder={workspace}>
      <h3 className="text-sm font-bold text-[#1E1810]">{def.label}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#5C5346]">
        This workspace will surface conversation-backed evidence. There is no standalone {def.label}{" "}
        panel yet — ask LEO in the conversation. No inbox or calendar data is invented here.
      </p>
    </section>
  );
}

export function LeoWorkspaceSurface({ slots }: { slots: LeoWorkspaceSlots }) {
  const { activeWorkspace, goBack, historyLength } = useLeoWorkspaceController();
  const def = getLeoWorkspaceDefinition(activeWorkspace);

  let body: ReactNode;
  switch (activeWorkspace) {
    case "HOME":
      body = slots.HOME;
      break;
    case "ATTENTION":
      body = slots.ATTENTION;
      break;
    case "CLIENTS":
      body = slots.CLIENTS;
      break;
    case "GOVERNED_ACTIONS":
      body = slots.GOVERNED_ACTIONS;
      break;
    case "MEMORY":
      body = slots.MEMORY;
      break;
    case "SELF_INTELLIGENCE":
      body = slots.SELF_INTELLIGENCE;
      break;
    case "TECHNOLOGY":
      body = slots.TECHNOLOGY;
      break;
    case "REPORTS":
      body = slots.REPORTS;
      break;
    default:
      body = <Placeholder workspace={activeWorkspace} />;
  }

  return (
    <div
      id="leo-active-workspace"
      className="min-w-0"
      data-leo-active-workspace={activeWorkspace}
      data-leo-workspace-renderer={def.renderer}
    >
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs font-bold uppercase tracking-wide text-[#5C5346]">
          Workspace · {def.label}
        </p>
        {historyLength > 0 ? (
          <button
            type="button"
            onClick={() => goBack()}
            className="inline-flex min-h-[44px] min-w-[44px] items-center rounded-lg border border-[color:var(--lx-border)] bg-white px-3 text-xs font-semibold text-[#1E1810]"
            data-leo-workspace-back
          >
            Back
          </button>
        ) : null}
      </div>
      {body}
    </div>
  );
}
