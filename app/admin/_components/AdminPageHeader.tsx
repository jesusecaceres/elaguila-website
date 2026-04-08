import type { ReactNode } from "react";

export function AdminPageHeader({
  title,
  subtitle,
  eyebrow,
  rightSlot,
  helperText,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  rightSlot?: ReactNode;
  /** Short “what this screen is for” line for training (kept plain-language). */
  helperText?: string;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A67C52]">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#5C5346]/95">{subtitle}</p> : null}
        {helperText ? (
          <p className="mt-3 max-w-3xl rounded-xl border border-[#E8DFD0]/80 bg-[#FAF7F2]/90 px-3 py-2 text-xs leading-relaxed text-[#5C5346]">
            {helperText}
          </p>
        ) : null}
      </div>
      {rightSlot ? (
        <div className="w-full shrink-0 sm:w-auto sm:self-start [&_a]:flex [&_a]:min-h-[44px] [&_a]:w-full [&_a]:items-center [&_a]:justify-center sm:[&_a]:min-h-0 sm:[&_a]:w-auto sm:[&_a]:inline-flex">
          {rightSlot}
        </div>
      ) : null}
    </header>
  );
}
