import Link from "next/link";
import { FiStar } from "react-icons/fi";
import type { LeonixCategoryVisibilityStripProps } from "./types";
import {
  LEONIX_BTN_PRIMARY_LANDING,
  LEONIX_LANDING_SECTION,
  LEONIX_LANDING_SECTION_PAD,
  LEONIX_VISIBILITY_BODY,
  LEONIX_VISIBILITY_CTA,
  LEONIX_VISIBILITY_EYEBROW,
  LEONIX_VISIBILITY_GRADIENT,
  LEONIX_VISIBILITY_ICON,
  LEONIX_VISIBILITY_STRIP,
  LEONIX_VISIBILITY_TITLE,
} from "./constants";

/**
 * Leonix Category Visibility Strip
 * 
 * This component provides the visibility/advertise strip for category pages.
 * It uses the exact Rentas/Bienes visual system with gradient, icon, and CTA.
 * 
 * Source: app/(site)/clasificados/rentas/landing/RentasLandingVisibilityStrip.tsx
 * 
 * Default: If surface === "results" and allowOnResults !== true, return null.
 * 
 * @param lang - "es" or "en"
 * @param surface - "landing" or "results"
 * @param allowOnResults - Whether to allow on results page
 * @param eyebrow - Eyebrow text
 * @param title - Section title
 * @param body - Section body text
 * @param ctaLabel - CTA button label
 * @param ctaHref - CTA button href
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
}: LeonixCategoryVisibilityStripProps) {
  // Default: no visibility strip on results unless explicitly allowed
  if (surface === "results" && !allowOnResults) {
    return null;
  }

  return (
    <aside className={`${LEONIX_VISIBILITY_STRIP} ${LEONIX_LANDING_SECTION}`} aria-label={ctaLabel}>
      <div className={LEONIX_VISIBILITY_GRADIENT} aria-hidden />
      <div className={`${LEONIX_LANDING_SECTION_PAD} relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex min-w-0 gap-3 sm:gap-4">
          <span className={LEONIX_VISIBILITY_ICON}>
            <FiStar className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className={LEONIX_VISIBILITY_EYEBROW}>{eyebrow}</p>
            <p className={LEONIX_VISIBILITY_TITLE}>{title}</p>
            <p className={LEONIX_VISIBILITY_BODY}>{body}</p>
          </div>
        </div>
        <Link href={ctaHref} className={LEONIX_VISIBILITY_CTA}>
          {ctaLabel}
        </Link>
      </div>
    </aside>
  );
}
