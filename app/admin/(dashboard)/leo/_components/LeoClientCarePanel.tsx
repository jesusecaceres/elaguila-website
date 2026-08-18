import { adminCardBase } from "@/app/admin/_components/adminTheme";
import type { LeoClientCareSignal, LeoClientCareWatchResult } from "@/app/leo/_lib/leoTypes";

type CareLoad =
  | { ok: true; watch: LeoClientCareWatchResult }
  | { ok: false; limitation: string };

const DISPLAY_MAX = 8;

function evidenceLabel(signal: LeoClientCareSignal): { badge: string; badgeClass: string } {
  if (signal.isHeuristic) {
    return {
      badge: "HEURISTIC",
      badgeClass: "border-[#C9B46A]/50 bg-[#FFFCF7] text-[#5C4E2E]",
    };
  }
  return {
    badge: "EXPLICIT",
    badgeClass: "border-[#2A4536]/30 bg-[#EEF4F0] text-[#2A4536]",
  };
}

export function LeoClientCarePanel({ load }: { load: CareLoad }) {
  return (
    <section className="min-w-0" aria-labelledby="leo-care-heading">
      <div className="mb-3">
        <h2 id="leo-care-heading" className="text-lg font-bold text-[#1E1810] sm:text-xl">
          Client Care
        </h2>
        <p className="mt-1 text-sm text-[#5C5346]">
          Who may need a reply or follow-up — explicit evidence first; heuristics labeled.
        </p>
      </div>

      {!load.ok ? (
        <div className={`${adminCardBase} border-amber-200/80 bg-amber-50/70 p-4 text-sm text-amber-950`}>
          {load.limitation}
        </div>
      ) : load.watch.signals.length === 0 ? (
        <div className={`${adminCardBase} p-4 text-sm text-[#5C5346]`}>
          No client-care signals from currently available bounded sources.
        </div>
      ) : (
        <div className={`${adminCardBase} divide-y divide-[color:var(--lx-border)]/50 overflow-hidden`}>
          {load.watch.signals.slice(0, DISPLAY_MAX).map((s) => {
            const { badge, badgeClass } = evidenceLabel(s);
            return (
              <div key={s.key} className="min-w-0 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${badgeClass}`}>
                    {badge}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#A67C52]">{s.kind}</span>
                </div>
                <p className="mt-1 break-words text-sm font-semibold text-[#1E1810]">{s.title}</p>
                <p className="mt-0.5 break-words text-xs leading-relaxed text-[#5C5346]">{s.summary}</p>
                {s.isHeuristic ? (
                  <p className="mt-1 text-[11px] text-[#5C5346]">
                    Operational heuristic — not an SLA breach and not a broken promise to the client.
                  </p>
                ) : null}
              </div>
            );
          })}
          {load.watch.signals.length > DISPLAY_MAX ? (
            <p className="px-4 py-2 text-xs text-[#5C5346] sm:px-5">
              Showing {DISPLAY_MAX} of {load.watch.signals.length} signals (bounded).
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
