"use client";

import Link from "next/link";

import { useAdminT } from "@/app/admin/_components/AdminI18nProvider";

/** ACCESS-01 — obvious Command Center ↔ LEO wayfinding inside admin shell. */
export function LeoAdminWayfinding() {
  const t = useAdminT();

  return (
    <nav
      aria-label={t("leo.wayfindingLabel")}
      className="mb-3 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold"
    >
      <Link
        href="/admin"
        className="inline-flex min-h-[44px] items-center rounded-lg px-2 text-[#7A1E2C] underline underline-offset-2 hover:bg-[#FAF7F2]"
      >
        {t("nav.dashboard")}
      </Link>
      <span className="text-[#5C5346]/60" aria-hidden>
        /
      </span>
      <span className="inline-flex min-h-[44px] items-center px-2 text-[#5C5346]" aria-current="page">
        {t("nav.leo")}
      </span>
    </nav>
  );
}
