"use client";

import { useState } from "react";

/**
 * Program 7 — Admin UI panel for Business Outcomes.
 * Server data is passed in as props. Client-side interactions use fetch.
 */

export type OutcomeRow = {
  id: string;
  metricKey: string;
  metricLabelEs: string;
  metricLabelEn: string;
  baselineValue: string | null;
  measuredValue: string | null;
  result: string;
  confidence: string;
  causationClaim: string;
  reviewStatus: string;
  createdAt: string;
};

export function OutcomesPanel({ outcomes }: { outcomes: OutcomeRow[] }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mt-4 rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex min-h-[44px] w-full items-center justify-between text-left"
      >
        <h3 className="text-sm font-bold text-[color:var(--lx-text)]">
          Business Outcomes ({outcomes.length})
        </h3>
        <span className="text-xs text-[color:var(--lx-text-muted)]">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-[#7A7164]">
            Recorded observation or result — not guaranteed business impact, not ROI, and not automatic attribution.
          </p>
          {outcomes.length === 0 ? (
            <p className="text-xs text-[color:var(--lx-text-muted)]">No outcomes have been recorded yet.</p>
          ) : (
            outcomes.map((o) => (
              <div key={o.id} className="rounded border border-[color:var(--lx-border)] p-3 text-xs">
                <div className="break-words font-semibold">{o.metricLabelEn}</div>
                <div className="mt-1 break-words text-[color:var(--lx-text-muted)]">
                  Baseline: {o.baselineValue ?? "—"} → Measured: {o.measuredValue ?? "—"}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded bg-[color:var(--lx-badge-bg)] px-1.5 py-0.5">{o.result}</span>
                  <span className="rounded bg-[color:var(--lx-badge-bg)] px-1.5 py-0.5">{o.confidence}</span>
                  <span className="rounded bg-[color:var(--lx-badge-bg)] px-1.5 py-0.5">causation: {o.causationClaim}</span>
                  <span className="rounded bg-[color:var(--lx-badge-bg)] px-1.5 py-0.5">{o.reviewStatus}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
