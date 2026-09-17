import { adminCardBase } from "@/app/admin/_components/adminTheme";
import type { LeoAttentionItem } from "@/app/leo/_lib/leoTypes";
import type { LeoAttentionRuntimeBrief } from "@/app/leo/_lib/leoAttentionRuntime";

import { presentAttentionItem, scrubOwnerFacingText } from "./leoOwnerPresentation";

type AttentionLoad =
  | { ok: true; brief: LeoAttentionRuntimeBrief; truth?: { explanation: string; nextStep: string | null; health: string } }
  | { ok: false; limitation: string; truth?: { explanation: string; nextStep: string | null; health: string } };

function levelStyles(level: LeoAttentionItem["level"]): string {
  switch (level) {
    case "CRITICAL":
      return "border-rose-300 bg-rose-50 text-rose-900";
    case "HIGH":
      return "border-[#C9782F]/50 bg-[#FFF4E8] text-[#7A3E10]";
    case "NORMAL":
      return "border-[#1E4A7A]/30 bg-[#F0F5FA] text-[#1E4A7A]";
    default:
      return "border-[color:var(--lx-border)] bg-[color:var(--lx-section)] text-[#5C5346]";
  }
}

function AttentionRow({ item, rank }: { item: LeoAttentionItem; rank: number }) {
  const presented = presentAttentionItem(item);
  return (
    <article className="min-w-0 px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex min-w-0 gap-3">
        <span
          className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#7A1E2C] text-xs font-bold text-white"
          aria-label={`Priority ${rank}`}
        >
          #{rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${levelStyles(item.level)}`}
            >
              {item.level}
            </span>
            {item.affectedCount != null ? (
              <span className="text-[11px] font-medium text-[#5C5346]">
                {item.affectedCount} affected
              </span>
            ) : null}
          </div>
          <h3 className="mt-1 break-words text-sm font-bold leading-snug text-[#1E1810] sm:text-[15px]">
            {presented.title}
          </h3>
          <p className="mt-0.5 break-words text-xs leading-relaxed text-[#5C5346] sm:text-sm">
            {presented.summary}
          </p>
          {item.factors.length > 0 ? (
            <details className="mt-1.5">
              <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-wide text-[#A67C52]">
                Why this matters
              </summary>
              <ul className="mt-1.5 space-y-1 border-t border-[color:var(--lx-border)]/40 pt-1.5">
                {item.factors.map((f) => (
                  <li key={`${item.id}-${f.factor}`} className="break-words text-xs leading-relaxed text-[#5C5346]">
                    {scrubOwnerFacingText(f.reason)}
                    {f.evidence ? (
                      <span className="text-[#5C5346]/80"> — {scrubOwnerFacingText(f.evidence)}</span>
                    ) : null}
                  </li>
                ))}
                <li className="text-[11px] text-[#5C5346]/70">Internal rank score: {item.score}</li>
              </ul>
            </details>
          ) : null}
          {presented.limitationNote ? (
            <p className="mt-1.5 break-words text-[11px] text-amber-900">
              Note: {presented.limitationNote}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function LeoAttentionPanel({ load }: { load: AttentionLoad }) {
  return (
    <section className="min-w-0" aria-labelledby="leo-attention-heading">
      <div className="mb-2">
        <h2 id="leo-attention-heading" className="text-base font-bold text-[#1E1810] sm:text-lg">
          Today&apos;s Top Priorities
        </h2>
        <p className="mt-0.5 text-xs text-[#5C5346] sm:text-sm">
          Ranked from available Leonix evidence — not a full system-health claim.
        </p>
      </div>

      {!load.ok ? (
        <div
          className={`${adminCardBase} border-amber-200/80 bg-amber-50/70 p-3 text-sm text-amber-950`}
          data-leo-health={load.truth?.health ?? "UNAVAILABLE"}
        >
          <p>{load.limitation}</p>
          {load.truth?.nextStep ? <p className="mt-1 text-xs">{load.truth.nextStep}</p> : null}
        </div>
      ) : (load.brief.visibleItems ?? load.brief.items).length === 0 ? (
        <div className={`${adminCardBase} p-4`} data-leo-health={load.truth?.health ?? "HEALTHY"}>
          <p className="text-sm font-semibold leading-relaxed text-[#1E1810]">
            {load.truth?.explanation ??
              "No current signals qualify for executive attention from available sources."}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#5C5346]">
            This is not a full-system health attestation — LEO does not yet have complete operational
            monitoring coverage.
          </p>
          {load.brief.limitations[0] ? (
            <p className="mt-2 text-xs text-[#5C5346]">Note: {scrubOwnerFacingText(load.brief.limitations[0])}</p>
          ) : null}
        </div>
      ) : (
        <div className={`${adminCardBase} divide-y divide-[color:var(--lx-border)]/50 overflow-hidden`}>
          {(load.brief.visibleItems ?? load.brief.items).map((item, index) => (
            <AttentionRow key={item.id} item={item} rank={index + 1} />
          ))}
        </div>
      )}
    </section>
  );
}
