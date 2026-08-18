/**
 * LEO-8 Watcher Registry — centralized supported on-demand watchers.
 * No dynamic plugins. No client registration. Execution always FALSE.
 */
import type { LeoPreparationKind, LeoWatcherKind } from "@/app/leo/_lib/leoTypes";

export type LeoWatcherRegistryEntry = {
  kind: LeoWatcherKind;
  description: string;
  evidenceSource: string;
  supported: true;
  ownerOnly: true;
  preparationTypesAllowed: readonly LeoPreparationKind[];
  executionAllowed: false;
  limitations: readonly string[];
};

export const LEO_WATCHER_REGISTRY: Record<LeoWatcherKind, LeoWatcherRegistryEntry> = {
  CLIENT_CARE: {
    kind: "CLIENT_CARE",
    description: "Evaluate current Client Care signals (needs-reply, follow-up, support, stale).",
    evidenceSource: "leoClientCareService / leoClientCareWatcher",
    supported: true,
    ownerOnly: true,
    preparationTypesAllowed: ["FOLLOW_UP_DRAFT", "CLIENT_CARE_PLAN", "INTERNAL_TASK_DRAFT"],
    executionAllowed: false,
    limitations: [
      "On-demand only — not a background monitor.",
      "Reuses Client Care v0 evidence; does not invent SLAs.",
    ],
  },
  ATTENTION: {
    kind: "ATTENTION",
    description: "Evaluate current executive Attention brief items.",
    evidenceSource: "leoAttentionService / leoAttentionEngine",
    supported: true,
    ownerOnly: true,
    preparationTypesAllowed: ["REVIEW_PLAN", "MEETING_BRIEF", "INTERNAL_TASK_DRAFT"],
    executionAllowed: false,
    limitations: [
      "On-demand only — not real-time monitoring.",
      "Reuses Attention Engine ranking; does not invent CRITICAL.",
    ],
  },
  FOLLOW_UP: {
    kind: "FOLLOW_UP",
    description: "Evaluate explicit follow-up due/overdue Client Care signals only.",
    evidenceSource: "leoClientCareService (FOLLOW_UP_DUE / FOLLOW_UP_OVERDUE)",
    supported: true,
    ownerOnly: true,
    preparationTypesAllowed: ["FOLLOW_UP_DRAFT", "CLIENT_CARE_PLAN"],
    executionAllowed: false,
    limitations: [
      "Only explicit follow_up_at evidence — not heuristic stale alone.",
      "On-demand only.",
    ],
  },
  DECISION_REVIEW: {
    kind: "DECISION_REVIEW",
    description: "Review an explicit decision context via Decision Engine.",
    evidenceSource: "leoDecisionEngine (requires explicit decisionContext)",
    supported: true,
    ownerOnly: true,
    preparationTypesAllowed: ["DECISION_BRIEF", "MEETING_BRIEF", "INTERNAL_TASK_DRAFT"],
    executionAllowed: false,
    limitations: ["Requires explicit decisionContext — no invented decisions."],
  },
  MEMORY_CONTRADICTION: {
    kind: "MEMORY_CONTRADICTION",
    description: "Surface bounded Living Book records that already declare contradictions.",
    evidenceSource: "Living Book records with non-empty contradictsIds",
    supported: true,
    ownerOnly: true,
    preparationTypesAllowed: ["MEETING_BRIEF", "DECISION_BRIEF", "INTERNAL_TASK_DRAFT"],
    executionAllowed: false,
    limitations: [
      "Only records that already link contradictsIds — does not invent contradictions.",
      "Bounded recent/subject reads only.",
    ],
  },
};

export function isLeoWatcherKind(v: unknown): v is LeoWatcherKind {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(LEO_WATCHER_REGISTRY, v);
}

export function getLeoWatcherEntry(kind: LeoWatcherKind): LeoWatcherRegistryEntry {
  return LEO_WATCHER_REGISTRY[kind];
}

export function listSupportedLeoWatchers(): LeoWatcherRegistryEntry[] {
  return Object.values(LEO_WATCHER_REGISTRY);
}
