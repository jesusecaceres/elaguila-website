"use client";

import Link from "next/link";
import {
  LEONIX_LANDING_SECTION,
  LEONIX_LANDING_SECTION_PAD,
  LEONIX_SHORTCUT_SECTIONS,
  LEONIX_SHORTCUT_SECTION_BORDER,
  LEONIX_SHORTCUT_BORDER_GOLD,
  LEONIX_SHORTCUT_BORDER_OLIVE,
  LEONIX_SECTION_HEADING,
  LEONIX_SECTION_SUBTITLE,
  LEONIX_BUDGET_CHIP,
  LEONIX_PRACTICAL_CHIP,
  LEONIX_SHORTCUT_ROW,
} from "./constants";
import type { ShortcutSectionProps } from "./types";

/**
 * Leonix Category Shortcut Section
 *
 * Landing-only shortcut/chip section with Rentas/Bienes visual style.
 *
 * Visual contract:
 * - Container: mt-6 space-y-5 sm:mt-7
 * - Section: rounded-2xl border bg-[#FFFDF7]/96 shadow
 * - Inner: px-4 py-5 sm:px-6 sm:py-6
 * - Budget chip: h-[38px], gold border, gradient bg
 * - Practical chip: h-[36px], olive border, gradient bg
 * - Left border accent (gold or olive)
 *
 * HARD RULE:
 * If surface === "results", returns null.
 * No shortcut/chip sections on results pages.
 */
export function LeonixCategoryShortcutSection({
  title,
  subtitle,
  chips,
  surface,
}: ShortcutSectionProps) {
  // Hard block on results surface
  if (surface === "results") {
    return null;
  }

  // Determine border accent based on first chip variant
  const firstVariant = chips[0]?.variant || "default";
  const borderAccent = firstVariant === "budget" ? LEONIX_SHORTCUT_BORDER_GOLD : LEONIX_SHORTCUT_BORDER_OLIVE;

  return (
    <div className={LEONIX_SHORTCUT_SECTIONS}>
      <section className={LEONIX_LANDING_SECTION} aria-labelledby="leonix-shortcut-title">
        <div className={`${LEONIX_LANDING_SECTION_PAD} ${LEONIX_SHORTCUT_SECTION_BORDER} ${borderAccent}`}>
          <h2 id="leonix-shortcut-title" className={LEONIX_SECTION_HEADING}>
            {title}
          </h2>
          {subtitle ? (
            <p className={LEONIX_SECTION_SUBTITLE}>{subtitle}</p>
          ) : null}

          <div className="mt-3.5">
            <div className={LEONIX_SHORTCUT_ROW}>
              {chips.map((chip) => {
                const chipClass =
                  chip.variant === "budget"
                    ? LEONIX_BUDGET_CHIP
                    : chip.variant === "practical"
                      ? LEONIX_PRACTICAL_CHIP
                      : LEONIX_BUDGET_CHIP; // Default to budget style

                const Icon = chip.icon;

                return (
                  <Link key={chip.id} href={chip.href} className={`${chipClass} shrink-0 snap-start`}>
                    {Icon ? (
                      <Icon className="h-3.5 w-3.5 shrink-0 text-[#B8954A]" aria-hidden />
                    ) : null}
                    {chip.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
