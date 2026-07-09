import Link from "next/link";
import type { LeonixCategoryCompactEmptyStateProps } from "./types";
import {
  LEONIX_COMPACT_EMPTY_STATE,
  LEONIX_EMPTY_BODY,
  LEONIX_EMPTY_CTA,
  LEONIX_EMPTY_TITLE,
} from "./constants";

/**
 * Leonix Category Compact Empty State
 * 
 * This component provides the compact empty state for category results pages.
 * It uses the exact Rentas/Bienes visual system with rounded border and compact padding.
 * 
 * Source: app/(site)/clasificados/rentas/results/components/ (empty state pattern)
 * 
 * HARD RULE: No multi-button CTA clutter.
 * Results empty state allows at most one CTA.
 * 
 * @param title - Empty state title
 * @param body - Empty state body text
 * @param ctaLabel - Optional CTA button label
 * @param ctaHref - Optional CTA button href
 */
export function LeonixCategoryCompactEmptyState({
  title,
  body,
  ctaLabel,
  ctaHref,
}: LeonixCategoryCompactEmptyStateProps) {
  return (
    <div className={LEONIX_COMPACT_EMPTY_STATE}>
      <p className={LEONIX_EMPTY_TITLE}>{title}</p>
      <p className={LEONIX_EMPTY_BODY}>{body}</p>
      {ctaLabel && ctaHref ? (
        <Link href={ctaHref} className={LEONIX_EMPTY_CTA}>
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
