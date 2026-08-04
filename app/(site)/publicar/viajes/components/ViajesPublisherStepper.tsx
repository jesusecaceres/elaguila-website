"use client";

type ViajesPublisherStepperProps = {
  steps: string[];
  activeIndex: number;
  onStepClick?: (i: number) => void;
};

export function ViajesPublisherStepper({ steps, activeIndex, onStepClick }: ViajesPublisherStepperProps) {
  return (
    <nav aria-label="Pasos del formulario" className="w-full">
      <ol className="flex flex-wrap items-stretch gap-2 sm:gap-3">
        {steps.map((label, i) => {
          const active = i === activeIndex;
          const complete = i < activeIndex;
          const clickable = typeof onStepClick === "function";
          const className = `flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
            active
              ? "border-[color:var(--lx-cta-dark)] bg-[color:var(--lx-cta-dark)]/10 shadow-sm"
              : complete
                ? "border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)]"
                : "border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/50"
          } ${clickable ? "cursor-pointer hover:bg-[color:var(--lx-nav-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lx-focus-ring)]" : ""}`;

          const inner = (
            <>
              <span
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  active
                    ? "bg-[color:var(--lx-cta-dark)] text-[#FFFCF7]"
                    : complete
                      ? "bg-[color:var(--lx-gold)] text-[color:var(--lx-text)]"
                      : "bg-[color:var(--lx-nav-border)] text-[color:var(--lx-muted)]"
                }`}
                aria-hidden
              >
                {i + 1}
              </span>
              <span
                className={`min-w-0 truncate text-xs font-bold sm:text-sm ${
                  active ? "text-[color:var(--lx-text)]" : "text-[color:var(--lx-text-2)]"
                }`}
              >
                {label}
              </span>
            </>
          );

          return (
            <li key={`${i}-${label}`} className="min-w-0 flex-1 basis-[140px]">
              {clickable ? (
                <button
                  type="button"
                  className={className}
                  aria-current={active ? "step" : undefined}
                  onClick={() => onStepClick?.(i)}
                >
                  {inner}
                </button>
              ) : (
                <div className={className} aria-current={active ? "step" : undefined}>
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
