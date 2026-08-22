"use client";

import { useState } from "react";

/**
 * Package B, Gate 6 / Gate 06 — Opportunities panel for the existing Business Concierge workspace.
 * Only Review / Approve / Dismiss / Create Creative Request. Never Send Email, SMS, Charge,
 * Contract, Publish, or Confirm Sponsorship — those actions have no corresponding API.
 */

export type OpportunityRow = {
  id: string;
  opportunityType: string;
  titleEn: string;
  titleEs: string;
  summaryEn: string;
  matchReasons: readonly { category: string; explanationEn: string; explanationEs: string }[];
  confidence: "low" | "medium" | "high";
  readinessRecommended: boolean;
  readinessExplanationEn: string;
  sourceTitle: string;
  sourceType: string;
  reviewNote: string | null;
  lifecycleState: string;
};

function stateBadgeClass(state: string): string {
  switch (state) {
    case "approved":
      return "bg-emerald-100 text-emerald-800";
    case "creative_requested":
      return "bg-[#EDE6D6] text-[#3D3428]";
    case "dismissed":
      return "bg-[#EDE6D6] text-[#7A7164]";
    case "reviewed":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-[#EDE6D6] text-[#3D3428]";
  }
}

function stateMeaning(state: string): string {
  switch (state) {
    case "suggested":
      return "Suggested — the system found a plausible fit.";
    case "reviewed":
      return "Reviewed — staff assessed it.";
    case "approved":
      return "Approved — staff judges this opportunity worth pursuing. Not client acceptance and not confirmed sponsorship.";
    case "dismissed":
      return "Dismissed — not appropriate or not worth pursuing.";
    case "creative_requested":
      return "Creative requested — an approved opportunity moved into the existing Creative Studio bridge.";
    default:
      return state;
  }
}

async function readApiError(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => ({} as { error?: string }));
  return typeof data.error === "string" && data.error.trim() ? data.error : fallback;
}

export function OpportunitiesPanel({
  businessId,
  opportunities,
  canReview,
  canCreateCreativeRequest,
}: {
  businessId: string;
  opportunities: OpportunityRow[];
  canReview: boolean;
  canCreateCreativeRequest: boolean;
}) {
  const [actioning, setActioning] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waitingReview = opportunities.filter((o) => o.lifecycleState === "suggested" || o.lifecycleState === "reviewed");
  const waitingCreative = opportunities.filter((o) => o.lifecycleState === "approved");
  const others = opportunities.filter((o) => o.lifecycleState === "dismissed" || o.lifecycleState === "creative_requested");

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/opportunities`, { method: "POST" });
    setGenerating(false);
    if (!res.ok) {
      setError(await readApiError(res, "Could not check for opportunities."));
      return;
    }
    window.location.reload();
  }

  async function handleReviewAction(opportunityId: string, action: "review" | "approve" | "dismiss") {
    setActioning(opportunityId);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/opportunities/${opportunityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      setActioning(null);
      setError(await readApiError(res, `Could not ${action} this opportunity.`));
      return;
    }
    window.location.reload();
  }

  async function handleCreateCreativeRequest(opportunityId: string) {
    setActioning(opportunityId);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/opportunities/${opportunityId}/creative-request`, { method: "POST" });
    if (!res.ok) {
      setActioning(null);
      setError(await readApiError(res, "Could not request creative. Opportunity was not marked creative_requested."));
      return;
    }
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-xs text-[#7A7164]">
          Contextual editorial / sponsorship / advertising candidates. Related to Next Right Move, not the same object.
        </p>
        <button
          onClick={() => void handleGenerate()}
          disabled={generating}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#1E1810] disabled:opacity-50"
        >
          {generating ? "Checking…" : "Check for opportunities"}
        </button>
      </div>

      <div className="rounded-lg border border-[#E8DFD0] bg-[#FFFDF7] p-3 text-xs text-[#3D3428]">
        <p className="font-semibold">Approved means staff judges this worth pursuing.</p>
        <p className="mt-1 text-[#7A7164]">
          Approved does not mean the client accepted, sponsorship sold, contract signed, payment received, editorial endorsement, or creative published. Payment cannot buy false claims or editorial endorsement. Human review is required.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-red-700">{error}</p>
      ) : null}

      {!canReview && !canCreateCreativeRequest ? (
        <p className="text-xs text-[#7A7164]">Your role can view opportunities. Review, approve, dismiss, and creative request remain manager / super-admin actions.</p>
      ) : null}

      {waitingReview.length === 0 ? (
        <p className="text-sm text-[#7A7164]">No contextual opportunities are waiting for review.</p>
      ) : (
        <div className="space-y-3">
          {waitingReview.map((o) => (
            <OpportunityCard
              key={o.id}
              opportunity={o}
              canReview={canReview}
              canCreateCreativeRequest={canCreateCreativeRequest}
              actioning={actioning}
              onReview={handleReviewAction}
              onCreative={handleCreateCreativeRequest}
            />
          ))}
        </div>
      )}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Approved, awaiting creative</p>
        {waitingCreative.length === 0 ? (
          <p className="mt-2 text-sm text-[#7A7164]">No approved opportunities are waiting for creative.</p>
        ) : (
          <div className="mt-2 space-y-3">
            {waitingCreative.map((o) => (
              <OpportunityCard
                key={o.id}
                opportunity={o}
                canReview={canReview}
                canCreateCreativeRequest={canCreateCreativeRequest}
                actioning={actioning}
                onReview={handleReviewAction}
                onCreative={handleCreateCreativeRequest}
              />
            ))}
          </div>
        )}
      </div>

      {others.length > 0 ? (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Closed or already requested</p>
          <div className="mt-2 space-y-3">
            {others.map((o) => (
              <OpportunityCard
                key={o.id}
                opportunity={o}
                canReview={canReview}
                canCreateCreativeRequest={canCreateCreativeRequest}
                actioning={actioning}
                onReview={handleReviewAction}
                onCreative={handleCreateCreativeRequest}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a href="#recommend" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#1E1810]">
          Review Next Right Move
        </a>
        <a href="#creative" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-4 py-2 text-xs font-semibold text-[#3D3428]">
          Creative Studio
        </a>
      </div>
    </div>
  );
}

function OpportunityCard({
  opportunity: o,
  canReview,
  canCreateCreativeRequest,
  actioning,
  onReview,
  onCreative,
}: {
  opportunity: OpportunityRow;
  canReview: boolean;
  canCreateCreativeRequest: boolean;
  actioning: string | null;
  onReview: (id: string, action: "review" | "approve" | "dismiss") => void;
  onCreative: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[#E8DFD0] bg-white p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-[#1E1810]">{o.titleEn}</p>
          <p className="mt-1 text-xs text-[#7A7164]">{o.summaryEn}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-[#8A6B1F]">{o.opportunityType.replace(/_/g, " ")}</p>
        </div>
        <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold ${stateBadgeClass(o.lifecycleState)}`}>
          {o.lifecycleState.replace(/_/g, " ")}
        </span>
      </div>
      <p className="mt-2 text-[11px] text-[#3D3428]">{stateMeaning(o.lifecycleState)}</p>

      <div className="mt-2 rounded-lg border border-[#E8DFD0] bg-[#FAF6EE] p-2">
        <p className="text-[11px] font-semibold text-[#3D3428]">Why this was suggested</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-[#3D3428]">
          {o.matchReasons.map((reason) => (
            <li key={`${reason.category}-${reason.explanationEn}`}>
              <span className="font-semibold">{reason.category.replace(/_/g, " ")}:</span> {reason.explanationEn}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-2 text-[11px] text-[#7A7164]">
        Source: {o.sourceTitle} · {o.sourceType.replace(/_/g, " ")}
        {" · "}
        Explainable confidence (not a score): {o.confidence}
      </p>
      <p className={`mt-1 text-[11px] ${o.readinessRecommended ? "text-emerald-800" : "text-amber-800"}`}>
        {o.readinessRecommended ? "Readiness context supports action." : "Potential match — not recommended for action yet."}
      </p>
      <p className="mt-1 text-[11px] text-[#7A7164]">{o.readinessExplanationEn}</p>
      {o.reviewNote ? <p className="mt-1 text-[11px] text-[#3D3428]">Staff review note: {o.reviewNote}</p> : null}

      {canReview || canCreateCreativeRequest ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {canReview && o.lifecycleState === "suggested" ? (
            <button
              onClick={() => onReview(o.id, "review")}
              disabled={actioning === o.id}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-4 py-2 text-xs font-semibold text-[#3D3428] disabled:opacity-50"
            >
              Mark reviewed
            </button>
          ) : null}
          {canReview && (o.lifecycleState === "suggested" || o.lifecycleState === "reviewed") ? (
            <button
              onClick={() => onReview(o.id, "approve")}
              disabled={actioning === o.id}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#1F3A2D] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Approve
            </button>
          ) : null}
          {canReview && (o.lifecycleState === "suggested" || o.lifecycleState === "reviewed" || o.lifecycleState === "approved") ? (
            <button
              onClick={() => onReview(o.id, "dismiss")}
              disabled={actioning === o.id}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-800 disabled:opacity-50"
            >
              Dismiss
            </button>
          ) : null}
          {canCreateCreativeRequest && o.lifecycleState === "approved" ? (
            <button
              onClick={() => onCreative(o.id)}
              disabled={actioning === o.id}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Request Creative
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
