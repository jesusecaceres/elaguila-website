"use client";

export type ViajesResultsViewMode = "grid" | "list";

export function ViajesResultsViewToggle({
  value,
  onChange,
  gridLabel,
  listLabel,
}: {
  value: ViajesResultsViewMode;
  onChange: (mode: ViajesResultsViewMode) => void;
  gridLabel: string;
  listLabel: string;
}) {
  return (
    <div className="inline-flex rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-0.5" role="group">
      <button
        type="button"
        aria-pressed={value === "grid"}
        aria-label={gridLabel}
        className={`inline-flex min-h-[36px] min-w-[40px] items-center justify-center rounded-lg px-2.5 text-xs font-bold ${
          value === "grid" ? "bg-[color:var(--lx-section)] text-[color:var(--lx-text)]" : "text-[color:var(--lx-muted)]"
        }`}
        onClick={() => onChange("grid")}
      >
        ▦
      </button>
      <button
        type="button"
        aria-pressed={value === "list"}
        aria-label={listLabel}
        className={`inline-flex min-h-[36px] min-w-[40px] items-center justify-center rounded-lg px-2.5 text-xs font-bold ${
          value === "list" ? "bg-[color:var(--lx-section)] text-[color:var(--lx-text)]" : "text-[color:var(--lx-muted)]"
        }`}
        onClick={() => onChange("list")}
      >
        ☰
      </button>
    </div>
  );
}
