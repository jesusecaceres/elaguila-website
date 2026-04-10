import type { ReactNode } from "react";

const railClass =
  "-mx-1 flex min-w-0 max-w-full flex-nowrap justify-start gap-x-2 gap-y-2 overflow-x-auto overflow-y-visible scroll-pl-3 scroll-pr-3 pb-1.5 pt-0.5 [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-1 md:gap-x-2.5 [&::-webkit-scrollbar]:hidden";

type Props = {
  children: ReactNode;
  /** Screen-reader label for the chip group */
  label?: string;
  className?: string;
};

/**
 * Horizontal scroll on narrow viewports, wrap + center from `sm` up — prevents chip collision and clipping.
 */
export function CategoryLandingChipsRail({ children, label, className = "" }: Props) {
  return (
    <div className={`min-w-0 ${className}`.trim()}>
      {label ? <span className="sr-only">{label}</span> : null}
      <div className={railClass}>{children}</div>
    </div>
  );
}
