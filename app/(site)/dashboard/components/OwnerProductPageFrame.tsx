"use client";

/**
 * Owner Command Center — Package 3, Gate 3A Correction. Global Owner Product Page Frame —
 * Layer B of the Bible's three-layer model (Layer A = LeonixDashboardShell, Layer B = this
 * component, Layer C = OwnerEntityWorkspace).
 *
 * This is the ONE outer shell every category-level owner product page (Servicios,
 * Restaurantes, and every future category workspace page) renders through. It owns page
 * header anatomy, category-level action placement, and the loading/empty/error/collection
 * rhythm — never category data, fetching, mutations, routes, or entitlement logic. A
 * category page becomes: LeonixDashboardShell → OwnerProductPageFrame → OwnerEntityWorkspace
 * instances, with zero bespoke wrapper in between.
 *
 * Category-level aggregate KPI/summary blocks (e.g. an account-wide "engagement summary" or
 * a stats-card row) do NOT belong here or anywhere in this page's outer shell — that class of
 * data is deliberately deferred to a future Account Command Center / category-aggregate
 * system per the Bible's Part 3 instruction, not preserved as a bespoke per-category wrapper.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { LX_DASH } from "../lib/dashboardLeonixTheme";

export function OwnerProductPageFrame({
  eyebrow,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  infoNote,
  loading,
  loadingLabel,
  error,
  empty,
  emptyLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Category-level publish/create action — rendered once, here, never repeated per entity. */
  primaryAction?: { label: string; href: string } | null;
  /** Category-level results/discovery action — rendered once, here. */
  secondaryAction?: { label: string; href: string } | null;
  /** Short contextual note under the header (e.g. a data-source explanation). Not a KPI block. */
  infoNote?: string | null;
  loading?: boolean;
  loadingLabel?: string;
  error?: string | null;
  empty?: boolean;
  emptyLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A6B1F]">{eyebrow}</span>
          <h1 className="mt-1 font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-[#1F241C] sm:text-[2rem]">
            {title}
          </h1>
          {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346]">{subtitle}</p> : null}
          {infoNote ? <p className="mt-2 max-w-2xl text-xs text-[#7A7164]">{infoNote}</p> : null}
        </div>
        {primaryAction || secondaryAction ? (
          <div className="flex flex-wrap gap-2">
            {primaryAction ? (
              <Link href={primaryAction.href} prefetch={false} className={LX_DASH.btnSecondary}>
                {primaryAction.label}
              </Link>
            ) : null}
            {secondaryAction ? (
              <Link href={secondaryAction.href} prefetch={false} className={LX_DASH.btnSecondary}>
                {secondaryAction.label}
              </Link>
            ) : null}
          </div>
        ) : null}
      </header>

      {loading ? (
        <div className="rounded-3xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-10 text-center text-sm text-[#5C5346]">
          {loadingLabel}
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>
      ) : empty ? (
        <div className={LX_DASH.emptyState}>{emptyLabel}</div>
      ) : (
        <div className="flex flex-col gap-4">{children}</div>
      )}
    </div>
  );
}
