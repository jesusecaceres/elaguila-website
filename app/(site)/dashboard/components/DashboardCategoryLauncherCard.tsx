"use client";

import Link from "next/link";
import { LX_DASH } from "../lib/dashboardLeonixTheme";

export function DashboardCategoryLauncherCard({
  title,
  description,
  ready,
  manageHref,
  publishHref,
  resultsHref,
  manageLabel,
  publishLabel,
  resultsLabel,
  readyLabel,
  soonLabel,
}: {
  title: string;
  description: string;
  ready: boolean;
  manageHref?: string;
  publishHref?: string;
  resultsHref?: string;
  manageLabel: string;
  publishLabel: string;
  resultsLabel?: string;
  readyLabel: string;
  soonLabel: string;
}) {
  return (
    <div className={ready ? LX_DASH.categoryCardReady : LX_DASH.categoryCardSoon}>
      <div className="flex items-start justify-between gap-2">
        <h3 className={`font-semibold ${ready ? "text-[#1F241C]" : "text-[#7A7164]"}`}>{title}</h3>
        <span className={ready ? LX_DASH.badgeReady : LX_DASH.badgeSoon}>{ready ? readyLabel : soonLabel}</span>
      </div>
      <p className={`mt-2 flex-1 text-xs leading-relaxed ${ready ? "text-[#5C5346]" : "text-[#7A7164]"}`}>
        {description}
      </p>
      {ready ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {manageHref ? (
            <Link href={manageHref} className={LX_DASH.btnManage}>
              {manageLabel}
            </Link>
          ) : null}
          {publishHref ? (
            <Link href={publishHref} className={LX_DASH.btnPrimary}>
              {publishLabel}
            </Link>
          ) : null}
          {resultsHref && resultsLabel ? (
            <Link href={resultsHref} className={LX_DASH.btnSecondary}>
              {resultsLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
