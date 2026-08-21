/**
 * LEO-9B owner-facing presentation adapters.
 * Presentation only — does not alter scoring, care truth, or storage.
 */

import type { LeoAttentionItem, LeoClientCareSignal, LeoClientCareSignalKind } from "@/app/leo/_lib/leoTypes";

const SOURCE_LABELS: Record<string, string> = {
  advertising: "Advertising inquiry",
  promotionalProducts: "Promotional products inquiry",
  launch: "Launch inquiry",
  mediaKit: "Media kit inquiry",
  newsletter: "Newsletter inquiry",
  website: "Website inquiry",
  generic: "General inquiry",
};

const KIND_LABELS: Record<LeoClientCareSignalKind, string> = {
  NEEDS_REPLY: "Needs reply",
  FOLLOW_UP_DUE: "Follow-up due",
  FOLLOW_UP_OVERDUE: "Follow-up overdue",
  WAITING_ON_CUSTOMER: "Waiting on customer",
  OPEN_SUPPORT: "Open support",
  STALE_ACTIVE_LEAD: "Stale active lead",
  INFORMATIONAL_LIMITATION: "Limitation note",
  UNKNOWN: "Unknown care signal",
};

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** Split camelCase / snake_case into readable owner words when no map entry exists. */
export function humanizeInternalLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "Unknown";
  if (SOURCE_LABELS[trimmed]) return SOURCE_LABELS[trimmed];
  if (trimmed.includes("_")) {
    return trimmed
      .split("_")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  if (/^[a-z]+(?:[A-Z][a-z0-9]*)+$/.test(trimmed)) {
    const spaced = trimmed.replace(/([A-Z])/g, " $1").trim();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }
  return trimmed;
}

export function presentCareKind(kind: LeoClientCareSignalKind): string {
  return KIND_LABELS[kind] ?? humanizeInternalLabel(kind);
}

export function presentCareSourceLabel(raw: string | null | undefined): string {
  if (!raw?.trim()) return "Launch inquiry";
  const key = raw.trim();
  if (SOURCE_LABELS[key]) return SOURCE_LABELS[key];
  const human = humanizeInternalLabel(key);
  if (/inquiry$/i.test(human)) return human;
  return `${human} inquiry`;
}

/** Strip common internal tokens from owner-visible prose without inventing facts. */
export function scrubOwnerFacingText(text: string): string {
  return text
    .replace(/\bLEO-[0-9]+[A-Z]?\b/g, "LEO")
    .replace(/\bTop-N\b/gi, "priority")
    .replace(/\bclient-care signal\(s\)\b/gi, "client-care items")
    .replace(/\bclient-care signals?\b/gi, "client-care items")
    .replace(/\bexecutionAllowed\s*=\s*\w+/gi, "")
    .replace(/\bpreparationAllowed\s*=\s*\w+/gi, "")
    .replace(/\blisting_reports\b/gi, "listing reports")
    .replace(/\breview_queue_preview\b/gi, "review queue")
    .replace(/\breview-queue preview\b/gi, "review queue")
    .replace(/\bneeds_reply\b/gi, "needs reply")
    .replace(/\bflagSourceKind\b/gi, "flag reason")
    .replace(/\bpromotionalProducts\b/g, "promotional products")
    .replace(/\bwaiting_on_client\b/gi, "waiting on customer")
    .replace(/\bfollow_up_at\b/gi, "follow-up date")
    .replace(/\blast_contacted_at\b/gi, "last contact")
    .replace(/\bcreated_at\b/gi, "created date")
    .replace(/\bstatus pending\b/gi, "pending status")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function presentAttentionTitle(raw: string): string {
  const t = raw.trim();
  const exact: Record<string, string> = {
    "Pending listing reports": "Listing reports waiting for review",
    "Pending / flagged listings (generic)": "Listings awaiting review",
    "Review queue preview": "Listings waiting for review",
    "Leads needing reply": "Leads needing a reply",
    "Listings expiring soon": "Listings expiring soon",
    "Expired listings (preview sample)": "Expired listings (sample)",
    "Users needing help (proxy)": "Users who may need help",
    "Monetization not in this adapter": "Monetization data not in this view",
  };
  if (exact[t]) return exact[t];

  const queueMatch = /^Review queue items \((.+)\)$/i.exec(t);
  if (queueMatch) {
    const flag = queueMatch[1].trim();
    if (/^unknown$/i.test(flag) || flag === "generic") {
      return "Listings waiting for review";
    }
    return `Listings waiting for review (${humanizeInternalLabel(flag)})`;
  }

  return scrubOwnerFacingText(t);
}

export function presentAttentionSummary(raw: string, affectedCount: number | null): string {
  const s = raw.trim();

  if (/listing_reports with status pending/i.test(s)) {
    if (affectedCount != null) {
      return `${affectedCount} ${plural(affectedCount, "listing report is", "listing reports are")} waiting for review.`;
    }
    return "Listing reports are waiting for review.";
  }

  if (/review-queue preview rows share flag source/i.test(s)) {
    const countMatch = /(\d+)\s+review-queue/i.exec(s);
    const n = countMatch ? Number(countMatch[1]) : affectedCount;
    const flagMatch = /flag source ["']([^"']+)["']/i.exec(s);
    const flag = flagMatch?.[1] ?? "unknown";
    if (/^unknown$/i.test(flag) || flag === "generic") {
      return n != null
        ? `${n} ${plural(n, "listing needs", "listings need")} review, but the original flag reason is unavailable.`
        : "Listings need review, but the original flag reason is unavailable.";
    }
    return n != null
      ? `${n} ${plural(n, "listing needs", "listings need")} review (flag: ${humanizeInternalLabel(flag)}).`
      : `Listings need review (flag: ${humanizeInternalLabel(flag)}).`;
  }

  if (/Count of listings with status pending or flagged/i.test(s)) {
    if (affectedCount != null) {
      return `${affectedCount} ${plural(affectedCount, "listing is", "listings are")} currently pending or flagged for review.`;
    }
    return "Listings are currently pending or flagged for review.";
  }

  if (/Launch leads in new or needs_reply status/i.test(s)) {
    if (affectedCount != null) {
      return `${affectedCount} ${plural(affectedCount, "lead needs", "leads need")} a reply.`;
    }
    return "Launch leads need a reply.";
  }

  if (/^unknown$/i.test(s)) return "Reason unavailable.";
  if (/unavailable/i.test(s) && s.length < 40) return "Data currently unavailable.";

  return scrubOwnerFacingText(s);
}

export function presentAttentionItem(item: LeoAttentionItem): {
  title: string;
  summary: string;
  limitationNote: string | null;
} {
  return {
    title: presentAttentionTitle(item.title),
    summary: presentAttentionSummary(item.summary, item.affectedCount),
    limitationNote: item.limitationNote ? scrubOwnerFacingText(item.limitationNote) : null,
  };
}

export function presentCareTitle(signal: LeoClientCareSignal): string {
  const kind = presentCareKind(signal.kind);
  // Titles often look like "Needs reply — advertising"
  const dash = /\s[—–-]\s/.exec(signal.title);
  if (dash) {
    const after = signal.title.slice(dash.index! + dash[0].length).trim();
    return `${kind} — ${presentCareSourceLabel(after)}`;
  }
  return scrubOwnerFacingText(signal.title);
}

export function presentCareSummary(signal: LeoClientCareSignal): string {
  let text = scrubOwnerFacingText(signal.summary);
  text = text
    .replace(/Launch lead status is new or needs reply \(canonical Admin dashboard rule\)\./i, "This lead is marked as needing a reply.")
    .replace(/Active launch lead has follow-up date in the past \(overdue by ~(\d+) day\(s\)\)\./i, "Follow-up is overdue by about $1 day(s).")
    .replace(
      /Active launch lead has follow-up date within the LEO \d+h operational due window\./i,
      "Follow-up is due soon.",
    )
    .replace(
      /HEURISTIC: active lead idle ≥ (\d+) days since last contact or created date\./i,
      "Heuristic: this active lead has been idle for about $1 days.",
    )
    .replace(/Support ticket status is ([^.]+)\. No canonical due date\/SLA exists on support_tickets\./i, "Support ticket is $1. No SLA due date is recorded.");
  return text;
}

export function presentCareContextLine(signal: LeoClientCareSignal): string | null {
  const bits: string[] = [];
  if (signal.overdueByDays != null && signal.overdueByDays > 0) {
    bits.push(`Overdue ~${Math.floor(signal.overdueByDays)}d`);
  } else if (signal.followUpAt) {
    bits.push(`Due ${new Date(signal.followUpAt).toLocaleDateString()}`);
  } else if (signal.ageDays != null) {
    bits.push(`Age ~${Math.floor(signal.ageDays)}d`);
  }
  if (signal.evidence) {
    const ev = scrubOwnerFacingText(signal.evidence);
    // Keep short evidence; drop raw status dumps if too technical
    if (!/canonical status ∈/i.test(ev) && ev.length < 120) {
      bits.push(ev);
    }
  }
  return bits.length ? bits.join(" · ") : null;
}

/** Explicit signals first; then kind priority; stable key. */
export function sortCareSignalsForOwner(signals: LeoClientCareSignal[]): LeoClientCareSignal[] {
  const kindRank: Record<string, number> = {
    FOLLOW_UP_OVERDUE: 0,
    NEEDS_REPLY: 1,
    FOLLOW_UP_DUE: 2,
    OPEN_SUPPORT: 3,
    WAITING_ON_CUSTOMER: 4,
    STALE_ACTIVE_LEAD: 5,
    INFORMATIONAL_LIMITATION: 6,
    UNKNOWN: 7,
  };
  return [...signals].sort((a, b) => {
    if (a.isHeuristic !== b.isHeuristic) return a.isHeuristic ? 1 : -1;
    const ka = kindRank[a.kind] ?? 50;
    const kb = kindRank[b.kind] ?? 50;
    if (ka !== kb) return ka - kb;
    return a.key.localeCompare(b.key);
  });
}

/* -------------------------------------------------------------------------- */
/* LEO-14.7 owner-facing card / action labels                                 */
/* -------------------------------------------------------------------------- */

export function presentEmailAttentionLabel(raw: string | null | undefined): string {
  switch (raw) {
    case "WAITING_ON_US":
      return "Waiting on you";
    case "NEEDS_REVIEW":
      return "Needs review";
    case "LIKELY_REPLY_NEEDED":
      return "Likely reply needed";
    case "INFORMATIONAL":
      return "Informational";
    case "AUTOMATED":
      return "Automated";
    case "RECEIPT":
      return "Receipt";
    case "SYSTEM":
      return "System";
    default:
      return raw ? humanizeInternalLabel(raw) : "Email";
  }
}

export function presentCommitmentKindLabel(kind: string | null | undefined): string {
  switch (kind) {
    case "EXTRACTED_CANDIDATE":
      return "Possible commitment — needs confirmation";
    case "EXPLICIT_OWNER":
      return "Your commitment";
    case "EXTERNAL_PARTY":
      return "External-party commitment";
    default:
      return kind ? humanizeInternalLabel(kind) : "Commitment";
  }
}

export function presentCommitmentDueState(state: string | null | undefined): string {
  switch (state) {
    case "OVERDUE":
      return "Overdue";
    case "DUE_TODAY":
      return "Due today";
    case "DUE_SOON":
      return "Due soon";
    case "FUTURE":
      return "Upcoming";
    case "NO_DUE_DATE":
      return "No due date";
    default:
      return state ? humanizeInternalLabel(state) : "";
  }
}

export function presentPreparedLifecycleLabel(status: string | null | undefined): {
  primary: string;
  secondary: string | null;
  tone: "prepared" | "executed" | "verified" | "failed" | "neutral";
} {
  switch (status) {
    case "PREPARED":
      return { primary: "Prepared", secondary: "Not executed", tone: "prepared" };
    case "EXECUTED":
      return { primary: "Executed", secondary: "Verification pending", tone: "executed" };
    case "VERIFIED":
      return { primary: "Executed & verified", secondary: null, tone: "verified" };
    case "FAILED":
      return { primary: "Failed", secondary: null, tone: "failed" };
    case "NOT_EXECUTED":
      return { primary: "Not executed", secondary: null, tone: "neutral" };
    default:
      return {
        primary: status ? humanizeInternalLabel(status) : "Prepared action",
        secondary: null,
        tone: "neutral",
      };
  }
}

/**
 * LEO-21A — Owner vocabulary for governed connected-action proposal states.
 * Provider-neutral labels only. Never "Sent" / "Scheduled" / "Done" without proof.
 * No Execute/Send button in this gate.
 */
export function presentConnectedActionProposalStateLabel(
  proposalState: string | null | undefined,
): {
  primary: string;
  secondary: string | null;
  tone: "prepared" | "approval" | "approved" | "executing" | "executed" | "verified" | "failed" | "neutral";
} {
  switch (proposalState) {
    case "DRAFT":
    case "PREPARED":
      return { primary: "Prepared", secondary: "Not executed", tone: "prepared" };
    case "AWAITING_APPROVAL":
      return { primary: "Needs approval", secondary: "Owner approval required", tone: "approval" };
    case "APPROVED":
      return {
        primary: "Approved — execution capability not enabled yet",
        secondary: "Not executed yet",
        tone: "approved",
      };
    case "EXECUTION_CLAIMED":
      return { primary: "Executing", secondary: "Execution claimed — not verified", tone: "executing" };
    case "EXECUTED":
      return {
        primary: "Executed — verification pending",
        secondary: "Provider accepted ≠ verified",
        tone: "executed",
      };
    case "VERIFIED":
      return { primary: "Verified", secondary: null, tone: "verified" };
    case "FAILED":
      return { primary: "Failed", secondary: null, tone: "failed" };
    case "EXPIRED":
      return { primary: "Expired", secondary: null, tone: "neutral" };
    case "CANCELLED":
      return { primary: "Cancelled", secondary: null, tone: "neutral" };
    default:
      return {
        primary: proposalState ? humanizeInternalLabel(proposalState) : "Unknown",
        secondary: null,
        tone: "neutral",
      };
  }
}

export function presentGovernanceBanner(
  level: string | null | undefined,
): { show: boolean; text: string; tone: "yellow" | "red" | "never" } | null {
  if (level === "YELLOW") {
    return { show: true, text: "Prepared only — not executed", tone: "yellow" };
  }
  if (level === "RED") {
    return { show: true, text: "Approval required", tone: "red" };
  }
  if (level === "NEVER") {
    return { show: true, text: "Blocked by governance", tone: "never" };
  }
  return null;
}

export function formatOwnerDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  try {
    return new Date(t).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* LEO-20B Self-Intelligence owner labels (presentation only)                 */
/* -------------------------------------------------------------------------- */

const SI_DIMENSION_LABELS: Record<string, string> = {
  OPERATIONS: "Operations",
  REVENUE_MONETIZATION_HEALTH: "Revenue & Monetization",
  TECHNOLOGY_READINESS: "Technology Readiness",
  PRODUCT_OPERATIONAL_HEALTH: "Product Operations",
  BUSINESS_FOUNDATION: "Business Foundation",
  CUSTOMER_JOURNEY: "Customer Journey",
  DISCOVERY_SEO: "SEO / Discovery",
  TRUST_REPUTATION: "Trust & Reputation",
  MARKETING_CREATIVE: "Marketing & Creative",
  COMMUNITY_IMPACT: "Community Impact",
};

const SI_HEALTH_LABELS: Record<string, string> = {
  HEALTHY: "Healthy",
  WATCH: "Watch",
  NEEDS_ATTENTION: "Needs attention",
  CRITICAL: "Critical",
  UNKNOWN: "Unknown",
  NOT_MEASURED: "Not measured",
};

const SI_FRESHNESS_LABELS: Record<string, string> = {
  CURRENT: "Current",
  AGING: "Aging",
  STALE: "Stale",
  UNKNOWN: "Freshness unknown",
};

export function presentSelfIntelligenceDimension(dimension: string): string {
  return SI_DIMENSION_LABELS[dimension] ?? humanizeInternalLabel(dimension);
}

export function presentSelfIntelligenceHealthState(state: string): string {
  return SI_HEALTH_LABELS[state] ?? humanizeInternalLabel(state);
}

export function presentSelfIntelligenceFreshness(freshness: string): string {
  return SI_FRESHNESS_LABELS[freshness] ?? humanizeInternalLabel(freshness);
}
