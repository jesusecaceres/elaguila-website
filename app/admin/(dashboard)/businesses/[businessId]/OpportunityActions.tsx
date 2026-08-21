"use client";

import { useState } from "react";

/**
 * Package B, Gate 6 — Opportunities panel for the existing Business Concierge business workspace.
 * Mirrors the AdvisorPanel.tsx fetch-then-reload idiom exactly — no new UI framework.
 *
 * Doctrine (locked): only ever shows Review/Approve/Dismiss/Create Creative Request. Never Send
 * Email, Send SMS, Charge Client, Create Contract, Publish, or Confirm Sponsorship — those
 * actions have no corresponding API route to call even if a button existed.
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
  lifecycleState: string;
};

function stateBadgeClass(state: string): string {
  switch (state) {
    case "approved": return "bg-green-100 text-green-700";
    case "creative_requested": return "bg-blue-100 text-blue-700";
    case "dismissed": return "bg-gray-100 text-gray-500";
    case "reviewed": return "bg-amber-100 text-amber-700";
    default: return "bg-gray-100 text-gray-600";
  }
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

  async function handleGenerate() {
    setGenerating(true);
    try {
      await fetch(`/api/admin/businesses/${businessId}/opportunities`, { method: "POST" });
      window.location.reload();
    } finally {
      setGenerating(false);
    }
  }

  async function handleReviewAction(opportunityId: string, action: "review" | "approve" | "dismiss") {
    setActioning(opportunityId);
    try {
      await fetch(`/api/admin/businesses/${businessId}/opportunities/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      window.location.reload();
    } finally {
      setActioning(null);
    }
  }

  async function handleCreateCreativeRequest(opportunityId: string) {
    setActioning(opportunityId);
    try {
      await fetch(`/api/admin/businesses/${businessId}/opportunities/${opportunityId}/creative-request`, { method: "POST" });
      window.location.reload();
    } finally {
      setActioning(null);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Opportunities</h3>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? "Checking…" : "Check for opportunities"}
        </button>
      </div>

      {opportunities.length === 0 ? (
        <p className="text-sm text-gray-500">No opportunities suggested yet.</p>
      ) : (
        <div className="space-y-3">
          {opportunities.map((o) => (
            <div key={o.id} className="border border-gray-200 rounded p-3 text-sm space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{o.titleEn}</p>
                  <p className="text-xs text-gray-500">{o.summaryEn}</p>
                </div>
                <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold ${stateBadgeClass(o.lifecycleState)}`}>
                  {o.lifecycleState.replace(/_/g, " ")}
                </span>
              </div>

              <div className="rounded bg-gray-50 p-2">
                <p className="text-[11px] font-semibold text-gray-600">Why this matches:</p>
                <ul className="mt-1 list-disc list-inside space-y-0.5 text-xs text-gray-600">
                  {o.matchReasons.map((r, i) => (
                    <li key={i}>{r.explanationEn}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span>Source: {o.sourceTitle}</span>
                <span>· Confidence: {o.confidence}</span>
                <span className={o.readinessRecommended ? "text-green-700" : "text-amber-700"}>
                  · {o.readinessRecommended ? "Recommended for action" : "Potential match — not recommended for action yet"}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">{o.readinessExplanationEn}</p>

              {canReview || canCreateCreativeRequest ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {canReview && o.lifecycleState === "suggested" ? (
                    <button
                      onClick={() => handleReviewAction(o.id, "review")}
                      disabled={actioning === o.id}
                      className="rounded bg-gray-500 px-2 py-1 text-xs font-semibold text-white hover:bg-gray-600 disabled:opacity-50"
                    >
                      Mark reviewed
                    </button>
                  ) : null}
                  {canReview && (o.lifecycleState === "suggested" || o.lifecycleState === "reviewed") ? (
                    <button
                      onClick={() => handleReviewAction(o.id, "approve")}
                      disabled={actioning === o.id}
                      className="rounded bg-green-700 px-2 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  ) : null}
                  {canReview && (o.lifecycleState === "suggested" || o.lifecycleState === "reviewed") ? (
                    <button
                      onClick={() => handleReviewAction(o.id, "dismiss")}
                      disabled={actioning === o.id}
                      className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  ) : null}
                  {canCreateCreativeRequest && o.lifecycleState === "approved" ? (
                    <button
                      onClick={() => handleCreateCreativeRequest(o.id)}
                      disabled={actioning === o.id}
                      className="rounded bg-[#7A1E2C] px-2 py-1 text-xs font-semibold text-white hover:bg-[#6A1825] disabled:opacity-50"
                    >
                      Create Creative Request
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
