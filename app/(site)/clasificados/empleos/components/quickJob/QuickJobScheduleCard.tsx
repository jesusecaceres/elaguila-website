import type { EmpleosScheduleRowDisplay } from "@/app/publicar/empleos/shared/lib/empleosScheduleDisplay";

type Props = {
  title: string;
  rows: EmpleosScheduleRowDisplay[];
  fallbackText?: string;
};

export function QuickJobScheduleCard({ title, rows, fallbackText }: Props) {
  const lines = rows.length ? rows : fallbackText?.trim() ? [{ line: fallbackText.trim(), dayLabel: "", timeLabel: "" }] : [];
  if (!lines.length || lines.every((r) => !r.line.trim())) return null;

  return (
    <section className="rounded-xl border border-[#D6C7AD]/80 bg-[#FFFDF7] p-5 shadow-[0_10px_28px_-16px_rgba(31,36,28,0.18)] sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#8A6B1F]">{title}</p>
      <ul className="mt-3 space-y-2.5">
        {lines.map((row, i) => (
          <li key={`${row.line}-${i}`} className="flex gap-3 text-sm leading-relaxed text-[#4A4744]">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84A]" aria-hidden />
            <div className="min-w-0">
              {row.dayLabel ? (
                <>
                  <span className="font-semibold text-[#3D3428]">{row.dayLabel}</span>
                  {row.timeLabel ? (
                    <span className="text-[#5C564E]"> · {row.timeLabel}</span>
                  ) : null}
                  {row.note ? <p className="mt-0.5 text-xs text-[#7A7164]">{row.note}</p> : null}
                </>
              ) : (
                <span className="whitespace-pre-line break-words">{row.line}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
