"use client";

import Link from "next/link";

/**
 * Stretched listing link for Servicios results cards — opens detail from logo/title/body.
 * Interactive CTAs sit in a sibling column with higher z-index.
 */
export function ServiciosResultCardBodyLink({
  href,
  ariaLabel,
  onNavigate,
  className = "",
}: {
  href: string;
  ariaLabel: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      onClick={onNavigate}
      className={`absolute inset-0 z-[1] rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/55 focus-visible:ring-offset-2 ${className}`.trim()}
    />
  );
}

/** Wrap CTA / engagement controls so they stay above the stretched card link. */
export const SERVICIOS_RESULT_CARD_INTERACTIVE =
  "relative z-[2] pointer-events-auto";
