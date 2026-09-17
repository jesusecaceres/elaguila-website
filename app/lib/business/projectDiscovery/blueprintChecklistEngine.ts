/**
 * Client Discovery & Project Blueprint Engine, Gate 7 — deterministic QA/Launch/Handoff checklist
 * engine (MD <qa_execution>, <qa_summary>, <launch_checklist_execution>, <handoff_execution>). Pure
 * functions only: generates checklist SNAPSHOTS from a frozen blueprint packet's own qaMatrix/
 * launchChecklist/handoffChecklist — never an independent, disconnected checklist (MD <core_law>:
 * "Do not build a second independent checklist disconnected from the Blueprint").
 */
export type CheckItemKind = "qa" | "launch" | "handoff";
export type CheckItemStatus = "not_checked" | "pending" | "pass" | "complete" | "fail" | "blocked" | "not_applicable";

export interface CheckItemSnapshot {
  kind: CheckItemKind;
  itemKey: string;
  category: string | null;
  labelEs: string;
  labelEn: string;
  releaseBlocking: boolean;
}

interface PacketQaRow {
  key: string;
  labelEs: string;
  labelEn: string;
  conditional: boolean;
}

interface PacketTextItem {
  key: string;
  textEs: string;
  textEn: string;
}

/**
 * Every QA row Gate 5/6 ever generates is a real, required check — neither "universal" nor
 * "conditional" (conditional only means "only generated when the relevant feature applies", not
 * "optional to pass") ever means non-blocking. A helpful/non-blocking QA concept does not exist in
 * the frozen qaMatrix today; if a future gate introduces one, it should flow through here as an
 * explicit field on PacketQaRow rather than being inferred.
 */
export function buildQaSnapshotFromPacket(qaMatrix: readonly PacketQaRow[]): CheckItemSnapshot[] {
  return qaMatrix.map((row) => ({
    kind: "qa",
    itemKey: row.key,
    category: row.conditional ? "conditional" : "universal",
    labelEs: row.labelEs,
    labelEn: row.labelEn,
    releaseBlocking: true,
  }));
}

/** Every generated launch-checklist item is release-blocking by construction — Gate 5/6 only ever emit an item here when it's genuinely relevant to this project. */
export function buildLaunchSnapshotFromPacket(launchChecklist: readonly PacketTextItem[]): CheckItemSnapshot[] {
  return launchChecklist.map((item) => ({
    kind: "launch",
    itemKey: item.key,
    category: null,
    labelEs: item.textEs,
    labelEn: item.textEn,
    releaseBlocking: true,
  }));
}

/**
 * Handoff items are NEVER release-blocking (MD <qa_and_release_separation>: "QA PASSED does NOT
 * mean CLIENT HANDOFF COMPLETE" — handoff is its own gate that happens at/after launch, not a
 * precondition for release readiness).
 */
export function buildHandoffSnapshotFromPacket(handoffChecklist: readonly PacketTextItem[]): CheckItemSnapshot[] {
  return handoffChecklist.map((item) => ({
    kind: "handoff",
    itemKey: item.key,
    category: null,
    labelEs: item.textEs,
    labelEn: item.textEn,
    releaseBlocking: false,
  }));
}

// ---------------------------------------------------------------------------------------------
// Summary (MD <qa_summary>) — never an arbitrary completion percentage as the only truth.
// ---------------------------------------------------------------------------------------------
export interface CheckItemRecord {
  itemKey: string;
  kind: CheckItemKind;
  status: CheckItemStatus;
  releaseBlocking: boolean;
}

export interface ChecklistSummary {
  total: number;
  pass: number;
  fail: number;
  blocked: number;
  notChecked: number;
  notApplicable: number;
  readyForRelease: boolean;
  blockingItems: readonly CheckItemRecord[];
}

function isResolvedPositive(status: CheckItemStatus): boolean {
  return status === "pass" || status === "complete";
}
function isUnresolved(status: CheckItemStatus): boolean {
  return status === "not_checked" || status === "pending";
}
function isBlockingFailure(status: CheckItemStatus): boolean {
  return status === "fail" || status === "blocked";
}

/**
 * Release-blocking is a hard server-side gate (MD <qa_guard>): NO if any release_blocking item is
 * FAIL, BLOCKED, or NOT_CHECKED/PENDING. Non-blocking (e.g. handoff) items never affect this.
 */
export function summarizeCheckItems(items: readonly CheckItemRecord[]): ChecklistSummary {
  let pass = 0, fail = 0, blocked = 0, notChecked = 0, notApplicable = 0;
  const blockingItems: CheckItemRecord[] = [];

  for (const item of items) {
    if (isResolvedPositive(item.status)) pass += 1;
    else if (item.status === "fail") fail += 1;
    else if (item.status === "blocked") blocked += 1;
    else if (item.status === "not_applicable") notApplicable += 1;
    else notChecked += 1;

    if (item.releaseBlocking && (isBlockingFailure(item.status) || isUnresolved(item.status))) {
      blockingItems.push(item);
    }
  }

  return {
    total: items.length,
    pass, fail, blocked, notChecked, notApplicable,
    // Gate 10.1 — an empty snapshot (checklist never generated at all) must never read as vacuously
    // "ready for release." This matches the handoff-complete route's own established guard
    // (`handoffItems.length === 0` is explicitly treated as pending, never as complete) — QA/launch
    // readiness now follows the identical rule rather than the two diverging.
    readyForRelease: items.length > 0 && blockingItems.length === 0,
    blockingItems,
  };
}
