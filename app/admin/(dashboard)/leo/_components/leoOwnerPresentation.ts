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
    .replace(/\bstatus pending\b/gi, "pending status");
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
