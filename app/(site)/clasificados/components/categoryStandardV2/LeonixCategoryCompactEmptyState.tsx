"use client";

import Link from "next/link";
import { LeonixCategoryCta } from "./LeonixCategoryCta";
import type { CompactEmptyStateProps } from "./types";

/**
 * Leonix Category Compact Empty State
 *
 * Compact empty state for results pages.
 *
 * Visual contract:
 * - rounded-[20px] border dashed
 * - bg section/card
 * - compact px/py
 * - title, body, optional single CTA max
 *
 * HARD RULE:
 * - No multi-button CTA clutter
 * - Results empty state allows at most one CTA
 */
export function LeonixCategoryCompactEmptyState({
  title,
  body,
  ctaLabel,
  ctaHref,
  ctaOnClick,
}: CompactEmptyStateProps) {
  return (
    <div className="rounded-[20px] border border-dashed border-[#D6C7AD]/80 bg-[#FFFDF7] px-5 py-10 text-center sm:px-8 sm:py-14 md:px-10">
      <h3 className="font-serif text-lg font-semibold text-[#2A4536]">{title}</h3>
      {body ? (
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#5C5346]">
          {body}
        </p>
      ) : null}

      {ctaLabel && (ctaHref || ctaOnClick) ? (
        <div className="mt-6">
          {ctaHref ? (
            <Link href={ctaHref} className="no-underline">
              <LeonixCategoryCta
                label={ctaLabel}
                variant="secondary"
                href={ctaHref}
                landing={false}
              />
            </Link>
          ) : (
            <LeonixCategoryCta
              label={ctaLabel}
              variant="secondary"
              onClick={ctaOnClick}
              landing={false}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
