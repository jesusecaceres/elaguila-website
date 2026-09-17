/**
 * Client Discovery & Project Blueprint Engine, Gate 10.2 — pure Launch Package roll-up computation
 * (MD §7, §19 <multi_project_discovery>, Gate 10.2 <phase_10>). Takes already-gathered sibling
 * intent/blueprint state (assembled by launchPackageRollupAssembler.ts from the EXISTING
 * intents/blueprint repositories — never a second dependency/status system) and produces a
 * roll-up summary. No database, no network — matches every other pure engine file in this domain.
 */
export type LaunchPackageChildState = "no_intent_yet" | "discovery_in_progress" | "blueprint_in_review" | "approved_for_build" | "released" | "handoff_complete";

export interface LaunchPackageChildSummary {
  intentId: string;
  projectType: string;
  title: string;
  state: LaunchPackageChildState;
  blockingReasonEs: string | null;
  blockingReasonEn: string | null;
}

export interface LaunchPackageRollup {
  totalComponents: number;
  readyOrDoneCount: number;
  blockedCount: number;
  inProgressCount: number;
  children: readonly LaunchPackageChildSummary[];
  allComponentsHandedOff: boolean;
}

const DONE_STATES: readonly LaunchPackageChildState[] = ["approved_for_build", "released", "handoff_complete"];

export function buildLaunchPackageRollup(children: readonly LaunchPackageChildSummary[]): LaunchPackageRollup {
  const readyOrDoneCount = children.filter((c) => DONE_STATES.includes(c.state)).length;
  const blockedCount = children.filter((c) => c.state === "no_intent_yet" || Boolean(c.blockingReasonEs)).length;
  const inProgressCount = children.length - readyOrDoneCount - blockedCount;

  return {
    totalComponents: children.length,
    readyOrDoneCount,
    blockedCount,
    inProgressCount,
    children,
    // Every real component intent has reached handoff_complete — the only truthful "package done" signal.
    allComponentsHandedOff: children.length > 0 && children.every((c) => c.state === "handoff_complete"),
  };
}
