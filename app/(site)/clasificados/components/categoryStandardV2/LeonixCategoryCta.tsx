"use client";

import Link from "next/link";
import {
  LEONIX_BTN_PRIMARY_LANDING,
  LEONIX_BTN_SECONDARY_LANDING,
  LEONIX_BTN_PRIMARY,
  LEONIX_BTN_SECONDARY,
} from "./constants";
import type { CtaVariant } from "./types";

type Props = {
  /** Button text */
  label: string;
  /** Link href (renders as Link if provided) */
  href?: string;
  /** onClick handler (renders as button if provided) */
  onClick?: () => void;
  /** Button type */
  type?: "button" | "submit" | "reset";
  /** CTA variant */
  variant?: CtaVariant;
  /** Full width */
  fullWidth?: boolean;
  /** Additional className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Landing size (larger) vs results size (compact) */
  landing?: boolean;
};

/**
 * Leonix Category CTA
 *
 * Enforces the exact CTA contract from Rentas/Bienes visual system.
 *
 * Primary CTA (landing):
 * - bg-[#7A1E2C]
 * - hover:bg-[#5e1721]
 * - text-[#FFFDF7]
 * - min-h-[3rem] sm:min-h-[3.125rem]
 * - rounded-xl
 * - text-sm font-bold
 * - px-5
 * - shadow-[0_6px_20px_-8px_rgba(122,30,44,0.45)]
 *
 * Secondary CTA (landing):
 * - border border-[#C9A84A]/60
 * - bg-[#FFFDF7]
 * - text-[#3D3428]
 * - min-h-[3rem] sm:min-h-[3.125rem]
 * - rounded-xl
 * - text-sm font-semibold
 * - px-4
 *
 * CTA RULES:
 * - Allowed on landing: search shell CTA row, partner section, visibility strip
 * - NOT allowed: floating publish buttons under discovery, repeated empty-state CTA clutter
 * - Results empty state: max one CTA
 */
export function LeonixCategoryCta({
  label,
  href,
  onClick,
  type = "button",
  variant = "primary",
  fullWidth = false,
  className = "",
  disabled = false,
  landing = true,
}: Props) {
  const isPrimary = variant === "primary";
  const baseClass = landing
    ? isPrimary
      ? LEONIX_BTN_PRIMARY_LANDING
      : LEONIX_BTN_SECONDARY_LANDING
    : isPrimary
      ? LEONIX_BTN_PRIMARY
      : LEONIX_BTN_SECONDARY;

  const widthClass = fullWidth ? "w-full" : "";

  const combinedClassName = `${baseClass} ${widthClass} ${className}`.trim();

  if (href) {
    return (
      <Link
        href={href}
        className={combinedClassName}
        aria-disabled={disabled}
      >
        {label}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName}
    >
      {label}
    </button>
  );
}
