/** Visual rhythm between primary → secondary → tertiary landing tiers */
export function ViajesLandingTierBreak({ label }: { label: string }) {
  return (
    <div
      className="my-10 flex min-w-0 items-center gap-3 px-1 sm:my-14 sm:gap-4 md:my-16"
      role="separator"
      aria-label={label}
    >
      <div className="h-px min-w-0 flex-1 bg-gradient-to-r from-transparent via-[color:var(--lx-gold-border)]/55 to-transparent" />
      <span className="max-w-[min(100%,18rem)] shrink-0 text-center text-[9px] font-bold uppercase leading-tight tracking-[0.14em] text-[color:var(--lx-muted)] sm:max-w-none sm:text-[10px] sm:tracking-[0.18em]">
        {label}
      </span>
      <div className="h-px min-w-0 flex-1 bg-gradient-to-r from-transparent via-[color:var(--lx-gold-border)]/55 to-transparent" />
    </div>
  );
}
