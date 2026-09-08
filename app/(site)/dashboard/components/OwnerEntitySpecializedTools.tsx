"use client";

/**
 * Owner Command Center — Package 3, Gate 3A. Canonical specialized-tools zone (gold role).
 *
 * Renders whatever real specialized actions the category adapter supplies (offers/coupons,
 * inventory, applications, etc.) through the existing shared `DashboardListingActionBar` —
 * this component invents no action, no label, no destination. Every action passed here
 * should already carry `tone: "premium"` from the adapter; nothing here changes tone.
 */
import type { ReactNode } from "react";
import { DashboardListingActionBar, type ActionItem } from "./DashboardListingActionBar";

export function OwnerEntitySpecializedTools({
  title,
  actions,
  children,
}: {
  title: string;
  actions: ActionItem[];
  children?: ReactNode;
}) {
  if (actions.length === 0 && !children) return null;
  return (
    <section aria-label={title}>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8A6B1F]">{title}</h3>
      {actions.length > 0 ? (
        <div className="mt-2">
          <DashboardListingActionBar actions={actions} />
        </div>
      ) : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </section>
  );
}
