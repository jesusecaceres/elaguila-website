/**
 * Gate 01 — Staff Command Center read model.
 * Pure composition over the existing business-list payload (sales profile + current follow-up).
 * No new table, no extra domain fan-out (Advisor / Outcomes / Meetings / Creative / etc.).
 */
import type { BusinessSalesStatus, FollowUpStoredStatus } from "./salesWorkspaceLogic";

export type StaffConciergeHomeSource = {
  business: { id: string; displayName: string };
  salesStatus: BusinessSalesStatus;
  nextFollowUpDate: string | null;
  nextFollowUpStatus: FollowUpStoredStatus | null;
};

export type StaffConciergeAttentionReason = "overdue" | "due_today" | "waiting_on_owner" | "follow_up_due";

export type StaffConciergeAttentionItem = {
  businessId: string;
  displayName: string;
  reason: StaffConciergeAttentionReason;
  followUpDate: string | null;
};

export type StaffConciergeHome = {
  dueFollowUps: StaffConciergeAttentionItem[];
  overdueFollowUps: StaffConciergeAttentionItem[];
  attentionBusinesses: StaffConciergeAttentionItem[];
  recentBusinesses: { businessId: string; displayName: string }[];
};

const ATTENTION_LIMIT = 6;
const RECENT_LIMIT = 5;

function toItem(source: StaffConciergeHomeSource, reason: StaffConciergeAttentionReason): StaffConciergeAttentionItem {
  return {
    businessId: source.business.id,
    displayName: source.business.displayName,
    reason,
    followUpDate: source.nextFollowUpDate,
  };
}

export function emptyStaffConciergeHome(): StaffConciergeHome {
  return { dueFollowUps: [], overdueFollowUps: [], attentionBusinesses: [], recentBusinesses: [] };
}

/** Derives Today / Needs Attention from list rows already loaded for the workspace. */
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

  return { dueFollowUps, overdueFollowUps, attentionBusinesses: attention, recentBusinesses };
}
