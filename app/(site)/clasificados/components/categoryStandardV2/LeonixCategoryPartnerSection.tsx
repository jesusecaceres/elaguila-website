"use client";

import {
  LEONIX_LANDING_SECTION,
  LEONIX_LANDING_SECTION_PAD,
  LEONIX_SECTION_HEADING,
  LEONIX_SECTION_SUBTITLE,
  LEONIX_LANDING_CHIP,
} from "./constants";
import { LeonixCategoryCta } from "./LeonixCategoryCta";
import type { PartnerSectionProps } from "./types";

/**
 * Leonix Category Partner Section
 *
 * Landing-only sponsor/partner section with Rentas/Bienes visual style.
 *
 * Visual contract:
 * - Rounded-2xl section wrapper with border, background, shadow
 * - Compact padding px-4 py-5 sm:px-6 sm:py-6
 * - Chips h-[36px] to h-[38px]
 * - Primary/secondary CTA using LeonixCategoryCta
 * - Optional eyebrow, title, body, supporting line
 *
 * HARD RULE:
 * If surface === "results", returns null.
 * No partner/sponsor section on results pages.
 */
export function LeonixCategoryPartnerSection({
  enabled = true,
  lang,
  surface,
  eyebrow,
  title,
  body,
  supportingLine,
  chips = [],
  primaryCta,
  secondaryCta,
}: PartnerSectionProps) {
  // Hard block on results surface
  if (surface === "results" || !enabled) {
    return null;
  }

  return (
    <section className={LEONIX_LANDING_SECTION} aria-labelledby="leonix-partner-title">
      <div className={LEONIX_LANDING_SECTION_PAD}>
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">
          {eyebrow}
        </p>
        <h2 id="leonix-partner-title" className={LEONIX_SECTION_HEADING}>
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
          {body}
        </p>
        {supportingLine ? (
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[#5C5346] sm:text-sm">
            {supportingLine}
          </p>
        ) : null}

        {chips.length > 0 ? (
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
              <LeonixCategoryCta
                label={primaryCta.label}
                href={primaryCta.href}
                variant="primary"
                landing
              />
            ) : null}
            {secondaryCta ? (
              <LeonixCategoryCta
                label={secondaryCta.label}
                href={secondaryCta.href}
                variant="secondary"
                landing
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
