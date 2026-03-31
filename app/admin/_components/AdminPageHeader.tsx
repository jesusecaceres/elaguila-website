import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  subtitle,
  eyebrow,
  rightSlot,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  rightSlot?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A67C52]">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#5C5346]/95">{subtitle}</p> : null}
      </div>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </header>
  );
}
