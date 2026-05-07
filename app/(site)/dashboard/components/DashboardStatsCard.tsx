"use client";

export function DashboardStatsCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: string;
}) {
  return (
    <div className="rounded-3xl border border-[#E8DFD0]/90 bg-gradient-to-br from-[#FFFCF7] to-[#FAF7F2] p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.1)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{label}</p>
        {icon ? (
          <span className="text-lg opacity-80" aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-[#1E1810]">{value}</p>
    </div>
  );
}
