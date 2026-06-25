"use client";

import Link from "next/link";
import { LX_DASH } from "../lib/dashboardLeonixTheme";

export function DashboardQuickActionCard({
  href,
  icon,
  title,
  description,
  primary,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${LX_DASH.quickActionCard}${primary ? " border-[#7A1E2C]/25 ring-[#7A1E2C]/10" : ""}`}
    >
      <span className={LX_DASH.quickActionIcon} aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-[#1F241C]">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-[#5C5346]">{description}</p>
      </div>
    </Link>
  );
}
