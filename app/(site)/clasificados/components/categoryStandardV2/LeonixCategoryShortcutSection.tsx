import Link from "next/link";
import type { LeonixCategoryShortcutSectionProps, ChipVariant } from "./types";
import {
  LEONIX_BUDGET_CHIP,
  LEONIX_LANDING_SECTION,
  LEONIX_LANDING_SECTION_PAD,
  LEONIX_PRACTICAL_CHIP,
  LEONIX_SHORTCUT_HEADING,
  LEONIX_SHORTCUT_ROW,
  LEONIX_SHORTCUT_SECTIONS,
  LEONIX_SHORTCUT_SUBTITLE,
} from "./constants";

/**
 * Leonix Category Shortcut Section
 * 
 * This component provides the shortcut/chip section for category landing pages.
 * It uses the exact Rentas/Bienes visual system with section wrapper and chips.
 * 
 * Source: app/(site)/clasificados/rentas/landing/RentasLandingShortcutSections.tsx
 * 
 * HARD RULE: If surface === "results", return null.
 * No shortcut/chip sections on results.
 * 
 * @param lang - "es" or "en"
 * @param surface - "landing" or "results"
 * @param title - Section title
 * @param subtitle - Section subtitle
 * @param chips - Shortcut chips
 * @param variant - Chip variant ("budget" or "practical" or "default")
 */
export function LeonixCategoryShortcutSection({
  lang,
  surface,
  title,
  subtitle,
  chips,
  variant = "default",
}: LeonixCategoryShortcutSectionProps) {
  // Hard rule: no shortcut section on results
  if (surface === "results") {
    return null;
  }

  const chipClass = variant === "budget" ? LEONIX_BUDGET_CHIP : variant === "practical" ? LEONIX_PRACTICAL_CHIP : LEONIX_BUDGET_CHIP;
  const borderColor = variant === "budget" ? "border-[#C9A84A]/55" : variant === "practical" ? "border-[#556B3E]/40" : "border-[#C9A84A]/55";
  const iconColor = variant === "budget" ? "text-[#B8954A]" : variant === "practical" ? "text-[#556B3E]" : "text-[#B8954A]";

  return (
    <section className={LEONIX_SHORTCUT_SECTIONS} aria-labelledby="leonix-shortcut-title">
      <div className={LEONIX_LANDING_SECTION}>
        <div className={`${LEONIX_LANDING_SECTION_PAD} border-l-[3px] ${borderColor}`}>
          <h2 id="leonix-shortcut-title" className={LEONIX_SHORTCUT_HEADING}>{title}</h2>
          <p className={LEONIX_SHORTCUT_SUBTITLE}>{subtitle}</p>
          <div className="mt-3.5">
            <div className={LEONIX_SHORTCUT_ROW}>
              {chips.map((chip) => {
                const Icon = chip.icon;
                return (
                  <Link key={chip.id} href={chip.href} className={`${chipClass} shrink-0 snap-start`}>
                    {Icon ? <Icon className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} aria-hidden /> : null}
                    {chip.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
