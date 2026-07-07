import type { ReactNode } from "react";

/**
 * Leonix Global Mobile/PWA Foundation V1 — shared responsive shell.
 *
 * Provides a mobile-first, overflow-safe container so category preview/hub pages
 * stop leaking horizontal scroll. Adds optional PWA-safe bottom padding for pages
 * that render a fixed mobile action bar.
 *
 * No global CSS changes.
 */

type LeonixResponsiveShellProps = {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  safeBottom?: boolean;
  maxWidth?: "preview" | "wide" | "narrow";
  background?: "ivory" | "transparent";
  as?: "main" | "div";
};

const MAX_WIDTH: Record<NonNullable<LeonixResponsiveShellProps["maxWidth"]>, string> = {
  preview: "max-w-7xl",
  wide: "max-w-[1400px]",
  narrow: "max-w-3xl",
};

const BACKGROUND: Record<NonNullable<LeonixResponsiveShellProps["background"]>, string> = {
  ivory: "bg-[#FFFCF7]",
  transparent: "",
};

export function LeonixResponsiveShell({
  children,
  className = "",
  containerClassName = "",
  safeBottom = false,
  maxWidth = "preview",
  background = "transparent",
  as = "div",
}: LeonixResponsiveShellProps) {
  const Outer = as;
  const safeBottomClass = safeBottom
    ? "pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-20"
    : "";

  return (
    <Outer className={`w-full overflow-x-hidden ${BACKGROUND[background]} ${className}`.trim()}>
      <div
        className={`mx-auto w-full min-w-0 px-4 sm:px-6 lg:px-8 ${MAX_WIDTH[maxWidth]} ${safeBottomClass} ${containerClassName}`.trim()}
      >
        {children}
      </div>
    </Outer>
  );
}
