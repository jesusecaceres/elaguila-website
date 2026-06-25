"use client";

type Metric = {
  label: string;
  value: number | string;
};

export function DashboardCompactMetricStrip({ metrics }: { metrics: Metric[] }) {
  if (metrics.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="inline-flex min-h-[36px] items-center gap-2 rounded-lg border border-[#D6C7AD]/65 bg-[#FFFCF7] px-3 py-1.5 text-xs"
        >
          <span className="font-bold uppercase tracking-wide text-[#8A6B1F]">{m.label}</span>
          <span className="font-semibold tabular-nums text-[#1F241C]">{m.value}</span>
        </div>
      ))}
    </div>
  );
}
