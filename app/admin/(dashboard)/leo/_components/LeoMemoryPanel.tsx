import { adminCardBase } from "@/app/admin/_components/adminTheme";
import type { LeoMemoryRecord } from "@/app/leo/_lib/leoTypes";

type MemoryLoad =
  | { ok: true; records: LeoMemoryRecord[] }
  | { ok: false; limitation: string };

export function LeoMemoryPanel({ load }: { load: MemoryLoad }) {
  return (
    <section className="min-w-0" aria-labelledby="leo-memory-heading">
      <div className="mb-2">
        <h2 id="leo-memory-heading" className="text-base font-bold text-[#1E1810] sm:text-lg">
          Living Leonix Book
        </h2>
        <p className="mt-0.5 text-xs text-[#5C5346] sm:text-sm">
          Executive memory: decisions, facts, commitments, and corrections LEO has explicitly recorded.
        </p>
      </div>

      {!load.ok ? (
        <div className={`${adminCardBase} border-amber-200/80 bg-amber-50/70 p-3 text-sm text-amber-950`}>
          {load.limitation}
        </div>
      ) : load.records.length === 0 ? (
        <div className={`${adminCardBase} p-4`}>
          <p className="text-sm font-semibold text-[#1E1810]">LEO has no executive memories recorded yet.</p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#5C5346]">
            Decisions and important facts will appear here only when they are explicitly recorded. LEO never invents
            memory.
          </p>
        </div>
      ) : (
        <ul className={`${adminCardBase} divide-y divide-[color:var(--lx-border)]/50 overflow-hidden`}>
          {load.records.map((r) => (
            <li key={r.id} className="min-w-0 px-3 py-2.5 sm:px-4">
              <div className="flex min-w-0 flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide">
                <span className="text-[#A67C52]">{r.epistemicType}</span>
                <span className="text-[#5C5346]">{r.status}</span>
              </div>
              <p className="mt-1 break-words text-sm font-semibold text-[#1E1810]">{r.statement.slice(0, 220)}</p>
              <p className="mt-0.5 break-words text-xs text-[#5C5346]">
                {r.subject.subjectType} · {r.source.actorType} · {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
