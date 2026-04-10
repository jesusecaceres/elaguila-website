type ViajesSectionHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
  /** Vertical accent rail (desktop) for section rhythm */
  showRail?: boolean;
  eyebrow?: string;
  /** Tightens title scale for tertiary / lower-priority bands */
  headingScale?: "primary" | "secondary" | "tertiary";
};

const TITLE: Record<NonNullable<ViajesSectionHeaderProps["headingScale"]>, string> = {
  primary: "text-[1.45rem] font-bold tracking-tight text-[color:var(--lx-text)] sm:text-[1.65rem] md:text-[1.85rem]",
  secondary: "text-[1.3rem] font-bold tracking-tight text-[color:var(--lx-text)] sm:text-2xl md:text-[1.65rem]",
  tertiary: "text-[1.15rem] font-bold tracking-tight text-[color:var(--lx-text)] sm:text-xl md:text-[1.4rem]",
};

export function ViajesSectionHeader({
  title,
  subtitle,
  className = "",
  showRail = false,
  eyebrow,
  headingScale = "secondary",
}: ViajesSectionHeaderProps) {
  return (
    <header className={`text-center sm:text-left ${className}`}>
      <div className={`flex gap-4 ${showRail ? "sm:gap-5" : ""}`}>
        {showRail ? (
          <div
            className="hidden h-auto w-1 shrink-0 rounded-full bg-gradient-to-b from-sky-800/35 via-[color:var(--lx-gold)]/45 to-amber-600/35 sm:block"
            aria-hidden
          />
        ) : null}
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-sky-900/75">{eyebrow}</p>
          ) : null}
          <h2 className={TITLE[headingScale]}>{title}</h2>
          {subtitle ? (
            <p className="mx-auto mt-2 max-w-3xl text-[13px] leading-relaxed text-[color:var(--lx-text-2)] sm:mx-0 sm:text-[0.9375rem]">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
