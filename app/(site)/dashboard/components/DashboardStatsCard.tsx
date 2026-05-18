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
    <div className="rounded-3xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)] p-5 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.08)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{label}</p>
        {icon ? (
          <span className="text-lg opacity-80" aria-hidden>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-[color:var(--lx-text)]">{value}</p>
    </div>
  );
}
