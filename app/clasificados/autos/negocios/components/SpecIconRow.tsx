import type { ReactNode } from "react";

export function SpecIconRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | undefined;
}) {
  if (value === undefined || value.trim() === "") return null;

  return (
    <div className="flex gap-3 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-3 shadow-[0_2px_12px_rgba(42,36,22,0.04)]">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-nav-hover)] text-[color:var(--lx-text)]"
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--lx-muted)]">{label}</p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-[color:var(--lx-text)]">{value}</p>
      </div>
    </div>
  );
}
