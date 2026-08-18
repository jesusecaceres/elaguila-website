import { adminCardBase } from "@/app/admin/_components/adminTheme";
import type { LeoAttentionBrief, LeoAttentionItem } from "@/app/leo/_lib/leoTypes";

type AttentionLoad =
  | { ok: true; brief: LeoAttentionBrief }
  | { ok: false; limitation: string };

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

function AttentionCard({ item }: { item: LeoAttentionItem }) {
  return (
    <article className={`${adminCardBase} min-w-0 p-4 sm:p-5`}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span
          className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${levelStyles(item.level)}`}
        >
          {item.level}
        </span>
        <span className="text-[11px] font-semibold text-[#5C5346]">score {item.score}</span>
        {item.affectedCount != null ? (
          <span className="text-[11px] text-[#5C5346]">· {item.affectedCount} affected</span>
        ) : null}
      </div>
      <h3 className="mt-2 break-words text-base font-bold text-[#1E1810]">{item.title}</h3>
      <p className="mt-1 break-words text-sm leading-relaxed text-[#5C5346]">{item.summary}</p>
      {item.factors.length > 0 ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-[#A67C52]">
            Why it ranked
          </summary>
          <ul className="mt-2 space-y-1.5 border-t border-[color:var(--lx-border)]/50 pt-2">
            {item.factors.map((f) => (
              <li key={`${item.id}-${f.factor}`} className="break-words text-xs leading-relaxed text-[#5C5346]">
                <span className="font-semibold text-[#1E1810]">{f.factor}</span>
                {f.value !== 0 ? ` (${f.value > 0 ? "+" : ""}${f.value})` : ""} — {f.reason}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {item.limitationNote ? (
        <p className="mt-3 break-words rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
          Limitation: {item.limitationNote}
        </p>
      ) : null}
    </article>
  );
}

export function LeoAttentionPanel({ load }: { load: AttentionLoad }) {
  return (
    <section className="min-w-0" aria-labelledby="leo-attention-heading">
      <div className="mb-3">
        <h2 id="leo-attention-heading" className="text-lg font-bold text-[#1E1810] sm:text-xl">
          Today&apos;s Attention
        </h2>
        <p className="mt-1 text-sm text-[#5C5346]">Highest-priority items from available Leonix evidence.</p>
      </div>

      {!load.ok ? (
        <div className={`${adminCardBase} border-amber-200/80 bg-amber-50/70 p-4 text-sm text-amber-950`}>
          {load.limitation}
        </div>
      ) : load.brief.items.length === 0 ? (
        <div className={`${adminCardBase} p-5 sm:p-6`}>
          <p className="text-sm font-semibold leading-relaxed text-[#1E1810]">
            No current signals qualify for executive attention from available sources.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#5C5346]">
            This is not a full-system health attestation — LEO does not yet have complete operational
            monitoring coverage.
          </p>
          {load.brief.limitations[0] ? (
            <p className="mt-3 text-xs text-[#5C5346]">Note: {load.brief.limitations[0]}</p>
          ) : null}
        </div>
      ) : (
        <div className="grid min-w-0 gap-3">
          {load.brief.items.map((item) => (
            <AttentionCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
