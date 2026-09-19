/**
 * Ofertas Locales admin — pure view helpers (closeout 2): scope parsing / links, filter vocabularies that
 * match each scope's rows, listing truth and the canonical row-action set. No React, no I/O.
 */
import { isOfertaPubliclyLive } from "@/app/admin/_lib/adminOfertasLivePredicate";
import { classifyPublication, type PublicationTruth } from "@/app/admin/_lib/publicationSemantics";
import {
  ofertaLocalAdminActionsForStatus,
  type OfertaLocalAdminReviewAction,
} from "@/app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations";

import type { ClassifiedAdminLifecycleAction } from "../_components/ClassifiedAdminRowActions";
import { appendPreservedSearchParams } from "../_lib/clasificadosAdminScopeUrls";

export type OfertasAdminScope = "queue" | "live" | "history";

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
  return (typeof v === "string" ? v : Array.isArray(v) ? v[0] ?? "" : "").trim();
}

export const OFERTAS_ADMIN_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `?scope=live` | `?scope=history` | (anything else / absent) => queue. */
export function parseOfertasAdminScope(sp: SearchParams | undefined): OfertasAdminScope {
  const raw = first(sp?.scope).toLowerCase();
  return raw === "live" ? "live" : raw === "history" ? "history" : "queue";
}

/**
 * Scope-switch link. The status / operational-state filters are DROPPED on a scope switch: their options are
 * different per scope, so a stale value would silently show zero rows. Every other filter is preserved.
 */
export function ofertasScopeHref(basePath: string, sp: SearchParams | undefined, scope: OfertasAdminScope): string {
  // `term` has a per-scope vocabulary too (e.g. Expiring exists only in Live, Expired only in History): keep it
  // only when the target scope offers that value, otherwise the switch would land on an empty list.
  const term = first(sp?.term);
  const termKept = term !== "" && OFERTAS_ADMIN_TERM_OPTIONS[scope].some((o) => o.value === term);
  const cleaned: SearchParams = { ...(sp ?? {}), status: undefined, status_group: undefined, ...(termKept ? {} : { term: undefined }) };
  if (scope === "live") return appendPreservedSearchParams(basePath, cleaned, "live");
  const queueHref = appendPreservedSearchParams(basePath, cleaned, null);
  if (scope === "queue") return queueHref;
  return `${queueHref}${queueHref.includes("?") ? "&" : "?"}scope=history`;
}

/** Raw `ofertas_locales.status` values that can appear in each scope's rows (the Status <select>). */
export const OFERTAS_ADMIN_STATUS_OPTIONS: Readonly<Record<OfertasAdminScope, readonly { value: string; label: string }[]>> = {
  queue: [
    { value: "pending_review", label: "Pending review" },
    { value: "submitted", label: "Submitted" },
    { value: "draft", label: "Draft" },
  ],
  live: [{ value: "approved", label: "Approved (live)" }],
  history: [
    { value: "rejected", label: "Rejected" },
    { value: "archived", label: "Archived" },
    { value: "expired", label: "Expired" },
    { value: "approved", label: "Approved, no longer live" },
  ],
};

/**
 * Operational-state (`status_group`) values that can occur in each scope, taken from
 * `deriveOfertaLocalOperationalStatus`. (The old page offered `active` / `expired` / `expiring` /
 * `changes_requested` under a Queue that can never contain them.)
 */
export const OFERTAS_ADMIN_STATUS_GROUP_OPTIONS: Readonly<Record<OfertasAdminScope, readonly { value: string; label: string }[]>> = {
  queue: [
    { value: "approval_ready", label: "Approval ready" },
    { value: "approval_blocked", label: "Approval blocked" },
    { value: "commercially_ineligible", label: "Commercial blocked" },
    { value: "source_missing", label: "Source missing" },
    { value: "scan_unresolved", label: "Scan unresolved" },
    { value: "review_unresolved", label: "Review unresolved" },
    { value: "operational_recovery", label: "Operational recovery" },
    { value: "ready_for_review", label: "Ready for review" },
    { value: "submitted", label: "Submitted" },
    { value: "resubmitted", label: "Resubmitted" },
    { value: "incomplete_draft", label: "Incomplete draft" },
    { value: "renewal_review", label: "Renewal review" },
    { value: "renewal_scheduled", label: "Renewal scheduled" },
  ],
  live: [
    { value: "active", label: "Active" },
    { value: "expiring", label: "Expiring" },
    { value: "renewal_review", label: "Renewal review" },
    { value: "renewal_scheduled", label: "Renewal scheduled" },
  ],
  history: [
    { value: "changes_requested", label: "Changes requested (rejected)" },
    { value: "archived", label: "Archived" },
    { value: "expired", label: "Expired" },
    { value: "activation_incomplete", label: "Approved, activation incomplete" },
  ],
};

/** `term` filter values (public-term status) that are meaningful per scope. */
export const OFERTAS_ADMIN_TERM_OPTIONS: Readonly<Record<OfertasAdminScope, readonly { value: string; label: string }[]>> = {
  queue: [{ value: "renewal", label: "Renewal" }],
  live: [
    { value: "active", label: "Active" },
    { value: "expiring", label: "Expiring" },
    { value: "renewal", label: "Renewal" },
  ],
  history: [
    { value: "expired", label: "Expired" },
    { value: "active", label: "Term still running" },
  ],
};

/**
 * Listing truth for an Ofertas row. `classifyPublication("ofertas_locales", row)` plus one honest correction:
 * an `approved` row inside its term that the public reader still hides (missing public source asset, coupon
 * window, empty name/title) is NOT live — classifyPublication alone would call it PUBLIC.
 */
export function ofertaListingTruth(row: Record<string, unknown>, now: Date = new Date()): PublicationTruth {
  const t = classifyPublication("ofertas_locales", row, { now });
  if (t.semantic === "PUBLIC" && !isOfertaPubliclyLive(row, now.getTime())) {
    return {
      ...t,
      semantic: "PAUSED",
      reason:
        "Approved and inside its term, but the public reader does not show it (missing public source asset, or the coupon date window / name is not valid).",
    };
  }
  return t;
}

const NOTE_REQUIRED_PROMPT = "Rejection reason (required — kept in the internal record and shown to the owner):";

/**
 * The canonical row actions for an Ofertas offer: approve / reject / archive / restore, from the SAME
 * transition table the mutation enforces. Approve is shown disabled (with the blockers) until the operational
 * status allows it; the mutation re-checks the payment / entitlement gates regardless.
 */
export function ofertaRowActions(input: {
  status: string;
  approvalAllowed: boolean;
  blockingReasons?: readonly string[];
}): ClassifiedAdminLifecycleAction[] {
  const allowed = new Set<OfertaLocalAdminReviewAction>(ofertaLocalAdminActionsForStatus(input.status));
  const out: ClassifiedAdminLifecycleAction[] = [];
  if (allowed.has("approve")) {
    const blockers = (input.blockingReasons ?? []).join(", ");
    out.push({
      action: "approve",
      label: "Approve",
      tone: "active",
      confirm:
        "Approve this offer? Confirm you reviewed identity, source, scan, review, commercial state, public term and blockers. Approval stays gated by payment / entitlement — it cannot bypass them.",
      disabled: !input.approvalAllowed,
      reason: input.approvalAllowed ? null : `Approval blocked${blockers ? `: ${blockers}` : "."}`,
    });
  }
  if (allowed.has("reject")) {
    out.push({ action: "reject", label: "Reject", tone: "danger", confirm: NOTE_REQUIRED_PROMPT, note: "required" });
  }
  if (allowed.has("restore")) {
    out.push({
      action: "restore",
      label: "Restore to review",
      tone: "active",
      confirm:
        "Restore this offer to review (pending_review)? It does NOT go live — it must be approved again, with the normal payment / entitlement gates.",
    });
  }
  if (allowed.has("archive")) {
    out.push({
      action: "archive",
      label: "Archive",
      tone: "warning",
      confirm: "Archive this offer? It stops showing publicly and its items are deactivated.",
    });
  }
  return out;
}

/**
 * Leonix Ad ID search: the data layer's `q` already ilike-matches `leonix_ad_id`, so the dedicated Ad ID field
 * rides on `q` when no free-text search is given (it runs BEFORE the row limit). When both are given, `q` is
 * used server-side and the Ad ID narrows the returned rows in memory (`adminRowMatchesLeonixAdIdFilter`).
 */
export function ofertasServerSearchTerm(q: string, leonixAdId: string): string | undefined {
  return (q || leonixAdId || "").trim() || undefined;
}
