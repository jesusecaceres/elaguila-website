"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LX_DASH } from "../lib/dashboardLeonixTheme";

export function DashboardMetricLinkCard({
  href,
  label,
  value,
  hint,
  accent,
}: {
  href: string;
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: string;
}) {
  return (
    <Link href={href} className={LX_DASH.metricCard}>
      <div className="flex items-start justify-between gap-2">
        <p className={LX_DASH.metricLabel}>{label}</p>
        {accent ? (
          <span className="text-lg opacity-75" aria-hidden>
            {accent}
          </span>
        ) : null}
      </div>
      <p className={LX_DASH.metricValue}>{value}</p>
      {hint ? <p className={LX_DASH.metricHint}>{hint}</p> : null}
    </Link>
  );
}
