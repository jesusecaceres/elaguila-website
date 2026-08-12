"use client";

import { useState } from "react";

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

export function AdvisorPanel({ signals }: { signals: SignalRow[] }) {
  const [expanded, setExpanded] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);

  const activeSignals = signals.filter((s) => s.status === "active");

  async function handleAction(signalId: string, action: "acknowledge" | "resolve" | "dismiss") {
    setActioning(signalId);
    try {
      await fetch(`/api/admin/businesses/${signalId}/${action}`, { method: "POST" });
      window.location.reload();
    } finally {
      setActioning(null);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="text-sm font-bold text-[color:var(--lx-text)]">
          Program 7 — Advisor Signals ({activeSignals.length} active)
        </h3>
        <span className="text-xs text-[color:var(--lx-text-muted)]">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="mt-3 space-y-2">
          {activeSignals.length === 0 ? (
            <p className="text-xs text-[color:var(--lx-text-muted)]">No active signals.</p>
          ) : (
            activeSignals.map((s) => (
              <div key={s.id} className="rounded border border-[color:var(--lx-border)] p-2 text-xs">
                <div className="font-semibold">{s.titleEn}</div>
                <div className="text-[color:var(--lx-text-muted)]">{s.explanationEn}</div>
                <div className="mt-1 flex gap-2">
                  <span className="rounded bg-[color:var(--lx-badge-bg)] px-1.5 py-0.5">{s.severity}</span>
                  <span className="rounded bg-[color:var(--lx-badge-bg)] px-1.5 py-0.5">{s.signalType}</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleAction(s.id, "acknowledge")}
                    disabled={actioning === s.id}
                    className="rounded bg-[#7A1E2C] px-2 py-1 text-xs font-semibold text-white hover:bg-[#6A1825] disabled:opacity-50"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => handleAction(s.id, "resolve")}
                    disabled={actioning === s.id}
                    className="rounded bg-green-700 px-2 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => handleAction(s.id, "dismiss")}
                    disabled={actioning === s.id}
                    className="rounded bg-gray-500 px-2 py-1 text-xs font-semibold text-white hover:bg-gray-600 disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
