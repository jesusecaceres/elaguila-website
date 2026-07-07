import Link from "next/link";
import type { LeonixCategoryPartnerSectionProps } from "./types";
import {
  LEONIX_BTN_PRIMARY_LANDING,
  LEONIX_BTN_SECONDARY_LANDING,
  LEONIX_LANDING_CHIP,
  LEONIX_LANDING_SECTION,
  LEONIX_LANDING_SECTION_PAD,
} from "./constants";

/**
 * Leonix Category Partner Section
 * 
 * This component provides the partner/sponsor section for category landing pages.
 * It uses the exact Rentas/Bienes visual system with section wrapper, chips, and CTAs.
 * 
 * Source: app/(site)/clasificados/rentas/landing/RentasLandingVisibilityStrip.tsx (similar pattern)
 * 
 * HARD RULE: If surface === "results", return null.
 * No partner/sponsor section on results.
 * 
 * @param enabled - Whether the section is enabled
 * @param lang - "es" or "en"
 * @param surface - "landing" or "results"
 * @param eyebrow - Eyebrow text
 * @param title - Section title
 * @param body - Section body text
 * @param supportingLine - Optional supporting line
 * @param chips - Optional chips array
 * @param primaryCta - Primary CTA
 * @param secondaryCta - Secondary CTA
 */
export function LeonixCategoryPartnerSection({
  enabled,
  lang,
  surface,
  eyebrow,
  title,
  body,
  supportingLine,
  chips,
  primaryCta,
  secondaryCta,
}: LeonixCategoryPartnerSectionProps) {
  // Hard rule: no partner section on results
  if (surface === "results" || !enabled) {
    return null;
  }

  return (
    <section className={LEONIX_LANDING_SECTION} aria-labelledby="leonix-partner-title">
      <div className={LEONIX_LANDING_SECTION_PAD}>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{eyebrow}</p>
        <h2 id="leonix-partner-title" className="mt-2 font-serif text-xl font-bold leading-snug text-[#2A4536] sm:text-2xl">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{body}</p>
        {supportingLine ? (
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[#5C5346] sm:text-sm">{supportingLine}</p>
        ) : null}

        {chips && chips.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
            {chips.map((chip) => (
              <span key={chip} className={LEONIX_LANDING_CHIP}>
                {chip}
              </span>
            ))}
          </div>
        ) : null}

        {primaryCta || secondaryCta ? (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:gap-4">
            {primaryCta ? (
              <Link href={primaryCta.href} className={LEONIX_BTN_PRIMARY_LANDING}>
                {primaryCta.label}
              </Link>
            ) : null}
            {secondaryCta ? (
              <Link href={secondaryCta.href} className={LEONIX_BTN_SECONDARY_LANDING}>
                {secondaryCta.label}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
