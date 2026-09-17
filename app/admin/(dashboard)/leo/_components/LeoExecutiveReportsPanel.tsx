import { adminCardBase } from "@/app/admin/_components/adminTheme";
import { composeLeoExecutiveReportingSummary } from "@/app/leo/_lib/leoExecutiveReportingAdapter";
import type {
  LeoExecutiveReportingAvailability,
  LeoExecutiveReportingSnapshot,
  LeoExecutiveSignal,
} from "@/app/leo/_lib/leoExecutiveReportingTypes";

import { scrubOwnerFacingText } from "./leoOwnerPresentation";

export type LeoExecutiveReportsLoad =
  | { ok: true; snapshot: LeoExecutiveReportingSnapshot }
  | { ok: false; limitation: string };

function availabilityLabel(state: LeoExecutiveReportingAvailability): string {
  switch (state) {
    case "AVAILABLE":
      return "Available";
    case "PARTIAL":
      return "Partial";
    case "EMPTY":
      return "Empty";
    case "UNAVAILABLE":
      return "Unavailable";
    case "NOT_IMPLEMENTED":
      return "Not implemented";
    default:
      return "Unknown";
  }
}

function SignalRow({ signal }: { signal: LeoExecutiveSignal }) {
  return (
    <li className="min-w-0 rounded-xl border border-[color:var(--lx-border)]/70 bg-white/80 p-3.5">
      <p className="break-words text-sm font-bold text-[#1E1810]">{scrubOwnerFacingText(signal.title)}</p>
      <p className="mt-1 break-words text-xs leading-relaxed text-[#5C5346]">
        {scrubOwnerFacingText(signal.summary)}
      </p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-[#A67C52]">
        {signal.domain.replace(/_/g, " ")} · {signal.severity} · {signal.availability}
      </p>
    </li>
  );
}

export function LeoExecutiveReportsPanel({ load }: { load: LeoExecutiveReportsLoad }) {
  if (!load.ok) {
    return (
      <section className={`${adminCardBase} min-w-0 p-4`} data-leo-workspace-panel="REPORTS">
        <h2 className="text-base font-bold text-[#1E1810]">Company reports</h2>
        <p className="mt-2 text-sm leading-relaxed text-amber-900">{load.limitation}</p>
      </section>
    );
  }

  const snap = load.snapshot;
  const headline = composeLeoExecutiveReportingSummary(snap);
  const attention = snap.attention.slice(0, 6);
  const performance = snap.performance.slice(0, 4);
  const asOf = new Date(snap.generatedAt).toLocaleString();

  return (
    <section className={`${adminCardBase} min-w-0 space-y-4 p-4`} data-leo-workspace-panel="REPORTS">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">Company reports</p>
        <h2 className="mt-1 text-lg font-bold text-[#1E1810]">Leonix-wide reporting</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#5C5346]">{scrubOwnerFacingText(headline)}</p>
        <p className="mt-1 text-[11px] text-[#A67C52]">
          Overall: {availabilityLabel(snap.overallAvailability)} · as of {asOf}
        </p>
      </div>

      {attention.length > 0 ? (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#5C5346]">Needs attention</h3>
          <ul className="mt-2 space-y-2">
            {attention.map((s) => (
              <SignalRow key={s.signalId} signal={s} />
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-[#5C5346]">No owner-attention queues from available sources.</p>
      )}

      {performance.length > 0 ? (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#5C5346]">Sales and performance</h3>
          <ul className="mt-2 space-y-2">
            {performance.map((s) => (
              <SignalRow key={s.signalId} signal={s} />
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-[#5C5346]">Admin areas</h3>
        <ul className="mt-2 space-y-1.5">
          {snap.domainSummaries.map((d) => (
            <li key={d.domain} className="text-sm text-[#5C5346]">
              <span className="font-semibold text-[#1E1810]">{d.label}:</span>{" "}
              {availabilityLabel(d.availability)}
              {d.attentionCount > 0 ? ` · ${d.attentionCount} attention` : ""}
              {d.adapterStatus === "RESERVED" || d.availability === "NOT_IMPLEMENTED"
                ? " · not live yet"
                : ""}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
