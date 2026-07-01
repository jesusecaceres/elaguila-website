type Props = {
  priceDisplay: string;
  className?: string;
};

/** Compact plan price badge for lane selection and landing cards. */
export function AutosPricingBadge({ priceDisplay, className = "" }: Props) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border border-[color:var(--lx-gold-border)] bg-[#FFFCF7] px-2.5 py-1 text-xs font-bold tracking-tight text-[color:var(--lx-text)] sm:text-[13px] ${className}`}
    >
      {priceDisplay}
    </span>
  );
}
