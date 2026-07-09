import Link from "next/link";
import type { LeonixCategoryCtaProps } from "./types";
import {
  LEONIX_BTN_PRIMARY,
  LEONIX_BTN_PRIMARY_LANDING,
  LEONIX_BTN_SECONDARY,
  LEONIX_BTN_SECONDARY_LANDING,
} from "./constants";

/**
 * Leonix Category CTA Button
 * 
 * This component enforces the exact CTA contract from Rentas/Bienes visual system.
 * 
 * PRIMARY CTA:
 * - bg-[#7A1E2C]
 * - hover:bg-[#5e1721]
 * - text-[#FFFDF7]
 * - min-h-[3rem] sm:min-h-[3.125rem]
 * - rounded-xl
 * - text-sm font-bold
 * - px-5
 * 
 * SECONDARY CTA:
 * - border border-[#C9A84A]/60
 * - bg-[#FFFDF7]
 * - text-[#3D3428]
 * - min-h-[3rem] sm:min-h-[3.125rem]
 * - rounded-xl
 * - text-sm font-semibold
 * - px-4
 * 
 * Source: app/(site)/clasificados/rentas/shared/rentasLeonixPublicUi.ts
 * 
 * @param variant - "primary" | "secondary" | "ghost"
 * @param href - Link href (renders as Link if provided)
 * @param onClick - Click handler (renders as button if provided)
 * @param type - Button type (default: "button")
 * @param children - Button label
 * @param fullWidth - Full width button
 * @param className - Optional className override
 * @param disabled - Disabled state
 */
export function LeonixCategoryCta({
  variant = "primary",
  href,
  onClick,
  type = "button",
  children,
  fullWidth = false,
  className,
  disabled = false,
}: LeonixCategoryCtaProps) {
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isGhost = variant === "ghost";

  // Base classes for landing-style buttons (larger, more prominent)
  const basePrimary = LEONIX_BTN_PRIMARY_LANDING;
  const baseSecondary = LEONIX_BTN_SECONDARY_LANDING;

  // Ghost variant (not in Rentas/Bienes but provided for flexibility)
  const baseGhost = "inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-transparent text-[#3D3428] px-4 text-sm font-semibold transition hover:bg-[#FAF6EE] sm:min-h-[3.125rem]";

  const baseClasses = isPrimary ? basePrimary : isSecondary ? baseSecondary : baseGhost;
  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : "";

  const combinedClassName = `${baseClasses} ${widthClass} ${disabledClass} ${className || ""}`;

  // Render as Link if href provided
  if (href && !disabled) {
    return (
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    );
  }

  // Render as button otherwise
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName}
    >
      {children}
    </button>
  );
}
