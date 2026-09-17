"use client";

import { useState } from "react";

import { adminBtnSecondary } from "@/app/admin/_components/adminTheme";
import type { LeoExecutiveAction, LeoResultCard } from "@/app/leo/_lib/leoTypes";
import { isTrustedHttpUrl } from "@/app/leo/_lib/leoExecutiveActions";

const NAVIGATE_TYPES = new Set([
  "OPEN_GMAIL",
  "OPEN_CALENDAR",
  "OPEN_GITHUB",
  "OPEN_VERCEL",
  "OPEN_EXTERNAL",
  "OPEN_INTERNAL",
  "JOIN_MEETING",
  "CALL",
  "WHATSAPP",
  "EMAIL",
]);

const FOLLOWUP_TYPES = new Set(["SUMMARIZE", "SHOW_EVIDENCE", "INSPECT", "SHOW_TIMELINE"]);

const PREPARE_TYPES = new Set(["PREPARE_DRAFT", "PREPARE_FOLLOWUP", "CREATE_COMMITMENT"]);

const INTERNAL_TYPES = new Set(["ACKNOWLEDGE", "DISMISS", "REMIND_LATER"]);

function isUsableNavigateUrl(action: LeoExecutiveAction): boolean {
  if (!action.enabled) return false;
  if (action.governanceLevel === "RED" || action.governanceLevel === "NEVER") return false;
  if (action.executionType === "EXECUTE_EXTERNAL") return false;
  const url = action.targetRef.url?.trim();
  if (!url || !isTrustedHttpUrl(url)) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return true;
  } catch {
    return false;
  }
}

function followUpPrompt(action: LeoExecutiveAction, card: LeoResultCard): string {
  const label = card.title.slice(0, 80);
  switch (action.type) {
    case "SUMMARIZE":
      return `Summarize that${card.kind === "EMAIL" ? " email" : ""}: ${label}`;
    case "SHOW_EVIDENCE":
      return `Show evidence for that${card.kind === "COMMITMENT" ? " commitment" : ""}`;
    case "INSPECT":
      return `Inspect that: ${label}`;
    case "SHOW_TIMELINE":
      return `Show the timeline for that`;
    case "PREPARE_DRAFT":
      return `Prepare a draft reply for that email`;
    case "PREPARE_FOLLOWUP":
      return `Prepare a follow-up for that`;
    case "CREATE_COMMITMENT":
      return `Create a commitment from that`;
    default:
      return action.label;
  }
}

export function LeoActionBar({
  card,
  actions,
  pending,
  onAsk,
}: {
  card: LeoResultCard;
  actions: LeoExecutiveAction[];
  pending?: boolean;
  onAsk: (q: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);

  const visible = actions.filter((a) => a.governanceLevel !== "NEVER");
  if (visible.length === 0) return null;

  const primary = visible.slice(0, 3);
  const rest = visible.slice(3);
  const shown = moreOpen ? visible : primary;

  function effectiveEnabled(action: LeoExecutiveAction): { enabled: boolean; reason: string | null } {
    if (action.governanceLevel === "RED") {
      return { enabled: false, reason: "Approval required before this action can run." };
    }
    if (action.governanceLevel === "NEVER") {
      return { enabled: false, reason: "Blocked by governance." };
    }
    if (INTERNAL_TYPES.has(action.type)) {
      return {
        enabled: false,
        reason: "Internal attention actions aren’t available from this panel yet.",
      };
    }
    if (!action.enabled) {
      return { enabled: false, reason: action.disabledReason };
    }
    if (NAVIGATE_TYPES.has(action.type) && !isUsableNavigateUrl(action)) {
      return { enabled: false, reason: action.disabledReason ?? "Trusted link unavailable." };
    }
    return { enabled: true, reason: null };
  }

  function run(action: LeoExecutiveAction) {
    const gate = effectiveEnabled(action);
    if (!gate.enabled || pending) return;

    if (action.requiresConfirmation && confirmId !== action.actionId) {
      setConfirmId(action.actionId);
      return;
    }
    setConfirmId(null);

    if (NAVIGATE_TYPES.has(action.type) && isUsableNavigateUrl(action)) {
      window.open(action.targetRef.url!, "_blank", "noopener,noreferrer");
      return;
    }

    if (FOLLOWUP_TYPES.has(action.type) || PREPARE_TYPES.has(action.type)) {
      onAsk(followUpPrompt(action, card));
      return;
    }

    if (action.type === "COPY" && action.targetRef.id) {
      void navigator.clipboard?.writeText(action.targetRef.id);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex min-w-0 flex-wrap gap-2">
        {shown.map((action) => {
          const gate = effectiveEnabled(action);
          const confirming = confirmId === action.actionId;
          const label = confirming ? `Confirm ${action.label}?` : action.label;
          return (
            <button
              key={action.actionId}
              type="button"
              disabled={pending || !gate.enabled}
              title={gate.reason ?? undefined}
              aria-disabled={!gate.enabled}
              className={`${adminBtnSecondary} min-h-[44px] max-w-full px-3 text-xs disabled:cursor-not-allowed disabled:opacity-55`}
              onClick={() => run(action)}
            >
              <span className="break-words">{label}</span>
            </button>
          );
        })}
        {rest.length > 0 ? (
          <button
            type="button"
            className={`${adminBtnSecondary} min-h-[44px] px-3 text-xs`}
            onClick={() => setMoreOpen((v) => !v)}
          >
            {moreOpen ? "Less" : "More"}
          </button>
        ) : null}
      </div>
      {confirmId ? (
        <p className="text-[11px] text-[#5C5346]">
          Confirmation required. Tap the action again to continue, or choose another action.
        </p>
      ) : null}
      {shown.some((a) => !effectiveEnabled(a).enabled && INTERNAL_TYPES.has(a.type)) ? (
        <p className="text-[11px] text-[#5C5346]/85">
          Acknowledge / Dismiss / Remind later need a dedicated owner route — not wired in this panel yet.
        </p>
      ) : null}
    </div>
  );
}
