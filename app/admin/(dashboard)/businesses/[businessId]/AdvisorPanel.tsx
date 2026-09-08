"use client";

import { useState } from "react";
import { advisorSignalDashboardAnchor } from "@/app/lib/business/advisor/logic";
import type { AdvisorSignalType } from "@/app/lib/business/advisor/types";

/**
 * Program 7 — Admin UI panel for Proactive Advisor signals.
 * Server data is passed in as props. Client-side acknowledge/resolve uses fetch.
 */

export type SignalRow = {
  id: string;
  signalType: string;
  severity: string;
  status: string;
  titleEn: string;
  titleEs: string;
  explanationEn: string;
  explanationEs: string;
  detectedAt: string;
};

export function AdvisorPanel({ businessId, signals }: { businessId: string; signals: SignalRow[] }) {
  const [expanded, setExpanded] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeSignals = signals.filter((s) => s.status === "active");

  async function handleAction(signalId: string, action: "acknowledge" | "resolve" | "dismiss") {
    setActioning(signalId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/advisor/${signalId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(typeof body?.error === "string" ? body.error : "Advisor action failed. The signal was not changed.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Advisor action failed. The signal was not changed.");
    } finally {
      setActioning(null);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex min-h-[44px] w-full items-center justify-between text-left"
      >
        <h3 className="text-sm font-bold text-[color:var(--lx-text)]">
          Advisor Signals ({activeSignals.length} active)
        </h3>
        <span className="text-xs text-[color:var(--lx-text-muted)]">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-[#7A7164]">
            Advisor can surface and point staff to an existing workflow. It cannot create recommendations, rewrite facts, send messages, charge, or publish.
          </p>
          {error ? <p className="text-xs text-[#7A1E2C]">{error}</p> : null}
          {activeSignals.length === 0 ? (
            <p className="text-xs text-[color:var(--lx-text-muted)]">No active advisor signals.</p>
          ) : (
            activeSignals.map((s) => {
              const anchor = advisorSignalDashboardAnchor(s.signalType as AdvisorSignalType);
              return (
                <div key={s.id} className="rounded border border-[color:var(--lx-border)] p-3 text-xs">
                  <div className="break-words font-semibold">{s.titleEn}</div>
                  <div className="mt-1 break-words text-[color:var(--lx-text-muted)]">{s.explanationEn}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded bg-[color:var(--lx-badge-bg)] px-1.5 py-0.5">{s.severity}</span>
                    <span className="rounded bg-[color:var(--lx-badge-bg)] px-1.5 py-0.5">{s.signalType}</span>
                  </div>
                  <a href={anchor} className="mt-2 inline-flex min-h-[44px] items-center text-xs font-semibold text-[#7A1E2C] underline">
                    Open related workflow
                  </a>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAction(s.id, "acknowledge")}
                      disabled={actioning === s.id}
                      className="inline-flex min-h-[44px] items-center rounded bg-[#7A1E2C] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6A1825] disabled:opacity-50"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleAction(s.id, "resolve")}
                      disabled={actioning === s.id}
                      className="inline-flex min-h-[44px] items-center rounded bg-[#1F4D3A] px-3 py-2 text-xs font-semibold text-white hover:bg-[#17392C] disabled:opacity-50"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleAction(s.id, "dismiss")}
                      disabled={actioning === s.id}
                      className="inline-flex min-h-[44px] items-center rounded bg-[#5C564C] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3D3428] disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
