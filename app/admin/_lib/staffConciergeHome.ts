/**
 * Gate 01 — Staff Command Center read model.
 * Pure composition over already-loaded data — no new table, no extra domain fan-out here.
 * Gate 1 (systemic repair) extends this with missing-information composition (still pure, still
 * derived from the same already-loaded workspace list) and a generic cross-domain merge helper
 * used to build one "Needs Attention" list out of several already-bounded repository reads
 * (follow-ups, commitments, proposals, creative, meetings, Advisor). The merge helper is pure
 * too — every underlying read stays a separate, existing, bounded query; this file only combines
 * their results for display.
 */
import type { BusinessSalesStatus, FollowUpStoredStatus } from "./salesWorkspaceLogic";

export type StaffConciergeHomeSource = {
  business: { id: string; displayName: string };
  salesStatus: BusinessSalesStatus;
  nextFollowUpDate: string | null;
  nextFollowUpStatus: FollowUpStoredStatus | null;
  // Optional: present when the caller passes the full workspace list item (BusinessWorkspaceListItem).
  // Absent in minimal/test sources — missing-information composition simply yields nothing for them.
  hasPhone?: boolean;
  hasEmail?: boolean;
  hasWebsite?: boolean;
  completenessMet?: number;
  completenessTotal?: number;
};

export type StaffConciergeAttentionReason = "overdue" | "due_today" | "waiting_on_owner" | "follow_up_due";

export const STAFF_ATTENTION_REASON_LABELS: Record<StaffConciergeAttentionReason, string> = {
  overdue: "Overdue follow-up",
  due_today: "Follow-up due today",
  waiting_on_owner: "Waiting on owner",
  follow_up_due: "Follow-up due",
};

export type StaffConciergeAttentionItem = {
  businessId: string;
  displayName: string;
  reason: StaffConciergeAttentionReason;
  followUpDate: string | null;
};

export type StaffConciergeMissingInfoItem = {
  businessId: string;
  displayName: string;
  missingLabel: string;
  completenessMet: number;
  completenessTotal: number;
};

export type StaffConciergeHome = {
  dueFollowUps: StaffConciergeAttentionItem[];
  overdueFollowUps: StaffConciergeAttentionItem[];
  attentionBusinesses: StaffConciergeAttentionItem[];
  recentBusinesses: { businessId: string; displayName: string }[];
  missingInformation: StaffConciergeMissingInfoItem[];
};

const ATTENTION_LIMIT = 6;
const RECENT_LIMIT = 5;
const MISSING_INFO_LIMIT = 5;

function toItem(source: StaffConciergeHomeSource, reason: StaffConciergeAttentionReason): StaffConciergeAttentionItem {
  return {
    businessId: source.business.id,
    displayName: source.business.displayName,
    reason,
    followUpDate: source.nextFollowUpDate,
  };
}

function missingInfoLabel(source: StaffConciergeHomeSource): string | null {
  if (source.completenessTotal === undefined || source.completenessMet === undefined) return null;
  if (source.completenessMet >= source.completenessTotal) return null;
  if (source.hasPhone === false) return "Missing phone";
  if (source.hasEmail === false) return "Missing email";
  if (source.hasWebsite === false) return "Missing website";
  return `${source.completenessMet}/${source.completenessTotal} complete`;
}

export function emptyStaffConciergeHome(): StaffConciergeHome {
  return { dueFollowUps: [], overdueFollowUps: [], attentionBusinesses: [], recentBusinesses: [], missingInformation: [] };
}

/** Derives Today / Needs Attention / Missing Information from list rows already loaded for the workspace. */
export function composeStaffConciergeHome(items: readonly StaffConciergeHomeSource[]): StaffConciergeHome {
  const dueFollowUps: StaffConciergeAttentionItem[] = [];
  const overdueFollowUps: StaffConciergeAttentionItem[] = [];
  const attention: StaffConciergeAttentionItem[] = [];
  const seenAttention = new Set<string>();

  function pushAttention(item: StaffConciergeAttentionItem) {
    if (seenAttention.has(item.businessId) || attention.length >= ATTENTION_LIMIT) return;
    seenAttention.add(item.businessId);
    attention.push(item);
  }

  for (const source of items) {
    if (source.nextFollowUpStatus === "overdue") {
      const row = toItem(source, "overdue");
      overdueFollowUps.push(row);
      pushAttention(row);
    } else if (source.nextFollowUpStatus === "due_today") {
      const row = toItem(source, "due_today");
      dueFollowUps.push(row);
      pushAttention(row);
    }
  }

  for (const source of items) {
    if (source.nextFollowUpStatus === "waiting_on_owner" || source.salesStatus === "waiting_on_owner") {
      pushAttention(toItem(source, "waiting_on_owner"));
    } else if (source.salesStatus === "follow_up_due") {
      pushAttention(toItem(source, "follow_up_due"));
    }
  }

  const recentBusinesses = items.slice(0, RECENT_LIMIT).map((source) => ({
    businessId: source.business.id,
    displayName: source.business.displayName,
  }));

  const missingInformation: StaffConciergeMissingInfoItem[] = [];
  const byCompleteness = [...items].sort((a, b) => (a.completenessMet ?? Number.MAX_SAFE_INTEGER) - (b.completenessMet ?? Number.MAX_SAFE_INTEGER));
  for (const source of byCompleteness) {
    if (missingInformation.length >= MISSING_INFO_LIMIT) break;
    const label = missingInfoLabel(source);
    if (!label) continue;
    missingInformation.push({
      businessId: source.business.id,
      displayName: source.business.displayName,
      missingLabel: label,
      completenessMet: source.completenessMet ?? 0,
      completenessTotal: source.completenessTotal ?? 0,
    });
  }

  return { dueFollowUps, overdueFollowUps, attentionBusinesses: attention, recentBusinesses, missingInformation };
}

// ---------------------------------------------------------------------------
// Gate 1 — cross-domain Needs Attention merge.
// Each domain (follow-ups, commitments, proposals, creative, meetings, Advisor-only signals,
// missing information) already has its own bounded, existing repository read. This merge only
// combines their already-fetched results into one capped, de-duplicated, per-business list — it
// issues no query of its own.
// ---------------------------------------------------------------------------

export type StaffConciergeAttentionEntry = {
  businessId: string;
  displayName: string;
  reasonLabel: string;
  detailText: string | null;
  href: string;
};

const NEEDS_ATTENTION_LIST_LIMIT = 8;

/**
 * Merges attention reasons from every domain into one capped list, one row per business — the
 * business's highest-priority reason wins (pass buckets in priority order; the first bucket a
 * business appears in is the one shown).
 */
export function composeNeedsAttentionList(
  buckets: readonly (readonly StaffConciergeAttentionEntry[])[],
): StaffConciergeAttentionEntry[] {
  const seen = new Set<string>();
  const merged: StaffConciergeAttentionEntry[] = [];
  for (const bucket of buckets) {
    for (const entry of bucket) {
      if (merged.length >= NEEDS_ATTENTION_LIST_LIMIT) return merged;
      if (seen.has(entry.businessId)) continue;
      seen.add(entry.businessId);
      merged.push(entry);
    }
  }
  return merged;
}
