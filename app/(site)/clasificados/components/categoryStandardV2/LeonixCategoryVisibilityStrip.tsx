"use client";

import Link from "next/link";
import { FiStar } from "react-icons/fi";
import {
  LEONIX_VISIBILITY_STRIP,
  LEONIX_VISIBILITY_GRADIENT,
  LEONIX_VISIBILITY_ICON,
  LEONIX_VISIBILITY_EYEBROW,
  LEONIX_VISIBILITY_TITLE,
  LEONIX_VISIBILITY_BODY,
  LEONIX_VISIBILITY_CTA,
} from "./constants";
import type { VisibilityStripProps } from "./types";

/**
 * Leonix Category Visibility Strip
 *
 * Visibility/advertise CTA section with Rentas/Bienes visual style.
 *
 * Visual contract:
 * - Same section wrapper as other landing sections
 * - Gradient overlay background
 * - Icon with border and shadow
 * - Eyebrow, title, body text hierarchy
 * - CTA button
 *
 * Rules:
 * - Landing: always renders if enabled
 * - Results: only renders if allowOnResults === true
 * - Default: results blocked unless explicitly allowed
 */
export function LeonixCategoryVisibilityStrip({
  lang,
  surface,
  allowOnResults = false,
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaHref,
}: VisibilityStripProps) {
  // Block on results unless explicitly allowed
  if (surface === "results" && !allowOnResults) {
    return null;
  }

  const isEs = lang === "es";

  // Default copy if not provided
  const defaultEyebrow = isEs ? "Visibilidad" : "Visibility";
  const defaultTitle = isEs ? "Haz que tu anuncio destaque" : "Make your listing stand out";
  const defaultBody = isEs
    ? "Opciones de revista, digital y destacados se revisan con Leonix."
    : "Print, digital, and featured options are reviewed with Leonix.";
  const defaultCtaLabel = isEs ? "Conocer opciones" : "Explore options";

  const finalEyebrow = eyebrow || defaultEyebrow;
  const finalTitle = title || defaultTitle;
  const finalBody = body || defaultBody;
  const finalCtaLabel = ctaLabel || defaultCtaLabel;

  // If no CTA href provided, don't render
  if (!ctaHref) {
    return null;
  }

  return (
    <aside className={`${LEONIX_VISIBILITY_STRIP} relative overflow-hidden`} aria-label={finalCtaLabel}>
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(201,168,74,0.1)_0%,rgba(255,253,247,0.96)_50%,rgba(85,107,62,0.06)_100%)]"
        aria-hidden
      />
      <div className={`${LEONIX_VISIBILITY_STRIP.replace("rounded-2xl", "").replace("shadow", "")} relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 py-5 sm:px-6 sm:py-6`}>
        <div className="flex min-w-0 gap-3 sm:gap-4">
          <span className={LEONIX_VISIBILITY_ICON}>
            <FiStar className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className={LEONIX_VISIBILITY_EYEBROW}>{finalEyebrow}</p>
            <p className={LEONIX_VISIBILITY_TITLE}>{finalTitle}</p>
            <p className={LEONIX_VISIBILITY_BODY}>{finalBody}</p>
          </div>
        </div>
        <Link
          href={ctaHref}
          className={LEONIX_VISIBILITY_CTA}
        >
          {finalCtaLabel}
        </Link>
      </div>
    </aside>
  );
}
