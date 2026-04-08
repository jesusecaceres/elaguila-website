import type { ReactNode } from "react";
import Link from "next/link";
import { adminCardBase, adminCtaChip } from "./adminTheme";

export function AdminStatCard({
  title,
  value,
  hint,
  icon,
  actionLabel,
  actionHref,
  accent = "default",
}: {
  title: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  accent?: "default" | "rose" | "amber";
}) {
  const accentRing =
    accent === "rose"
      ? "ring-1 ring-rose-200/80"
      : accent === "amber"
        ? "ring-1 ring-amber-200/80"
        : "";

  return (
    <div className={`${adminCardBase} p-5 ${accentRing}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{title}</p>
        {icon ? <span className="text-xl opacity-90">{icon}</span> : null}
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums text-[#1E1810]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#5C5346]/85">{hint}</p> : null}
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={`${adminCtaChip} mt-4 w-full text-xs sm:w-auto`}>
          {actionLabel} →
        </Link>
      ) : null}
    </div>
  );
}
